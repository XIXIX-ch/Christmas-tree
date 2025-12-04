import { Vector3 } from 'three';

export enum TreeState {
  SCATTERED = 'SCATTERED',
  TREE_SHAPE = 'TREE_SHAPE',
}

export interface ParticleData {
  id: number;
  treePosition: Vector3;
  scatterPosition: Vector3;
  scale: number;
  rotation: [number, number, number];
  color?: string;
  speed: number;
}

export interface SceneConfig {
  cameraPosition: [number, number, number];
  particleCount: number;
  ornamentCount: number;
}