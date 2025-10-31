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
  ) { }

  async create(dto: CreateReservationDto) {
    const { tableIds, menuIds, date, heure_debut, heure_fin, type_reservation, ...data } = dto;

    // Vérification client
    const client = await this.clientRepository.findOneBy({ id: dto.client_id });
    if (!client) throw new NotFoundException('Client introuvable');

    // Vérification des tables
    if (!tableIds || tableIds.length === 0)
      throw new BadRequestException('Au moins une table doit être spécifiée');

    for (const tableId of tableIds) {
      const tableExists = await this.tableRepository.findOneBy({ id: tableId });
      if (!tableExists)
        throw new NotFoundException(`Table ${tableId} introuvable`);

      const dispo = await this.verifierDisponibiliteTable(tableId, date, heure_debut, heure_fin);
      if (!dispo.disponible)
        throw new BadRequestException(`Table ${tableId} déjà réservée sur cette période`);
    }

    // Vérification des menus si type_reservation != standard
    if (type_reservation && type_reservation !== 'standard') {
      if (!menuIds || menuIds.length === 0)
        throw new BadRequestException('Menus requis pour ce type de réservation');

      for (const menuId of menuIds) {
        const menuExists = await this.menuRepository.findOneBy({ id: menuId });
        if (!menuExists)
          throw new NotFoundException(`Menu ${menuId} introuvable`);
      }
    }

    // Création de la réservation
    const reservation = this.reservationRepository.create({
      ...data,
      client_id: dto.client_id,
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

    // Association menus (si applicable)
    if (type_reservation && type_reservation !== 'standard' && menuIds?.length) {
      const menus = await this.menuRepository.findBy({ id: In(menuIds) });
      const reservationMenus = menus.map((menu) =>
        this.reservationMenuRepository.create({ menu, reservation: saved }),
      );
      await this.reservationMenuRepository.save(reservationMenus);
    }

    return await this.reservationRepository.findOne({
      where: { id: saved.id },
      relations: [
        'client',
        'reservationTables',
        'reservationTables.table',
        'reservationMenus',
        'reservationMenus.menu',
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
      ],
    });
    if (!reservation) throw new NotFoundException('Réservation introuvable');
    return reservation;
  }

  async update(id: number, dto: UpdateReservationDto) {
    const { tableIds, menuIds, date, heure_debut, heure_fin, type_reservation, ...data } = dto;

    const existing = await this.reservationRepository.findOne({
      where: { id },
      relations: ['reservationTables', 'reservationMenus'],
    });
    if (!existing)
      throw new NotFoundException(`Réservation ${id} introuvable`);

    // Vérifier client
    const client = await this.clientRepository.findOneBy({ id: dto.client_id });
    if (!client) throw new NotFoundException('Client introuvable');

    // Vérifier les tables
    if (!tableIds || tableIds.length === 0)
      throw new BadRequestException('Au moins une table doit être spécifiée');

    for (const tableId of tableIds) {
      const tableExists = await this.tableRepository.findOneBy({ id: tableId });
      if (!tableExists)
        throw new NotFoundException(`Table ${tableId} introuvable`);

      const dispo = await this.verifierDisponibiliteTable(tableId, date, heure_debut, heure_fin, id);
      if (!dispo.disponible)
        throw new BadRequestException(`Table ${tableId} déjà réservée sur cette période`);
    }

    // Vérifier les menus si non standard
    if (type_reservation && type_reservation !== 'standard') {
      if (!menuIds || menuIds.length === 0)
        throw new BadRequestException('Menus requis pour ce type de réservation');

      for (const menuId of menuIds) {
        const menuExists = await this.menuRepository.findOneBy({ id: menuId });
        if (!menuExists)
          throw new NotFoundException(`Menu ${menuId} introuvable`);
      }
    }

    // Mise à jour de la réservation
    await this.reservationRepository.update(id, {
      ...data,
      date,
      heure_debut,
      heure_fin,
      client_id: dto.client_id,
      type_reservation,
    });

    // Mise à jour des tables
    await this.reservationTableRepository.delete({ reservation: { id } });
    const tables = await this.tableRepository.findBy({ id: In(tableIds) });
    // reuse the already-validated 'existing' reservation to avoid a nullable result
    const reservation = existing;
    const reservationTables = tables.map((table) =>
      this.reservationTableRepository.create({ table, reservation }),
    );
    await this.reservationTableRepository.save(reservationTables);

    // Mise à jour des menus
    await this.reservationMenuRepository.delete({ reservation: { id } });
    if (type_reservation && type_reservation !== 'standard' && menuIds?.length) {
      const menus = await this.menuRepository.findBy({ id: In(menuIds) });
      const reservationMenus = menus.map((menu) =>
        this.reservationMenuRepository.create({ menu, reservation }),
      );
      await this.reservationMenuRepository.save(reservationMenus);
    }

    return await this.reservationRepository.findOne({
      where: { id },
      relations: [
        'client',
        'reservationTables',
        'reservationTables.table',
        'reservationMenus',
        'reservationMenus.menu',
      ],
    });
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
