import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksService } from './crons.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Commande } from 'src/commande/entities/commande.entity';

@Module({
    imports: [ScheduleModule.forRoot(), TypeOrmModule.forFeature([Commande])],
    providers: [TasksService],
    exports: [],
})
export class TasksModule { }
