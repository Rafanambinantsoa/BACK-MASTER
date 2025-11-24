import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePaiementPretDto } from './dto/create-paiement-pret.dto';
import { UpdatePaiementPretDto } from './dto/update-paiement-pret.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { PaiementPret } from './entities/paiement-pret.entity';
import { Repository } from 'typeorm';
import { Commande } from 'src/commande/entities/commande.entity';

@Injectable()
export class PaiementPretService {

  constructor(
    @InjectRepository(PaiementPret)
    private paiementPretRepository: Repository<PaiementPret>,

    @InjectRepository(Commande)
    private commandeRepository: Repository<Commande>,
  ) { }

  async create(createPaiementPretDto: CreatePaiementPretDto) {
    //verification  de  l'existence de la commande associée peut être ajoutée ici
    const test = await this.commandeRepository.findOneBy({ id: createPaiementPretDto.commandeId });
    if (!test) {
      throw new NotFoundException('Commande associée non trouvée');
    }

    //verification si la commande est deja  present dans paiementPret
    const existingPaiement = await this.paiementPretRepository.findOneBy({ commandeId: createPaiementPretDto.commandeId });
    if (existingPaiement) {
      throw new Error('Un paiement pour cette commande existe déjà');
    }

    //On change  le statut du commande en pret
    test.status = 'pret';
    await this.commandeRepository.save(test);

    //if montantAvance est null ou undefined, on le considère comme 0
    if (!createPaiementPretDto.montantAvance) {
      createPaiementPretDto.montantAvance = 0;
    }
    const resteARegler = createPaiementPretDto.montantTotal - (createPaiementPretDto.montantAvance || 0); createPaiementPretDto['resteARegler'] = resteARegler;

    const data = this.paiementPretRepository.create(createPaiementPretDto);
    return this.paiementPretRepository.save(data);
  }

  async findAll() {
    return await this.paiementPretRepository.find({ relations: ['commande.reservation.client'] });
  }


  async findOne(id: number) {
    const data = await this.paiementPretRepository.findOne({
      where: { id },
      relations: ['commande.reservation.client'],
    });

    if (!data) {
      throw new Error('PaiementPret non trouvé');
    }
    return data;
  }
  async update(id: number, updatePaiementPretDto: UpdatePaiementPretDto) {
    const paiementPret = await this.paiementPretRepository.findOneBy({ id });
    if (!paiementPret) {
      throw new NotFoundException('PaiementPret non trouvé');
    }

    // montant total déjà payé
    const montantAvanceActuel = paiementPret.montantTotal - (paiementPret.resteARegler ?? paiementPret.montantTotal);

    // nouveau total payé
    const nouveauMontantAvance = montantAvanceActuel + updatePaiementPretDto.montantAvance;

    if (nouveauMontantAvance > paiementPret.montantTotal) {
      throw new BadRequestException("Le montant avancé dépasse le montant total.");
    }

    // nouveau reste
    const nouveauResteARegler = paiementPret.montantTotal - nouveauMontantAvance;

    paiementPret.resteARegler = nouveauResteARegler;
    paiementPret.estRegle = nouveauResteARegler === 0;

    return this.paiementPretRepository.save(paiementPret);
  }


  remove(id: number) {
    return `This action removes a #${id} paiementPret`;
  }
}
