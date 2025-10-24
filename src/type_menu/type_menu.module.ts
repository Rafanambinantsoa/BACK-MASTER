import { Module } from '@nestjs/common';
import { TypeMenuService } from './type_menu.service';
import { TypeMenuController } from './type_menu.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeMenu } from './entities/type_menu.entity';
import { User } from 'src/user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TypeMenu, User])],
  controllers: [TypeMenuController],
  providers: [TypeMenuService],
})
export class TypeMenuModule { }
