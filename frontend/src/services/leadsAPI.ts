import { LEAD_STATUSES, type LeadStatus } from '../types/leads.ts';
import api from './api';

interface LeadFilters {
  status?: LeadStatus;
  page?: number;
  limit?: number;
}

interface LeadStats {
  totalLeads: number;
  newLeads: number;
  convertedLeads: number;
}

interface LeadComment {
  id: number;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
}

interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  originCountry: string;
  destinationCountry: string;
  parcelType: string;
  weight: number;
  notes: string;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
}

interface LeadsResponse {
  leads: Lead[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const leadsAPI = {
  // Create a new lead
  createLead: async (data: {
    name: string;
    email: string;
    phone: string;
    originCountry: string;
    destinationCountry: string;
    parcelType: string;
    weight: number;
    notes?: string;
    userId?: string; // Optional: for admin creating on behalf of user
  }): Promise<Lead> => {
    const response = await api.post('/leads', data);
    return response.data;
  },

  // Update a lead
  updateLead: async (id: number, data: {
    name?: string;
    email?: string;
    phone?: string;
    originCountry?: string;
    destinationCountry?: string;
    parcelType?: string;
    weight?: number;
    notes?: string;
  }): Promise<Lead> => {
    const response = await api.put(`/leads/${id}`, data);
    return response.data;
  },

  // Delete a lead
  deleteLead: async (id: number): Promise<void> => {
    await api.delete(`/leads/${id}`);
  },

  // Get leads with filters and pagination
  getLeads: async (filters: LeadFilters = {}): Promise<LeadsResponse> => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`/leads${params.toString() ? `?${params}` : ''}`);
    return response.data;
  },

  // Get lead statistics
  getStats: async (): Promise<LeadStats> => {
    const response = await api.get('/leads/stats');
    return response.data;
  },

  // Get single lead details
  getLead: async (id: number): Promise<Lead> => {
    const response = await api.get(`/leads/${id}`);
    return response.data;
  },

  // Update lead status
  updateStatus: async (id: number, status: LeadStatus): Promise<Lead> => {
    const response = await api.patch(`/leads/${id}/status`, { status });
    return response.data;
  },

  // Add comment to lead
  addComment: async (leadId: number, content: string): Promise<LeadComment> => {
    const response = await api.post(`/lead-enhancements/leads/${leadId}/comments`, { content });
    return response.data;
  },

  // Get lead comments
  getComments: async (leadId: number): Promise<LeadComment[]> => {
    const response = await api.get(`/lead-enhancements/leads/${leadId}/comments`);
    return response.data;
  },

  // Convert lead to shipment
  convertToShipment: async (
    leadId: number,
    data: {
      carrier?: string;
      carrierTrackingNumber?: string;
      estimatedDelivery?: string;
    }
  ): Promise<{ shipmentId: string }> => {
    const response = await api.post(`/leads/${leadId}/convert`, data);
    return response.data;
  },

  // Assign lead to admin
  assignLead: async (leadId: number, adminId: string): Promise<Lead> => {
    const response = await api.post(`/leads/${leadId}/assign`, { adminId });
    return response.data;
  },
};
