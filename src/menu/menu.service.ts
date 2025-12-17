import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Menu } from './entities/menu.entity';
import { Repository } from 'typeorm';
import { TypeMenu } from 'src/type_menu/entities/type_menu.entity';

@Injectable()
export class MenuService {

  constructor(
    @InjectRepository(Menu)
    private menuRepo: Repository<Menu>,

    @InjectRepository(TypeMenu)
    private typeMenuRepo: Repository<TypeMenu>
  ) { }

  async create(createMenuDto: CreateMenuDto) {

    const typeMenu = await this.typeMenuRepo.findOneBy({ id: createMenuDto.type_menu_id });

    if (typeMenu === null) {
      throw new NotFoundException("Type de menu inexistant")
    }
    const data = this.menuRepo.create(createMenuDto);
    const menu = await this.menuRepo.save(data);

    const menuRelation = await this.menuRepo.findOne({ where: { id: menu.id }, relations: ['type_menu'] });

    if (menuRelation === null) {
      throw new NotFoundException('Introuvable')
    }
    //AJoute l;image url  COMPLTE
    // const baseUrl = process.env.BASE_URL || 'http://localhost:3000/uploads/menu';
    const baseUrl = 'https://back-master-ztyd.onrender.com/uploads/menu';
    if (menuRelation.image) {
      menuRelation['imageUrl'] = `${baseUrl}/${menuRelation.image}`;
    } else {
      menuRelation['imageUrl'] = null;
    }

    return menuRelation;
  }

  async findAll() {
    const menu = await this.menuRepo.find();

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000/uploads/menu';

    return menu.map((menu) => ({
      ...menu,
      imageUrl: menu.image ? `${baseUrl}/${menu.image}` : null,
    }));
  }

  async findOne(id: number) {
    const data = await this.menuRepo.findOne({ where: { id } });

    if (data === null) {
      throw new NotFoundException('Menus Introuvable')
    }
    return {
      ...data,
      imageUrl: data.image ? `${process.env.BASE_URL || 'http://localhost:3000/uploads/menu'}/${data.image}` : null,
    };
  }

  async update(id: number, updateMenuDto: UpdateMenuDto) {
    const data = await this.menuRepo.findOne({ where: { id }, relations: ['type_menu'] });

    if (data === null) {
      throw new NotFoundException('Menus Introuvable')
    }

    //Suppression de l'ancienne image si une nouvelle est uploadée
    if (updateMenuDto.image && data.image) {
      const fs = require('fs');
      const path = require('path');
      const imagePath = path.join(__dirname, '../../uploads/menu', data.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    if (updateMenuDto.type_menu_id) {
      const typeMenu = await this.typeMenuRepo.findOneBy({ id: updateMenuDto.type_menu_id });

      if (typeMenu === null) {
        throw new NotFoundException("Type de menu inexistant")
      }

      data.type_menu = typeMenu;
    }

    const user = this.menuRepo.merge(data, updateMenuDto)
    //AJoute l;image url  COMPLTE
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000/uploads/menu';
    if (user.image) {
      user['imageUrl'] = `${baseUrl}/${user.image}`;
    } else {
      user['imageUrl'] = null;
    }

    return this.menuRepo.save(user)

  }

  async remove(id: number) {
    const data = await this.menuRepo.findOne({ where: { id } });

    if (data === null) {
      throw new NotFoundException('Menus Introuvable')
    }

    this.menuRepo.remove(data)

    //effacer  l'image associée
    if (data.image) {
      const fs = require('fs');
      const path = require('path');
      const imagePath = path.join(__dirname, '../../uploads/menu', data.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    return { message: `Menu with id ${id} deleted` };
  }
}
