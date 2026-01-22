import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MailService } from './mail.service';
import { CreateMailDto } from './dto/create-mail.dto';
import { UpdateMailDto } from './dto/update-mail.dto';

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) { }

  @Post('send-confirmation')
  async sendConfirmation(
    @Body() body: { email: string; username: string; token: string },
  ) {
    return this.mailService.sendUserConfirmation(
      body.email,
      body.username,
      body.token,
    );
  }

  @Post('send-custom')
  async sendCustom(
    @Body() body: { email: string; subject: string; html: string },
  ) {
    return this.mailService.sendCustomEmail(
      body.email,
      body.subject,
      body.html,
    );
  }
}
