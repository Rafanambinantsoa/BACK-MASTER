import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Client } from './entities/client.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
  ) { }
  async create(createClientDto: CreateClientDto) {
    const client = await this.clientRepository.create(createClientDto);
    return await this.clientRepository.save(client);
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
    return await this.clientRepository.save(result);
  }

  async remove(id: number) {
    const data = await this.clientRepository.findOneBy({ id });
    if (data === null) {
      throw new NotFoundException("Client introuvable");
    }

    await this.clientRepository.delete(id);

    return { message: "Client Supprimé" }
  }
}
