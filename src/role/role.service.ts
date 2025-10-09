import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RoleService {

  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) { }

  async create(createRoleDto: CreateRoleDto) {
    const role = await this.roleRepository.create(createRoleDto);
    return this.roleRepository.save(role);
  }

  async findAll() {
    const data = await this.roleRepository.find();
    if (data === null) {
      throw new NotFoundException(`No roles found`);
    }
    return data;
  }

  async findOne(id: number) {
    const role = await this.roleRepository.findOneBy({ id });
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    return role;
  }

  async update(id: number, updateRoleDto: UpdateRoleDto) {
    const role = await this.roleRepository.findOneBy({ id });
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    await this.roleRepository.merge(role, updateRoleDto);
    return this.roleRepository.save(role);
  }

  async remove(id: number) {
    const role = await this.roleRepository.findOneBy({ id });
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    await this.roleRepository.delete(id);

    return { message: `Role with ID ${id} deleted` };

  }
}
