import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './entities/user.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from 'src/role/entities/role.entity';
import { TypeMenu } from 'src/type_menu/entities/type_menu.entity';
import { UserTypeMenu } from 'src/userTypeMenu/user-type-menu.entity';
import { Table } from 'src/table/entities/table.entity';
import { PaimentCommande } from 'src/paiment-commande/entities/paiment-commande.entity';
import { PaiementReste } from 'src/paiment-reste/entities/paiment-reste.entity';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, TypeMenu, UserTypeMenu, Table, PaimentCommande, PaiementReste]),
    MailModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule { }
