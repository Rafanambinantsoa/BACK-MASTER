import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class RoleService {

  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,

    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) { }

  async create(createRoleDto: CreateRoleDto) {
    //verification  doublon de nom
    const existingRole = await this.roleRepository.findOneBy({ nom: createRoleDto.nom });
    if (existingRole) {
      throw new Error('Role with this name already exists');
    }
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

    // Vérification de doublon par nom
    if (updateRoleDto.nom) {
      const existingRole = await this.roleRepository.findOne({
        where: { nom: updateRoleDto.nom },
      });

      if (existingRole && existingRole.id !== id) {
        throw new NotFoundException(`Le nom du rôle "${updateRoleDto.nom}" est déjà utilisé.`);
      }
    }

    await this.roleRepository.merge(role, updateRoleDto);
    return this.roleRepository.save(role);
  }


  async remove(id: number) {
    const role = await this.roleRepository.findOneBy({ id });
    if (!role) throw new NotFoundException(`Role with ID ${id} not found`);

    // Met le champ role_id à NULL pour les utilisateurs liés
    await this.userRepository
      .createQueryBuilder()
      .update('user')
      .set({ role: null })
      .where('role_id = :id', { id })
      .execute();

    await this.roleRepository.delete(id);

    return { message: `Role with ID ${id} deleted and users unlinked.` };
  }

  async seedRoles() {
    const roles: CreateRoleDto[] = [
      { nom: 'Cuisinier', description: 'Prépare les plats', couleur: 'rouge' },
      { nom: 'Serveur', description: 'Serve les clients', couleur: 'vert' },
      { nom: 'Admin', description: 'Gestion complète du système', couleur: 'jaune' },
      { nom: 'Caissier', description: 'Gère les paiements', couleur: 'violet' },
    ];

    for (const roleDto of roles) {
      const existingRole = await this.roleRepository.findOneBy({ nom: roleDto.nom });
      if (!existingRole) {
        const role = this.roleRepository.create(roleDto);
        await this.roleRepository.save(role);
      }
    }

    return { message: 'Roles seeded successfully.' };
  }

  async countRoles() {
    const count = await this.roleRepository.count();
    return { roleCount: count };
  }


}
