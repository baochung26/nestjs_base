import { Module } from '@nestjs/common';
import { AdminUsersModule } from './users/admin-users.module';
import { AdminSettingsModule } from './settings/admin-settings.module';
import { AdminDashboardModule } from './dashboard/admin-dashboard.module';

@Module({
  imports: [
    AdminUsersModule,
    AdminSettingsModule,
    AdminDashboardModule,
  ],
})
export class AdminModule {}
