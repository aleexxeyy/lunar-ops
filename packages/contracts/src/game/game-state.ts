import type { CrewState } from '../crew/crew-state.js';
import type { ResourceState } from '../resources/resource-state.js';
import type { MissionState } from './mission-state.js';

export interface GameState {
  id: string;
  mission: MissionState;
  resources: ResourceState;
  crew: CrewState;
}
