import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Commande } from 'src/commande/entities/commande.entity';
import { Repository } from 'typeorm';
import { PusherService } from 'src/pusher/pusher.service';

@Injectable()
export class TasksService {
    private readonly logger = new Logger(TasksService.name);

    constructor(
        @InjectRepository(Commande)
        private commandeRepo: Repository<Commande>,
        private pusherService: PusherService,
    ) { }

    // Exécution toutes les minutes
    @Cron(CronExpression.EVERY_MINUTE)
    async handleEveryMinute() {
        this.logger.log('Cron : vérification des commandes en cours');

        // 1️⃣ Charger les commandes en cours
        const commandesEnCours = await this.commandeRepo.find({
            where: { status: 'en_cours' },
            relations: ['commandeMenu'], // indispensable
        });

        for (const commande of commandesEnCours) {
            // 2️⃣ Vérifier si tous les menus sont terminés
            const tousTermines = commande.commandeMenu.every(
                (cm) => cm.status === 'terminer',
            );

            if (tousTermines) {
                commande.status = 'terminer';
                await this.commandeRepo.save(commande);
                this.logger.log(`Commande ${commande.id} mise à jour en "terminer"`);

                // Notification temps réel côté application serveur (Flutter)
                // Flutter écoute: channel `server-notifications` + event `order-ready`
                await this.pusherService.trigger('server-notifications', 'order-ready', {
                    commandeId: commande.id,
                    reference: commande.reference,
                    message: `La commande ${commande.reference ?? commande.id} est prête à être servie.`,
                    updatedAt: new Date().toISOString(),
                });
            }
        }
    }
}
