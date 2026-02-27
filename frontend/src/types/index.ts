export type UserRole = 'user' | 'moderator' | 'admin';

export interface SocialLinks {
  linkedin?: string;
  github?: string;
  twitter?: string;
  instagram?: string;
  website?: string;
  portfolio?: string;
}

export interface BadgeProgress {
  current: number;
  target: number;
}

export interface Badge {
  key: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  progress?: BadgeProgress;
}

export interface BadgeSummary {
  badges: Badge[];
  earned_count: number;
  total_count: number;
}

export interface Rating {
  _id: string;
  transaction_id: string;
  rater_id: string;
  rated_user_id: string;
  score: number;
  comment?: string;
  created_at: string;
  rater?: {
    id: string;
    username: string;
    full_name?: string;
  };
}

export interface RatingListResponse {
  ratings: Rating[];
  total: number;
  average_score?: number;
}

export interface RatingForm {
  transaction_id: string;
  rated_user_id: string;
  score: number;
  comment?: string;
}

export interface User {
  _id: string;
  username: string;
  email: string;
  full_name?: string;
  bio?: string;
  location?: string;
  profile_picture?: string;
  social_links?: SocialLinks;
  interests?: string[];
  is_active: boolean;
  is_verified: boolean;
  role: UserRole;
  timebank_balance: number;
  created_at: string;
  updated_at: string;
  // Privacy settings
  profile_visible?: boolean;
  show_email?: boolean;
  show_location?: boolean;
  // Notification settings
  email_notifications?: boolean;
  service_matches_notifications?: boolean;
  messages_notifications?: boolean;
}

export interface UserSettings {
  profile_visible: boolean;
  show_email: boolean;
  show_location: boolean;
  email_notifications: boolean;
  service_matches_notifications: boolean;
  messages_notifications: boolean;
}

export interface PasswordChangeForm {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface AccountDeletionForm {
  password: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface TagEntity {
  label: string;
  entityId: string; // e.g., "Q1234"
  description?: string;
  aliases?: string[];
}

export interface Service {
  _id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  tags: TagEntity[]; 
  estimated_duration: number;
  location: Location;
  deadline?: string;
  service_type: 'offer' | 'need';
  status: 'active' | 'in_progress' | 'completed' | 'cancelled' | 'expired';
  created_at: string;
  updated_at: string;
  completed_at?: string;
  matched_user_ids?: string[];
  max_participants: number;
  provider_confirmed?: boolean;
  receiver_confirmed_ids?: string[];
  // Scheduling fields
  scheduling_type?: 'specific' | 'recurring' | 'open';
  specific_date?: string;
  specific_time?: string;
  recurring_pattern?: {
    days: string[];
    time: string;
  };
  open_availability?: string;
  is_remote?: boolean;
}

export interface TimeBankTransaction {
  id: string;
  user_id: string;
  amount: number;
  description: string;
  service_id?: string;
  created_at: string;
  user?: {
    id: string;
    username: string;
    full_name?: string;
  };
}

export interface TimeBankResponse {
  balance: number;
  transactions: TimeBankTransaction[];
  max_balance: number;
  can_earn: boolean;
  requires_need_creation?: boolean;
}

export interface ServiceFilters {
  service_type?: 'offer' | 'need';
  category?: string;
  tags?: string[];
  status?: string;
  min_duration?: number;
  max_duration?: number;
  location?: Location;
  radius?: number;
  user_id?: string;
  is_remote?: boolean;
}

export interface ServiceListResponse {
  services: Service[];
  total: number;
  page: number;
  limit: number;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
  full_name?: string;
  bio?: string;
  location?: string;
}

export interface ServiceForm {
  title: string;
  description: string;
  category: string;
  tags: TagEntity[]; 
  estimated_duration: number;
  location: Location;
  city?: string;
  deadline?: string;
  service_type: 'offer' | 'need';
  // New scheduling fields
  scheduling_type: 'specific' | 'recurring' | 'open';
  specific_date?: string;
  specific_time?: string;
  recurring_pattern?: {
    days: string[];
    time: string;
  };
  open_availability?: string;
  // New participant and attachment fields
  max_participants: number;
  attachment?: File;
  attachment_url?: string;
  is_remote?: boolean;
}

export interface ServiceFormErrors {
  title?: string;
  description?: string;
  category?: string;
  tags?: string;
  estimated_duration?: string;
  city?: string;
  location?: string;
  max_participants?: string;
  specific_date?: string;
  specific_time?: string;
  recurring_pattern?: string | { days: string[]; time: string; error: string };
  open_availability?: string;
}

export interface Comment {
  _id: string;
  user_id: string;
  service_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    username: string;
    full_name?: string;
    bio?: string;
  };
}

export interface CommentListResponse {
  comments: Comment[];
  total: number;
  page: number;
  limit: number;
}

export interface CommentForm {
  content: string;
  service_id: string;
}

export interface JoinRequest {
  _id: string;
  service_id: string;
  user_id: string;
  message?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  admin_message?: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    username: string;
    full_name?: string;
    bio?: string;
  };
  service?: {
    id: string;
    title: string;
    description?: string;
    category?: string;
  };
}

export interface JoinRequestListResponse {
  requests: JoinRequest[];
  total: number;
  page: number;
  limit: number;
}

export interface JoinRequestForm {
  service_id: string;
  message?: string;
}

export interface Transaction {
  _id: string;
  service_id: string;
  provider_id: string;
  requester_id: string;
  timebank_hours: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
  description?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  completion_notes?: string;
  dispute_reason?: string;
  provider_confirmed?: boolean;
  requester_confirmed?: boolean;
  service?: {
    id: string;
    title: string;
    description?: string;
  };
  provider?: {
    id: string;
    username: string;
    full_name?: string;
  };
  requester?: {
    id: string;
    username: string;
    full_name?: string;
  };
}

export interface TransactionListResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
}

export interface TransactionForm {
  service_id: string;
  provider_id: string;
  requester_id: string;
  hours: number;
  description?: string;
}

export interface ChatRoom {
  _id: string;
  name?: string;
  description?: string;
  is_active: boolean;
  participant_ids: string[];
  service_ids?: string[];
  service_id?: string; // For backward compatibility
  transaction_id?: string;
  created_at: string;
  updated_at: string;
  last_message_at?: string;
  participants?: {
    id: string;
    username: string;
    full_name?: string;
    bio?: string;
  }[];
  services?: {
    id: string;
    title: string;
    description?: string;
    category?: string;
  }[];
  service?: {
    id: string;
    title: string;
    description?: string;
    category?: string;
  }; // For backward compatibility (first service)
  transaction?: {
    id: string;
    status: string;
    hours: number;
  };
}

export interface ChatRoomListResponse {
  rooms: ChatRoom[];
  total: number;
  page: number;
  limit: number;
}

export interface ChatRoomForm {
  name?: string;
  description?: string;
  participant_ids: string[];
  service_id?: string;
  transaction_id?: string;
}

export interface Message {
  _id: string;
  room_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  reply_to_message_id?: string;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  sender?: {
    id: string;
    username: string;
    full_name?: string;
  };
  reply_to_message?: {
    id: string;
    content: string;
    sender: string;
  };
}

export interface MessageListResponse {
  messages: Message[];
  total: number;
  page: number;
  limit: number;
}

export interface MessageForm {
  room_id: string;
  content: string;
  message_type?: 'text' | 'image' | 'file' | 'system';
  reply_to_message_id?: string;
}

export interface FailedTransaction {
  id: string;
  user_id: string;
  amount: number;
  description: string;
  service_id?: string;
  reason: 'provider_balance_limit' | 'insufficient_balance' | 'user_not_found' | 'unknown_error';
  user_balance_at_failure?: number;
  error_message?: string;
  created_at: string;
  user?: {
    id: string;
    username: string;
    full_name?: string;
    email?: string;
  };
  service?: {
    id: string;
    title: string;
  };
}

export interface FailedTransactionListResponse {
  failed_transactions: FailedTransaction[];
  total: number;
  page: number;
  limit: number;
}
