import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MapPin, TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NexusStatus {
  state: string;
  crossed_at: string | null;
  crossed_by: string | null;
  est_liability: number | null;
  taxable_post_cross: number | null;
  last_calculated: string;
}

const Results = () => {
  const { user } = useAuth();
  const { currentOrg } = useOrganization();
  const { toast } = useToast();
  const [nexusData, setNexusData] = useState<NexusStatus[]>([]);
  const [selectedState, setSelectedState] = useState<NexusStatus | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [salesEventCount, setSalesEventCount] = useState(0);
  const [isRecomputing, setIsRecomputing] = useState(false);

  useEffect(() => {
    if (currentOrg) {
      fetchNexusData();
      fetchSalesEventCount();
    }
  }, [currentOrg]);

  const fetchNexusData = async () => {
    if (!currentOrg) return;

    try {
      console.log('Fetching nexus data for org:', currentOrg.id);
      const { data, error } = await supabase
        .from('nexus_status')
        .select('*')
        .eq('org_id', currentOrg.id)
        .order('state');

      if (error) {
        console.error('Error fetching nexus data:', error);
        throw error;
      }
      
      console.log('Nexus data received:', data);
      setNexusData(data || []);
    } catch (error) {
      console.error('Error fetching nexus data:', error);
      toast({
        title: "Error loading results",
        description: "There was an error loading your nexus analysis results.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesEventCount = async () => {
    if (!currentOrg) return;

    try {
      const { count, error } = await supabase
        .from('sales_events')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', currentOrg.id);

      if (error) throw error;
      setSalesEventCount(count || 0);
      console.log('Sales events count:', count);
    } catch (error) {
      console.error('Error fetching sales events count:', error);
    }
  };

  const recomputeNexus = async () => {
    if (!currentOrg) return;

    setIsRecomputing(true);
    try {
      console.log('Recomputing nexus for org:', currentOrg.id);
      const { error } = await supabase.rpc('compute_nexus', {
        p_org: currentOrg.id
      });

      if (error) {
        console.error('Error recomputing nexus:', error);
        throw error;
      }

      toast({
        title: "Analysis updated",
        description: "Nexus analysis has been recomputed successfully.",
      });

      // Refresh the data
      await fetchNexusData();
    } catch (error) {
      console.error('Error recomputing nexus:', error);
      toast({
        title: "Error recomputing analysis",
        description: "There was an error updating your nexus analysis.",
        variant: "destructive",
      });
    } finally {
      setIsRecomputing(false);
    }
  };

  const openModal = (state: NexusStatus) => {
    setSelectedState(state);
    setIsModalOpen(true);
  };

  // Mock chart data for demonstration
  const getChartData = (state: NexusStatus) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month, index) => ({
      month,
      revenue: Math.random() * 50000 + 10000,
      threshold: 100000,
    }));
  };

  if (!currentOrg) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Organization Selected</h2>
          <p className="text-gray-600 mb-6">Please select an organization to view results.</p>
          <Button onClick={() => window.location.href = '/dashboard'}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Nexus Analysis Results - {currentOrg.name}</h1>
          <p className="text-gray-600">Review your sales tax nexus status by state</p>
          
          {/* Status Information */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <div className="bg-blue-100 px-3 py-1 rounded-full">
              <span className="text-blue-800">Sales Events: {salesEventCount}</span>
            </div>
            <div className="bg-green-100 px-3 py-1 rounded-full">
              <span className="text-green-800">States Analyzed: {nexusData.length}</span>
            </div>
            <div className="bg-orange-100 px-3 py-1 rounded-full">
              <span className="text-orange-800">
                Nexus Crossed: {nexusData.filter(s => s.crossed_at).length}
              </span>
            </div>
          </div>
        </div>

        <Card className="rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Nexus Status by State
              </div>
              <Button 
                onClick={recomputeNexus} 
                disabled={isRecomputing}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRecomputing ? 'animate-spin' : ''}`} />
                {isRecomputing ? 'Recomputing...' : 'Refresh Analysis'}
              </Button>
            </CardTitle>
            <CardDescription>
              {nexusData.length > 0 
                ? "Click on any row to view detailed analysis"
                : "No nexus analysis data found. Try refreshing the analysis or uploading sales data."
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {nexusData.length === 0 ? (
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analysis Results</h3>
                <p className="text-gray-600 mb-4">
                  {salesEventCount === 0 
                    ? "No sales data found. Please upload your sales data first."
                    : "Analysis data not found. The compute_nexus function may need to be run."
                  }
                </p>
                <div className="space-y-2">
                  <Button onClick={recomputeNexus} disabled={isRecomputing}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRecomputing ? 'animate-spin' : ''}`} />
                    {isRecomputing ? 'Computing...' : 'Run Analysis'}
                  </Button>
                  {salesEventCount === 0 && (
                    <div>
                      <Button variant="outline" onClick={() => window.location.href = '/upload'}>
                        Upload Sales Data
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white">
                    <TableRow>
                      <TableHead>State</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Crossed Date</TableHead>
                      <TableHead>Triggered By</TableHead>
                      <TableHead>Est. Liability</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nexusData.map((state, index) => (
                      <TableRow 
                        key={state.state}
                        className={`hover:bg-gray-50 cursor-pointer ${index % 2 === 0 ? 'bg-gray-25' : ''}`}
                        onClick={() => openModal(state)}
                      >
                        <TableCell className="font-medium">{state.state}</TableCell>
                        <TableCell>
                          <Badge variant={state.crossed_at ? 'destructive' : 'secondary'}>
                            {state.crossed_at ? 'Crossed' : 'Monitoring'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {state.crossed_at ? new Date(state.crossed_at).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>
                          {state.crossed_by ? (
                            <Badge variant="outline">
                              {state.crossed_by}
                            </Badge>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {state.est_liability ? `$${state.est_liability.toLocaleString()}` : '-'}
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal with chart */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-4xl backdrop-blur-sm bg-white/95">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {selectedState?.state} - Detailed Analysis
              </DialogTitle>
            </DialogHeader>
            
            {selectedState && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-600">Crossed Date</div>
                      <div className="text-lg font-semibold">
                        {selectedState.crossed_at 
                          ? new Date(selectedState.crossed_at).toLocaleDateString()
                          : 'Not crossed'
                        }
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-600">Estimated Liability</div>
                      <div className="text-lg font-semibold">
                        ${selectedState.est_liability?.toLocaleString() || '0'}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-600">Taxable Revenue</div>
                      <div className="text-lg font-semibold">
                        ${selectedState.taxable_post_cross?.toLocaleString() || '0'}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Revenue vs Threshold</CardTitle>
                    <CardDescription>Cumulative revenue progression</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={getChartData(selectedState)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']} />
                          <Line 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke="#2563eb" 
                            strokeWidth={2}
                            name="Cumulative Revenue"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="threshold" 
                            stroke="#dc2626" 
                            strokeWidth={2} 
                            strokeDasharray="5 5"
                            name="Threshold"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Results;
