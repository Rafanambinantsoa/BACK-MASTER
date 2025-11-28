import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePaiementPretDto } from './dto/create-paiement-pret.dto';
import { UpdatePaiementPretDto } from './dto/update-paiement-pret.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { PaiementPret } from './entities/paiement-pret.entity';
import { Repository } from 'typeorm';
import { Commande } from 'src/commande/entities/commande.entity';
import { CreatePaiementResteDto } from 'src/paiment-reste/dto/create-paiment-reste.dto';
import { PaiementReste } from 'src/paiment-reste/entities/paiment-reste.entity';

@Injectable()
export class PaiementPretService {

  constructor(
    @InjectRepository(PaiementPret)
    private paiementPretRepository: Repository<PaiementPret>,

    @InjectRepository(Commande)
    private commandeRepository: Repository<Commande>,

    @InjectRepository(PaiementReste)
    private paiementResteRepository: Repository<PaiementReste>,
  ) { }


  // Création du paiement initial
  // -----------------------
  async createPaiementPret(dto: CreatePaiementPretDto) {
    const existing = await this.paiementPretRepository.findOneBy({ commandeId: dto.commandeId });
    if (existing) throw new BadRequestException('Paiement initial déjà enregistré');
    // if modePaiment is mobile money reference must be provided
    if (dto.modePaiement === "mobile_money") {
      if (!dto.reference) {
        throw new BadRequestException('La référence est obligatoire pour le paiement mobile money');
      }
    }

    if (!dto.montantAvance) dto.montantAvance = 0;
    const reste = dto.montantTotal - dto.montantAvance;
    const estRegle = reste <= 0;

    const paiement = this.paiementPretRepository.create({
      commandeId: dto.commandeId,
      montantTotal: dto.montantTotal,
      montantAvance: dto.montantAvance,
      estRegle: estRegle,
      reste_a_regler: reste,
    });

    const data = await this.paiementPretRepository.save(paiement);

    // pret 
    if (dto.montantAvance > 0) {
      const paiementReste = this.paiementResteRepository.create({
        paiementPret: data,
        montant: dto.montantAvance,
        modePaiement: dto.modePaiement,
        reference: dto.reference ?? null,
      });
      await this.paiementResteRepository.save(paiementReste);
    }

    return data;
  }

  // -----------------------
  // Création d’un paiement du reste
  // -----------------------
  async createPaiementReste(dto: CreatePaiementResteDto, id: number) {
    const paiementPret = await this.paiementPretRepository.findOne({
      where: { id },
      relations: ['paiementsReste'], // tu peux garder
    });

    if (!paiementPret) throw new NotFoundException('Paiement initial non trouvé');

    if (paiementPret.estRegle) {
      throw new BadRequestException('Le paiement est déjà réglé');
    }

    if (dto.montantPaye > paiementPret.reste_a_regler) {
      throw new BadRequestException('Le montant payé dépasse le reste à régler');
    }

    if (dto.modePaiement === "mobile_money" && !dto.reference) {
      throw new BadRequestException('La référence est obligatoire pour le paiement mobile money');
    }

    // 1) Création du paiement enfant
    const paiementReste = this.paiementResteRepository.create({
      paiementPret: { id } as any,   // ✅ référence locale, pas l'objet mémoire
      montant: dto.montantPaye,
      modePaiement: dto.modePaiement,
      reference: dto.reference ?? null,
    });

    const check = await this.paiementResteRepository.save(paiementReste);

    // 2) Mise à jour SANS toucher aux relations
    const nouveauReste = paiementPret.reste_a_regler - dto.montantPaye;
    const estRegle = nouveauReste <= 0;

    await this.paiementPretRepository.update(id, {
      reste_a_regler: estRegle ? 0 : nouveauReste,
      estRegle,
    });

    return check;
  }


  // Obtenir la liste des prets 
  async findAll() {
    return this.paiementPretRepository.find({ relations: ['paiementsReste', 'commande'] });
  }

  // Obtenir un pret par son id
  async findOne(id: number) {
    const data = await this.paiementPretRepository.findOne({
      where: { id },
      relations: ['paiementsReste', 'commande'],
    });

    if (!data) throw new NotFoundException('Paiement initial non trouvé');
    return data;
  }

}
