import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useLeads } from '@/hooks/useLeads';
import { leadsAPI } from '@/services/leadsAPI';
import { toast } from 'sonner';

interface LeadDetailsProps {
  leadId: number;
  onClose: () => void;
  onUpdate: () => void;
}

export function LeadDetails({ leadId, onClose, onUpdate }: LeadDetailsProps) {
  const [comment, setComment] = useState('');
  const queryClient = useQueryClient();
  
  const {
    leads: [lead],
    isLoading: loadingLead,
  } = useLeads({ id: leadId });

  const {
    data: comments,
    isLoading: loadingComments,
  } = useQuery({
    queryKey: ['lead-comments', leadId],
    queryFn: () => leadsAPI.getComments(leadId),
  });

  const addCommentMutation = useMutation({
    mutationFn: (content: string) => leadsAPI.addComment(leadId, content),
    onSuccess: () => {
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['lead-comments', leadId] });
      toast.success('Comment added successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to add comment');
    },
  });

  useEffect(() => {
    if (lead) {
      document.title = `Lead Details - ${lead.name}`;
    }
    return () => {
      document.title = 'Admin Dashboard';
    };
  }, [lead]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">Lead Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            X
          </button>
        </div>

        {loadingLead ? (
          <div className="p-4 text-center">Loading lead details...</div>
        ) : lead ? (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-800">Client Information</h3>
                <p className="text-gray-500">Name: {lead.name}</p>
                <p className="text-gray-500">Email: {lead.email}</p>
                <p className="text-gray-500">Phone: {lead.phone}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Shipment Details</h3>
                <p className="text-gray-500">Origin: {lead.originCountry}</p>
                <p className="text-gray-500">Destination: {lead.destinationCountry}</p>
                <p className="text-gray-500">Parcel Type: {lead.parcelType}</p>
                <p className="text-gray-500">Weight: {lead.weight} kg</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800">Status</h3>
              <Badge className="capitalize">{lead.status}</Badge>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800">Notes</h3>
              <p className="text-gray-500 whitespace-pre-wrap">{lead.notes}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800">Comments</h3>
              <div className="space-y-2">
                {loadingComments ? (
                  <p>Loading comments...</p>
                ) : comments?.length ? (
                  comments.map((comment: any) => (
                    <div key={comment.id} className="border rounded p-2">
                      <p className="text-sm text-gray-800">{comment.content}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(comment.createdAt), 'MMM d, yyyy hh:mm a')} by {comment.user.name}
                      </p>
                    </div>
                  ))
                ) : (
                  <p>No comments yet.</p>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <Textarea
                placeholder="Add a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full mb-4"
              />
              <Button
                onClick={() => addComment(comment)}
                disabled={addingComment || !comment.trim()}
              >
                {addingComment ? 'Adding Comment...' : 'Add Comment'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4 text-center text-red-500">Lead not found.</div>
        )}
      </div>
    </div>
  );
}

