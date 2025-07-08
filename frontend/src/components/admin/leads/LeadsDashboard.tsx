import { useState } from 'react';
import { useLeads } from '@/hooks/useLeads';
import { LEAD_STATUSES, type Lead, type LeadStatus } from '../../../types/leads.ts';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LeadDetails } from './LeadDetails';
import { format } from 'date-fns';

const statusColors = {
  [LEAD_STATUSES.NEW]: 'bg-blue-100 text-blue-800',
  [LEAD_STATUSES.CONTACTED]: 'bg-yellow-100 text-yellow-800',
  [LEAD_STATUSES.QUALIFIED]: 'bg-purple-100 text-purple-800',
  [LEAD_STATUSES.CONVERTED]: 'bg-green-100 text-green-800',
  [LEAD_STATUSES.REJECTED]: 'bg-red-100 text-red-800',
};

export function LeadsDashboard() {
  const queryClient = useQueryClient();
  // Using sonner toast directly
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  const {
    leads,
    pagination,
    isLoading,
    error,
    updateStatus,
    isUpdatingStatus,
  } = useLeads({
    status: selectedStatus === 'all' ? undefined : selectedStatus as LeadStatus,
    page,
    limit: 10,
  });

  const filteredLeads = leads.filter((lead) =>
    searchTerm
      ? lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex space-x-4">
          <Input
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value={LEAD_STATUSES.NEW}>New</SelectItem>
              <SelectItem value={LEAD_STATUSES.CONTACTED}>Contacted</SelectItem>
              <SelectItem value={LEAD_STATUSES.QUALIFIED}>Qualified</SelectItem>
              <SelectItem value={LEAD_STATUSES.CONVERTED}>Converted</SelectItem>
              <SelectItem value={LEAD_STATUSES.REJECTED}>Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading leads...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">
          Error loading leads. Please try again.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Origin</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads?.map((lead: any) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.name}</TableCell>
                  <TableCell>{lead.email}</TableCell>
                  <TableCell>{lead.originCountry}</TableCell>
                  <TableCell>{lead.destinationCountry}</TableCell>
                  <TableCell>
                    <Badge
                      className={`${
                        statusColors[lead.status as keyof typeof statusColors]
                      }`}
                    >
                      {lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(lead.createdAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedLead(lead.id)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex justify-between items-center p-4">
            <div className="text-sm text-gray-600">
              {pagination?.total || 0} total leads
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page === pagination?.totalPages}
                onClick={() =>
                  setPage((p) => Math.min(pagination?.totalPages || p, p + 1))
                }
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {selectedLead && (
        <LeadDetails
          leadId={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={() => refetch()}
        />
      )}
    </div>
  );
}
