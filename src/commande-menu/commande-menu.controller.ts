import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CommandeMenuService } from './commande-menu.service';
import { CreateCommandeMenuDto } from './dto/create-commande-menu.dto';
import { UpdateCommandeMenuDto } from './dto/update-commande-menu.dto';

@Controller('commande-menu')
export class CommandeMenuController {
  constructor(private readonly commandeMenuService: CommandeMenuService) { }

  @Post()
  create(@Body() createCommandeMenuDto: CreateCommandeMenuDto) {
    return this.commandeMenuService.create(createCommandeMenuDto);
  }

  @Get()
  findAll() {
    return this.commandeMenuService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.commandeMenuService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCommandeMenuDto: UpdateCommandeMenuDto) {
    return this.commandeMenuService.update(+id, updateCommandeMenuDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.commandeMenuService.remove(+id);
  }

  @Get('count/today')
  countToday() {
    return this.commandeMenuService.countCommandeMenuToday();
  }

  @Get('statistiques/cuisinier')
  getStatistiquesCuisinier() {
    return this.commandeMenuService.getStatistiquesCuisinier();
  }
}
