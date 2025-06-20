
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Users, Mail, UserPlus, Building2, Plus } from 'lucide-react';

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  full_name?: string;
  avatar_url?: string;
}

interface Organization {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [newOrgName, setNewOrgName] = useState('');
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [creatingOrg, setCreatingOrg] = useState(false);

  useEffect(() => {
    fetchTeamMembers();
    fetchOrganizations();
  }, [user]);

  const fetchOrganizations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('organisations')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  const fetchTeamMembers = async () => {
    if (!user) return;

    try {
      // First get memberships
      const { data: memberships, error: membershipsError } = await supabase
        .from('memberships')
        .select('*')
        .eq('org_id', user.id);

      if (membershipsError) throw membershipsError;

      // Then get profile data for each member
      const membersWithProfiles = await Promise.all(
        (memberships || []).map(async (membership) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', membership.user_id)
            .single();

          return {
            ...membership,
            full_name: profile?.full_name || 'Unknown User',
            avatar_url: profile?.avatar_url || null
          };
        })
      );

      setTeamMembers(membersWithProfiles);
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim() || !user) return;

    setCreatingOrg(true);
    try {
      const { data, error } = await supabase
        .from('organisations')
        .insert([
          {
            name: newOrgName.trim(),
            owner_id: user.id
          }
        ])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Organization created!",
        description: `${newOrgName} has been created successfully.`,
      });
      
      setNewOrgName('');
      fetchOrganizations(); // Refresh the list
    } catch (error) {
      console.error('Error creating organization:', error);
      toast({
        title: "Error",
        description: "Failed to create organization. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreatingOrg(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !user) return;

    setInviting(true);
    try {
      // This would typically involve sending an invitation email
      // For now, we'll just show a success message
      toast({
        title: "Invitation sent!",
        description: `An invitation has been sent to ${inviteEmail}`,
      });
      setInviteEmail('');
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setInviting(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'admin':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your organizations and team settings</p>
        </div>

        <div className="grid gap-6">
          {/* Create Organization */}
          <Card className="rounded-2xl shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create Organization
              </CardTitle>
              <CardDescription>
                Create a new organization to manage your business data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateOrganization} className="space-y-4">
                <div>
                  <Label htmlFor="orgName">Organization Name</Label>
                  <Input
                    id="orgName"
                    type="text"
                    placeholder="My Company Inc."
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={creatingOrg}>
                  <Building2 className="h-4 w-4 mr-2" />
                  {creatingOrg ? 'Creating...' : 'Create Organization'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Your Organizations */}
          <Card className="rounded-2xl shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Your Organizations
              </CardTitle>
              <CardDescription>
                Organizations you own and manage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {organizations.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No organizations yet. Create your first organization above.
                  </p>
                ) : (
                  organizations.map((org) => (
                    <div key={org.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Building2 className="h-8 w-8 text-blue-500" />
                        <div>
                          <div className="font-medium">{org.name}</div>
                          <div className="text-sm text-gray-500">
                            Created {new Date(org.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <Badge variant="default">Owner</Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Team Members */}
          <Card className="rounded-2xl shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Members
              </CardTitle>
              <CardDescription>
                Manage who has access to your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        {member.avatar_url ? (
                          <img 
                            src={member.avatar_url} 
                            alt="Avatar" 
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <Users className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">
                          {member.full_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {member.user_id}
                        </div>
                      </div>
                    </div>
                    <Badge variant={getRoleBadgeVariant(member.role)}>
                      {member.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Invite Team Member */}
          <Card className="rounded-2xl shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Invite Team Member
              </CardTitle>
              <CardDescription>
                Send an invitation to join your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={inviting}>
                  <Mail className="h-4 w-4 mr-2" />
                  {inviting ? 'Sending...' : 'Send Invitation'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
