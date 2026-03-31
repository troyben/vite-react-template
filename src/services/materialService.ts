import api from '../api';
import { AxiosResponse } from 'axios';
import { handleServiceError } from '../utils/errorHandling';
import type { PaginationParams, PaginatedResponse } from '@/types/pagination';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export type MaterialCategory = 'frame_profile' | 'glass' | 'hardware' | 'accessory';
export type MaterialUnit = 'per_meter' | 'per_sqm' | 'per_piece' | 'per_kg';

export interface Material {
  id: number;
  name: string;
  category: MaterialCategory;
  description?: string;
  unit: MaterialUnit;
  costPrice: number;
  isDefault?: boolean;
  currency?: string;
  properties?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export type CreateMaterialData = Omit<Material, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateMaterialData = Partial<CreateMaterialData>;

type MaterialListParams = PaginationParams & { category?: MaterialCategory };

/**
 * Parse properties from JSON string if the backend returned it serialized.
 */
const parseProperties = (material: any): Material => ({
  ...material,
  costPrice: Number(material.costPrice),
  properties: (() => {
    if (typeof material.properties !== 'string') return material.properties ?? undefined;
    try { return JSON.parse(material.properties); } catch { return undefined; }
  })(),
});

/**
 * Stringify properties for the backend if it's an object.
 */
const serializeProperties = (data: any): any => {
  const payload = { ...data };
  if (payload.properties && typeof payload.properties === 'object') {
    payload.properties = JSON.stringify(payload.properties);
  }
  return payload;
};

export const getAllMaterials = async (
  params?: MaterialListParams
): Promise<AxiosResponse<ApiResponse<PaginatedResponse<Material>>>> => {
  try {
    const response = await api.get('/materials', { params });
    if (response.data?.data?.items) {
      response.data.data.items = response.data.data.items.map(parseProperties);
    }
    return response;
  } catch (error) {
    return handleServiceError(error);
  }
};

export const getMaterialById = async (
  id: number
): Promise<AxiosResponse<ApiResponse<Material>>> => {
  try {
    const response = await api.get(`/materials/${id}`);
    if (response.data?.data) {
      response.data.data = parseProperties(response.data.data);
    }
    return response;
  } catch (error) {
    return handleServiceError(error);
  }
};

export const createMaterial = async (
  data: CreateMaterialData
): Promise<AxiosResponse<ApiResponse<Material>>> => {
  try {
    const response = await api.post('/materials', serializeProperties(data));
    if (response.data?.data) response.data.data = parseProperties(response.data.data);
    return response;
  } catch (error) {
    return handleServiceError(error);
  }
};

export const updateMaterial = async (
  id: number,
  data: UpdateMaterialData
): Promise<AxiosResponse<ApiResponse<Material>>> => {
  try {
    const response = await api.put(`/materials/${id}`, serializeProperties(data));
    if (response.data?.data) response.data.data = parseProperties(response.data.data);
    return response;
  } catch (error) {
    return handleServiceError(error);
  }
};

export const deleteMaterial = async (
  id: number
): Promise<AxiosResponse<ApiResponse<void>>> => {
  try {
    return await api.delete(`/materials/${id}`);
  } catch (error) {
    return handleServiceError(error);
  }
};
