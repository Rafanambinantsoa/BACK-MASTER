import { ForbiddenException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { Role } from 'src/role/entities/role.entity';
import { UserTypeMenu } from 'src/userTypeMenu/user-type-menu.entity';
import { TypeMenu } from 'src/type_menu/entities/type_menu.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Role)
    private roleRepository: Repository<Role>,

    @InjectRepository(UserTypeMenu)
    private userTypeMenuRepository: Repository<UserTypeMenu>,

    @InjectRepository(TypeMenu)
    private typeMenuRepository: Repository<TypeMenu>
  ) { }

  async create(createUserDto: CreateUserDto) {
    // Vérifier si le role_id existe
    const role = await this.roleRepository.findOneBy({ id: createUserDto.role_id });
    if (!role) {
      throw new NotFoundException("Role inexistant");
    }

    //Verification email doublon
    const checkemail = await this.userRepository.findOneBy({ email: createUserDto.email });
    if (checkemail) {
      throw new ForbiddenException("Email deja existant")
    };

    // Créer l'utilisateur
    const user = this.userRepository.create(createUserDto);
    const savedUser = await this.userRepository.save(user);

    // Assigner les spécialités (typeMenuIds)
    if (createUserDto.typeMenuIds && createUserDto.typeMenuIds.length > 0) {
      const userTypeMenus: UserTypeMenu[] = [];

      // Utiliser forEach avec Promise.all
      const promises = createUserDto.typeMenuIds.map(async (typeMenuId) => {
        const typeMenu = await this.typeMenuRepository.findOneBy({ id: typeMenuId });
        if (!typeMenu) return; // ignorer les ids invalides
        const userTypeMenu = this.userTypeMenuRepository.create({
          user: savedUser,
          typeMenu: typeMenu,
        });
        userTypeMenus.push(userTypeMenu);
      });

      await Promise.all(promises);

      if (userTypeMenus.length > 0) {
        await this.userTypeMenuRepository.save(userTypeMenus);
      }
    }

    // Retourner l'utilisateur avec ses spécialités
    return this.userRepository.findOne({
      where: { id: savedUser.id },
      relations: ['userTypeMenus.typeMenu'],
    });
  }


  async findAll() {
    return await this.userRepository.find({ relations: ['userTypeMenus.typeMenu'] });
  }

  async findOne(id: number) {
    const data = await this.userRepository.findOne({ where: { id }, relations: ['userTypeMenus.typeMenu'] });
    // retourner une status code avec un message  404
    if (data === null) {
      // ✅ lance une exception 404
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return data;
  }

  async findOneBy(email: string) {
    const data = await this.userRepository.findOneBy({ email });
    if (data === null) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    return data;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    // Vérifier si l'utilisateur existe
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['userTypeMenus', 'userTypeMenus.typeMenu'],
    });
    if (!user) {
      throw new NotFoundException('Utilisateur inexistant');
    }

    // Vérifier si le rôle existe
    if (updateUserDto.role_id) {
      const role = await this.roleRepository.findOneBy({ id: updateUserDto.role_id });
      if (!role) {
        throw new NotFoundException('Rôle inexistant');
      }
    }

    // Vérifier si l'email n'est pas déjà pris par un autre utilisateur
    if (updateUserDto.email) {
      const existingEmail = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });
      if (existingEmail && existingEmail.id !== id) {
        throw new ForbiddenException('Email déjà utilisé par un autre utilisateur');
      }
    }

    // Exclure typeMenuIds avant la mise à jour principale
    const { typeMenuIds, ...userData } = updateUserDto;

    // Mettre à jour les infos principales de l'utilisateur
    await this.userRepository.update(id, userData);

    // Gestion des spécialités (typeMenuIds)
    if (typeMenuIds !== undefined) {
      // Supprimer toutes les anciennes relations
      await this.userTypeMenuRepository.delete({ user: { id } });

      // Si le tableau contient des IDs, on recrée les nouvelles relations
      if (typeMenuIds.length > 0) {
        const newUserTypeMenus: UserTypeMenu[] = [];

        for (const typeMenuId of typeMenuIds) {
          const typeMenu = await this.typeMenuRepository.findOneBy({ id: typeMenuId });
          if (!typeMenu) continue;

          const newRelation = this.userTypeMenuRepository.create({
            user: { id },
            typeMenu,
          });

          newUserTypeMenus.push(newRelation);
        }

        if (newUserTypeMenus.length > 0) {
          await this.userTypeMenuRepository.save(newUserTypeMenus);
        }
      }
      // Si le tableau est vide → toutes les anciennes relations sont déjà supprimées ci-dessus
    }

    // Retourner l'utilisateur mis à jour avec ses nouvelles relations
    return this.userRepository.findOne({
      where: { id },
      relations: ['userTypeMenus.typeMenu'],
    });
  }


  async remove(id: number) {
    const data = await this.userRepository.findOneBy({ id });
    // retourner une status code avec un message  404
    if (data === null) {
      // ✅ lance une exception 404
      throw new NotFoundException(`User with id ${id} not found`);
    }

    await this.userRepository.delete(id);
    return { message: `User with id ${id} deleted` };
  }
}
