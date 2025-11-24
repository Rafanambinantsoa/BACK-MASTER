import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PaimentResteService } from './paiment-reste.service';
import { CreatePaimentResteDto } from './dto/create-paiment-reste.dto';
import { UpdatePaimentResteDto } from './dto/update-paiment-reste.dto';

@Controller('paiment-reste')
export class PaimentResteController {
  constructor(private readonly paimentResteService: PaimentResteService) {}

  @Post()
  create(@Body() createPaimentResteDto: CreatePaimentResteDto) {
    return this.paimentResteService.create(createPaimentResteDto);
  }

  @Get()
  findAll() {
    return this.paimentResteService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paimentResteService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePaimentResteDto: UpdatePaimentResteDto) {
    return this.paimentResteService.update(+id, updatePaimentResteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.paimentResteService.remove(+id);
  }
}
