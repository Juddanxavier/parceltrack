import { TrackingDetails } from '../types/tracking';

const API_BASE_URL = '/api/tracking'; // Adjust this based on your backend URL

export class TrackingService {
  async getTracking(trackingNumber: string): Promise<TrackingDetails> {
    const response = await fetch(`${API_BASE_URL}/${trackingNumber}`);
    if (!response.ok) {
      throw new Error('Failed to fetch tracking information');
    }
    return response.json();
  }

  async subscribeToUpdates(trackingNumber: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tracking_number: trackingNumber }),
    });
    if (!response.ok) {
      throw new Error('Failed to subscribe to tracking updates');
    }
  }

  async unsubscribeFromUpdates(trackingNumber: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/unsubscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tracking_number: trackingNumber }),
    });
    if (!response.ok) {
      throw new Error('Failed to unsubscribe from tracking updates');
    }
  }
}
