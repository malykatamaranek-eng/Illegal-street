export interface UserActivity {
  id: string;
  user_id: string;
  action: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface ActivityMetadata {
  module_id?: string;
  quiz_id?: string;
  product_id?: string;
  event_id?: string;
  duration?: number;
  score?: number;
  [key: string]: any;
}

export interface GlobalStats {
  total_users: number;
  active_users_today: number;
  total_modules: number;
  total_quizzes: number;
  total_products: number;
  total_orders: number;
  total_events: number;
  avg_user_level: number;
  total_achievements: number;
}

export interface ModuleStats {
  module_id: string;
  total_enrollments: number;
  completion_rate: number;
  average_score: number;
  average_time_spent: number;
  difficulty_rating: number;
}

export interface DashboardStats {
  users: {
    total: number;
    new_today: number;
    new_this_week: number;
    new_this_month: number;
    active_today: number;
  };
  modules: {
    total: number;
    total_completions: number;
    average_completion_rate: number;
  };
  quizzes: {
    total: number;
    total_attempts: number;
    average_score: number;
  };
  orders: {
    total: number;
    pending: number;
    completed: number;
    total_revenue: number;
  };
  events: {
    total: number;
    upcoming: number;
    total_registrations: number;
  };
}

export interface UserActivityStats {
  user_id: string;
  total_actions: number;
  actions_by_type: Record<string, number>;
  last_activity: Date;
  most_active_hour: number;
  most_active_day: string;
}
