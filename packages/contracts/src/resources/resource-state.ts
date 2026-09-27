import type { ResourcePool } from './resource-pool.js';

export interface ResourceState {
  energy: ResourcePool;
  water: ResourcePool;
  oxygen: ResourcePool;
  food: ResourcePool;
}
