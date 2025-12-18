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
import { PaiementPret } from 'src/paiement-pret/entities/paiement-pret.entity';
import { CreateCommandeFromReservationDto } from './dto/CreateCommandeFromReservationDto.dto';

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

    @InjectRepository(PaiementPret)
    private paiementPretRepository: Repository<PaiementPret>,
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
        user_id: dto.user_id,
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
            status: "en_attente"
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
  async updateCommandeMenuStatus(
    commandeId: number,
    dto: UpdateCommandeMenuStatusDto,
  ) {
    const commande = await this.commandeRepo.findOne({
      where: { id: commandeId }
    });

    if (!commande) {
      throw new NotFoundException('Commande introuvable');
    }

    const commandeMenu = await this.commandeMenuRepo.findOne({
      where: {
        commande: { id: commandeId },
        menu: { id: dto.menuId },
      },
    });

    if (!commandeMenu) {
      throw new NotFoundException('Menu de la commande introuvable');
    }

    commandeMenu.status = dto.status;

    await this.commandeMenuRepo.save(commandeMenu);

    return {
      message: 'Statut du menu mis à jour avec succès',
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
      if (quantities.some(q => q <= 0)) {
        throw new BadRequestException('Toutes les quantités doivent être supérieures à 0');
      }

      // Charger tous les menus pour vérifier qu'ils existent
      const menus = await queryRunner.manager.findBy(Menu, { id: In(menuIds) });
      if (menus.length !== menuIds.length) {
        throw new BadRequestException('Un ou plusieurs menus sont introuvables');
      }

      // Créer une map pour associer menuId -> Menu (pour le calcul du prix)
      const menuMap = new Map<number, Menu>();
      menus.forEach(menu => menuMap.set(menu.id, menu));

      // Charger les CommandeMenu existants pour cette commande
      const existingCommandeMenus = await queryRunner.manager.find(CommandeMenu, {
        where: { commande_id: commandeId },
      });
      const existingMap = new Map<number, CommandeMenu>();
      existingCommandeMenus.forEach(cm => existingMap.set(cm.menuId, cm));

      let totalPrice = 0;
      const toSave: CommandeMenu[] = [];
      const menuIdsSet = new Set(menuIds);

      // Mettre à jour ou créer les CommandeMenu
      for (let i = 0; i < menuIds.length; i++) {
        const menuId = menuIds[i];
        const quantity = quantities[i];
        const menu = menuMap.get(menuId)!;
        totalPrice += menu.prix * quantity;

        if (existingMap.has(menuId)) {
          // Mise à jour de la quantité existante
          const cm = existingMap.get(menuId)!;
          cm.quantity = quantity;
          toSave.push(cm);
          existingMap.delete(menuId); // on marque comme traité
        } else {
          // Créer un nouveau CommandeMenu
          const cm = queryRunner.manager.create(CommandeMenu, {
            commande_id: commandeId,
            menuId,
            quantity,
            status: "en_attente"
          });
          toSave.push(cm);
        }
      }

      // Supprimer les CommandeMenu qui ne sont pas dans la nouvelle liste
      const toDelete = Array.from(existingMap.values());
      if (toDelete.length > 0) {
        await queryRunner.manager.remove(CommandeMenu, toDelete);
      }

      // Sauvegarder les CommandeMenu à créer ou mettre à jour
      if (toSave.length > 0) {
        await queryRunner.manager.save(toSave);
      }

      // Mettre à jour le prix total de la commande
      await queryRunner.manager.update(Commande, commandeId, { status: "en_cours", total_price: totalPrice });

      await queryRunner.commitTransaction();
      await queryRunner.release();

      // Recharger la commande avec les relations pour le retour
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

  async countCommandesToDay() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const count = await this.commandeRepo.count({
      where: {
        date_commande: In([startOfDay, endOfDay]),
      },
    });

    return { commandesTodayCount: count };
  }

  //nombre des commande en_cours et payer
  async countCommandesByStatus() {
    const enCoursCount = await this.commandeRepo.count({ where: { status: 'en_cours' } });
    const payerCount = await this.commandeRepo.count({ where: { status: 'payer' } });

    return {
      en_cours: enCoursCount,
      payer: payerCount,
    };
  }

  async totalPaiementToday() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Total from paiementCommande
    const total = await this.commandeRepo
      .createQueryBuilder('commande')
      .leftJoin('commande.paimentCommandes', 'paiementCommande')
      .where('commande.date_commande >= :startOfDay AND commande.date_commande < :endOfDay', { startOfDay, endOfDay })
      .select('COALESCE(SUM(paiementCommande.montant), 0)', 'totalPaiement')
      .getRawOne();

    // Total from paiementPret
    const totalAvance = await this.paiementPretRepository
      .createQueryBuilder('paiementPret')
      .where('paiementPret.createdAt >= :startOfDay AND paiementPret.createdAt < :endOfDay', { startOfDay, endOfDay })
      .select('COALESCE(SUM(paiementPret.montantAvance), 0)', 'totalAvance')
      .getRawOne();

    const totalPaiementToday =
      parseFloat(total.totalPaiement) +
      parseFloat(totalAvance.totalAvance);

    return { totalPaiementToday };
  }


  async totalPret() {
    //somme total reste_a_regler dans paiementPret
    const totalPret = await this.paiementPretRepository
      .createQueryBuilder('paiementPret')
      .select('SUM(paiementPret.reste_a_regler)', 'totalPret')
      .getRawOne();

    return { totalPret: parseFloat(totalPret.totalPret) };
  }


  async createFromExistingReservation(dto: CreateCommandeFromReservationDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      if (!dto.menuIds?.length || !dto.quantities?.length) {
        throw new BadRequestException('Aucun menu fourni.');
      }

      if (dto.menuIds.length !== dto.quantities.length) {
        throw new BadRequestException('menuIds et quantities doivent avoir la même taille.');
      }

      // ========= CLIENT =========
      const client = await queryRunner.manager.findOne(Client, { where: { id: dto.clientId } });
      if (!client) throw new BadRequestException('Client introuvable');

      // ========= RESERVATION =========
      const reservation = await queryRunner.manager.findOne(Reservation, {
        where: { id: dto.reservationId },
      });
      if (!reservation) throw new BadRequestException('Réservation introuvable');

      // Vérifier que la réservation appartient bien au client
      if (reservation.client_id !== client.id) {
        throw new BadRequestException('La réservation ne correspond pas au client');
      }

      // Vérifier que la réservation est valide
      if (reservation.status === 'annulee') {
        throw new BadRequestException('La réservation est annulée');
      }

      // ========= MENUS =========
      let totalPrice = 0;

      for (let i = 0; i < dto.menuIds.length; i++) {
        const menu = await queryRunner.manager.findOne(Menu, { where: { id: dto.menuIds[i] } });

        if (!menu) throw new BadRequestException(`Menu introuvable : ${dto.menuIds[i]}`);

        const qty = dto.quantities[i];
        if (qty <= 0) throw new BadRequestException(`Quantité invalide pour ${menu.nom}`);

        totalPrice += menu.prix * qty;
      }

      // ========= COMMANDE =========
      const commande = queryRunner.manager.create(Commande, {
        reservation_id: reservation.id,
        date_commande: dto.date_commande ?? new Date(),
        status: 'en_cours',
        total_price: totalPrice,
      });

      const savedCommande = await queryRunner.manager.save(commande);

      // ========= REFERENCE =========
      const reference = `COM-${savedCommande.id.toString().padStart(6, '0')}`;
      await queryRunner.manager.update(Commande, savedCommande.id, { reference });
      savedCommande.reference = reference;

      // ========= COMMANDE MENUS =========
      for (let i = 0; i < dto.menuIds.length; i++) {
        await queryRunner.manager.save(
          CommandeMenu,
          queryRunner.manager.create(CommandeMenu, {
            commande_id: savedCommande.id,
            menuId: dto.menuIds[i],
            quantity: dto.quantities[i],
            status: 'en_attente',
          }),
        );
      }

      await queryRunner.commitTransaction();

      return {
        message: 'Commande créée pour la réservation existante',
        commande: savedCommande,
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException({
        message: 'Erreur lors de la création de la commande',
        details: error.message,
      });
    } finally {
      await queryRunner.release();
    }
  }





}
