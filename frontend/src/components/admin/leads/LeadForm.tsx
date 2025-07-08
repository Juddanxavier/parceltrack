import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { leadFormSchema, type LeadFormValues } from '@/lib/validations/lead.schema';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useLeads } from '@/hooks/useLeads';
import { toast } from 'sonner';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface LeadFormProps {
  leadId?: number;
  onClose: () => void;
  onSuccess?: () => void;
}

export function LeadForm({ leadId, onClose, onSuccess }: LeadFormProps) {
  const { createLead, updateLead, getSingleLead } = useLeads();
  const { data: lead } = getSingleLead(leadId);

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: lead?.name || '',
      email: lead?.email || '',
      phone: lead?.phone || '',
      originCountry: lead?.originCountry || '',
      destinationCountry: lead?.destinationCountry || '',
      parcelType: lead?.parcelType || '',
      weight: lead?.weight || 0,
      notes: lead?.notes || '',
    },
  });

  const onSubmit = async (data: LeadFormValues) => {
    try {
      if (leadId) {
        await updateLead({ id: leadId, data });
        toast.success('Lead updated successfully');
      } else {
        await createLead(data);
        toast.success('Lead created successfully');
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error('Failed to save lead');
      console.error('Failed to save lead:', error);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{leadId ? 'Edit' : 'Create'} Lead</DialogTitle>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="originCountry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Origin Country</FormLabel>
                  <FormControl>
                    <Input maxLength={2} placeholder="US" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="destinationCountry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destination Country</FormLabel>
                  <FormControl>
                    <Input maxLength={2} placeholder="UK" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="parcelType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parcel Type</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="weight"
            render={({ field: { onChange, ...field } }) => (
              <FormItem>
                <FormLabel>Weight (kg)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {leadId ? 'Updating...' : 'Creating...'}
                </div>
              ) : (
                leadId ? 'Update Lead' : 'Create Lead'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
