import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksService } from './crons.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Commande } from 'src/commande/entities/commande.entity';
import { PusherModule } from 'src/pusher/pusher.module';

@Module({
    imports: [ScheduleModule.forRoot(), TypeOrmModule.forFeature([Commande]), PusherModule],
    providers: [TasksService],
    exports: [],
})
export class TasksModule { }
