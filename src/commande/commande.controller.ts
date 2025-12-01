import { Controller, Get, Post, Body, Patch, Param, Delete, Put } from '@nestjs/common';
import { CommandeService } from './commande.service';
import { CreateCommandeDto } from './dto/create-commande.dto';
import { UpdateCommandeDto } from './dto/update-commande.dto';
import { UpdateCommandeMenuStatusDto } from './dto/update-commande-menu-status.dto';
import { UpdateCommandeMenusDto } from './dto/update-commande-menus.dto';
import { get } from 'http';

@Controller('commande')
export class CommandeController {
  constructor(private readonly commandeService: CommandeService) { }

  @Post()
  create(@Body() createCommandeDto: CreateCommandeDto) {
    return this.commandeService.create(createCommandeDto);
  }

  @Get()
  findAll() {
    return this.commandeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.commandeService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateCommandeDto: UpdateCommandeDto) {
    return this.commandeService.update(+id, updateCommandeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.commandeService.remove(+id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string) {
    return this.commandeService.updateStatus(+id);
  }

  @Patch(':commandeId/menus/status')
  async updateCommandeMenuStatus(
    @Param('commandeId') commandeId: number,
    @Body() dto: UpdateCommandeMenuStatusDto
  ) {
    return this.commandeService.updateCommandeMenuStatus(
      commandeId,
      dto
    );
  }

  @Put(':id/menus')
  async updateCommandeMenus(
    @Param('id') id: string,
    @Body() dto: UpdateCommandeMenusDto
  ) {
    return this.commandeService.updateCommandeMenus(+id, dto.menuIds, dto.quantities);
  }

  @Get('count/today')
  countCommandesToday() {
    return this.commandeService.countCommandesToDay();
  }

  @Get('count/status')
  countCommandesByStatus() {
    return this.commandeService.countCommandesByStatus();
  }

  @Get('total/pret')
  totalPret() {
    return this.commandeService.totalPret();
  }

  @Get('total/cash/today')
  totalCashToday() {
    return this.commandeService.totalPaiementToday();
  }
}
