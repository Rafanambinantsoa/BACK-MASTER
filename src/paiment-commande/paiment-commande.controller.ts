import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { PaimentCommandeService } from './paiment-commande.service';
import { CreatePaimentCommandeDto } from './dto/create-paiment-commande.dto';
import { UpdatePaimentCommandeDto } from './dto/update-paiment-commande.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('paiment-commande')
export class PaimentCommandeController {
  constructor(private readonly paimentCommandeService: PaimentCommandeService) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createPaimentCommandeDto: CreatePaimentCommandeDto) {
    return this.paimentCommandeService.create(createPaimentCommandeDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.paimentCommandeService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('ventes-journalieres')
  getVentesJournalieresParHeure() {
    return this.paimentCommandeService.getVentesJournalieresParHeure();
  }

  @UseGuards(JwtAuthGuard)
  @Get('ventes-semaine')
  getVentesSemaine() {
    return this.paimentCommandeService.getVentesSemaine();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paimentCommandeService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePaimentCommandeDto: UpdatePaimentCommandeDto) {
    return this.paimentCommandeService.update(+id, updatePaimentCommandeDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.paimentCommandeService.remove(+id);
  }
}
