import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PaiementPretService } from './paiement-pret.service';
import { CreatePaiementPretDto } from './dto/create-paiement-pret.dto';
import { UpdatePaiementPretDto } from './dto/update-paiement-pret.dto';

@Controller('paiement-pret')
export class PaiementPretController {
  constructor(private readonly paiementPretService: PaiementPretService) {}

  @Post()
  create(@Body() createPaiementPretDto: CreatePaiementPretDto) {
    return this.paiementPretService.create(createPaiementPretDto);
  }

  @Get()
  findAll() {
    return this.paiementPretService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paiementPretService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePaiementPretDto: UpdatePaiementPretDto) {
    return this.paiementPretService.update(+id, updatePaiementPretDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.paiementPretService.remove(+id);
  }
}
