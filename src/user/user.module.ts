import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './entities/user.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from 'src/role/entities/role.entity';
import { TypeMenu } from 'src/type_menu/entities/type_menu.entity';
import { UserTypeMenu } from 'src/pivots/user-type-menu.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, TypeMenu, UserTypeMenu])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule { }
