import { Injectable, Logger } from '@nestjs/common';
import Pusher from 'pusher';
import { pusherConfig } from '../common/config/pusher.config';

@Injectable()
export class PusherService {
  private pusher: Pusher;
  private readonly logger = new Logger(PusherService.name);

  constructor() {
    this.pusher = new Pusher({
      appId: pusherConfig.appId,
      key: pusherConfig.key,
      secret: pusherConfig.secret,
      cluster: pusherConfig.cluster,
      useTLS: pusherConfig.useTLS,
    });
  }

  async trigger(channel: string, event: string, data: any): Promise<void> {
    try {
      await this.pusher.trigger(channel, event, data);
      this.logger.log(`Event '${event}' triggered on channel '${channel}' with data: ${JSON.stringify(data)}`);
    } catch (error) {
      this.logger.error(`Error triggering event '${event}' on channel '${channel}': ${error.message}`);
      throw error;
    }
  }
}
