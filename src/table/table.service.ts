import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Table } from './entities/table.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TableService {

  constructor(
    @InjectRepository(Table)
    private tableRepo: Repository<Table>
  ) { }

  async create(createTableDto: CreateTableDto) {
    //verification  doubloun de nom 
    const existingTable = await this.tableRepo.findOneBy({ numero_table: createTableDto.numero_table });

    if (existingTable) {
      throw new NotFoundException('Une table avec ce numéro existe déjà.');
    }

    const data = this.tableRepo.create(createTableDto)
    await this.tableRepo.save(data)

    return data;

  }

  async findAll() {
    return await this.tableRepo.find()
  }

  async findOne(id: number) {
    const data = await this.tableRepo.findOneBy({ id })
    if (data === null) {
      throw new NotFoundException("Table introuvable")
    }
    return data;
  }

  async update(id: number, updateTableDto: UpdateTableDto) {
    const data = await this.tableRepo.findOneBy({ id })
    if (data === null) {
      throw new NotFoundException("Table introuvable")
    }

    await this.tableRepo.merge(data, updateTableDto)
    await this.tableRepo.save(data)
    return data;
  }

  async remove(id: number) {
    const data = await this.tableRepo.findOneBy({ id })
    if (data === null) {
      throw new NotFoundException('Table introuvable')
    }
    await this.tableRepo.remove(data)

    return { message: "Table removed" }
  }
}
