
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MapPin, TrendingUp, AlertTriangle } from 'lucide-react';

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
  const [nexusData, setNexusData] = useState<NexusStatus[]>([]);
  const [selectedState, setSelectedState] = useState<NexusStatus | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNexusData();
  }, [user]);

  const fetchNexusData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('nexus_status')
        .select('*')
        .eq('org_id', user.id)
        .order('state');

      if (error) throw error;
      setNexusData(data || []);
    } catch (error) {
      console.error('Error fetching nexus data:', error);
    } finally {
      setLoading(false);
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Nexus Analysis Results</h1>
          <p className="text-gray-600">Review your sales tax nexus status by state</p>
        </div>

        <Card className="rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Nexus Status by State
            </CardTitle>
            <CardDescription>
              Click on any row to view detailed analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
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
