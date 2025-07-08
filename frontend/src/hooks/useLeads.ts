import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsAPI } from '../services/leadsAPI.ts';
import { LEAD_STATUSES, type LeadStatus } from '../types/leads.ts';

export function useLeads(filters: {
  status?: LeadStatus;
  page?: number;
  limit?: number;
} = {}) {
  const queryClient = useQueryClient();

  // Query for leads list
  const {
    data: leadsData,
    isLoading: isLoadingLeads,
    error: leadsError,
    failureCount: leadsFailureCount,
  } = useQuery({
    queryKey: ['leads', filters],
    queryFn: () => leadsAPI.getLeads(filters),
  });

  // Query for single lead
  const getSingleLead = (leadId: number) => {
    return useQuery({
      queryKey: ['leads', leadId],
      queryFn: () => leadsAPI.getLead(leadId),
      enabled: !!leadId,
    });
  };

  // Query for lead comments
  const getComments = (leadId: number) => {
    return useQuery({
      queryKey: ['leads', leadId, 'comments'],
      queryFn: () => leadsAPI.getComments(leadId),
      enabled: !!leadId,
    });
  };

  // Query for lead statistics
  const {
    data: stats,
    isLoading: isLoadingStats,
    error: statsError,
  } = useQuery({
    queryKey: ['leads-stats'],
    queryFn: () => leadsAPI.getStats(),
  });

  // Create lead mutation
  const createLeadMutation = useMutation({
    mutationFn: (data: Parameters<typeof leadsAPI.createLead>[0]) =>
      leadsAPI.createLead(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads-stats'] });
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: (variables: { id: number; status: LeadStatus }) =>
      leadsAPI.updateStatus(variables.id, variables.status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads-stats'] });
    },
  });

  // Convert to shipment mutation
  const convertToShipmentMutation = useMutation({
    mutationFn: (variables: {
      leadId: number;
      data: Parameters<typeof leadsAPI.convertToShipment>[1];
    }) => leadsAPI.convertToShipment(variables.leadId, variables.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads-stats'] });
    },
  });

  // Comment mutation
  const addCommentMutation = useMutation({
    mutationFn: (variables: { leadId: number; content: string }) =>
      leadsAPI.addComment(variables.leadId, variables.content),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads', variables.leadId, 'comments'] });
    },
  });

  // Update lead mutation
  const updateLeadMutation = useMutation({
    mutationFn: (variables: { id: number; data: Parameters<typeof leadsAPI.updateLead>[1] }) =>
      leadsAPI.updateLead(variables.id, variables.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  // Delete lead mutation
  const deleteLeadMutation = useMutation({
    mutationFn: (id: number) => leadsAPI.deleteLead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads-stats'] });
    },
  });

  // Assign lead mutation
  const assignLeadMutation = useMutation({
    mutationFn: (variables: { leadId: number; adminId: string }) =>
      leadsAPI.assignLead(variables.leadId, variables.adminId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  return {
    // Queries
    leads: leadsData?.leads || [],
    pagination: leadsData?.pagination,
    stats,
    isLoading: isLoadingLeads || isLoadingStats,
    error: leadsError ? 
      leadsError instanceof Error ? leadsError.message :
      typeof leadsError === 'string' ? leadsError :
      'Backend server is not running' : 
      statsError ? 'Error loading stats' : null,
    isConnectionError: leadsFailureCount > 0,

    // Single lead query hook
    getSingleLead,

    // Comments query hook
    getComments,

    // Status and assignment mutations
    updateStatus: updateStatusMutation.mutate,
    isUpdatingStatus: updateStatusMutation.isPending,
    assignLead: assignLeadMutation.mutate,
    isAssigning: assignLeadMutation.isPending,

    // CRUD mutations
    createLead: createLeadMutation.mutate,
    isCreating: createLeadMutation.isPending,
    updateLead: updateLeadMutation.mutate,
    isUpdating: updateLeadMutation.isPending,
    deleteLead: deleteLeadMutation.mutate,
    isDeleting: deleteLeadMutation.isPending,

    // Conversion mutation
    convertToShipment: convertToShipmentMutation.mutate,
    isConverting: convertToShipmentMutation.isPending,

    // Comments mutation
    addComment: addCommentMutation.mutate,
    isAddingComment: addCommentMutation.isPending,
  };
}
