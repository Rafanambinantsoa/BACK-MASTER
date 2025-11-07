import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
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

    // Vérification client
    if (!client_email) throw new BadRequestException('Email client requis');

    let client = await this.clientRepository.findOne({ where: { email: client_email } });
    if (client) {
      client.nom = client_nom || client.nom;
      client.telephone = client_telephone || client.telephone;
      client.adresse = client_adresse || client.adresse;
      await this.clientRepository.save(client);
    } else {
      client = this.clientRepository.create({
        nom: client_nom,
        email: client_email,
        telephone: client_telephone,
        adresse: client_adresse,
      });
      await this.clientRepository.save(client);
    }

    // Vérification tables
    if (!tableIds || tableIds.length === 0)
      throw new BadRequestException('Au moins une table doit être spécifiée');

    for (const tableId of tableIds) {
      const tableExists = await this.tableRepository.findOneBy({ id: tableId });
      if (!tableExists) throw new NotFoundException(`Table ${tableId} introuvable`);

      const dispo = await this.verifierDisponibiliteTable(tableId, date, heure_debut, heure_fin);
      if (!dispo.disponible)
        throw new BadRequestException(`Table ${tableId} déjà réservée sur cette période`);
    }

    // Vérification menus + quantités
    if (type_reservation && type_reservation !== 'standard') {
      if (!menuIds?.length)
        throw new BadRequestException('Menus requis pour ce type de réservation');

      if (!menuQuantities || menuQuantities.length !== menuIds.length)
        throw new BadRequestException('Les quantités doivent correspondre aux menus.');

      for (const menuId of menuIds) {
        const menuExists = await this.menuRepository.findOneBy({ id: menuId });
        if (!menuExists) throw new NotFoundException(`Menu ${menuId} introuvable`);
      }
    }

    // Création réservation
    const reservation = this.reservationRepository.create({
      ...data,
      client,
      date,
      heure_debut,
      heure_fin,
      type_reservation,
    });
    const saved = await this.reservationRepository.save(reservation);

    // Association tables
    const tables = await this.tableRepository.findBy({ id: In(tableIds) });
    const reservationTables = tables.map((table) =>
      this.reservationTableRepository.create({ table, reservation: saved }),
    );
    await this.reservationTableRepository.save(reservationTables);

    // Association menus avec quantités
    if (type_reservation && type_reservation !== 'standard' && menuIds?.length) {
      const menus = await this.menuRepository.findBy({ id: In(menuIds) });
      const reservationMenus = menus.map((menu, index) =>
        this.reservationMenuRepository.create({
          menu,
          reservation: saved,
          quantity: menuQuantities[index],
        }),
      );
      await this.reservationMenuRepository.save(reservationMenus);
    }

    // Paiement
    if (type_reservation !== 'standard' && type_paiment) {
      if (type_paiment === 'mobile_money' && !reference)
        throw new BadRequestException('Référence requise pour mobile money.');
      if (type_paiment !== 'stripe') {
        if (montant == null || isNaN(montant))
          throw new BadRequestException('Montant invalide ou manquant.');

        const paiement = this.paimentReservationTableRepository.create({
          reservation: saved,
          type_paiment,
          reference: type_paiment === 'mobile_money' ? reference : undefined,
          montant,
        });
        await this.paimentReservationTableRepository.save(paiement);
      }
    }

    return this.reservationRepository.findOne({
      where: { id: saved.id },
      relations: [
        'client',
        'reservationTables.table',
        'reservationMenus.menu',
        'paimentReservationTable',
      ],
    });
  }

  async update(id: number, dto: UpdateReservationDto) {
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

    const existing = await this.reservationRepository.findOne({
      where: { id },
      relations: ['reservationTables', 'reservationMenus', 'paimentReservationTable'],
    });
    if (!existing) throw new NotFoundException(`Réservation ${id} introuvable`);

    // Client
    if (!client_email) throw new BadRequestException('Email client requis');
    let client = await this.clientRepository.findOne({ where: { email: client_email } });
    if (client) {
      client.nom = client_nom || client.nom;
      client.telephone = client_telephone || client.telephone;
      client.adresse = client_adresse || client.adresse;
      await this.clientRepository.save(client);
    } else {
      client = this.clientRepository.create({
        nom: client_nom,
        email: client_email,
        telephone: client_telephone,
        adresse: client_adresse,
      });
      await this.clientRepository.save(client);
    }

    // Vérif tables
    if (!tableIds || tableIds.length === 0)
      throw new BadRequestException('Au moins une table doit être spécifiée');

    for (const tableId of tableIds) {
      const tableExists = await this.tableRepository.findOneBy({ id: tableId });
      if (!tableExists) throw new NotFoundException(`Table ${tableId} introuvable`);
    }

    // Vérif menus
    if (type_reservation && type_reservation !== 'standard') {
      if (!menuIds?.length)
        throw new BadRequestException('Menus requis pour ce type de réservation');
      if (!menuQuantities || menuQuantities.length !== menuIds.length)
        throw new BadRequestException('Les quantités doivent correspondre aux menus.');
    }

    // Update réservation
    await this.reservationRepository.update(id, {
      ...data,
      date,
      heure_debut,
      heure_fin,
      client,
      type_reservation,
    });

    // Update tables
    await this.reservationTableRepository.delete({ reservation: { id } });
    const tables = await this.tableRepository.findBy({ id: In(tableIds) });
    const reservation = existing;
    const reservationTables = tables.map((table) =>
      this.reservationTableRepository.create({ table, reservation }),
    );
    await this.reservationTableRepository.save(reservationTables);

    // Update menus + quantités
    await this.reservationMenuRepository.delete({ reservation: { id } });
    if (type_reservation && type_reservation !== 'standard' && menuIds?.length) {
      const menus = await this.menuRepository.findBy({ id: In(menuIds) });
      const reservationMenus = menus.map((menu, index) =>
        this.reservationMenuRepository.create({
          menu,
          reservation,
          quantity: menuQuantities[index],
        }),
      );
      await this.reservationMenuRepository.save(reservationMenus);
    }

    // Update paiement
    if (type_reservation !== 'standard' && type_paiment) {
      if (type_paiment === 'mobile_money' && !reference)
        throw new BadRequestException('Référence requise pour mobile money.');
      if (type_paiment !== 'stripe') {
        if (montant == null || isNaN(montant))
          throw new BadRequestException('Montant invalide ou manquant.');

        const existingPayment = await this.paimentReservationTableRepository.findOne({
          where: { reservation: { id } },
        });

        if (existingPayment) {
          await this.paimentReservationTableRepository.update(existingPayment.id, {
            type_paiment,
            reference: type_paiment === 'mobile_money' ? reference : undefined,
            montant,
          });
        } else {
          const newPayment = this.paimentReservationTableRepository.create({
            reservation,
            type_paiment,
            reference: type_paiment === 'mobile_money' ? reference : undefined,
            montant,
          });
          await this.paimentReservationTableRepository.save(newPayment);
        }
      }
    } else {
      await this.paimentReservationTableRepository.delete({ reservation: { id } });
    }

    return this.reservationRepository.findOne({
      where: { id },
      relations: [
        'client',
        'reservationTables.table',
        'reservationMenus.menu',
        'paimentReservationTable',
      ],
    });
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

    if (!formatHeure.test(heureDebut) || !formatHeure.test(heureFin))
      throw new BadRequestException('Format d’heure invalide');

    const [hdH, hdM] = heureDebut.split(':').map(Number);
    const [hfH, hfM] = heureFin.split(':').map(Number);
    if (hfH * 60 + hfM <= hdH * 60 + hdM)
      throw new BadRequestException('Heure de fin avant heure de début');

    const toutesTables = await this.tableRepository.find();

    const tablesReservees = await this.reservationTableRepository
      .createQueryBuilder('reservationTable')
      .leftJoin('reservationTable.reservation', 'reservation')
      .where('reservation.date = :date', { date })
      .andWhere('(reservation.heure_debut < :heureFin AND reservation.heure_fin > :heureDebut)', {
        heureDebut,
        heureFin,
      })
      .select('reservationTable.tableId')
      .getRawMany();

    const idsReservees = tablesReservees.map((r) => r.reservationTable_tableId);
    const disponibles = toutesTables.filter((t) => !idsReservees.includes(t.id));

    return { date, heureDebut, heureFin, disponibles, total: disponibles.length };
  }
}
