import { Command } from 'commander';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { SeederService } from './seeder.service';
import { SeederModule } from './seeder.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seederModule = app.select(SeederModule);
  const seederService = seederModule.get(SeederService);

  const program = new Command();

  program
    .name('seeder')
    .description('Database seeder commands')
    .version('1.0.0');

  program
    .command('seed')
    .description('Seed the database with sample data')
    .action(async () => {
      try {
        await seederService.seed();
        await app.close();
        process.exit(0);
      } catch (error) {
        console.error('Seeding failed:', error);
        await app.close();
        process.exit(1);
      }
    });

  program
    .command('clear')
    .description('Clear all seeded data')
    .action(async () => {
      try {
        await seederService.clear();
        await app.close();
        process.exit(0);
      } catch (error) {
        console.error('Clearing failed:', error);
        await app.close();
        process.exit(1);
      }
    });

  program
    .command('refresh')
    .description('Clear and seed the database')
    .action(async () => {
      try {
        await seederService.refresh();
        await app.close();
        process.exit(0);
      } catch (error) {
        console.error('Refresh failed:', error);
        await app.close();
        process.exit(1);
      }
    });

  await program.parseAsync(process.argv);
}

bootstrap();
