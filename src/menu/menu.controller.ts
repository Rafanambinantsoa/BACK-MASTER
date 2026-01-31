import { Controller, Get, Post, Body, Patch, Param, Delete, UploadedFile, UseGuards } from '@nestjs/common';
import { MenuService } from './menu.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import type { Express } from 'express';
import { UploadImageInterceptor } from 'src/common/config/file-upload.config';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  @UploadImageInterceptor('menu')
  create(@Body() createMenuDto: CreateMenuDto, @UploadedFile() file: Express.Multer.File) {
    if (file) { createMenuDto.image = file.filename; }
    return this.menuService.create(createMenuDto);
  }

  // @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.menuService.findAll();
  }

  // @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.menuService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @UploadImageInterceptor('menu')
  update(@Param('id') id: string, @Body() updateMenuDto: UpdateMenuDto, @UploadedFile() file: Express.Multer.File) {
    if (file) {
      updateMenuDto.image = file.filename;
    }
    return this.menuService.update(+id, updateMenuDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.menuService.remove(+id);
  }
}
