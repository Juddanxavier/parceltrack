export const LEAD_STATUSES = {
  NEW: 'new',
  CONTACTED: 'contacted',
  QUALIFIED: 'qualified',
  CONVERTED: 'converted',
  REJECTED: 'rejected',
} as const;

export type LeadStatus = typeof LEAD_STATUSES[keyof typeof LEAD_STATUSES];

export interface Lead {
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

export interface LeadComment {
  id: number;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
}

export interface LeadStats {
  totalLeads: number;
  newLeads: number;
  convertedLeads: number;
}
