import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { Module } from '@nestjs/common';
import { RoleModule } from './role/role.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { MenuModule } from './menu/menu.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { TypeMenuModule } from './type_menu/type_menu.module';
import { UserTypeMenuModule } from './userTypeMenu/user-type-menu.module';
import { TableModule } from './table/table.module';
import { ClientModule } from './client/client.module';
import { ReservationModule } from './reservation/reservation.module';
import { ReservationTableModule } from './reservation-table/reservation-table.module';
import { ReservationMenuModule } from './reservation-menu/reservation-menu.module';
import { PaimentReservationTableModule } from './paiment-reservation-table/paiment-reservation-table.module';
import { CommandeModule } from './commande/commande.module';
import { CommandeMenuModule } from './commande-menu/commande-menu.module';
import { TasksModule } from './crons/crons.module';
import { PaimentCommandeModule } from './paiment-commande/paiment-commande.module';
import { PaiementPretModule } from './paiement-pret/paiement-pret.module';
import { PaimentResteModule } from './paiment-reste/paiment-reste.module';
import { StripeModule } from './stripe/stripe.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'), // dossier à exposer
      serveRoot: '/uploads', // l’URL de base publique
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'auth-db1318.hstgr.io',
      port: 3306,
      username: 'u614166417_kim',
      password: 'U614166417_kim',
      database: 'u614166417_kim',
      autoLoadEntities: true,
      synchronize: true, // ⚠️ à désactiver en production
    }),
    TasksModule,
    UserModule,
    RoleModule,
    AuthModule,
    MenuModule,
    TypeMenuModule,
    UserTypeMenuModule,
    TableModule,
    ClientModule,
    ReservationModule,
    ReservationTableModule,
    ReservationMenuModule,
    PaimentReservationTableModule,
    CommandeModule,
    CommandeMenuModule,
    PaimentCommandeModule,
    PaiementPretModule,
    PaimentResteModule,
    StripeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
