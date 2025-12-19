import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePaimentCommandeDto } from './dto/create-paiment-commande.dto';
import { UpdatePaimentCommandeDto } from './dto/update-paiment-commande.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { PaimentCommande } from './entities/paiment-commande.entity';
import { Repository } from 'typeorm';
import { Commande } from 'src/commande/entities/commande.entity';

@Injectable()
export class PaimentCommandeService {

  constructor(
    @InjectRepository(PaimentCommande)
    private paiementCommandeRepository: Repository<PaimentCommande>,

    @InjectRepository(Commande)
    private commandRep: Repository<Commande>
  ) { }

  async create(createPaimentCommandeDto: CreatePaimentCommandeDto) {
    const { commande_id, type_paiment, reference } = createPaimentCommandeDto;

    //Verfier si la commande existe
    const commande = await this.commandRep.findOneBy({ id: commande_id });
    if (!commande) {
      return { message: "La commande associée au paiement n'existe pas" };
    }

    // Vérifier si la commande a déjà un paiement
    const match = await this.paiementCommandeRepository.findOneBy({ commande_id });
    if (match) {
      return { message: "La commande en question est déjà traitée" };
    }

    // Règle : référence obligatoire pour mobile_money
    if (type_paiment === "mobile_money" && (!reference || reference.trim() === "")) {
      throw new BadRequestException("La référence est obligatoire pour un paiement mobile money");
    }

    // Génération du slugcommandId
    const slugcommandId = `P-COM-${commande_id}`;

    const data = await this.paiementCommandeRepository.save({
      ...createPaimentCommandeDto,
      slugcommandId,
    });

    //Mise a  jour du status de la commande
    commande.status = "payer";
    await this.commandRep.save(commande);

    return { message: "Commande encaissée avec succès", data };
  }



  async findAll() {
    return await this.paiementCommandeRepository.find({ relations: ['commande'] });
  }

  async findOne(id: number) {
    const data = await this.paiementCommandeRepository.find({ where: { id }, relations: ['commande'] });
    if (data === null) {
      return new NotFoundException("Paiment  introuvable")
    }

    return data;
  }

  async update(id: number, updateDto: Partial<CreatePaimentCommandeDto>) {
    const paiement = await this.paiementCommandeRepository.findOne({ where: { id } });

    if (!paiement) {
      throw new NotFoundException("Paiement introuvable");
    }

    // Déterminer le type final après update
    const finalType = updateDto.type_paiment || paiement.type_paiment;

    // Règle : mobile_money → référence obligatoire
    if (finalType === "mobile_money") {
      const ref = updateDto.reference ?? paiement.reference;
      if (!ref || ref.trim() === "") {
        throw new BadRequestException("La référence est obligatoire pour un paiement mobile money");
      }
    }

    // Mise à jour des champs sauf ceux à nettoyer
    const { type_paiment, reference, stripe_payment_intent_id, ...rest } = updateDto;
    Object.assign(paiement, rest);

    // Mettre à jour le type
    if (type_paiment) {
      paiement.type_paiment = type_paiment;
    }

    // Nettoyage des champs selon le type final
    switch (finalType) {
      case "espece":
        paiement.reference = "";
        paiement.stripe_payment_intent_id = "";
        break;
      case "mobile_money":
        paiement.reference = updateDto.reference ?? paiement.reference;
        paiement.stripe_payment_intent_id = "";
        break;
      case "stripe":
        paiement.reference = "";
        paiement.stripe_payment_intent_id = updateDto.stripe_payment_intent_id ?? paiement.stripe_payment_intent_id;
        break;
    }

    const data = await this.paiementCommandeRepository.save(paiement);
    return { message: "Paiement mis à jour avec succès", data };
  }







  async remove(id: number) {
    const data = await this.paiementCommandeRepository.findOneBy({ id });
    if (data === null) {
      return new NotFoundException("Paiment  introuvable")
    }

    await this.paiementCommandeRepository.delete(id);

    return { message: "Paiment Supprimer" }
  }

  /**
   * Retourne les ventes journalières groupées par heure pour la journée actuelle
   * @returns {Promise<{ventesParHeure: Array<{hour: string, ventes: number}>}>}
   */
  async getVentesJournalieresParHeure() {
    try {
      // Début et fin de la journée actuelle
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

      // Récupérer tous les paiements de la journée
      const paiements = await this.paiementCommandeRepository
        .createQueryBuilder('paiement')
        .where('paiement.createdAt BETWEEN :startOfDay AND :endOfDay', { startOfDay, endOfDay })
        .getMany();

      // Grouper les ventes par heure
      const ventesMap: Map<number, number> = new Map();

      for (const paiement of paiements) {
        if (paiement.createdAt) {
          const date = new Date(paiement.createdAt);
          const hour = date.getHours();
          const montant = Number(paiement.montant) || 0;
          ventesMap.set(hour, (ventesMap.get(hour) || 0) + montant);
        }
      }

      // Générer le résultat pour toutes les heures
      const ventesParHeure: { hour: string; ventes: number }[] = Array.from({ length: 24 }, (_, hour) => ({
        hour: `${hour.toString().padStart(2, '0')}h`,
        ventes: Math.round(ventesMap.get(hour) || 0),
      }));

      return { ventesParHeure };
    } catch (error: any) {
      console.error('Erreur dans getVentesJournalieresParHeure:', error);
      throw new BadRequestException(
        `Erreur lors de la récupération des ventes journalières: ${error.message || error}`
      );
    }
  }

  async getVentesSemaine() {
    try {
      // Calculer le début et la fin de la semaine (lundi → dimanche)
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = dimanche, 1 = lundi ...
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

      const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() + diffToMonday, 0, 0, 0, 0);
      const endOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() + diffToMonday + 6, 23, 59, 59, 999);

      // Récupérer tous les paiements de la semaine
      const paiements = await this.paiementCommandeRepository
        .createQueryBuilder('paiement')
        .where('paiement.createdAt >= :startOfWeek AND paiement.createdAt <= :endOfWeek', {
          startOfWeek,
          endOfWeek,
        })
        .getMany();

      // Grouper les ventes par jour
      const ventesMap = new Map<string, number>();
      for (const paiement of paiements) {
        if (paiement.createdAt) {
          const date = new Date(paiement.createdAt);
          const dayKey = date.toISOString().slice(0, 10); // YYYY-MM-DD
          const montant = Number(paiement.montant) || 0;
          ventesMap.set(dayKey, (ventesMap.get(dayKey) || 0) + montant);
        }
      }

      // Générer toutes les dates de la semaine avec format "YYYY-MM-DD"
      const result: Array<{ date: string; ventes: number }> = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        const dayKey = date.toISOString().slice(0, 10);
        result.push({
          date: dayKey,
          ventes: Math.round(ventesMap.get(dayKey) || 0),
        });
      }

      return { ventesParJour: result };
    } catch (error: any) {
      console.error('Erreur dans getVentesSemaine:', error);
      throw new BadRequestException(
        `Erreur lors de la récupération des ventes de la semaine: ${error.message || error}`,
      );
    }
  }



}
