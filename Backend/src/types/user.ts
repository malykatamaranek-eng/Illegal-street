export interface UserProfile {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  level: number;
  total_points: number;
  streak: number;
  created_at: Date;
  updated_at: Date;
}

export interface UserStats {
  level: number;
  total_points: number;
  streak: number;
  modules_completed: number;
  quizzes_taken: number;
  average_quiz_score: number;
  time_spent: number;
  achievements_count: number;
  followers_count: number;
  following_count: number;
}

export interface UpdateProfileData {
  username?: string;
  bio?: string;
  avatar_url?: string;
}

export interface ChangePasswordData {
  oldPassword: string;
  newPassword: string;
}

export interface UserSearchFilters {
  level?: number;
  minPoints?: number;
  maxPoints?: number;
  limit?: number;
  offset?: number;
}

export interface FollowResponse {
  success: boolean;
  follower_id: string;
  following_id: string;
  created_at: Date;
}

export interface UserListItem {
  id: string;
  username: string;
  avatar_url?: string;
  level: number;
  total_points: number;
}
