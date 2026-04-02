import api from '../api';
import { AxiosResponse } from 'axios';
import { handleServiceError } from '../utils/errorHandling';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface SystemSetting {
  id: number;
  key: string;
  value: string;
  description?: string;
}

export const getAllSystemSettings = async (): Promise<AxiosResponse<ApiResponse<SystemSetting[]>>> => {
  try {
    return await api.get('/system-settings');
  } catch (error) {
    return handleServiceError(error);
  }
};

export const updateSystemSettings = async (
  settings: Array<{ key: string; value: string }>
): Promise<AxiosResponse<ApiResponse<SystemSetting[]>>> => {
  try {
    return await api.put('/system-settings', { settings });
  } catch (error) {
    return handleServiceError(error);
  }
};
