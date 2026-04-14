import api from './axiosInstance';
import { PUBLIC_CONFIG } from '../utils/runtimeConfig';

const API_URL = PUBLIC_CONFIG.apiUrl;

export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const logout = () => api.post('/auth/logout');
export const refreshToken = () => api.post('/auth/refresh-token');
export const verifyEmail = (token) => api.get(`/auth/verify-email/${token}`);
export const verifyEmailOtp = (data) => api.post('/auth/verify-email-otp', data);
export const resendOtp = (data) => api.post('/auth/resend-otp', data);
export const forgotPassword = (data) => api.post('/auth/forgot-password', data);
export const verifyResetPasswordOtp = (data) => api.post('/auth/verify-reset-password-otp', data);
export const resetPassword = (token, data) => api.post(`/auth/reset-password/${token}`, data);
export const resetPasswordWithSession = (data) => api.post('/auth/reset-password-session', data);
export const getMe = () => api.get('/auth/me');
export const updateProfile = (data) => api.put('/auth/update-profile', data);
export const changePassword = (data) => api.put('/auth/change-password', data);
export const getGoogleAuthUrl = (redirect = '/') => `${API_URL}/auth/google?redirect=${encodeURIComponent(redirect)}`;
