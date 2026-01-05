import axios from 'axios';

// API Base URL - connects to shared backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

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
    if (error.response?.status === 401) {
      // Token expired or invalid
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
  getById: (id: string) =>
    api.get(`/employees/${id}`),
  create: (data: any) =>
    api.post('/employees', data),
  update: (id: string, data: any) =>
    api.put(`/employees/${id}`, data),
  delete: (id: string) =>
    api.delete(`/employees/${id}`),
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
};

// Task API
export const taskAPI = {
  getAll: (params?: any) =>
    api.get('/tasks', { params }),
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
  delete: (id: string) =>
    api.delete(`/tasks/${id}`),
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
  sendMessage: (chatId: string, content: string, messageType?: string) =>
    api.post(`/chat/${chatId}/message`, { content, messageType }),
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

export default api;

