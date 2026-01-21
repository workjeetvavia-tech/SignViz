export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface SignState {
  id: string;
  imageSrc: string;
  position: Position;
  scaleX: number;
  scaleY: number;
  rotation: number;
}

export enum LightingMode {
  DAY = 'DAY',
  NIGHT = 'NIGHT'
}