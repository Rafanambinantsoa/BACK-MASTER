import { Injectable } from '@nestjs/common';
import { CreateCommandeMenuDto } from './dto/create-commande-menu.dto';
import { UpdateCommandeMenuDto } from './dto/update-commande-menu.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CommandeMenu } from './entities/commande-menu.entity';
import { Repository } from 'typeorm';
import { PusherService } from 'src/pusher/pusher.service';

@Injectable()
export class CommandeMenuService {

  constructor(
    @InjectRepository(CommandeMenu)
    private cM: Repository<CommandeMenu>,
    private pusherService: PusherService,
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
    const updatedCommandeMenu = await this.cM.findOne({
      where: { id },
      relations: ['commande'],
    });

    // Sync temps réel côté cuisine (plats à préparer + dashboard cuisinier)
    if (updatedCommandeMenu) {
      const commandeId = updatedCommandeMenu.commande_id;
      const reference =
        updatedCommandeMenu.commande?.reference?.trim() || (commandeId ? `COM-${commandeId}` : `COM-${id}`);

      await this.pusherService.trigger('cuisine', 'commande-mise-a-jour', {
        commandeId,
        reference,
        message: `La commande ${reference} a été mise à jour. Merci de vérifier.`,
        updatedAt: new Date().toISOString(),
      });
    }

    return updatedCommandeMenu;
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
  async getStatistiquesCuisinier() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const rows = await this.cM
      .createQueryBuilder('cm')
      .leftJoin('cm.menu', 'menu')
      .leftJoin('menu.type_menu', 'type_menu')
      .select([
        'LOWER(type_menu.nom) AS specialite',
        'cm.status AS status',
        'SUM(cm.quantity) AS total',
      ])
      .where('cm.createdAt BETWEEN :start AND :end', { start: startOfDay, end: endOfDay })
      .groupBy('specialite')
      .addGroupBy('cm.status')
      .getRawMany();

    const normalizeStatus = (status: string) => {
      // Correction typo possible dans la base
      return status === 'en_atttente' ? 'en_attente' : status;
    };

    const result = {
      platsPreparés: 0,
      platsEnCours: 0,
      platsEnAttente: 0,
      platsParSpecialite: {},
    };

    for (const row of rows) {
      const specialite = row.specialite;
      const status = normalizeStatus(row.status);
      const total = Number(row.total);

      if (!result.platsParSpecialite[specialite]) {
        result.platsParSpecialite[specialite] = { enAttente: 0, enCours: 0 };
      }

      if (['pret', 'terminer'].includes(status)) {
        result.platsPreparés += total;
      }

      if (['en_preparation', 'en_cours'].includes(status)) {
        result.platsEnCours += total;
        result.platsParSpecialite[specialite].enCours += total;
      }

      if (status === 'en_attente') {
        result.platsEnAttente += total;
        result.platsParSpecialite[specialite].enAttente += total;
      }
    }

    return result;
  }

}
