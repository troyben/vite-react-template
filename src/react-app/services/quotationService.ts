import api from '../api';
import type { ProductData } from '../components/ProductSketch';
import { AxiosResponse } from 'axios';
import { handleServiceError } from '../utils/errorHandling';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface SketchData extends ProductData {}

export interface QuotationItem {
  item: string;              // Required
  description?: string;      // Optional
  quantity: number;          // Required
  price: number;            // Required
  total: number;           // Required
  rate?: number;             // Optional, if applicable
  productSketch?: ProductData; // Optional
}

export interface QuotationFormData {
  id?: number;
  clientId: number;           // Required
  client_name: string;        // Required
  client_email: string;       // Required even if empty
  client_phone?: string;      // Optional
  client_address?: string;    // Optional
  items: QuotationItem[];     // Required
  total_amount: number;       // Required
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'paid'; // Required
  notes?: string;            // Optional
  created_at?: string;       // Will be set by backend
  updated_at?: string;       // Will be set by backend
}

export interface Quotation {
  id: number;
  clientId: number;
  client_name: string;
  client_email: string;
  client_phone?: string;
  client_address?: string;
  items: QuotationItem[];
  total_amount: number;
  rate?: number; // Optional, if applicable
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'paid';
  notes?: string;
  created_at: string;
  updated_at: string;
  createdAt: string;
  updatedAt: string;
}

export const getAllQuotations = async (): Promise<AxiosResponse<ApiResponse<Quotation[]>>> => {
  try {
    return await api.get('/quotations');
  } catch (error) {
    return handleServiceError(error);
  }
};

export const getQuotationById = async (id: number): Promise<AxiosResponse<ApiResponse<Quotation>>> => {
  try {
    return await api.get(`/quotations/${id}`);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const updateQuotation = (
  id: number, 
  quotation: Partial<Quotation>
): Promise<AxiosResponse<ApiResponse<Quotation>>> => {
  return api.put(`/quotations/${id}`, quotation);
};

export const deleteQuotation = (id: number): Promise<AxiosResponse<ApiResponse<void>>> => {
  return api.delete(`/quotations/${id}`);
};

// Add a validation function
export const validateQuotation = (data: QuotationFormData): { isValid: boolean; missingFields: string[] } => {
  const missingFields: string[] = [];

  if (!data.clientId) missingFields.push('clientId');
  if (!data.client_name) missingFields.push('client_name');
  if (data.client_email === undefined) missingFields.push('client_email');
  if (!data.items?.length) missingFields.push('items');
  if (typeof data.total_amount !== 'number') missingFields.push('total_amount');
  if (!data.status) missingFields.push('status');

  // Validate each item
  data.items?.forEach((item, index) => {
    if (!item.item) missingFields.push(`items[${index}].item`);
    if (typeof item.quantity !== 'number') missingFields.push(`items[${index}].quantity`);
    if (typeof item.price !== 'number') missingFields.push(`items[${index}].price`);
    if (typeof item.total !== 'number') missingFields.push(`items[${index}].total`);
  });

  return {
    isValid: missingFields.length === 0,
    missingFields
  };
};

export const createQuotation = async (
  quotationData: Omit<QuotationFormData, 'id'>
): Promise<AxiosResponse<ApiResponse<Quotation>>> => {
  // Validate required fields
  if (!quotationData.clientId || !quotationData.client_name) {
    throw new Error('Client ID and name are required');
  }

  if (!Array.isArray(quotationData.items) || quotationData.items.length === 0) {
    throw new Error('At least one item is required');
  }

  // Ensure all items have required fields
  quotationData.items.forEach((item, index) => {
    if (!item.item || !item.quantity || typeof item.price !== 'number') {
      throw new Error(`Missing required fields in item ${index + 1}`);
    }
  });

  // Add required fields if missing
  const preparedData = {
    ...quotationData,
    status: quotationData.status || 'draft',
    client_email: quotationData.client_email || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    return await api.post('/quotations', preparedData);
  } catch (error) {
    return handleServiceError(error);
  }
};
