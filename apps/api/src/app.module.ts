import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { MissionsController } from './missions.controller.js';
import { MissionsService } from './missions.service.js';

@Module({
  imports: [],
  controllers: [AppController, MissionsController],
  providers: [AppService, MissionsService],
})
export class AppModule {}
