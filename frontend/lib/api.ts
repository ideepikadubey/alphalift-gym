import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 8000, // Reduced from 15s — fail fast, show errors sooner
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("alphalift_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401
// Rules for forced logout redirect:
//  1. A token must exist (user was logged in)
//  2. Must NOT be a /me revalidation call (handled by auth context)
//  3. Must NOT be a member session — members get legitimate 401s on
//     staff-only routes (hasPermission middleware) and should NOT be
//     kicked out. Their 401s are handled by individual call sites.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const url: string = error.config?.url || "";
      const isMeCheck = url.includes("/auth/me") || url.includes("/auth/member/me");
      const hasToken = !!localStorage.getItem("alphalift_token");
      const isMemberSession = localStorage.getItem("alphalift_user_type") === "member";

      if (hasToken && !isMeCheck && !isMemberSession) {
        // Staff session with unexpected 401 — token expired/invalid
        localStorage.removeItem("alphalift_token");
        localStorage.removeItem("alphalift_user");
        localStorage.removeItem("alphalift_user_type");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ——————————————————————————————
// Auth
// ——————————————————————————————
export const authAPI = {
  login: (data: { username: string; password: string }) =>
    api.post("/auth/login", data),
  memberLogin: (data: { phone: string; password: string }) =>
    api.post("/auth/member/login", data),
  logout: () => api.get("/auth/logout"),
  getMe: () => api.get("/auth/me"),
  getMemberMe: () => api.get("/auth/member/me"),
  memberRegister: (data: object) => api.post("/auth/member/register", data),
  updateMe: (data: object) => api.put("/auth/update/me", data),
  updatePassword: (data: object) => api.put("/auth/update/password", data),
};

// ——————————————————————————————
// Dashboard
// ——————————————————————————————
export const dashboardAPI = {
  getStats: () => api.get("/dashboard"),
  globalSearch: (q: string) => api.get(`/dashboard/search?q=${encodeURIComponent(q)}`),
};

// ——————————————————————————————
// Members
// ——————————————————————————————
export const membersAPI = {
  getAll: (params?: object) => api.get("/members", { params }),
  getOne: (id: string) => api.get(`/members/${id}`),
  create: (data: object) => api.post("/members", data),
  update: (id: string, data: object) => api.put(`/members/${id}`, data),
  delete: (id: string) => api.delete(`/members/${id}`),
  search: (q: string) => api.get(`/members/search?q=${q}`),
  getStats: () => api.get("/members/stats"),
  approve: (id: string) => api.put(`/members/${id}/approve`),
  reject: (id: string) => api.put(`/members/${id}/reject`),
};

// ——————————————————————————————
// Trainers
// ——————————————————————————————
export const trainersAPI = {
  getAll: () => api.get("/trainers"),
  getOne: (id: string) => api.get(`/trainers/${id}`),
  create: (data: object) => api.post("/trainers", data),
  update: (id: string, data: object) => api.put(`/trainers/${id}`, data),
  delete: (id: string) => api.delete(`/trainers/${id}`),
  getStats: () => api.get("/trainers/stats"),
  assignMember: (trainerId: string, data: object) =>
    api.post(`/trainers/${trainerId}/assign-member`, data),
  getAssignedMembers: (id: string) => api.get(`/trainers/${id}/members`),
  getAvailability: (id: string) => api.get(`/trainers/${id}/availability`),
  updateAvailability: (id: string, data: object) =>
    api.put(`/trainers/${id}/availability`, data),
  rate: (id: string, rating: number) => api.post(`/trainers/${id}/rate`, { rating }),
};

// ——————————————————————————————
// Attendance
// ——————————————————————————————
export const attendanceAPI = {
  checkIn: (data: object) => api.post("/attendance/checkin", data),
  checkOut: (data: object) => api.post("/attendance/checkout", data),
  getToday: () => api.get("/attendance/today"),
  getAll: (params?: object) => api.get("/attendance", { params }),
  getStats: () => api.get("/attendance/stats"),
  getMemberAttendance: (memberId: string) =>
    api.get(`/attendance/member/${memberId}`),
  qrScan: (data: object) => api.post("/attendance/qr-scan", data),
  getLiveOccupancy: () => api.get("/attendance/occupancy"),
};

// ——————————————————————————————
// Payments
// ——————————————————————————————
export const paymentsAPI = {
  getAll: (params?: object) => api.get("/payments", { params }),
  getOne: (id: string) => api.get(`/payments/${id}`),
  create: (data: object) => api.post("/payments", data),
  process: (data: object) => api.post("/payments/process", data),
  getPending: () => api.get("/payments/pending"),
  getRevenueStats: () => api.get("/payments/revenue/stats"),
  getMemberPayments: (memberId: string) =>
    api.get(`/payments/member/${memberId}`),
  refund: (id: string) => api.post(`/payments/${id}`),
};

// ——————————————————————————————
// Memberships
// ——————————————————————————————
export const membershipsAPI = {
  getAll: (params?: object) => api.get("/memberships", { params }),
  getOne: (id: string) => api.get(`/memberships/${id}`),
  create: (data: object) => api.post("/memberships", data),
  update: (id: string, data: object) => api.put(`/memberships/${id}`, data),
  cancel: (id: string, data: object) => api.post(`/memberships/${id}/cancel`, data),
  freeze: (id: string, data: object) => api.post(`/memberships/${id}/freeze`, data),
  renew: (id: string, data: object) => api.post(`/memberships/${id}/renew`, data),
  getMemberMemberships: (memberId: string) =>
    api.get(`/memberships/member/${memberId}`),
  getExpiring: () => api.get("/memberships/expiring"),
  getStats: () => api.get("/memberships/stats"),
  getMyMembership: () => api.get("/memberships/my-membership"),
};

// ——————————————————————————————
// Plans
// ——————————————————————————————
export const plansAPI = {
  getAll: (params?: object) => api.get("/plans", { params }),
  getOne: (id: string) => api.get(`/plans/${id}`),
  create: (data: object) => api.post("/plans", data),
  update: (id: string, data: object) => api.put(`/plans/${id}`, data),
  delete: (id: string) => api.delete(`/plans/${id}`),
};

// ——————————————————————————————
// Leads
// ——————————————————————————————
export const leadsAPI = {
  getAll: (params?: object) => api.get("/leads", { params }),
  getOne: (id: string) => api.get(`/leads/${id}`),
  create: (data: object) => api.post("/leads", data),
  update: (id: string, data: object) => api.put(`/leads/${id}`, data),
  delete: (id: string) => api.delete(`/leads/${id}`),
};

// ——————————————————————————————
// Workouts
// ——————————————————————————————
export const workoutsAPI = {
  getAll: () => api.get("/workouts"),
  getOne: (id: string) => api.get(`/workouts/${id}`),
  create: (data: object) => api.post("/workouts", data),
  update: (id: string, data: object) => api.put(`/workouts/${id}`, data),
  delete: (id: string) => api.delete(`/workouts/${id}`),
  getTemplates: () => api.get("/workouts/templates"),
  assign: (id: string, data: object) => api.post(`/workouts/${id}/assign`, data),
  getMemberWorkouts: (memberId: string) =>
    api.get(`/workouts/member/${memberId}`),
  getMyWorkout: () => api.get("/workouts/my-workout"),
};

// ——————————————————————————————
// Diets
// ——————————————————————————————
export const dietsAPI = {
  getAll: () => api.get("/diets"),
  getOne: (id: string) => api.get(`/diets/${id}`),
  create: (data: object) => api.post("/diets", data),
  update: (id: string, data: object) => api.put(`/diets/${id}`, data),
  delete: (id: string) => api.delete(`/diets/${id}`),
  getTemplates: () => api.get("/diets/templates"),
  assign: (id: string, data: object) => api.post(`/diets/${id}/assign`, data),
  getMemberDiets: (memberId: string) => api.get(`/diets/member/${memberId}`),
  getMyDiet: () => api.get("/diets/my-diet"),
};

// ——————————————————————————————
// Notifications
// ——————————————————————————————
export const notificationsAPI = {
  getAll: () => api.get("/notifications"),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put("/notifications/read-all"),
};

// ——————————————————————————————
// Announcements
// ——————————————————————————————
export const announcementsAPI = {
  create: (data: object) => api.post("/announcements", data),
  getAll: () => api.get("/announcements"),
  delete: (id: string) => api.delete(`/announcements/${id}`),
};

// ——————————————————————————————
// Payment Gateway (Razorpay — member-facing)
// ——————————————————————————————
export const paymentGatewayAPI = {
  createOrder: (data: object) => api.post("/payment/create-order", data),
  verifyPayment: (data: object) => api.post("/payment/verify", data),
  getStatus: (orderId: string) => api.get(`/payment/status/${orderId}`),
};


