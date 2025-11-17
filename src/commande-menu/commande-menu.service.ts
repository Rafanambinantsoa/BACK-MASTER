import { Injectable } from '@nestjs/common';
import { CreateCommandeMenuDto } from './dto/create-commande-menu.dto';
import { UpdateCommandeMenuDto } from './dto/update-commande-menu.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CommandeMenu } from './entities/commande-menu.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CommandeMenuService {

  constructor(
    @InjectRepository(CommandeMenu)
    private cM: Repository<CommandeMenu>
  ) { }

  create(createCommandeMenuDto: CreateCommandeMenuDto) {
    return 'This action adds a new commandeMenu';
  }

  async findAll() {
    return await this.cM.find({ relations: ['menu', 'commande.reservation'] });
  }

  async findOne(id: number) {

    return await this.cM.findOne({ where: { id }, relations: ['menu', 'commande.reservation'] });
  }

  async update(id: number, updateCommandeMenuDto: UpdateCommandeMenuDto) {
    await this.cM.update(id, updateCommandeMenuDto);
    return this.cM.findOne({ where: { id } });
  }

  remove(id: number) {
    return `This action removes a #${id} commandeMenu`;
  }
}
