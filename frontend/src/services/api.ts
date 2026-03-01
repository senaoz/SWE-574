import axios, { AxiosResponse } from 'axios';
import { AuthResponse, User, Service, ServiceListResponse, TimeBankResponse, TimeBankTransaction, LoginForm, RegisterForm, ServiceForm, Comment, CommentListResponse, CommentForm, JoinRequest, JoinRequestListResponse, JoinRequestForm, Transaction, TransactionListResponse, TransactionForm, ChatRoom, ChatRoomListResponse, ChatRoomForm, Message, MessageListResponse, MessageForm, UserSettings, PasswordChangeForm, AccountDeletionForm, BadgeSummary, Rating, RatingListResponse, RatingForm, ForumDiscussion, ForumDiscussionListResponse, ForumDiscussionForm, ForumEvent, ForumEventListResponse, ForumEventForm, ForumComment, ForumCommentListResponse } from '@/types';

// Use relative URL /api to leverage nginx proxy, or absolute URL if provided via env var
// This ensures requests go through the same HTTPS domain as the frontend
// Normalize the URL: remove trailing slash and enforce HTTPS for production URLs
const getApiBaseUrl = () => {
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl) {
    let url = envUrl.trim();
    // Remove trailing slash to avoid double slashes in path construction
    if (url.endsWith('/')) {
      url = url.slice(0, -1);
    }
    // Only force HTTPS for production URLs (not localhost)
    const isLocalhost = url.includes('localhost') || url.includes('127.0.0.1');
    if (url.startsWith('http://') && !isLocalhost) {
      console.warn('VITE_API_URL uses HTTP for production. Forcing HTTPS.');
      url = url.replace('http://', 'https://');
    }
    return url;
  }
  return "/api";
};

const API_BASE_URL = getApiBaseUrl();

// Log the API base URL in development to help debug
if ((import.meta as any).env?.DEV) {
  console.log('API Base URL:', API_BASE_URL);
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect on login/register endpoints
    const isAuthEndpoint = error.config?.url?.includes('/auth/');
    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('access_token');
      window.location.href = '/?login=true';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (data: LoginForm): Promise<AxiosResponse<AuthResponse>> =>
    api.post('/auth/login', data),
  
  register: (data: RegisterForm): Promise<AxiosResponse<AuthResponse>> =>
    api.post('/auth/register', data),
  
  getOAuthUrl: (provider: 'google' | 'github'): Promise<AxiosResponse<{ auth_url: string }>> =>
    api.get(`/auth/oauth/${provider}`),
  
  oauthCallback: (provider: 'google' | 'github', code: string): Promise<AxiosResponse<AuthResponse>> =>
    api.post(`/auth/oauth/${provider}/callback`, { code }),
  
  getMe: (): Promise<AxiosResponse<User>> =>
    api.get('/auth/me'),
};

// Users API
export const usersApi = {
  getProfile: (): Promise<AxiosResponse<User>> =>
    api.get('/users/profile'),
  
  updateProfile: (data: Partial<User>): Promise<AxiosResponse<User>> =>
    api.put('/users/profile', data),
  
  getTimeBank: (): Promise<AxiosResponse<TimeBankResponse>> =>
    api.get('/users/timebank'),
  
  getAllTimeBankTransactions: (page?: number, limit?: number): Promise<AxiosResponse<{ transactions: TimeBankTransaction[]; total: number; page: number; limit: number }>> =>
    api.get('/users/admin/timebank-transactions', { params: { page, limit } }),
  
  getUserById: (id: string): Promise<AxiosResponse<User>> =>
    api.get(`/users/${id}`),
  
  getSettings: (): Promise<AxiosResponse<User>> =>
    api.get('/users/settings'),
  
  updateSettings: (data: Partial<UserSettings>): Promise<AxiosResponse<User>> =>
    api.put('/users/settings', data),
  
  changePassword: (data: PasswordChangeForm): Promise<AxiosResponse<{ message: string }>> =>
    api.post('/users/change-password', data),
  
  deleteAccount: (data: AccountDeletionForm): Promise<AxiosResponse<{ message: string }>> =>
    api.post('/users/account/delete', data),

  getBadges: (): Promise<AxiosResponse<BadgeSummary>> =>
    api.get('/users/badges'),

  getUserBadges: (userId: string): Promise<AxiosResponse<BadgeSummary>> =>
    api.get(`/users/${userId}/badges`),

  getAvailableInterests: (): Promise<AxiosResponse<string[]>> =>
    api.get('/users/available-interests'),
};

// Services API
export const servicesApi = {
  getServices: (params?: {
    page?: number;
    limit?: number;
    service_type?: string;
    category?: string;
    tags?: string;
    status?: string;
    latitude?: number;
    longitude?: number;
    radius?: number;
    user_id?: string;
  }): Promise<AxiosResponse<ServiceListResponse>> =>
    api.get('/services/', { params }),
  
  getService: (id: string): Promise<AxiosResponse<Service>> =>
    api.get(`/services/${id}`),
  
  createService: (data: ServiceForm): Promise<AxiosResponse<Service>> =>
    api.post('/services/', data),
  
  updateService: (id: string, data: Partial<ServiceForm>): Promise<AxiosResponse<Service>> =>
    api.put(`/services/${id}`, data),
  
  deleteService: (id: string): Promise<AxiosResponse<{ message: string }>> =>
    api.delete(`/services/${id}`),
  
  cancelService: (id: string): Promise<AxiosResponse<{ message: string }>> =>
    api.post(`/services/${id}/cancel`),
  
  matchService: (id: string): Promise<AxiosResponse<{ message: string }>> =>
    api.post(`/services/${id}/match`),
  
  completeService: (id: string): Promise<AxiosResponse<{ message: string }>> =>
    api.post(`/services/${id}/complete`),
  
  confirmServiceCompletion: (id: string): Promise<AxiosResponse<Service>> =>
    api.post(`/services/${id}/confirm-completion`),

  saveService: (id: string): Promise<AxiosResponse<{ message: string }>> =>
    api.post(`/services/${id}/save`),

  unsaveService: (id: string): Promise<AxiosResponse<{ message: string }>> =>
    api.delete(`/services/${id}/save`),

  getSavedServices: (page?: number, limit?: number): Promise<AxiosResponse<ServiceListResponse>> =>
    api.get('/services/saved', { params: { page, limit } }),

  getSavedServiceIds: (): Promise<AxiosResponse<{ service_ids: string[] }>> =>
    api.get('/services/saved/ids'),
};

// Comments API
export const commentsApi = {
  getServiceComments: (serviceId: string, page?: number, limit?: number): Promise<AxiosResponse<CommentListResponse>> =>
    api.get(`/comments/service/${serviceId}`, { params: { page, limit } }),
  
  createComment: (data: CommentForm): Promise<AxiosResponse<Comment>> =>
    api.post('/comments/', data),
  
  getComment: (id: string): Promise<AxiosResponse<Comment>> =>
    api.get(`/comments/${id}`),
  
  updateComment: (id: string, data: { content: string }): Promise<AxiosResponse<Comment>> =>
    api.put(`/comments/${id}`, data),
  
  deleteComment: (id: string): Promise<AxiosResponse<{ message: string }>> =>
    api.delete(`/comments/${id}`),
  
  getUserComments: (userId: string, page?: number, limit?: number): Promise<AxiosResponse<CommentListResponse>> =>
    api.get(`/comments/user/${userId}`, { params: { page, limit } }),
};

// Join Requests API
export const joinRequestsApi = {
  createJoinRequest: (data: JoinRequestForm): Promise<AxiosResponse<JoinRequest>> =>
    api.post('/join-requests/', data),
  
  getServiceRequests: (serviceId: string, page?: number, limit?: number): Promise<AxiosResponse<JoinRequestListResponse>> =>
    api.get(`/join-requests/service/${serviceId}`, { params: { page, limit } }),
  
  getMyRequests: (page?: number, limit?: number, status?: string): Promise<AxiosResponse<JoinRequestListResponse>> =>
    api.get('/join-requests/my-requests', { params: { page, limit, status } }),
  
  updateRequestStatus: (requestId: string, data: { status: string; admin_message?: string }): Promise<AxiosResponse<JoinRequest>> =>
    api.put(`/join-requests/${requestId}`, data),
  
  getRequest: (requestId: string): Promise<AxiosResponse<JoinRequest>> =>
    api.get(`/join-requests/${requestId}`),
  
  cancelRequest: (requestId: string): Promise<AxiosResponse<JoinRequest>> =>
    api.post(`/join-requests/${requestId}/cancel`),
  
  getPendingRequestForService: (serviceId: string): Promise<AxiosResponse<JoinRequest>> =>
    api.get(`/join-requests/service/${serviceId}/pending`),
};

// Transactions API
export const transactionsApi = {
  createTransaction: (data: TransactionForm): Promise<AxiosResponse<Transaction>> =>
    api.post('/transactions/', data),
  
  getMyTransactions: (page?: number, limit?: number): Promise<AxiosResponse<TransactionListResponse>> =>
    api.get('/transactions/my-transactions', { params: { page, limit } }),
  
  getServiceTransactions: (serviceId: string, page?: number, limit?: number): Promise<AxiosResponse<TransactionListResponse>> =>
    api.get(`/transactions/service/${serviceId}`, { params: { page, limit } }),
  
  updateTransaction: (transactionId: string, data: { status?: string; description?: string }): Promise<AxiosResponse<Transaction>> =>
    api.put(`/transactions/${transactionId}`, data),
  
  completeTransaction: (transactionId: string, completionNotes?: string): Promise<AxiosResponse<Transaction>> =>
    api.post(`/transactions/${transactionId}/complete`, { completion_notes: completionNotes }),
  
  confirmTransactionCompletion: (transactionId: string): Promise<AxiosResponse<Transaction>> =>
    api.post(`/transactions/${transactionId}/confirm-completion`),
  
  getTransaction: (transactionId: string): Promise<AxiosResponse<Transaction>> =>
    api.get(`/transactions/${transactionId}`),
};

// Chat API
export const chatApi = {
  // Chat Rooms
  createChatRoom: (data: ChatRoomForm): Promise<AxiosResponse<ChatRoom>> =>
    api.post('/chat/rooms', data),
  
  getMyChatRooms: (page?: number, limit?: number): Promise<AxiosResponse<ChatRoomListResponse>> =>
    api.get('/chat/rooms', { params: { page, limit } }),
  
  getChatRoom: (roomId: string): Promise<AxiosResponse<ChatRoom>> =>
    api.get(`/chat/rooms/${roomId}`),
  
  updateChatRoom: (roomId: string, data: { name?: string; description?: string; is_active?: boolean }): Promise<AxiosResponse<ChatRoom>> =>
    api.put(`/chat/rooms/${roomId}`, data),
  
  createTransactionChatRoom: (transactionId: string): Promise<AxiosResponse<ChatRoom>> =>
    api.post(`/chat/rooms/transaction/${transactionId}`),
  
  // Messages
  sendMessage: (data: MessageForm): Promise<AxiosResponse<Message>> =>
    api.post('/chat/messages', data),
  
  getRoomMessages: (roomId: string, page?: number, limit?: number): Promise<AxiosResponse<MessageListResponse>> =>
    api.get(`/chat/rooms/${roomId}/messages`, { params: { page, limit } }),
  
  getMessage: (messageId: string): Promise<AxiosResponse<Message>> =>
    api.get(`/chat/messages/${messageId}`),
  
  updateMessage: (messageId: string, data: { content?: string }): Promise<AxiosResponse<Message>> =>
    api.put(`/chat/messages/${messageId}`, data),
  
  deleteMessage: (messageId: string): Promise<AxiosResponse<{ message: string }>> =>
    api.delete(`/chat/messages/${messageId}`),
};

// Ratings API
export const ratingsApi = {
  createRating: (data: RatingForm): Promise<AxiosResponse<Rating>> =>
    api.post('/ratings/', data),

  getUserRatings: (userId: string, page?: number, limit?: number): Promise<AxiosResponse<RatingListResponse>> =>
    api.get(`/ratings/user/${userId}`, { params: { page, limit } }),

  getTransactionRatings: (transactionId: string): Promise<AxiosResponse<Rating[]>> =>
    api.get(`/ratings/transaction/${transactionId}`),
};

// Forum API
export const forumApi = {
  // Discussions
  getDiscussions: (params?: { page?: number; limit?: number; tag?: string; q?: string }): Promise<AxiosResponse<ForumDiscussionListResponse>> =>
    api.get('/forum/discussions', { params }),

  getDiscussion: (id: string): Promise<AxiosResponse<ForumDiscussion>> =>
    api.get(`/forum/discussions/${id}`),

  createDiscussion: (data: ForumDiscussionForm): Promise<AxiosResponse<ForumDiscussion>> =>
    api.post('/forum/discussions', data),

  updateDiscussion: (id: string, data: Partial<ForumDiscussionForm>): Promise<AxiosResponse<ForumDiscussion>> =>
    api.put(`/forum/discussions/${id}`, data),

  deleteDiscussion: (id: string): Promise<AxiosResponse<{ message: string }>> =>
    api.delete(`/forum/discussions/${id}`),

  // Events
  getEvents: (params?: { page?: number; limit?: number; tag?: string; q?: string; has_location?: boolean }): Promise<AxiosResponse<ForumEventListResponse>> =>
    api.get('/forum/events', { params }),

  getEvent: (id: string): Promise<AxiosResponse<ForumEvent>> =>
    api.get(`/forum/events/${id}`),

  createEvent: (data: ForumEventForm): Promise<AxiosResponse<ForumEvent>> =>
    api.post('/forum/events', data),

  updateEvent: (id: string, data: Partial<ForumEventForm>): Promise<AxiosResponse<ForumEvent>> =>
    api.put(`/forum/events/${id}`, data),

  deleteEvent: (id: string): Promise<AxiosResponse<{ message: string }>> =>
    api.delete(`/forum/events/${id}`),

  getLinkedEvents: (serviceId: string): Promise<AxiosResponse<ForumEventListResponse>> =>
    api.get(`/forum/services/${serviceId}/linked-events`),

  // Attendance
  attendEvent: (eventId: string): Promise<AxiosResponse<ForumEvent>> =>
    api.post(`/forum/events/${eventId}/attend`),

  unattendEvent: (eventId: string): Promise<AxiosResponse<ForumEvent>> =>
    api.delete(`/forum/events/${eventId}/attend`),

  getEventAttendees: (eventId: string): Promise<AxiosResponse<{ _id: string; username: string; full_name?: string; profile_picture?: string }[]>> =>
    api.get(`/forum/events/${eventId}/attendees`),

  // Comments
  getComments: (targetType: string, targetId: string, params?: { page?: number; limit?: number }): Promise<AxiosResponse<ForumCommentListResponse>> =>
    api.get('/forum/comments', { params: { target_type: targetType, target_id: targetId, ...params } }),

  createComment: (data: { target_type: string; target_id: string; content: string }): Promise<AxiosResponse<ForumComment>> =>
    api.post('/forum/comments', data),

  updateComment: (id: string, data: { content: string }): Promise<AxiosResponse<ForumComment>> =>
    api.put(`/forum/comments/${id}`, data),

  deleteComment: (id: string): Promise<AxiosResponse<{ message: string }>> =>
    api.delete(`/forum/comments/${id}`),
};

export default api;
