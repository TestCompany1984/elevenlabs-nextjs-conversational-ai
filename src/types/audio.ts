export interface AudioConfiguration {
  sampleRate: number;
  channels: number;
  bitDepth: number;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
  latencyHint: 'interactive' | 'balanced' | 'playback';
  bufferSize?: number;
}

export interface AudioSettings {
  inputVolume: number;
  outputVolume: number;
  microphoneEnabled: boolean;
  speakerEnabled: boolean;
  audioQuality: 'low' | 'medium' | 'high';
}

export interface AudioState {
  isInputActive: boolean;
  isOutputActive: boolean;
  inputLevel: number;
  outputLevel: number;
  hasInputDevice: boolean;
  hasOutputDevice: boolean;
  inputDevice?: MediaDeviceInfo;
  outputDevice?: MediaDeviceInfo;
}

export interface AudioPermissions {
  microphone: 'granted' | 'denied' | 'prompt' | 'unknown';
  speaker: 'granted' | 'denied' | 'prompt' | 'unknown';
}

export type AudioEvent = 
  | 'input-start'
  | 'input-stop' 
  | 'output-start'
  | 'output-stop'
  | 'volume-change'
  | 'device-change'
  | 'permission-change';

export interface AudioEventData {
  type: AudioEvent;
  data?: unknown;
  timestamp: Date;
}