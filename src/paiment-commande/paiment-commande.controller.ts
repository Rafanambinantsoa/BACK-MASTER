import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PaimentCommandeService } from './paiment-commande.service';
import { CreatePaimentCommandeDto } from './dto/create-paiment-commande.dto';
import { UpdatePaimentCommandeDto } from './dto/update-paiment-commande.dto';

@Controller('paiment-commande')
export class PaimentCommandeController {
  constructor(private readonly paimentCommandeService: PaimentCommandeService) {}

  @Post()
  create(@Body() createPaimentCommandeDto: CreatePaimentCommandeDto) {
    return this.paimentCommandeService.create(createPaimentCommandeDto);
  }

  @Get()
  findAll() {
    return this.paimentCommandeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paimentCommandeService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePaimentCommandeDto: UpdatePaimentCommandeDto) {
    return this.paimentCommandeService.update(+id, updatePaimentCommandeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.paimentCommandeService.remove(+id);
  }
}
