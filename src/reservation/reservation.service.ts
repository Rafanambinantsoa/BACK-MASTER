import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource, Between } from 'typeorm';
import { Reservation } from './entities/reservation.entity';
import { Table } from 'src/table/entities/table.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ReservationTable } from 'src/reservation-table/entities/reservation-table.entity';
import { Client } from 'src/client/entities/client.entity';
import { DispoDto } from './dto/dispo.dto';
import { Menu } from 'src/menu/entities/menu.entity';
import { ReservationMenu } from 'src/reservation-menu/entities/reservation-menu.entity';
import { PaimentReservationTable } from 'src/paiment-reservation-table/entities/paiment-reservation-table.entity';

@Injectable()
export class ReservationService {
  constructor(
    private dataSource: DataSource,

    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
    @InjectRepository(ReservationTable)
    private reservationTableRepository: Repository<ReservationTable>,
    @InjectRepository(Table)
    private tableRepository: Repository<Table>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(Menu)
    private menuRepository: Repository<Menu>,
    @InjectRepository(ReservationMenu)
    private reservationMenuRepository: Repository<ReservationMenu>,
    @InjectRepository(PaimentReservationTable)
    private paimentReservationTableRepository: Repository<PaimentReservationTable>
  ) { }

  async create(dto: CreateReservationDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let code: string | undefined = undefined;
    try {
      const {
        tableIds,
        menuIds,
        menuQuantities,
        date,
        heure_debut,
        heure_fin,
        type_reservation,
        type_paiment,
        reference,
        montant,
        client_email,
        client_nom,
        client_telephone,
        client_adresse,
        ...data
      } = dto;

      if (!client_email) throw new BadRequestException('Email client requis');

      let client = await queryRunner.manager.findOne(Client, { where: { email: client_email } });
      if (client) {
        client.nom = client_nom || client.nom;
        client.telephone = client_telephone || client.telephone;
        client.adresse = client_adresse || client.adresse;
        await queryRunner.manager.save(Client, client);
      } else {
        client = queryRunner.manager.create(Client, {
          nom: client_nom,
          email: client_email,
          telephone: client_telephone,
          adresse: client_adresse,
        });
        await queryRunner.manager.save(Client, client);
      }

      if (!tableIds?.length)
        throw new BadRequestException('Au moins une table doit être spécifiée');

      for (const tableId of tableIds) {
        const tableExists = await queryRunner.manager.findOneBy(Table, { id: tableId });
        if (!tableExists) throw new NotFoundException(`Table ${tableId} introuvable`);

        const dispo = await this.verifierDisponibiliteTable(tableId, date, heure_debut, heure_fin);
        if (!dispo.disponible)
          throw new BadRequestException(`Table ${tableId} déjà réservée sur cette période`);
      }

      if (type_reservation && type_reservation !== 'standard') {
        if (!menuIds?.length)
          throw new BadRequestException('Menus requis pour ce type de réservation');
        if (!menuQuantities || menuQuantities.length !== menuIds.length)
          throw new BadRequestException('Les quantités doivent correspondre aux menus.');

        code = await this.generateUniqueReservationCode(queryRunner.manager);
      }

      const reservation = queryRunner.manager.create(Reservation, {
        ...data,
        client,
        date,
        heure_debut,
        heure_fin,
        type_reservation,
        code
      });
      const saved = await queryRunner.manager.save(Reservation, reservation);

      const tables = await queryRunner.manager.findBy(Table, { id: In(tableIds) });
      const reservationTables = tables.map((table) =>
        queryRunner.manager.create(ReservationTable, { table, reservation: saved }),
      );
      await queryRunner.manager.save(ReservationTable, reservationTables);

      if (type_reservation && type_reservation !== 'standard' && menuIds?.length) {
        const menus = await queryRunner.manager.findBy(Menu, { id: In(menuIds) });
        const reservationMenus = menus.map((menu, index) =>
          queryRunner.manager.create(ReservationMenu, {
            menu,
            reservation: saved,
            quantity: menuQuantities[index],
          }),
        );
        await queryRunner.manager.save(ReservationMenu, reservationMenus);
      }

      if (type_reservation !== 'standard' && type_paiment) {
        if (type_paiment === 'mobile_money' && !reference)
          throw new BadRequestException('Référence requise pour mobile money.');
        if (type_paiment !== 'stripe') {
          if (montant == null || isNaN(montant))
            throw new BadRequestException('Montant invalide ou manquant.');

          const paiement = queryRunner.manager.create(PaimentReservationTable, {
            reservation: saved,
            type_paiment,
            reference: type_paiment === 'mobile_money' ? reference : undefined,
            montant,
          });
          await queryRunner.manager.save(PaimentReservationTable, paiement);
        }


      }

      await queryRunner.commitTransaction();

      return this.reservationRepository.findOne({
        where: { id: saved.id },
        relations: [
          'client',
          'reservationTables.table',
          'reservationMenus.menu',
          'paimentReservationTable',
        ],
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  //Generer  code unique  de la reservation
  private async generateUniqueReservationCode(manager): Promise<string> {
    let code: string;
    let exists = true;

    do {
      const random = Math.floor(10000 + Math.random() * 90000); // 5 chiffres
      code = `RES${random}`;

      const found = await manager.findOne(Reservation, {
        where: { code },
        select: ['id'],
      });

      exists = !!found;
    } while (exists);

    return code;
  }


  async update(id: number, dto: UpdateReservationDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const {
        tableIds,
        menuIds,
        menuQuantities,
        date,
        heure_debut,
        heure_fin,
        type_reservation,
        type_paiment,
        reference,
        montant,
        client_email,
        client_nom,
        client_telephone,
        client_adresse,
        ...data
      } = dto;

      const existing = await queryRunner.manager.findOne(Reservation, {
        where: { id },
        relations: ['reservationTables', 'reservationMenus', 'paimentReservationTable'],
      });
      if (!existing) throw new NotFoundException(`Réservation ${id} introuvable`);

      if (!client_email) throw new BadRequestException('Email client requis');
      let client = await queryRunner.manager.findOne(Client, { where: { email: client_email } });
      if (client) {
        client.nom = client_nom || client.nom;
        client.telephone = client_telephone || client.telephone;
        client.adresse = client_adresse || client.adresse;
        await queryRunner.manager.save(Client, client);
      } else {
        client = queryRunner.manager.create(Client, {
          nom: client_nom,
          email: client_email,
          telephone: client_telephone,
          adresse: client_adresse,
        });
        await queryRunner.manager.save(Client, client);
      }

      if (!tableIds?.length)
        throw new BadRequestException('Au moins une table doit être spécifiée');

      for (const tableId of tableIds) {
        const tableExists = await queryRunner.manager.findOneBy(Table, { id: tableId });
        if (!tableExists) throw new NotFoundException(`Table ${tableId} introuvable`);
      }

      if (type_reservation && type_reservation !== 'standard') {
        if (!menuIds?.length)
          throw new BadRequestException('Menus requis pour ce type de réservation');
        if (!menuQuantities || menuQuantities.length !== menuIds.length)
          throw new BadRequestException('Les quantités doivent correspondre aux menus.');
      }

      await queryRunner.manager.update(Reservation, id, {
        ...data,
        date,
        heure_debut,
        heure_fin,
        client,
        type_reservation,
      });

      await queryRunner.manager.delete(ReservationTable, { reservation: { id } });
      const tables = await queryRunner.manager.findBy(Table, { id: In(tableIds) });
      const reservationTables = tables.map((table) =>
        queryRunner.manager.create(ReservationTable, { table, reservation: existing }),
      );
      await queryRunner.manager.save(ReservationTable, reservationTables);

      await queryRunner.manager.delete(ReservationMenu, { reservation: { id } });
      if (type_reservation && type_reservation !== 'standard' && menuIds?.length) {
        const menus = await queryRunner.manager.findBy(Menu, { id: In(menuIds) });
        const reservationMenus = menus.map((menu, index) =>
          queryRunner.manager.create(ReservationMenu, {
            menu,
            reservation: existing,
            quantity: menuQuantities[index],
          }),
        );
        await queryRunner.manager.save(ReservationMenu, reservationMenus);
      }

      if (type_reservation !== 'standard' && type_paiment) {
        if (type_paiment === 'mobile_money' && !reference)
          throw new BadRequestException('Référence requise pour mobile money.');
        if (type_paiment !== 'stripe') {
          if (montant == null || isNaN(montant))
            throw new BadRequestException('Montant invalide ou manquant.');

          const existingPayment = await queryRunner.manager.findOne(PaimentReservationTable, {
            where: { reservation: { id } },
          });

          if (existingPayment) {
            await queryRunner.manager.update(PaimentReservationTable, existingPayment.id, {
              type_paiment,
              reference: type_paiment === 'mobile_money' ? reference : undefined,
              montant,
            });
          } else {
            const newPayment = queryRunner.manager.create(PaimentReservationTable, {
              reservation: existing,
              type_paiment,
              reference: type_paiment === 'mobile_money' ? reference : undefined,
              montant,
            });
            await queryRunner.manager.save(PaimentReservationTable, newPayment);
          }
        }
      } else {
        await queryRunner.manager.delete(PaimentReservationTable, { reservation: { id } });
      }

      await queryRunner.commitTransaction();

      return this.reservationRepository.findOne({
        where: { id },
        relations: [
          'client',
          'reservationTables.table',
          'reservationMenus.menu',
          'paimentReservationTable',
        ],
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }


  async findAll() {
    return await this.reservationRepository.find({
      relations: [
        'client',
        'reservationTables',
        'reservationTables.table',
        'reservationMenus',
        'reservationMenus.menu',
        'paimentReservationTable',
      ],
    });
  }

  async findOne(id: number) {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
      relations: [
        'client',
        'reservationTables',
        'reservationTables.table',
        'reservationMenus',
        'reservationMenus.menu',
        'paimentReservationTable',
      ],
    });
    if (!reservation) throw new NotFoundException('Réservation introuvable');
    return reservation;
  }




  async remove(id: number) {
    const reservation = await this.reservationRepository.findOneBy({ id });
    if (!reservation) throw new NotFoundException('Réservation introuvable');
    await this.reservationRepository.remove(reservation);
    return { message: 'Réservation supprimée avec succès' };
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


  async findTablesDisponibles(dispoDto: DispoDto) {
    const { date, heureDebut, heureFin } = dispoDto;
    const formatHeure = /^([01]\d|2[0-3]):(00|30)$/;

    const aujourdHui = new Date();
    const dateSansHeure = new Date(date);
    aujourdHui.setHours(0, 0, 0, 0);
    dateSansHeure.setHours(0, 0, 0, 0);

    if (dateSansHeure < aujourdHui)
      throw new BadRequestException('La date ne peut pas être dans le passé');

    if (!formatHeure.test(heureDebut) || !formatHeure.test(heureFin))
      throw new BadRequestException('Format d’heure invalide (HH:MM, intervalle de 30 min)');

    // Convertir heureDebut et heureFin en minutes depuis minuit
    const [hdH, hdM] = heureDebut.split(':').map(Number);
    const [hfH, hfM] = heureFin.split(':').map(Number);
    const debutMinutes = hdH * 60 + hdM;
    let finMinutes = hfH * 60 + hfM;

    // Passage à minuit
    if (finMinutes <= debutMinutes) {
      finMinutes += 24 * 60;
    }

    const toutesTables = await this.tableRepository.find();

    // Récupérer toutes les réservations pour cette date
    const reservations = await this.reservationTableRepository.find({
      where: { reservation: { date } },
      relations: ['reservation', 'table']
    });

    // Identifier les tables réservées qui chevauchent l'intervalle
    const idsReservees = reservations
      .filter(r => {
        let rDebut = r.reservation.heure_debut.split(':').map(Number);
        let rFin = r.reservation.heure_fin.split(':').map(Number);

        let rDebutMinutes = rDebut[0] * 60 + rDebut[1];
        let rFinMinutes = rFin[0] * 60 + rFin[1];

        // Passage à minuit pour la réservation
        if (rFinMinutes <= rDebutMinutes) rFinMinutes += 24 * 60;

        // Chevauchement ?
        return rDebutMinutes < finMinutes && rFinMinutes > debutMinutes;
      })
      .map(r => r.table.id);

    const disponibles = toutesTables.filter(t => !idsReservees.includes(t.id));

    return { date, heureDebut, heureFin, disponibles, total: disponibles.length };
  }

  // nombre de reservations cree ajourd'hui
  async countTodayReservations() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const count = await this.reservationRepository.count({
      where: {
        createdAt: Between(today, tomorrow),
      },
    });

    return { count };
  }

  async findByCode(id: string) {
    const data = await this.reservationRepository.findOne({
      where: { code: id },
      relations: [
        'client',
        'reservationTables',
        'reservationTables.table',
        'reservationMenus',
        'reservationMenus.menu',
        'paimentReservationTable',
      ],
    });
    if (!data) throw new NotFoundException('Réservation introuvable');
    return data;
  }
}
