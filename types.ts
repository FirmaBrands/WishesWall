export interface Message {
  id: string;
  text: string;
  timestamp: number;
  author?: string;
  // Visual properties for the display
  x?: number; // percent
  y?: number; // percent
  color?: string;
  font?: string;
  rotation?: number;
  scale?: number;
}

export enum ViewMode {
  GUEST = 'guest',
  DISPLAY = 'display'
}

export interface GoogleAppsScriptConfig {
  deploymentUrl: string;
}