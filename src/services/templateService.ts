import api from '../api';
import { AxiosResponse } from 'axios';
import { handleServiceError } from '../utils/errorHandling';
import type { PaginationParams, PaginatedResponse } from '@/types/pagination';
import type { ProductData } from '@/components/product-sketch/types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface SketchTemplate {
  id: number;
  name: string;
  description?: string;
  sketchData: ProductData;
  thumbnail?: string;
  createdBy: number;
  isMaster: boolean;
  creator?: { id: number; name: string };
  createdAt: string;
  updatedAt: string;
}

type TemplateListParams = PaginationParams & { type?: string };

/**
 * Parse sketchData from JSON string if the backend returned it serialized.
 */
const parseSketchData = (template: any): SketchTemplate => ({
  ...template,
  sketchData:
    typeof template.sketchData === 'string'
      ? JSON.parse(template.sketchData)
      : template.sketchData,
});

export const getAllTemplates = async (
  params?: TemplateListParams
): Promise<AxiosResponse<ApiResponse<PaginatedResponse<SketchTemplate>>>> => {
  try {
    const response = await api.get('/templates', { params });
    // Parse sketchData for every item in the list
    if (response.data?.data?.items) {
      response.data.data.items = response.data.data.items.map(parseSketchData);
    }
    return response;
  } catch (error) {
    return handleServiceError(error);
  }
};

export const getTemplateById = async (
  id: number
): Promise<AxiosResponse<ApiResponse<SketchTemplate>>> => {
  try {
    const response = await api.get(`/templates/${id}`);
    if (response.data?.data) {
      response.data.data = parseSketchData(response.data.data);
    }
    return response;
  } catch (error) {
    return handleServiceError(error);
  }
};

export const createTemplate = async (
  data: { name: string; description?: string; sketchData: ProductData; thumbnail?: string }
): Promise<AxiosResponse<ApiResponse<SketchTemplate>>> => {
  try {
    return await api.post('/templates', {
      ...data,
      sketchData: JSON.stringify(data.sketchData),
    });
  } catch (error) {
    return handleServiceError(error);
  }
};

export const updateTemplate = async (
  id: number,
  data: Partial<{ name: string; description: string; sketchData: ProductData; thumbnail: string }>
): Promise<AxiosResponse<ApiResponse<SketchTemplate>>> => {
  try {
    const payload: any = { ...data };
    if (data.sketchData) {
      payload.sketchData = JSON.stringify(data.sketchData);
    }
    return await api.put(`/templates/${id}`, payload);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const deleteTemplate = async (
  id: number
): Promise<AxiosResponse<ApiResponse<void>>> => {
  try {
    return await api.delete(`/templates/${id}`);
  } catch (error) {
    return handleServiceError(error);
  }
};
