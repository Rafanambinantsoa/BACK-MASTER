import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) { }

  create(createUserDto: CreateUserDto) {
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

  async update(id: number, updateUserDto: UpdateUserDto) {
    const data = await this.userRepository.findOneBy({ id });
    // retourner une status code avec un message  404
    if (data === null) {
      // ✅ lance une exception 404
      throw new NotFoundException(`User with id ${id} not found`);
    }

    this.userRepository.merge(data, updateUserDto);
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
