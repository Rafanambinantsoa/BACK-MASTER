import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { TypeMenuService } from './type_menu.service';
import { CreateTypeMenuDto } from './dto/create-type_menu.dto';
import { UpdateTypeMenuDto } from './dto/update-type_menu.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('type-menu')
export class TypeMenuController {
  constructor(private readonly typeMenuService: TypeMenuService) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createTypeMenuDto: CreateTypeMenuDto) {
    return this.typeMenuService.create(createTypeMenuDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.typeMenuService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.typeMenuService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTypeMenuDto: UpdateTypeMenuDto) {
    return this.typeMenuService.update(+id, updateTypeMenuDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.typeMenuService.remove(+id);
  }
}
