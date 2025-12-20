import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Client } from './entities/client.entity';
import { Repository } from 'typeorm';
import { PusherService } from '../pusher/pusher.service';

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    private pusherService: PusherService,
  ) { }
  async create(createClientDto: CreateClientDto) {
    const client = await this.clientRepository.create(createClientDto);
    const savedClient = await this.clientRepository.save(client);
    await this.pusherService.trigger('clients', 'new-client', savedClient);
    return savedClient;
  }

  async findAll() {
    return await this.clientRepository.find();
  }

  async findOne(id: number) {
    const data = await this.clientRepository.findOneBy({ id });
    if (data === null) {
      throw new NotFoundException("Client introuvable");
    }
    return data;

  }

  async update(id: number, updateClientDto: UpdateClientDto) {
    const data = await this.clientRepository.findOneBy({ id });
    if (data === null) {
      throw new NotFoundException("Client introuvable");
    }

    const result = await this.clientRepository.merge(data, updateClientDto);
    const updatedClient = await this.clientRepository.save(result);
    await this.pusherService.trigger('clients', 'update-client', updatedClient);
    return updatedClient;
  }

  async remove(id: number) {
    const data = await this.clientRepository.findOneBy({ id });
    if (data === null) {
      throw new NotFoundException("Client introuvable");
    }

    await this.clientRepository.delete(id);
    await this.pusherService.trigger('clients', 'delete-client', { id, nom: data.nom });
    return { message: "Client Supprimé" }
  }
}
