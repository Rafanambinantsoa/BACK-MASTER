import { Controller, Get, Post, Body, Patch, Param, Delete, UploadedFile } from '@nestjs/common';
import { MenuService } from './menu.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import type { Express } from 'express';
import { UploadImageInterceptor } from 'src/common/config/file-upload.config';

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) { }

  @Post()
  @UploadImageInterceptor('menu')
  create(@Body() createMenuDto: CreateMenuDto, @UploadedFile() file: Express.Multer.File) {
    if (file) { createMenuDto.image = file.filename; }
    return this.menuService.create(createMenuDto);
  }

  @Get()
  findAll() {
    return this.menuService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.menuService.findOne(+id);
  }

  @Patch(':id')
  @UploadImageInterceptor('menu')
  update(@Param('id') id: string, @Body() updateMenuDto: UpdateMenuDto, @UploadedFile() file: Express.Multer.File) {
    if (file) {
      updateMenuDto.image = file.filename;
    }
    return this.menuService.update(+id, updateMenuDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.menuService.remove(+id);
  }
}
