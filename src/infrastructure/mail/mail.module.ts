import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { mailConfig } from '../../config/configuration';
import { MailService } from './mail.service';
import { MailTemplateService } from './mail-template.service';

@Global()
@Module({
  imports: [ConfigModule.forFeature(mailConfig)],
  providers: [MailService, MailTemplateService],
  exports: [MailService, MailTemplateService],
})
export class MailModule {}
