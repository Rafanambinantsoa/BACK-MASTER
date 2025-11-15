import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Commande } from './entities/commande.entity';
import { CreateCommandeDto } from './dto/create-commande.dto';
import { UpdateCommandeDto } from './dto/update-commande.dto';
import { Client } from 'src/client/entities/client.entity';
import { Reservation } from 'src/reservation/entities/reservation.entity';
import { CommandeMenu } from 'src/commande-menu/entities/commande-menu.entity';
import { Menu } from 'src/menu/entities/menu.entity';
import { Table } from 'src/table/entities/table.entity';
import { ReservationTable } from 'src/reservation-table/entities/reservation-table.entity';
import { UpdateCommandeMenuStatusDto } from './dto/update-commande-menu-status.dto';

@Injectable()
export class CommandeService {
  constructor(
    @InjectRepository(Commande)
    private commandeRepo: Repository<Commande>,

    @InjectRepository(Client)
    private clientRepo: Repository<Client>,

    @InjectRepository(Reservation)
    private reservationRepo: Repository<Reservation>,

    @InjectRepository(CommandeMenu)
    private commandeMenuRepo: Repository<CommandeMenu>,

    @InjectDataSource()
    private dataSource: DataSource,

    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,

    @InjectRepository(Table)
    private tableRepository: Repository<Table>,

    @InjectRepository(ReservationTable)
    private reservationTableRepository: Repository<ReservationTable>,
  ) { }

  async create(dto: CreateCommandeDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const date = dto.date_reservation;
      const heureDebut = dto.heure_debut;
      const heureFin = dto.heure_fin;

      await this.verifierDisponibiliteTables(
        queryRunner.manager,
        dto.tablesIds,
        date,
        heureDebut,
        heureFin,
      );

      const client = queryRunner.manager.create(Client, {
        nom: dto.nom,
        email: dto.email,
        telephone: dto.telephone,
        adresse: dto.adresse,
      });
      const savedClient = await queryRunner.manager.save(Client, client);

      const reservation = queryRunner.manager.create(Reservation, {
        client_id: savedClient.id,
        date,
        heure_debut: heureDebut,
        heure_fin: heureFin,
        status: 'en_attente',
        type_reservation: 'table',
      });
      const savedReservation = await queryRunner.manager.save(Reservation, reservation);

      for (const tableId of dto.tablesIds) {
        const table = await queryRunner.manager.findOne(Table, { where: { id: tableId } });
        if (!table) throw new BadRequestException(`Table introuvable : ${tableId}`);

        await queryRunner.manager.save(
          ReservationTable,
          queryRunner.manager.create(ReservationTable, {
            reservation: savedReservation,
            table,
          }),
        );
      }

      let totalPrice = 0;
      for (let i = 0; i < dto.menuIds.length; i++) {
        const menu = await queryRunner.manager.findOne(Menu, { where: { id: dto.menuIds[i] } });
        if (!menu) throw new BadRequestException(`Menu introuvable : ${dto.menuIds[i]}`);

        totalPrice += menu.prix * dto.quantities[i];
      }

      const commande = queryRunner.manager.create(Commande, {
        reservation_id: savedReservation.id,
        date_commande: dto.date_commande,
        status: 'en_cours',
        total_price: totalPrice,
      });
      const savedCommande = await queryRunner.manager.save(Commande, commande);

      savedCommande.reference = `COM-${savedCommande.id}`;
      await queryRunner.manager.update(Commande, savedCommande.id, { reference: savedCommande.reference });

      for (let i = 0; i < dto.menuIds.length; i++) {
        await queryRunner.manager.save(
          CommandeMenu,
          queryRunner.manager.create(CommandeMenu, {
            commande_id: savedCommande.id,
            menuId: dto.menuIds[i],
            quantity: dto.quantities[i],
          }),
        );
      }

      await queryRunner.commitTransaction();

      return {
        message: 'Commande créée avec succès',
        commande: savedCommande,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await queryRunner.release();
    }
  }

  findAll() {
    return this.commandeRepo.find({
      relations: ['reservation.reservationTables.table', 'reservation.client', 'commandeMenu.menu']
    });
  }

  findOne(id: number) {
    return this.commandeRepo.findOne({
      where: { id },
      relations: ['reservation.reservationTables.table', 'reservation.client', 'commandeMenu.menu']
    });
  }

  async update(id: number, dto: UpdateCommandeDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingCommande = await queryRunner.manager.findOne(Commande, {
        where: { id },
        relations: [
          'reservation',
          'reservation.reservationTables',
          'reservation.client',
        ],
      });

      if (!existingCommande) {
        throw new BadRequestException('Commande introuvable');
      }

      const reservation = existingCommande.reservation;
      const client = reservation.client;

      // 1️⃣ Mise à jour Client
      if (dto.nom !== undefined) client.nom = dto.nom;
      if (dto.email !== undefined) client.email = dto.email;
      if (dto.telephone !== undefined) client.telephone = dto.telephone;
      if (dto.adresse !== undefined) client.adresse = dto.adresse;
      await queryRunner.manager.save(Client, client);

      // 2️⃣ Mise à jour Réservation
      const date = dto.date_reservation ? new Date(dto.date_reservation) : reservation.date;
      const heureDebut = dto.heure_debut ?? reservation.heure_debut;
      const heureFin = dto.heure_fin ?? reservation.heure_fin;

      // Mise à jour de la réservation
      await queryRunner.manager.update(Reservation, reservation.id, {
        date: date instanceof Date ? date : new Date(date),
        heure_debut: heureDebut,
        heure_fin: heureFin,
        client,
      });

      // Gestion des tables - Supprimer tous et recréer (comme dans reservation service)
      if (dto.tablesIds && dto.tablesIds.length > 0) {
        const dateString = date.toISOString().split('T')[0];
        await this.verifierDisponibiliteTables(
          queryRunner.manager,
          dto.tablesIds,
          dateString,
          heureDebut,
          heureFin,
          reservation.id,
        );

        // Vérifier que toutes les tables existent
        for (const tableId of dto.tablesIds) {
          const tableExists = await queryRunner.manager.findOneBy(Table, { id: tableId });
          if (!tableExists) throw new BadRequestException(`Table ${tableId} introuvable`);
        }

        // Supprimer tous les ReservationTable existants
        await queryRunner.manager.delete(ReservationTable, { reservation: { id: reservation.id } });

        // Charger toutes les tables en une seule requête
        const tables = await queryRunner.manager.findBy(Table, { id: In(dto.tablesIds) });

        // Créer tous les ReservationTable en batch
        const reservationTables = tables.map((table) =>
          queryRunner.manager.create(ReservationTable, { table, reservation }),
        );
        await queryRunner.manager.save(ReservationTable, reservationTables);
      }

      // 3️⃣ Mise à jour commande
      if (dto.date_commande !== undefined) {
        existingCommande.date_commande = dto.date_commande;
      }



      await queryRunner.commitTransaction();

      // Recharger la commande avec toutes les relations pour le retour
      const updatedCommande = await this.commandeRepo.findOne({
        where: { id },
        relations: [
          'reservation.reservationTables.table',
          'reservation.client',
          'commandeMenu.menu',
        ],
      });

      await queryRunner.release();

      return {
        message: 'Commande mise à jour avec succès',
        commande: updatedCommande,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      throw new BadRequestException(error.message);
    }
  }

  async remove(id: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const commande = await queryRunner.manager.findOne(Commande, {
        where: { id },
      });

      if (!commande) {
        throw new BadRequestException('Commande introuvable');
      }

      // 1. Supprimer les CommandeMenu liés
      await queryRunner.manager.delete(CommandeMenu, { commande_id: commande.id });

      // 2. Optionally, you can delete the reservation and client if needed
      // const reservation = await queryRunner.manager.findOne(Reservation, { where: { id: commande.reservation_id } });
      // if (reservation) {
      //   await queryRunner.manager.delete(Client, { id: reservation.client_id });
      //   await queryRunner.manager.delete(Reservation, { id: reservation.id });
      // }

      // 3. Supprimer la commande
      await queryRunner.manager.delete(Commande, { id: commande.id });

      await queryRunner.commitTransaction();

      return {
        message: 'Commande supprimée avec succès',
        commandeId: id,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await queryRunner.release();
    }
  }

  private async verifierDisponibiliteTables(
    manager,
    tablesIds: number[],
    date: string,
    heureDebut: string,
    heureFin: string,
    reservationIdExclue?: number,
  ) {
    const conflits = await manager
      .getRepository(ReservationTable)
      .createQueryBuilder('rt')
      .leftJoin('rt.reservation', 'reservation')
      .where('rt.tableId IN (:...tablesIds)', { tablesIds })
      .andWhere('reservation.date = :date', { date })
      .andWhere(
        '(reservation.heure_debut < :heureFin AND reservation.heure_fin > :heureDebut)',
        { heureDebut, heureFin },
      )
      .andWhere(reservationIdExclue ? 'reservation.id != :id' : '1=1', {
        id: reservationIdExclue,
      })
      .select(['rt.tableId AS tableId'])
      .getRawMany();

    if (conflits.length > 0) {
      const ids = conflits.map((c) => c.tableId).join(', ');
      throw new BadRequestException(
        `Les tables suivantes ne sont pas disponibles : ${ids}`,
      );
    }
  }

  async verifierDisponibiliteTable(
    tableId: number,
    date: Date,
    heureDebut: string,
    heureFin: string,
    reservationIdToExclude?: number,
  ) {
    const table = await this.tableRepository.findOneBy({ id: tableId });
    if (!table)
      throw new NotFoundException(`Table ${tableId} introuvable`);

    // Vérifier que la date n’est pas dans le passé (on autorise uniquement aujourd’hui et après)
    const aujourdHui = new Date();
    const dateSansHeure = new Date(date);
    dateSansHeure.setHours(0, 0, 0, 0);
    aujourdHui.setHours(0, 0, 0, 0);

    if (dateSansHeure < aujourdHui)
      throw new BadRequestException('La date ne peut pas être dans le passé');

    const formatHeure = /^([01]\d|2[0-3]):(00|30)$/;
    if (!formatHeure.test(heureDebut) || !formatHeure.test(heureFin))
      throw new BadRequestException('Format d’heure invalide (HH:MM, intervalle de 30 min)');

    const [hdH, hdM] = heureDebut.split(':').map(Number);
    const [hfH, hfM] = heureFin.split(':').map(Number);
    if (hfH * 60 + hfM <= hdH * 60 + hdM)
      throw new BadRequestException('Heure de fin avant heure de début');

    const query = this.reservationTableRepository
      .createQueryBuilder('reservationTable')
      .leftJoinAndSelect('reservationTable.reservation', 'reservation')
      .where('reservationTable.table = :tableId', { tableId })
      .andWhere('reservation.date = :date', { date })
      .andWhere('(reservation.heure_debut < :heureFin AND reservation.heure_fin > :heureDebut)', {
        heureDebut,
        heureFin,
      });

    if (reservationIdToExclude)
      query.andWhere('reservation.id != :reservationIdToExclude', { reservationIdToExclude });

    const conflits = await query.getMany();

    if (conflits.length > 0)
      return { disponible: false, message: 'Table occupée', conflits };

    return { disponible: true, message: 'Table disponible' };
  }

  //Mettre a  jour le status d'un commande
  async updateStatus(id: number) {
    const commande = await this.commandeRepo.findOne({ where: { id } });
    if (!commande) {
      throw new NotFoundException('Commande introuvable');
    }
    commande.status = "terminer";
    await this.commandeRepo.save(commande);

    return {
      message: 'Statut de la commande mis à jour avec succès',
      commande,
    };
  }

  //Mettre a jour la statut d'une des commande   genre un des  menus ou plusieur  
  async udpateCommandeMenuStatus(commandeId: number, updateCommandeMenuStatus: UpdateCommandeMenuStatusDto) {
    const commande = await this.commandeRepo.findOne({ where: { id: commandeId } });
    if (commande === null) {
      throw new NotFoundException('Commande introuvable');
    }

    const commandeMenu = await this.commandeMenuRepo.findOne({ where: { commande_id: commandeId, menuId: updateCommandeMenuStatus.menuId } });
    if (commandeMenu === null) {
      throw new NotFoundException('Menu de la commande introuvable');
    }

    // Mettre à jour le statut du menu dans la commande
    commandeMenu['status'] = updateCommandeMenuStatus.status; // Assurez-vous que la colonne 'status' existe dans l'entité CommandeMenu
    await this.commandeMenuRepo.save(commandeMenu);

    return {
      message: 'Statut du menu dans la commande mis à jour avec succès',
      commandeMenu,
    };
  }

  // Mettre à jour uniquement les menus et quantités d'une commande
  async updateCommandeMenus(commandeId: number, menuIds: number[], quantities: number[]) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Vérifier que la commande existe
      const commande = await queryRunner.manager.findOne(Commande, { where: { id: commandeId } });
      if (!commande) {
        throw new NotFoundException('Commande introuvable');
      }

      // Validation
      if (menuIds.length !== quantities.length) {
        throw new BadRequestException('Le nombre de menus doit correspondre au nombre de quantités');
      }

      if (menuIds.length === 0) {
        throw new BadRequestException('Au moins un menu doit être spécifié');
      }

      // Vérifier que toutes les quantités sont valides
      for (const quantity of quantities) {
        if (quantity <= 0) {
          throw new BadRequestException(`La quantité doit être supérieure à 0`);
        }
      }

      // Charger tous les menus pour vérifier qu'ils existent
      const menus = await queryRunner.manager.findBy(Menu, { id: In(menuIds) });
      if (menus.length !== menuIds.length) {
        throw new BadRequestException('Un ou plusieurs menus sont introuvables');
      }

      // Supprimer tous les CommandeMenu existants pour cette commande
      await queryRunner.manager.delete(CommandeMenu, { commande_id: commandeId });

      // Créer une map pour associer menuId -> Menu (pour le calcul du prix)
      const menuMap = new Map<number, Menu>();
      menus.forEach(menu => menuMap.set(menu.id, menu));

      // Calculer le prix total
      let totalPrice = 0;
      for (let i = 0; i < menuIds.length; i++) {
        const menuId = menuIds[i];
        const menu = menuMap.get(menuId);
        if (!menu) {
          throw new BadRequestException(`Menu ${menuId} introuvable`);
        }
        totalPrice += menu.prix * quantities[i];
      }

      // Créer tous les CommandeMenu en batch
      const commandeMenus: CommandeMenu[] = [];
      for (let i = 0; i < menuIds.length; i++) {
        const commandeMenu = queryRunner.manager.create(CommandeMenu, {
          commande_id: commandeId,
          menuId: menuIds[i],
          quantity: quantities[i],
        });
        commandeMenus.push(commandeMenu);
      }

      // Sauvegarder tous les CommandeMenu en batch
      if (commandeMenus.length > 0) {
        await queryRunner.manager.save(CommandeMenu, commandeMenus);
      }

      // Mettre à jour le prix total de la commande
      await queryRunner.manager.update(Commande, commandeId, { total_price: totalPrice });

      await queryRunner.commitTransaction();
      await queryRunner.release();

      // Recharger la commande avec les relations pour le retour (après avoir libéré le queryRunner)
      const updatedCommande = await this.commandeRepo.findOne({
        where: { id: commandeId },
        relations: ['commandeMenu.menu'],
      });

      return {
        message: 'Menus de la commande mis à jour avec succès',
        commande: updatedCommande,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      throw new BadRequestException(error.message);
    }
  }

}
