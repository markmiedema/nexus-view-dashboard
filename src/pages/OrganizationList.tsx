
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Plus, Users, Calendar } from 'lucide-react';
import { CreateOrganizationModal } from '@/components/CreateOrganizationModal';

const OrganizationList = () => {
  const { organizations, isLoading, setCurrentOrg } = useOrganization();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleOrgSelect = (org: any) => {
    setCurrentOrg(org);
    navigate('/dashboard');
  };

  const handleCreateSuccess = (newOrg: any) => {
    setCurrentOrg(newOrg);
    setShowCreateModal(false);
    navigate('/dashboard');
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
                <Card 
                  key={org.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleOrgSelect(org)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-blue-500" />
                      {org.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span className="capitalize">{org.role}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Created {new Date(org.created_at || Date.now()).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Button className="w-full mt-4" variant="outline">
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
      </div>
    </div>
  );
};

export default OrganizationList;
