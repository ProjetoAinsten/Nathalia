export interface Message {
  id: string;
  role: 'user' | 'model';
  userName?: string;
  text: string;
  timestamp: number;
  image?: string; 
  hasError?: boolean; 
  correction?: string; 
}

export type LogLevel = 'info' | 'warn' | 'error' | 'success';

export interface SystemLog {
  id: string;
  timestamp: number;
  level: LogLevel;
  message: string;
  details?: string;
}

export interface ErrorLog {
  id: string;
  moduleId: string;
  aiResponse: string;
  userCorrection: string;
  timestamp: number;
  cost: number;
}

export interface UsageLog {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostBRL: number;
  initialBonusBRL: number;
  remainingBonusBRL: number;
  breakdown: {
    flash: { input: number; output: number; cost: number };
    pro: { input: number; output: number; cost: number };
    audio: { cost: number };
  };
  lastUpdate: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  description?: string;
  notified?: boolean;
}

export enum AppStatus {
  IDLE = 'IDLE',
  THINKING = 'PENSANDO',
  STREAMING = 'RESPONDENDO',
  ERROR = 'ERRO',
  RECORDING = 'GRAVANDO ÁUDIO...',
  TRANSCRIBING = 'TRANSCREVENDO...'
}

export type ModuleType = 'core' | 'general' | 'health' | 'work' | 'code' | 'finance' | 'assistant' | 'memory' | 'lab' | 'system' | 'apple' | 'manual' | 'gcp';

export interface AppModule {
  id: ModuleType;
  name: string;
  icon: string; 
  color: string;
  description: string;
  systemInstruction: string;
  suggestedQuestions?: string[]; 
}

export interface ChatState {
  messages: Message[];
  status: AppStatus;
}