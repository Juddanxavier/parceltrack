export interface TrackingLocation {
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface TrackingEvent {
  status: string;
  status_details: string;
  status_date: string;
  location: TrackingLocation;
}

export interface TrackingDetails {
  tracking_number: string;
  carrier: string;
  status: string;
  eta: string | null;
  delivery_date: string | null;
  events: TrackingEvent[];
}

export type TrackingStatus = 
  | 'UNKNOWN'
  | 'PRE_TRANSIT' 
  | 'TRANSIT'
  | 'DELIVERED'
  | 'FAILURE'
  | 'RETURNED';
