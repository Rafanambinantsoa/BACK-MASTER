import { Module } from '@nestjs/common';
import { ClientService } from './client.service';
import { ClientController } from './client.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from './entities/client.entity';
import { Reservation } from 'src/reservation/entities/reservation.entity';
import { PusherModule } from '../pusher/pusher.module';

@Module({
  imports: [TypeOrmModule.forFeature([Client, Reservation]), PusherModule],  controllers: [ClientController],
  providers: [ClientService],
})
export class ClientModule { }
