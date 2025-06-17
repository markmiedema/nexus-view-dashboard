import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Plus, Users, Calendar, Trash2 } from 'lucide-react';
import { CreateOrganizationModal } from '@/components/CreateOrganizationModal';
import { DeleteOrganizationDialog } from '@/components/DeleteOrganizationDialog';
import { useToast } from '@/hooks/use-toast';

const OrganizationList = () => {
  const { organizations, isLoading, setCurrentOrg, refetchOrganizations } = useOrganization();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState<any>(null);

  const handleOrgSelect = (org: any) => {
    setCurrentOrg(org);
    navigate('/dashboard');
  };

  const handleCreateSuccess = (newOrg: any) => {
    setCurrentOrg(newOrg);
    setShowCreateModal(false);
    navigate('/dashboard');
  };

  const handleDeleteOrg = async (orgId: string) => {
    try {
      const { error } = await supabase
        .from('organisations')
        .delete()
        .eq('id', orgId);

      if (error) throw error;

      toast({
        title: "Organization deleted",
        description: "The organization has been successfully deleted.",
      });

      // Refresh the organizations list
      await refetchOrganizations();
      
      // If the deleted org was the current one, clear it
      setCurrentOrg(null);
      setOrgToDelete(null);
    } catch (error) {
      console.error('Error deleting organization:', error);
      toast({
        title: "Error",
        description: "Failed to delete organization. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading organizations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Organizations</h1>
          <p className="text-gray-600">Select an organization to manage nexus compliance</p>
        </div>

        {organizations.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Add your first organization</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Get started by creating your first organization to track sales tax nexus compliance.
            </p>
            <Button onClick={() => setShowCreateModal(true)} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Create Organization
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                {organizations.length} Organization{organizations.length !== 1 ? 's' : ''}
              </h2>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Organization
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {organizations.map((org) => (
                <Card key={org.id} className="relative">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-blue-500" />
                      {org.name}
                    </CardTitle>
                    {org.owner_id === user?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOrgToDelete(org);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span className="capitalize">{org.role}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Created {org.created_at ? new Date(org.created_at).toLocaleDateString() : 'Unknown'}</span>
                      </div>
                    </div>
                    <Button 
                      className="w-full mt-4" 
                      variant="outline"
                      onClick={() => handleOrgSelect(org)}
                    >
                      Open Dashboard
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <CreateOrganizationModal 
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          onSuccess={handleCreateSuccess}
        />

        <DeleteOrganizationDialog
          organization={orgToDelete}
          open={!!orgToDelete}
          onOpenChange={(open) => !open && setOrgToDelete(null)}
          onConfirm={handleDeleteOrg}
        />
      </div>
    </div>
  );
};

export default OrganizationList;
