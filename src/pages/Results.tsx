

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

interface StateWithActivity {
  state: string;
  crossed_at: string | null;
  crossed_by: string | null;
  est_liability: number | null;
  taxable_post_cross: number | null;
  last_calculated: string | null;
  total_revenue: number;
  transaction_count: number;
  has_nexus_record: boolean;
}

const Results = () => {
  const { user } = useAuth();
  const { currentOrg } = useOrganization();
  const { toast } = useToast();
  const [statesData, setStatesData] = useState<StateWithActivity[]>([]);
  const [selectedState, setSelectedState] = useState<StateWithActivity | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [salesEventCount, setSalesEventCount] = useState(0);
  const [isRecomputing, setIsRecomputing] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (currentOrg) {
      fetchAllStatesData();
      fetchSalesEventCount();
    }
  }, [currentOrg]);

  const fetchAllStatesData = async () => {
    if (!currentOrg) return;

    try {
      console.log('Fetching all states data for org:', currentOrg.id);
      
      // Get all states with sales activity
      const { data: salesByState, error: salesError } = await supabase
        .from('sales_events')
        .select('ship_to_state, amount')
        .eq('org_id', currentOrg.id);

      if (salesError) {
        console.error('Error fetching sales data:', salesError);
        throw salesError;
      }

      // Get nexus status data
      const { data: nexusData, error: nexusError } = await supabase
        .from('nexus_status')
        .select('*')
        .eq('org_id', currentOrg.id);

      if (nexusError) {
        console.error('Error fetching nexus data:', nexusError);
        throw nexusError;
      }

      // Aggregate sales data by state
      const stateAggregates = new Map<string, { revenue: number; count: number }>();
      
      salesByState?.forEach(sale => {
        const state = sale.ship_to_state;
        const current = stateAggregates.get(state) || { revenue: 0, count: 0 };
        current.revenue += sale.amount || 0;
        current.count += 1;
        stateAggregates.set(state, current);
      });

      // Combine sales data with nexus data
      const combinedData: StateWithActivity[] = [];
      const nexusMap = new Map(nexusData?.map(n => [n.state, n]) || []);

      // Add all states with sales activity
      stateAggregates.forEach((aggregate, state) => {
        const nexusRecord = nexusMap.get(state);
        combinedData.push({
          state,
          crossed_at: nexusRecord?.crossed_at || null,
          crossed_by: nexusRecord?.crossed_by || null,
          est_liability: nexusRecord?.est_liability || null,
          taxable_post_cross: nexusRecord?.taxable_post_cross || null,
          last_calculated: nexusRecord?.last_calculated || null,
          total_revenue: aggregate.revenue,
          transaction_count: aggregate.count,
          has_nexus_record: !!nexusRecord
        });
      });

      // Sort by state name
      combinedData.sort((a, b) => a.state.localeCompare(b.state));
      
      console.log('Combined states data:', combinedData);
      setStatesData(combinedData);
    } catch (error) {
      console.error('Error fetching states data:', error);
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

  const fetchChartData = async (state: string) => {
    if (!currentOrg) return [];

    try {
      // Get the state's threshold
      const { data: thresholdData, error: thresholdError } = await supabase
        .from('state_thresholds')
        .select('revenue_threshold')
        .eq('state', state)
        .single();

      if (thresholdError) {
        console.error('Error fetching threshold:', thresholdError);
      }

      const threshold = thresholdData?.revenue_threshold || 100000;

      const { data: salesEvents, error } = await supabase
        .from('sales_events')
        .select('transaction_date, amount')
        .eq('org_id', currentOrg.id)
        .eq('ship_to_state', state)
        .order('transaction_date', { ascending: true });

      if (error) throw error;

      console.log(`Raw sales events for ${state}:`, salesEvents);

      // Calculate cumulative revenue for each transaction
      const chartPoints: any[] = [];
      let cumulativeRevenue = 0;

      salesEvents?.forEach((event, index) => {
        cumulativeRevenue += event.amount || 0;
        
        chartPoints.push({
          transaction: index + 1,
          date: new Date(event.transaction_date).toLocaleDateString(),
          revenue: cumulativeRevenue,
          threshold: threshold,
          amount: event.amount
        });
      });

      console.log(`Chart data for ${state}:`, chartPoints);
      return chartPoints;
    } catch (error) {
      console.error('Error fetching chart data:', error);
      return [];
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
      await fetchAllStatesData();
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

  const openModal = async (state: StateWithActivity) => {
    setSelectedState(state);
    setIsModalOpen(true);
    
    // Fetch real chart data for this state
    const realChartData = await fetchChartData(state.state);
    setChartData(realChartData);
  };

  // Mock chart data for demonstration
  const getChartData = (state: StateWithActivity) => {
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
              <span className="text-green-800">States with Activity: {statesData.length}</span>
            </div>
            <div className="bg-orange-100 px-3 py-1 rounded-full">
              <span className="text-orange-800">
                Nexus Crossed: {statesData.filter(s => s.crossed_at).length}
              </span>
            </div>
          </div>
        </div>

        <Card className="rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                State Activity & Nexus Status
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
              {statesData.length > 0 
                ? "All states with sales activity. Click on any row to view detailed analysis"
                : "No sales activity data found. Try uploading sales data first."
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {statesData.length === 0 ? (
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Sales Activity Found</h3>
                <p className="text-gray-600 mb-4">
                  {salesEventCount === 0 
                    ? "No sales data found. Please upload your sales data first."
                    : "No state-level sales activity detected."
                  }
                </p>
                <div className="space-y-2">
                  {salesEventCount === 0 && (
                    <Button variant="outline" onClick={() => window.location.href = '/upload'}>
                      Upload Sales Data
                    </Button>
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
                      <TableHead>Total Revenue</TableHead>
                      <TableHead>Transactions</TableHead>
                      <TableHead>Crossed Date</TableHead>
                      <TableHead>Triggered By</TableHead>
                      <TableHead>Est. Liability</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statesData.map((state, index) => (
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
                          ${state.total_revenue.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {state.transaction_count.toLocaleString()}
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-600">Total Revenue</div>
                      <div className="text-lg font-semibold">
                        ${selectedState.total_revenue.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-600">Transactions</div>
                      <div className="text-lg font-semibold">
                        {selectedState.transaction_count.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                  
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
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Revenue vs Threshold</CardTitle>
                    <CardDescription>Cumulative revenue progression showing each transaction</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 40, bottom: 60 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                          <XAxis 
                            dataKey="transaction" 
                            label={{ value: 'Transaction #', position: 'insideBottom', offset: -10 }}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis 
                            label={{ value: 'Revenue ($)', angle: -90, position: 'insideLeft' }}
                            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip 
                            formatter={(value: number, name: string) => {
                              if (name === 'Cumulative Revenue') {
                                return [`$${value.toLocaleString()}`, name];
                              }
                              if (name === 'Nexus Threshold') {
                                return [`$${value.toLocaleString()}`, name];
                              }
                              return [value, name];
                            }}
                            labelFormatter={(label) => `Transaction ${label}`}
                            contentStyle={{
                              backgroundColor: 'white',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              fontSize: '12px'
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke="#2563eb" 
                            strokeWidth={3}
                            name="Cumulative Revenue"
                            dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2 }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="threshold" 
                            stroke="#dc2626" 
                            strokeWidth={2} 
                            strokeDasharray="8 4"
                            name="Nexus Threshold"
                            dot={false}
                            activeDot={false}
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

