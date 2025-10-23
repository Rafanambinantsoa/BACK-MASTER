import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTypeMenuDto } from './dto/create-type_menu.dto';
import { UpdateTypeMenuDto } from './dto/update-type_menu.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeMenu } from './entities/type_menu.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TypeMenuService {

  constructor(
    @InjectRepository(TypeMenu)
    private typeMenuRepo: Repository<TypeMenu>
  ) { }

  async create(createTypeMenuDto: CreateTypeMenuDto) {

    //rechercher s'il y a doublon 
    const doublon = await this.typeMenuRepo.findOneBy({ nom: createTypeMenuDto.nom })

    if (doublon) {
      return { message: "Type menu deja existant" }
    }

    const data = await this.typeMenuRepo.create(createTypeMenuDto)

    return this.typeMenuRepo.save(data);
  }

  async findAll() {
    const data = await this.typeMenuRepo.find()
    return data
  }

  async findOne(id: number) {
    const data = await this.typeMenuRepo.findOneBy({ id })
    if (data === null) {
      throw new NotFoundException(`TypeMenu avec l'ID ${id} introuvable`);
    }
    return data
  }

  async update(id: number, updateTypeMenuDto: UpdateTypeMenuDto) {
    await this.typeMenuRepo.update(id, updateTypeMenuDto);
    const updatedTypeMenu = await this.typeMenuRepo.findOne({ where: { id } });

    if (!updatedTypeMenu) {
      throw new NotFoundException(`TypeMenu avec l'ID ${id} introuvable`);
    }

    return updatedTypeMenu;
  }


  async remove(id: number) {
    const data = await this.typeMenuRepo.findOneBy({ id });
    if (data === null) {
      throw new NotFoundException(`TypeMenu avec l'ID ${id} introuvable`);
    }
    await this.typeMenuRepo.delete(id);
    return { message: "Type menu supprimé avec succès" };
  }
}
