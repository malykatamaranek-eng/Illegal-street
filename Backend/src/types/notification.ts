export enum NotificationType {
  ACHIEVEMENT = 'ACHIEVEMENT',
  FOLLOW = 'FOLLOW',
  MESSAGE = 'MESSAGE',
  SYSTEM = 'SYSTEM',
  EVENT = 'EVENT',
  MODULE = 'MODULE',
  ORDER = 'ORDER',
}

export interface CreateNotificationData {
  user_id: string;
  message: string;
  type?: NotificationType;
  metadata?: Record<string, any>;
}

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  read: boolean;
  created_at: Date;
  metadata?: Record<string, any>;
}

export interface NotificationFilters {
  read?: boolean;
  type?: NotificationType;
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface NotificationBatchUpdate {
  notificationIds: string[];
  read: boolean;
}
