import { Injectable } from '@nestjs/common';
import { CreateCommandeMenuDto } from './dto/create-commande-menu.dto';
import { UpdateCommandeMenuDto } from './dto/update-commande-menu.dto';

@Injectable()
export class CommandeMenuService {
  create(createCommandeMenuDto: CreateCommandeMenuDto) {
    return 'This action adds a new commandeMenu';
  }

  findAll() {
    return `This action returns all commandeMenu`;
  }

  findOne(id: number) {
    return `This action returns a #${id} commandeMenu`;
  }

  update(id: number, updateCommandeMenuDto: UpdateCommandeMenuDto) {
    return `This action updates a #${id} commandeMenu`;
  }

  remove(id: number) {
    return `This action removes a #${id} commandeMenu`;
  }
}
