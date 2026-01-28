import axios from 'axios';

const resolveApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.startsWith('http') && !envUrl.includes('localhost')) {
    return envUrl;
  }

  // If we are on a production-like domain but API is localhost or missing
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // If we are on Render (e.g., office-management-website.onrender.com)
    // Try to guess the backend URL based on the known backend pattern
    if (window.location.hostname.includes('onrender.com')) {
      return 'https://office-management-backend-cp7v.onrender.com/api';
    }
    // Fallback to relative if we can't guess
    return '/api';
  }

  return envUrl || 'http://localhost:5000/api';
};

// API Base URL - connects to shared backend
const API_BASE_URL = resolveApiUrl();
console.log('[API] Initializing with BASE_URL:', API_BASE_URL);

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

export const resolveSocketUrl = () => {
  const apiUrl = resolveApiUrl();
  return apiUrl.replace(/\/api$/, '') || window.location.origin;
};

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    // Use admin_token for HR/Boss portal (separate from employee portal)
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect on login endpoint failures - let the login component handle it
    const isLoginEndpoint = error.config?.url?.includes('/auth/login');

    if (error.response?.status === 401 && !isLoginEndpoint) {
      // Token expired or invalid (but not on login attempts)
      console.log('[API Interceptor] 401 error on non-login endpoint, redirecting to login');
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: any) =>
    api.post('/auth/register', data),
  logout: () =>
    api.post('/auth/logout'),
  getMe: () =>
    api.get('/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/auth/change-password', { currentPassword, newPassword }),
  getPendingRegistrations: () =>
    api.get('/auth/pending-registrations'),
  approveRegistration: (userId: string) =>
    api.put(`/auth/approve/${userId}`),
  rejectRegistration: (userId: string, reason?: string) =>
    api.put(`/auth/reject/${userId}`, { reason }),
  getRegistrationStats: () =>
    api.get('/auth/registration-stats'),
};

// Employee API
export const employeeAPI = {
  getAll: (params?: any) =>
    api.get('/employees', { params }),
  getWithStatus: (params?: any) =>
    api.get('/employees/with-status', { params }),
  getById: (id: string) =>
    api.get(`/employees/${id}`),
  create: (data: any) =>
    api.post('/employees', data),
  update: (id: string, data: any) =>
    api.put(`/employees/${id}`, data),
  delete: (id: string) =>
    api.delete(`/employees/${id}`),
  terminate: (id: string) =>
    api.put(`/employees/${id}/terminate`),
  unterminate: (id: string) =>
    api.put(`/employees/${id}/unterminate`),
  freeze: (id: string, isActive: boolean) =>
    api.put(`/employees/${id}/freeze`, { isActive }),
  getDirectory: () =>
    api.get('/employees/directory'),
  getStats: () =>
    api.get('/employees/stats'),
};

// Department API
export const departmentAPI = {
  getAll: () =>
    api.get('/departments'),
  getById: (id: string) =>
    api.get(`/departments/${id}`),
  create: (data: any) =>
    api.post('/departments', data),
  update: (id: string, data: any) =>
    api.put(`/departments/${id}`, data),
  delete: (id: string) =>
    api.delete(`/departments/${id}`),
};

// Attendance API
export const attendanceAPI = {
  getAll: (params?: any) =>
    api.get('/attendance', { params }),
  getStats: () =>
    api.get('/attendance/stats'),
  getTodayPresence: () =>
    api.get('/attendance/today-presence'),
  update: (id: string, data: any) =>
    api.put(`/attendance/${id}`, data),
};

// Leave API
export const leaveAPI = {
  getAll: (params?: any) =>
    api.get('/leaves', { params }),
  getPending: () =>
    api.get('/leaves/pending'),
  getById: (id: string) =>
    api.get(`/leaves/${id}`),
  approve: (id: string, comments?: string) =>
    api.put(`/leaves/${id}/approve`, { comments }),
  reject: (id: string, reason: string) =>
    api.put(`/leaves/${id}/reject`, { reason }),
  // Leave Policy API
  getPolicies: () =>
    api.get('/leaves/policy'),
  getPolicy: (leaveType: string) =>
    api.get(`/leaves/policy/${leaveType}`),
  createPolicy: (data: any) =>
    api.post('/leaves/policy', data),
  updatePolicy: (id: string, data: any) =>
    api.put(`/leaves/policy/${id}`, data),
  deletePolicy: (id: string) =>
    api.delete(`/leaves/policy/${id}`),
  getUnreadCount: () =>
    api.get('/leaves/unread-count'),
  markAsRead: (id: string) =>
    api.put(`/leaves/${id}/mark-read`),
};

// Notice API
export const noticeAPI = {
  getAll: (params?: any) =>
    api.get('/notices', { params }),
  getById: (id: string) =>
    api.get(`/notices/${id}`),
  create: (data: any) =>
    api.post('/notices', data),
  update: (id: string, data: any) =>
    api.put(`/notices/${id}`, data),
  delete: (id: string) =>
    api.delete(`/notices/${id}`),
};

// Meeting API
export const meetingAPI = {
  getAll: (params?: any) =>
    api.get('/meetings', { params }),
  getUpcoming: () =>
    api.get('/meetings/upcoming'),
  getToday: () =>
    api.get('/meetings/today'),
  getById: (id: string) =>
    api.get(`/meetings/${id}`),
  create: (data: any) =>
    api.post('/meetings', data),
  update: (id: string, data: any) =>
    api.put(`/meetings/${id}`, data),
  respond: (id: string, response: string) =>
    api.put(`/meetings/${id}/respond`, { response }),
  cancel: (id: string) =>
    api.delete(`/meetings/${id}`),
  delete: (id: string) =>
    api.delete(`/meetings/${id}`),
};

// Task API
export const taskAPI = {
  getAll: (params?: any) =>
    api.get('/tasks', { params }),
  getMy: (params?: any) =>
    api.get('/tasks/my', { params }),
  getStats: () =>
    api.get('/tasks/stats'),
  getById: (id: string) =>
    api.get(`/tasks/${id}`),
  create: (data: any) =>
    api.post('/tasks', data),
  update: (id: string, data: any) =>
    api.put(`/tasks/${id}`, data),
  addComment: (id: string, content: string) =>
    api.post(`/tasks/${id}/comment`, { content }),
  updateSubtask: (taskId: string, subtaskId: string, isCompleted: boolean) =>
    api.put(`/tasks/${taskId}/subtask/${subtaskId}`, { isCompleted }),
  uploadImage: (taskId: string, formData: FormData) =>
    api.post(`/tasks/${taskId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  delete: (id: string) =>
    api.delete(`/tasks/${id}`),
};

// Ticket API
export const ticketAPI = {
  getAll: (params?: any) =>
    api.get('/tickets', { params }),
  getStats: () =>
    api.get('/tickets/stats'),
  getById: (id: string) =>
    api.get(`/tickets/${id}`),
  resolve: (id: string, resolutionNotes?: string) =>
    api.put(`/tickets/${id}/resolve`, { resolutionNotes }),
  updateStatus: (id: string, status: string) =>
    api.put(`/tickets/${id}/status`, { status }),
};

// Report API
export const reportAPI = {
  getDashboard: () =>
    api.get('/reports/dashboard'),
  getAttendance: (params?: any) =>
    api.get('/reports/attendance', { params }),
  getLeave: (params?: any) =>
    api.get('/reports/leave', { params }),
  getTasks: (params?: any) =>
    api.get('/reports/tasks', { params }),
  getEmployee: (id: string) =>
    api.get(`/reports/employee/${id}`),
  getDepartment: () =>
    api.get('/reports/department'),
  getAll: (params?: any) =>
    api.get('/reports', { params }),
};

// Recruitment API
export const recruitmentAPI = {
  getAll: (params?: any) =>
    api.get('/recruitment', { params }),
  getStats: () =>
    api.get('/recruitment/stats'),
  getById: (id: string) =>
    api.get(`/recruitment/${id}`),
  create: (data: any) =>
    api.post('/recruitment', data),
  update: (id: string, data: any) =>
    api.put(`/recruitment/${id}`, data),
  updateApplicant: (jobId: string, applicantId: string, data: any) =>
    api.put(`/recruitment/${jobId}/applicant/${applicantId}`, data),
  close: (id: string) =>
    api.delete(`/recruitment/${id}`),
};

// Analytics API (uses report endpoints)
export const analyticsAPI = {
  getDashboard: () =>
    api.get('/reports/dashboard'),
  getAttendanceReport: (params?: any) =>
    api.get('/reports/attendance', { params }),
  getLeaveReport: (params?: any) =>
    api.get('/reports/leave', { params }),
  getTaskReport: (params?: any) =>
    api.get('/reports/tasks', { params }),
  getDepartmentReport: () =>
    api.get('/reports/department'),
  getReportStats: (params?: any) =>
    api.get('/reports/stats', { params }),
};

// Chat API
export const chatAPI = {
  getAll: () =>
    api.get('/chat'),
  getById: (id: string) =>
    api.get(`/chat/${id}`),
  getMessages: (id: string, page?: number) =>
    api.get(`/chat/${id}/messages`, { params: { page } }),
  createPrivate: (userId: string) =>
    api.post('/chat/private', { userId }),
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/chat/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  sendMessage: (chatId: string, content: string, messageType?: string, attachments?: any[]) =>
    api.post(`/chat/${chatId}/message`, { content, messageType, attachments }),
  getChatUsers: () =>
    api.get('/chat/users'),
};

// Message Request API
export const messageRequestAPI = {
  getAll: () =>
    api.get('/message-requests'),
  create: (to: string, message?: string) =>
    api.post('/message-requests', { to, message }),
  accept: (id: string) =>
    api.put(`/message-requests/${id}/accept`),
  reject: (id: string) =>
    api.put(`/message-requests/${id}/reject`),
};

// Settings API
export const settingsAPI = {
  get: () =>
    api.get('/settings'),
  update: (data: { companyName: string }) =>
    api.put('/settings', data),
};

export default api;

