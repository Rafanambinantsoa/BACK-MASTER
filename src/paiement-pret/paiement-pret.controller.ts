import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PaiementPretService } from './paiement-pret.service';
import { CreatePaiementPretDto } from './dto/create-paiement-pret.dto';
import { UpdatePaiementPretDto } from './dto/update-paiement-pret.dto';
import { CreatePaiementResteDto } from 'src/paiment-reste/dto/create-paiment-reste.dto';

@Controller('paiement-pret')
export class PaiementPretController {
  constructor(private readonly paiementPretService: PaiementPretService) { }

  // ---------------------------
  // Paiement initial
  // ---------------------------
  @Post('pret')
  createPaiementPret(@Body() dto: CreatePaiementPretDto) {
    return this.paiementPretService.createPaiementPret(dto);
  }

  // ---------------------------
  // Paiement du reste
  // ---------------------------
  @Post('reste/:id')
  createPaiementReste(@Param('id') id: string, @Body() dto: CreatePaiementResteDto) {
    return this.paiementPretService.createPaiementReste(dto, +id);
  }

  @Get()
  findAll() {
    return this.paiementPretService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paiementPretService.findOne(+id);
  }
}
