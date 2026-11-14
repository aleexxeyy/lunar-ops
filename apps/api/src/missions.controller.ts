import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
} from '@nestjs/common';
import { commandSchema, createSessionSchema } from '@lunar-ops/contracts';
import { missionConfig } from '@lunar-ops/game-config';
import { MissionsService } from './missions.service.js';

@Controller('api')
export class MissionsController {
  constructor(
    @Inject(MissionsService) private readonly missions: MissionsService,
  ) {}

  @Get('config')
  config() {
    return missionConfig;
  }

  @Post('sessions')
  create(@Body() body: unknown) {
    const result = createSessionSchema.safeParse(body);
    if (!result.success)
      throw new BadRequestException('Выберите корректный уровень сложности.');
    return this.missions.create(result.data.difficulty);
  }

  @Get('sessions/:id')
  get(@Param('id') id: string) {
    return this.missions.get(id);
  }

  @Post('sessions/:id/commands')
  execute(@Param('id') id: string, @Body() body: unknown) {
    const result = commandSchema.safeParse(body);
    if (!result.success)
      throw new BadRequestException('Некорректная команда миссии.');
    return this.missions.execute(id, result.data);
  }
}
