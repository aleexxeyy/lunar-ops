import type { Difficulty } from './difficulty.js';
import type { MissionStatus } from './mission-status.js';

export interface MissionState {
  sol: number;
  maxSols: number;
  difficulty: Difficulty;
  status: MissionStatus;
  sciencePoints: number;
}
