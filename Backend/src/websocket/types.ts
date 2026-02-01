export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  encrypted: boolean;
  timestamp: Date;
  reactions?: Record<string, { count: number; users: string[] }>;
}

export interface UserStatus {
  userId: string;
  username: string;
  online: boolean;
  lastSeen?: Date;
}

export interface TypingStatus {
  userId: string;
  username: string;
  isTyping: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  message: string;
  read: boolean;
  timestamp: Date;
}

export interface ProgressUpdate {
  userId: string;
  moduleId: string;
  percentComplete: number;
  timestamp: Date;
}

export interface RankingUpdate {
  userId: string;
  rank: number;
  totalPoints: number;
  timestamp: Date;
}
