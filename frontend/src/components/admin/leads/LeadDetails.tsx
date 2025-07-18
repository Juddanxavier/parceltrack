import { useState } from 'react';
import { useLeads } from '@/hooks/useLeads';
import { LEAD_STATUSES, type LeadStatus } from '@/types/leads';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface LeadDetailsProps {
  leadId: number;
  onClose: () => void;
  onUpdate?: () => void;
}

const statusColors = {
  [LEAD_STATUSES.NEW]: 'bg-blue-100 text-blue-800',
  [LEAD_STATUSES.CONTACTED]: 'bg-yellow-100 text-yellow-800',
  [LEAD_STATUSES.QUALIFIED]: 'bg-purple-100 text-purple-800',
  [LEAD_STATUSES.CONVERTED]: 'bg-green-100 text-green-800',
  [LEAD_STATUSES.REJECTED]: 'bg-red-100 text-red-800',
};

export function LeadDetails({ leadId, onClose, onUpdate }: LeadDetailsProps) {
  const { getSingleLead, updateStatus } = useLeads();
  const { data: lead, isLoading } = getSingleLead(leadId);
  const [status, setStatus] = useState<LeadStatus | undefined>(lead?.status);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: LeadStatus) => {
    try {
      setIsUpdating(true);
      await updateStatus(leadId, newStatus);
      setStatus(newStatus);
      toast.success('Lead status updated successfully');
      onUpdate?.();
    } catch (error) {
      toast.error('Failed to update lead status');
      console.error('Failed to update lead status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading || !lead) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Lead Details</DialogTitle>
      </DialogHeader>

      <div className="space-y-6 py-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">{lead.name}</h3>
            <p className="text-sm text-muted-foreground">{lead.email}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={statusColors[status || lead.status]}>
              {status || lead.status}
            </Badge>
            <Select
              value={status || lead.status}
              onValueChange={(value) => handleStatusChange(value as LeadStatus)}
              disabled={isUpdating}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Change status" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(LEAD_STATUSES).map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-1">Phone</h4>
            <p>{lead.phone}</p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Weight</h4>
            <p>{lead.weight} kg</p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Origin Country</h4>
            <p>{lead.originCountry}</p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Destination Country</h4>
            <p>{lead.destinationCountry}</p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Parcel Type</h4>
            <p>{lead.parcelType}</p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Created At</h4>
            <p>{format(new Date(lead.createdAt), 'PPP')}</p>
          </div>
        </div>

        {lead.notes && (
          <div>
            <h4 className="font-medium mb-1">Notes</h4>
            <p className="whitespace-pre-wrap">{lead.notes}</p>
          </div>
        )}

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </>
  );
}
