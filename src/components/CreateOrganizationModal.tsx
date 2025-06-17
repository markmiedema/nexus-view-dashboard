
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Building2, Loader2 } from 'lucide-react';

interface CreateOrganizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (organization: any) => void;
}

export const CreateOrganizationModal = ({ open, onOpenChange, onSuccess }: CreateOrganizationModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    ein: '',
    fiscalYear: 'calendar'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.name.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('organisations')
        .insert([
          {
            name: formData.name.trim(),
            owner_id: user.id,
            ein: formData.ein.trim() || null,
            fiscal_year: formData.fiscalYear
          }
        ])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Organization created!",
        description: `${formData.name} has been created successfully.`,
      });

      onSuccess(data);
      setFormData({ name: '', ein: '', fiscalYear: 'calendar' });
    } catch (error) {
      console.error('Error creating organization:', error);
      toast({
        title: "Error",
        description: "Failed to create organization. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Create Organization
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="orgName">Organization Name *</Label>
            <Input
              id="orgName"
              type="text"
              placeholder="Acme Corporation"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="ein">EIN (Optional)</Label>
            <Input
              id="ein"
              type="text"
              placeholder="12-3456789"
              value={formData.ein}
              onChange={(e) => setFormData({ ...formData, ein: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="fiscalYear">Fiscal Year</Label>
            <Select 
              value={formData.fiscalYear} 
              onValueChange={(value) => setFormData({ ...formData, fiscalYear: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select fiscal year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="calendar">Calendar Year (Jan-Dec)</SelectItem>
                <SelectItem value="april">April-March</SelectItem>
                <SelectItem value="july">July-June</SelectItem>
                <SelectItem value="october">October-September</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.name.trim()} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Organization'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
