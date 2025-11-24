import { Injectable } from '@nestjs/common';
import { CreatePaimentResteDto } from './dto/create-paiment-reste.dto';
import { UpdatePaimentResteDto } from './dto/update-paiment-reste.dto';

@Injectable()
export class PaimentResteService {
  create(createPaimentResteDto: CreatePaimentResteDto) {
    return 'This action adds a new paimentReste';
  }

  findAll() {
    return `This action returns all paimentReste`;
  }

  findOne(id: number) {
    return `This action returns a #${id} paimentReste`;
  }

  update(id: number, updatePaimentResteDto: UpdatePaimentResteDto) {
    return `This action updates a #${id} paimentReste`;
  }

  remove(id: number) {
    return `This action removes a #${id} paimentReste`;
  }
}
