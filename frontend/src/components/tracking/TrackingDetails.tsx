import { useState, useEffect } from 'react';
import { TrackingDetails as ITrackingDetails } from '../../types/tracking';
import { TrackingService } from '../../services/trackingService';
import { format } from 'date-fns';

interface TrackingDetailsProps {
  trackingNumber: string;
}

export function TrackingDetails({ trackingNumber }: TrackingDetailsProps) {
  const [tracking, setTracking] = useState<ITrackingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const trackingService = new TrackingService();

  useEffect(() => {
    const fetchTracking = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await trackingService.getTracking(trackingNumber);
        setTracking(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tracking data');
      } finally {
        setLoading(false);
      }
    };

    fetchTracking();
    
    // Subscribe to updates
    trackingService.subscribeToUpdates(trackingNumber).catch(console.error);

    // Cleanup subscription
    return () => {
      trackingService.unsubscribeFromUpdates(trackingNumber).catch(console.error);
    };
  }, [trackingNumber]);

  if (loading) {
    return <div className="flex items-center justify-center p-4">Loading tracking information...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  if (!tracking) {
    return <div className="p-4">No tracking information available</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Tracking Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">Tracking Number</p>
            <p className="font-medium">{tracking.tracking_number}</p>
          </div>
          <div>
            <p className="text-gray-600">Carrier</p>
            <p className="font-medium">{tracking.carrier}</p>
          </div>
          <div>
            <p className="text-gray-600">Status</p>
            <p className="font-medium">{tracking.status}</p>
          </div>
          {tracking.eta && (
            <div>
              <p className="text-gray-600">Estimated Delivery</p>
              <p className="font-medium">
                {format(new Date(tracking.eta), 'MMM d, yyyy')}
              </p>
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Tracking History</h3>
        <div className="space-y-4">
          {tracking.events.map((event, index) => (
            <div
              key={index}
              className="border-l-2 border-blue-500 pl-4 pb-4 last:pb-0"
            >
              <p className="font-medium">{event.status}</p>
              <p className="text-sm text-gray-600">{event.status_details}</p>
              <div className="mt-1 text-sm text-gray-500">
                <p>
                  {format(new Date(event.status_date), 'MMM d, yyyy h:mm a')}
                </p>
                <p>
                  {event.location.city}, {event.location.state}{' '}
                  {event.location.zip}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
