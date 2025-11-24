import { Module } from '@nestjs/common';
import { PaimentResteService } from './paiment-reste.service';
import { PaimentResteController } from './paiment-reste.controller';

@Module({
  controllers: [PaimentResteController],
  providers: [PaimentResteService],
})
export class PaimentResteModule {}
