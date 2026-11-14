import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type {
  CommandRequest,
  Difficulty,
  MissionState,
  MissionView,
} from '@lunar-ops/contracts';
import {
  createMission,
  executeCommand,
  getMissionView,
  MissionError,
} from '@lunar-ops/game-core';

@Injectable()
export class MissionsService {
  private readonly sessions = new Map<string, MissionState>();

  create(difficulty: Difficulty): MissionView {
    const state = createMission(randomUUID(), difficulty);
    this.sessions.set(state.id, state);
    return getMissionView(state);
  }

  get(id: string): MissionView {
    const state = this.sessions.get(id);
    if (!state)
      throw new NotFoundException(
        'Сессия не найдена. Возможно, сервер был перезапущен.',
      );
    return getMissionView(state);
  }

  execute(id: string, request: CommandRequest): MissionView {
    this.get(id);
    const current = this.sessions.get(id)!;
    if (current.revision !== request.revision)
      throw new ConflictException(
        'Состояние изменилось в другой вкладке. Проверьте актуальные данные и повторите действие.',
      );
    try {
      const state = executeCommand(current, request.command);
      this.sessions.set(id, state);
      return getMissionView(state);
    } catch (error) {
      if (error instanceof MissionError)
        throw new BadRequestException(error.message);
      throw error;
    }
  }
}
