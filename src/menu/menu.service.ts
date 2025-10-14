import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Menu } from './entities/menu.entity';
import { Repository } from 'typeorm';

@Injectable()
export class MenuService {

  constructor(
    @InjectRepository(Menu)
    private menuRepo: Repository<Menu>
  ) { }

  async create(createMenuDto: CreateMenuDto) {
    const data = this.menuRepo.create(createMenuDto);
    const menu = await this.menuRepo.save(data);

    return menu;
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
    const data = await this.menuRepo.findOne({ where: { id } });

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

    const user = this.menuRepo.merge(data, updateMenuDto)

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
