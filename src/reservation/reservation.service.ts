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
  ) { }

  async create(dto: CreateReservationDto) {
    const { tableIds, date, heure_debut, heure_fin, ...data } = dto;

    // Vérification une par une des tables transmises
    for (const tableId of tableIds) {
      const tableExists = await this.tableRepository.findOneBy({ id: tableId });
      if (!tableExists) {
        throw new NotFoundException(
          `La table avec l'id ${tableId} n'existe pas dans la base de données`,
        );
      }

      // Vérification disponibilité
      const dispo = await this.verifierDisponibiliteTable(
        tableId,
        date,
        heure_debut,
        heure_fin,
      );

      if (!dispo.disponible) {
        throw new BadRequestException(
          `La table ${tableId} est déjà réservée pour la période ${heure_debut} - ${heure_fin}`,
        );
      }
    }

    // Charger toutes les tables valides
    const tables = await this.tableRepository.findBy({ id: In(tableIds) });

    // Vérification du client
    const client = await this.clientRepository.findOneBy({ id: dto.client_id });
    if (!client) {
      throw new NotFoundException('Client introuvable');
    }

    // Création de la réservation
    const reservation = this.reservationRepository.create({
      ...data,
      date,
      heure_debut,
      heure_fin,
      client_id: dto.client_id,
    });

    const saved = await this.reservationRepository.save(reservation);

    // Lier les tables à la réservation
    const reservationTables = tables.map((table) =>
      this.reservationTableRepository.create({
        table,
        reservation: saved,
      }),
    );

    await this.reservationTableRepository.save(reservationTables);

    return await this.reservationRepository.findOne({
      where: { id: saved.id },
      relations: ['client', 'reservationTables', 'reservationTables.table'],
    });
  }


  async findAll() {
    return await this.reservationRepository.find({
      relations: ['client', 'reservationTables', 'reservationTables.table'],
    });
  }

  async findOne(id: number) {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
      relations: ['client', 'reservationTables', 'reservationTables.table'],
    });

    if (!reservation) throw new NotFoundException('Réservation introuvable');
    return reservation;
  }

  async update(id: number, dto: UpdateReservationDto) {
    const { tableIds, date, heure_debut, heure_fin, ...data } = dto;
    //verificataion que il y a des tableIds
    if (!tableIds || tableIds.length === 0) {
      throw new BadRequestException('Au moins une table doit être spécifiée');
    }

    // Vérifier si la réservation existe
    const existing = await this.reservationRepository.findOne({
      where: { id },
      relations: ['reservationTables', 'reservationTables.table'],
    });
    if (!existing) {
      throw new NotFoundException(`La réservation avec l'id ${id} est introuvable`);
    }

    // Vérifier une par une les tables
    for (const tableId of tableIds) {
      const tableExists = await this.tableRepository.findOneBy({ id: tableId });
      if (!tableExists) {
        throw new NotFoundException(
          `La table avec l'id ${tableId} n'existe pas dans la base de données`,
        );
      }

      const dispo = await this.verifierDisponibiliteTable(
        tableId,
        date,
        heure_debut,
        heure_fin,
        id, // exclure cette réservation de la vérif
      );

      if (!dispo.disponible) {
        throw new BadRequestException(
          `La table ${tableId} est déjà réservée pour la période ${heure_debut} - ${heure_fin}`,
        );
      }
    }

    // Charger toutes les tables valides
    const tables = await this.tableRepository.findBy({ id: In(tableIds) });

    // Vérifier le client
    const client = await this.clientRepository.findOneBy({ id: dto.client_id });
    if (!client) {
      throw new NotFoundException('Client introuvable');
    }

    // Mettre à jour la réservation
    await this.reservationRepository.update(id, {
      ...data,
      date,
      heure_debut,
      heure_fin,
      client_id: dto.client_id,
    });

    // Supprimer les anciennes associations table/réservation
    await this.reservationTableRepository.delete({
      reservation: { id },
    });

    // Lier les nouvelles tables
    const reservation = await this.reservationRepository.findOneBy({ id });

    if (!reservation) {
      throw new NotFoundException(`La réservation avec l'id ${id} est introuvable`);
    }

    const reservationTables = tables.map((table) =>
      this.reservationTableRepository.create({
        table,
        reservation,
      }),
    );
    await this.reservationTableRepository.save(reservationTables);

    return await this.reservationRepository.findOne({
      where: { id },
      relations: ['client', 'reservationTables', 'reservationTables.table'],
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
    reservationIdToExclude?: number, // <== paramètre optionnel
  ) {
    const table = await this.tableRepository.findOneBy({ id: tableId });
    if (!table) {
      throw new NotFoundException(`La table avec l'id ${tableId} n'existe pas`);
    }

    // Vérification du format et de l'alignement sur 30 minutes
    const formatHeure = /^([01]\d|2[0-3]):(00|30)$/;
    if (!formatHeure.test(heureDebut) || !formatHeure.test(heureFin)) {
      throw new BadRequestException(
        'Les heures doivent être au format HH:MM et alignées sur des intervalles de 30 minutes (ex. 19:00, 19:30, 20:00).',
      );
    }

    // Vérifier que l'heure de fin est après celle de début
    const [hdH, hdM] = heureDebut.split(':').map(Number);
    const [hfH, hfM] = heureFin.split(':').map(Number);
    const debutMinutes = hdH * 60 + hdM;
    const finMinutes = hfH * 60 + hfM;
    if (finMinutes <= debutMinutes) {
      throw new BadRequestException(
        "L'heure de fin doit être postérieure à l'heure de début.",
      );
    }

    // Vérifier les conflits
    const query = this.reservationTableRepository
      .createQueryBuilder('reservationTable')
      .leftJoinAndSelect('reservationTable.reservation', 'reservation')
      .where('reservationTable.table = :tableId', { tableId })
      .andWhere('reservation.date = :date', { date })
      .andWhere(
        '(reservation.heure_debut < :heureFin AND reservation.heure_fin > :heureDebut)',
        { heureDebut, heureFin },
      );

    // Exclure la réservation en cours si nécessaire
    if (reservationIdToExclude) {
      query.andWhere('reservation.id != :reservationIdToExclude', {
        reservationIdToExclude,
      });
    }

    const conflits = await query.getMany();

    if (conflits.length > 0) {
      return {
        disponible: false,
        message: `La table ${tableId} est déjà réservée pour cette période`,
        conflits,
      };
    }

    return {
      disponible: true,
      message: `La table ${tableId} est disponible pour cette période`,
    };
  }

  async findTablesDisponibles(dispoDto: DispoDto) {
    const { date, heureDebut, heureFin } = dispoDto;

    // Vérification du format d'heure
    const formatHeure = /^([01]\d|2[0-3]):(00|30)$/;
    if (!formatHeure.test(heureDebut) || !formatHeure.test(heureFin)) {
      throw new BadRequestException(
        'Les heures doivent être au format HH:MM et alignées sur 30 min (ex. 19:00, 19:30).',
      );
    }

    // Vérifier que l'heure de fin est après celle de début
    const [hdH, hdM] = heureDebut.split(':').map(Number);
    const [hfH, hfM] = heureFin.split(':').map(Number);
    const debutMinutes = hdH * 60 + hdM;
    const finMinutes = hfH * 60 + hfM;
    if (finMinutes <= debutMinutes) {
      throw new BadRequestException("L'heure de fin doit être postérieure à l'heure de début.");
    }

    // Récupérer toutes les tables
    const toutesTables = await this.tableRepository.find();

    // Chercher les tables déjà réservées à ce moment-là
    const tablesReservees = await this.reservationTableRepository
      .createQueryBuilder('reservationTable')
      .leftJoin('reservationTable.reservation', 'reservation')
      .where('reservation.date = :date', { date })
      .andWhere(
        '(reservation.heure_debut < :heureFin AND reservation.heure_fin > :heureDebut)',
        { heureDebut, heureFin },
      )
      .select('reservationTable.tableId')
      .getRawMany();

    const idsReservees = tablesReservees.map((r) => r.reservationTable_tableId);

    // Retourner les tables disponibles
    const tablesDisponibles = toutesTables.filter((table) => !idsReservees.includes(table.id));

    return {
      date,
      heureDebut,
      heureFin,
      disponibles: tablesDisponibles,
      total: tablesDisponibles.length,
    };
  }

}
