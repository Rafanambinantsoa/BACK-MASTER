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
    return this.menuRepo.find();
  }

  async findOne(id: number) {
    const data = await this.menuRepo.findOne({ where: { id } });

    if (data === null) {
      throw new NotFoundException('Menus Introuvable')
    }
    return data;
  }

  async update(id: number, updateMenuDto: UpdateMenuDto) {
    const data = await this.menuRepo.findOne({ where: { id } });

    if (data === null) {
      throw new NotFoundException('Menus Introuvable')
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
    return { message: `User with id ${id} deleted` };
  }
}
