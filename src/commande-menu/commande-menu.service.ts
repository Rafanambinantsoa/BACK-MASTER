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

  async remove(id: number) {
    return `This action removes a #${id} commandeMenu`;
  }

  async countCommandeMenuToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const result = await this.cM
      .createQueryBuilder('commandeMenu')
      .where('commandeMenu.createdAt >= :startOfDay AND commandeMenu.createdAt < :endOfDay', {
        startOfDay: today,
        endOfDay: tomorrow,
      })
      .select('COUNT(commandeMenu.id)', 'count')
      .getRawOne();

    return { count: Number(result.count) };
  }

  // Nombre de plat en cours today
  // Nombre de plat en attente today

  // async dashBoard () {
  //   //
  //   const nombrePa
  // }

}
