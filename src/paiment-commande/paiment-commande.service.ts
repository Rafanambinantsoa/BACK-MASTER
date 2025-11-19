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
}
