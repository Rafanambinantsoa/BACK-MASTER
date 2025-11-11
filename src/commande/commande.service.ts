import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Commande } from './entities/commande.entity';
import { CreateCommandeDto } from './dto/create-commande.dto';
import { UpdateCommandeDto } from './dto/update-commande.dto';
import { Client } from 'src/client/entities/client.entity';
import { Reservation } from 'src/reservation/entities/reservation.entity';
import { CommandeMenu } from 'src/commande-menu/entities/commande-menu.entity';
import { Menu } from 'src/menu/entities/menu.entity';
import { Table } from 'src/table/entities/table.entity';
import { ReservationTable } from 'src/reservation-table/entities/reservation-table.entity';

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
  ) { }

  async create(dto: CreateCommandeDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1️⃣ Créer le client
      const client = queryRunner.manager.create(Client, {
        nom: dto.nom,
        email: dto.email,
        telephone: dto.telephone,
        adresse: dto.adresse,
      });
      const savedClient = await queryRunner.manager.save(Client, client);

      // 2️⃣ Créer la réservation
      const reservation = queryRunner.manager.create(Reservation, {
        client_id: savedClient.id,
        date: new Date(dto.date_reservation),
        heure_debut: dto.heure_debut,
        heure_fin: dto.heure_fin,
        status: 'en_attente',
        type_reservation: 'table',
      });
      const savedReservation = await queryRunner.manager.save(Reservation, reservation);

      // Creer ;a resevation table  enregistrment 
      for (let i = 0; i < dto.tablesIds.length; i++) {
        // Vérifier si la table existe
        const table = await queryRunner.manager.findOne(Table, { where: { id: dto.tablesIds[i] } });
        if (!table) {
          throw new BadRequestException(`La table avec l'ID ${dto.tablesIds[i]} n'existe pas`);
        }

        const reservationTable = queryRunner.manager.create(ReservationTable, {
          reservation: savedReservation,
          table: table,
        });
        await queryRunner.manager.save(ReservationTable, reservationTable);
      }

      // 3️⃣ Créer la commande
      const commande = queryRunner.manager.create(Commande, {
        reservation_id: savedReservation.id,
        date_commande: dto.date_commande,
        status: 'en_cours',
      });
      const savedCommande = await queryRunner.manager.save(Commande, commande);

      // Générer la référence après sauvegarde
      savedCommande.reference = `COM-${savedCommande.id}`;
      await queryRunner.manager.update(Commande, savedCommande.id, {
        reference: savedCommande.reference,
      });

      // 4️⃣ Créer les CommandeMenu
      if (!dto.menuIds || !dto.quantities || dto.menuIds.length !== dto.quantities.length) {
        throw new BadRequestException('menuIds et quantities doivent avoir la même longueur');
      }

      for (let i = 0; i < dto.menuIds.length; i++) {
        // Vérifier si le menu existe
        const menu = await queryRunner.manager.findOne(Menu, { where: { id: dto.menuIds[i] } });
        if (!menu) {
          throw new BadRequestException(`Le menu avec l'ID ${dto.menuIds[i]} n'existe pas`);
        }

        const commandeMenu = queryRunner.manager.create(CommandeMenu, {
          commande_id: savedCommande.id,
          menuId: dto.menuIds[i],
          quantity: dto.quantities[i],
        });
        await queryRunner.manager.save(CommandeMenu, commandeMenu);
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
      relations: ['reservation.reservationTables', 'reservation.client', 'commandeMenu.menu']
    });
  }

  findOne(id: number) {
    return this.commandeRepo.findOne({
      where: { id },
      relations: ['reservation.reservationTables', 'reservation.client', 'commandeMenu.menu']
    });
  }

  async update(id: number, dto: UpdateCommandeDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 🔹 Récupérer la commande avec sa réservation
      const existingCommande = await queryRunner.manager.findOne(Commande, {
        where: { id },
        relations: ['reservation', 'reservation.reservationTables', 'reservation.reservationTables.table'],
      });
      if (!existingCommande) {
        throw new BadRequestException('Commande introuvable');
      }

      const reservation = existingCommande.reservation;
      if (!reservation) {
        throw new BadRequestException('Réservation introuvable');
      }

      // 🔹 Mettre à jour le client
      const client = await queryRunner.manager.findOne(Client, { where: { id: reservation.client_id } });
      if (client) {
        queryRunner.manager.merge(Client, client, {
          nom: dto.nom,
          email: dto.email,
          telephone: dto.telephone,
          adresse: dto.adresse,
        });
        await queryRunner.manager.save(Client, client);
      }

      // 🔹 Mettre à jour la réservation
      queryRunner.manager.merge(Reservation, reservation, {
        date: dto.date_reservation ? new Date(dto.date_reservation) : reservation.date,
        heure_debut: dto.heure_debut || reservation.heure_debut,
        heure_fin: dto.heure_fin || reservation.heure_fin,
        status: dto.status_reservation || reservation.status,
      });
      await queryRunner.manager.save(Reservation, reservation);

      // 🔹 Mettre à jour les tables liées à la réservation
      if (dto.tablesIds) {
        // Supprimer les anciennes liaisons
        await queryRunner.manager.delete(ReservationTable, { reservation: { id: reservation.id } });

        // Créer les nouvelles liaisons
        for (const tableId of dto.tablesIds) {
          const table = await queryRunner.manager.findOne(Table, { where: { id: tableId } });
          if (!table) throw new BadRequestException(`La table avec l'ID ${tableId} n'existe pas`);

          const reservationTable = queryRunner.manager.create(ReservationTable, {
            reservation,
            table,
          });
          await queryRunner.manager.save(ReservationTable, reservationTable);
        }
      }

      // 🔹 Mettre à jour la commande
      queryRunner.manager.merge(Commande, existingCommande, {
        date_commande: dto.date_commande || existingCommande.date_commande,
        status: dto.status || existingCommande.status,
      });
      await queryRunner.manager.save(Commande, existingCommande);

      // 🔹 Supprimer les anciens CommandeMenu
      await queryRunner.manager.delete(CommandeMenu, { commande_id: existingCommande.id });

      // 🔹 Créer les nouveaux CommandeMenu
      if (!dto.menuIds || !dto.quantities || dto.menuIds.length !== dto.quantities.length) {
        throw new BadRequestException('menuIds et quantities doivent avoir la même longueur');
      }

      for (let i = 0; i < dto.menuIds.length; i++) {
        const menu = await queryRunner.manager.findOne(Menu, { where: { id: dto.menuIds[i] } });
        if (!menu) {
          throw new BadRequestException(`Le menu avec l'ID ${dto.menuIds[i]} n'existe pas`);
        }

        const commandeMenu = queryRunner.manager.create(CommandeMenu, {
          commande_id: existingCommande.id,
          menu,
          quantity: dto.quantities[i],
        });
        await queryRunner.manager.save(CommandeMenu, commandeMenu);
      }

      await queryRunner.commitTransaction();

      return {
        message: 'Commande mise à jour avec succès',
        commande: existingCommande,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await queryRunner.release();
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

}
