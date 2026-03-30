import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PasswordResetOtp } from './entities/password-reset-otp.entity';
import { MailService } from 'src/mail/mail.service';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class AuthService {
    constructor(
        private userService: UserService,
        private jwtService: JwtService,
        private mailService: MailService,
        @InjectRepository(PasswordResetOtp)
        private otpRepository: Repository<PasswordResetOtp>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

    async validateUser(email: string, password: string) {
        const user = await this.userService.findOneBy(email);
        if (user && (await bcrypt.compare(password, user.password))) {
            const { password, ...result } = user;
            return result;
        }
        throw new UnauthorizedException('Email ou mot de passe invalide');
    }

    async login(user: any) {
        const payload = { email: user.email, sub: user.id, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    async register(createUserDto: CreateUserDto) {
        const user = await this.userService.create(createUserDto);
        if (!user) {
            throw new UnauthorizedException('Failed to create user');
        }
        const { password, ...result } = user;
        return result;
    }

    private normalizeEmail(email: string): string {
        return email.trim().toLowerCase();
    }

    private generateOtpCode(): string {
        // 6 chiffres (100000-999999)
        return String(Math.floor(100000 + Math.random() * 900000));
    }

    private async getActiveOtp(email: string): Promise<PasswordResetOtp | null> {
        const now = new Date();
        return await this.otpRepository
            .createQueryBuilder('otp')
            .where('otp.email = :email', { email })
            .andWhere('otp.usedAt IS NULL')
            .andWhere('otp.expiresAt > :now', { now })
            .orderBy('otp.id', 'DESC')
            .getOne();
    }

    async forgotPassword(rawEmail: string) {
        const email = this.normalizeEmail(rawEmail);
        const now = new Date();

        // Ne pas révéler si l'email existe.
        let user: User | null = null;
        try {
            user = await this.userRepository.findOne({ where: { email } });
        } catch {
            user = null;
        }

        // Cooldown anti-abus sur OTP actif
        const existingActive = await this.getActiveOtp(email);
        if (existingActive?.lastSentAt) {
            const diffMs = now.getTime() - existingActive.lastSentAt.getTime();
            if (diffMs < 30_000) {
                throw new BadRequestException('Veuillez attendre quelques secondes avant de renvoyer un code.');
            }
        }

        if (!user) {
            return { message: 'Si cet email existe, un code a été envoyé.' };
        }

        const otp = this.generateOtpCode();
        const otpHash = await bcrypt.hash(otp, 10);
        const expiresAt = new Date(now.getTime() + 5 * 60_000);

        // Invalider les OTP précédents non utilisés pour cet email
        await this.otpRepository
            .createQueryBuilder()
            .update(PasswordResetOtp)
            .set({ usedAt: now })
            .where('email = :email AND usedAt IS NULL', { email })
            .execute();

        const row = this.otpRepository.create({
            email,
            otpHash,
            expiresAt,
            usedAt: null,
            attemptCount: 0,
            lastSentAt: now,
        });
        await this.otpRepository.save(row);

        await this.mailService.sendPasswordResetOtp(email, user.nom, otp, 5);

        return { message: 'Si cet email existe, un code a été envoyé.' };
    }

    async verifyOtp(rawEmail: string, otp: string) {
        const email = this.normalizeEmail(rawEmail);
        const now = new Date();

        const active = await this.getActiveOtp(email);
        if (!active) {
            throw new BadRequestException('Code invalide ou expiré.');
        }

        if (active.attemptCount >= 5) {
            active.usedAt = now;
            await this.otpRepository.save(active);
            throw new BadRequestException('Trop de tentatives. Veuillez demander un nouveau code.');
        }

        const ok = await bcrypt.compare(otp, active.otpHash);
        if (!ok) {
            active.attemptCount += 1;
            await this.otpRepository.save(active);
            throw new BadRequestException('Code invalide ou expiré.');
        }

        return { message: 'Code vérifié', valid: true };
    }

    async resetPassword(rawEmail: string, otp: string, newPassword: string) {
        const email = this.normalizeEmail(rawEmail);
        const now = new Date();

        const active = await this.getActiveOtp(email);
        if (!active) {
            throw new BadRequestException('Code invalide ou expiré.');
        }

        if (active.attemptCount >= 5) {
            active.usedAt = now;
            await this.otpRepository.save(active);
            throw new BadRequestException('Trop de tentatives. Veuillez demander un nouveau code.');
        }

        const ok = await bcrypt.compare(otp, active.otpHash);
        if (!ok) {
            active.attemptCount += 1;
            await this.otpRepository.save(active);
            throw new BadRequestException('Code invalide ou expiré.');
        }

        const user = await this.userRepository.findOne({ where: { email } });
        // Toujours invalider l'OTP, même si l'utilisateur n'existe pas.
        active.usedAt = now;
        await this.otpRepository.save(active);

        if (!user) {
            return { message: 'Mot de passe mis à jour.' };
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await this.userRepository.save(user);

        return { message: 'Mot de passe mis à jour.' };
    }
}
