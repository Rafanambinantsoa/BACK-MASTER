import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { Role } from 'src/role/entities/role.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Role)
    private roleRepository: Repository<Role>
  ) { }

  async create(createUserDto: CreateUserDto) {
    //Verifier si le role_id existe dans la table role
    // if not throw new NotFoundException(`Role with id ${createUserDto.role_id} not found`);
    // else create the user
    const role = await this.roleRepository.findOneBy({ id: createUserDto.role_id });

    if (role === null) {
      throw new NotFoundException("Role  inexistant")
    }

    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  findAll() {
    return this.userRepository.find();
  }

  async findOne(id: number) {
    const data = await this.userRepository.findOneBy({ id });
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
    const data = await this.userRepository.findOne({
      where: { id },
      relations: ['role'], // utile si tu veux charger le rôle existant
    });

    if (!data) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    if (updateUserDto.role_id) {

      const role = await this.roleRepository.findOneBy({ id: updateUserDto.role_id });

      if (role === null) {
        throw new NotFoundException("Role  inexistant")
      }
      data.role = role;
    }

    this.userRepository.merge(data, { ...updateUserDto, role_id: undefined });
    return this.userRepository.save(data);
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
