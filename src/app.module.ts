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

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'), // dossier à exposer
      serveRoot: '/uploads', // l’URL de base publique
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '',
      database: 'masterback',
      autoLoadEntities: true,
      synchronize: true, // ⚠️ à désactiver en production
    }),
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
