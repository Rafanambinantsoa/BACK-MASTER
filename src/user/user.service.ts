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
import { Table } from 'src/table/entities/table.entity';
import * as bcrypt from 'bcrypt';


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
    private typeMenuRepository: Repository<TypeMenu>,

    @InjectRepository(Table)
    private tableRepository: Repository<Table>,
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

  //nombre de user actifs 
  async countActiveUsers() {
    const count = await this.userRepository.countBy({ statut: true });
    return { activeUserCount: count };
  }

  //seeds user
  async seedUsers() {
    const users = [
      {
        nom: 'Alice',
        email: 'ka@gmail.com',
        statut: true,
        password: 'password1',
        role_id: 1,
        typeMenuIds: [1, 2],
      },
      {
        nom: 'Bob',
        email: 'bob@example.com',
        statut: true,
        password: 'password2',
        role_id: 2,
        typeMenuIds: [2, 3],
      },
      {
        nom: 'Charlie',
        email: 'charlie@example.com',
        statut: true,
        password: 'password3',
        role_id: 3,
        typeMenuIds: [1, 3],
      },
      {
        nom: 'David',
        email: 'david@example.com',
        statut: true,
        password: 'password4',
        role_id: 4,
        typeMenuIds: [2, 4],
      }
    ];

    for (const userData of users) {
      const existingUser = await this.userRepository.findOneBy({ email: userData.email });
      if (!existingUser) {
        const { typeMenuIds, ...userInfo } = userData;
        const user = this.userRepository.create(userInfo);
        const savedUser = await this.userRepository.save(user);

        // Assigner les spécialités (typeMenuIds)
        if (typeMenuIds && typeMenuIds.length > 0) {
          const userTypeMenus: UserTypeMenu[] = [];

          for (const typeMenuId of typeMenuIds) {
            const typeMenu = await this.typeMenuRepository.findOneBy({ id: typeMenuId });
            if (!typeMenu) continue;

            const userTypeMenu = this.userTypeMenuRepository.create({
              user: savedUser,
              typeMenu: typeMenu,
            });
            userTypeMenus.push(userTypeMenu);
          }

          if (userTypeMenus.length > 0) {
            await this.userTypeMenuRepository.save(userTypeMenus);
          }
        }
      }
    }

    return { message: "Users initialisés avec succès" };
  }

  private async seedIfNotExists<T>(
    repository: any,
    uniqueKey: string,
    data: T[]
  ) {
    for (const item of data) {
      const where = { [uniqueKey]: item[uniqueKey] };
      const exists = await repository.findOneBy(where);

      if (!exists) {
        const entity = repository.create(item);
        await repository.save(entity);
      }
    }
  }

  private async seedUsersWithTypeMenus() {
    const users = [
      {
        nom: 'Alice',
        email: 'ka@gmail.com',
        statut: true,
        password: 'mikasa',
        role_id: 1,
        typeMenuIds: [1, 2],
      },
      {
        nom: 'Bob',
        email: 'bob@example.com',
        statut: true,
        password: 'mikasa',
        role_id: 2,
        typeMenuIds: [2, 3],
      },
      {
        nom: 'Charlie',
        email: 'charlie@example.com',
        statut: true,
        password: 'mikasa',
        role_id: 3,
        typeMenuIds: [1, 3],
      },
      {
        nom: 'David',
        email: 'david@example.com',
        statut: true,
        password: 'mikasa',
        role_id: 4,
        typeMenuIds: [2, 4],
      },
    ];

    for (const userData of users) {

      const existingUser = await this.userRepository.findOneBy({ email: userData.email });
      if (existingUser) continue;

      const { typeMenuIds, ...userInfo } = userData;
      const hashedPassword = await bcrypt.hash(userInfo.password, 10);

      const user = this.userRepository.create({ ...userInfo, password: hashedPassword });
      const savedUser = await this.userRepository.save(user);

      if (typeMenuIds?.length) {
        const userTypeMenus: UserTypeMenu[] = [];  // ✅ FIX

        for (const id of typeMenuIds) {
          const typeMenu = await this.typeMenuRepository.findOneBy({ id });
          if (!typeMenu) continue;

          userTypeMenus.push(
            this.userTypeMenuRepository.create({
              user: savedUser,
              typeMenu,
            })
          );
        }

        if (userTypeMenus.length) {
          await this.userTypeMenuRepository.save(userTypeMenus);
        }
      }
    }
  }




  //Seed principale 
  async seedAll() {
    await this.seedIfNotExists(this.typeMenuRepository, 'nom', [
      { nom: 'Chaud' },
      { nom: 'Froid' },
      { nom: 'Dessert' },
    ]);

    await this.seedIfNotExists(this.tableRepository, 'numero_table', [
      { numero_table: 'Table 1' },
      { numero_table: 'Table 2' },
      { numero_table: 'Table 3' },
      { numero_table: 'Table 4' },
      { numero_table: 'Table 5' },
    ]);

    await this.seedIfNotExists(this.roleRepository, 'nom', [
      { nom: 'Cuisinier', description: 'Prépare les plats', couleur: 'rouge' },
      { nom: 'Serveur', description: 'Serve les clients', couleur: 'vert' },
      { nom: 'Admin', description: 'Gestion complète du système', couleur: 'jaune' },
      { nom: 'Caissier', description: 'Gère les paiements', couleur: 'violet' },
    ]);

    await this.seedUsersWithTypeMenus();

    return { message: 'Toutes les données ont été seed avec succès' };
  }





}
