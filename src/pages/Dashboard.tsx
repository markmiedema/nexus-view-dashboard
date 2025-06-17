import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { OrganizationSwitcher } from '@/components/OrganizationSwitcher';
import { AlertTriangle, TrendingUp, MapPin, DollarSign, Upload, Settings, RefreshCw, Trash2, Building2, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { currentOrg, organizations } = useOrganization();
  const { toast } = useToast();
  const [nexusStates, setNexusStates] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [statesData, setStatesData] = useState<StateWithActivity[]>([]);
  const [selectedState, setSelectedState] = useState<StateWithActivity | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [salesEventCount, setSalesEventCount] = useState(0);
  const [isRecomputing, setIsRecomputing] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeNexusStates: 0,
    estimatedLiability: 0,
    salesThisMonth: 0
  });
  const [isClearingData, setIsClearingData] = useState(false);

  useEffect(() => {
    if (currentOrg) {
      fetchDashboardData();
      fetchAllStatesData();
      fetchSalesEventCount();
    }
  }, [currentOrg]);

  const fetchDashboardData = async () => {
    if (!currentOrg) return;

    try {
      // Fetch nexus status for current org
      const { data: nexusData, error: nexusError } = await supabase
        .from('nexus_status')
        .select('*')
        .eq('org_id', currentOrg.id)
        .order('state');

      if (nexusError) throw nexusError;

      // Fetch recent sales for current org
      const { data: salesData, error: salesError } = await supabase
        .from('sales_events')
        .select('*')
        .eq('org_id', currentOrg.id)
        .order('transaction_date', { ascending: false })
        .limit(3);

      if (salesError) throw salesError;

      // Calculate stats
      const activeNexus = (nexusData || []).filter(n => n.crossed_at).length;
      const totalLiability = (nexusData || []).reduce((sum, n) => sum + (n.est_liability || 0), 0);
      
      // Get this month's sales
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const { data: monthSales, error: monthError } = await supabase
        .from('sales_events')
        .select('amount')
        .eq('org_id', currentOrg.id)
        .gte('transaction_date', thisMonth.toISOString());

      if (monthError) throw monthError;
      
      const monthlyRevenue = (monthSales || []).reduce((sum, s) => sum + s.amount, 0);

      setNexusStates(nexusData || []);
      setRecentSales((salesData || []).map(sale => ({
        date: new Date(sale.transaction_date).toLocaleDateString(),
        amount: sale.amount,
        state: sale.ship_to_state,
        tax: sale.sales_tax
      })));
      
      setStats({
        totalRevenue: monthlyRevenue,
        activeNexusStates: activeNexus,
        estimatedLiability: totalLiability,
        salesThisMonth: monthlyRevenue
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

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

      // Get state thresholds for status calculation
      const { data: thresholds, error: thresholdError } = await supabase
        .from('state_thresholds')
        .select('state, revenue_threshold');

      if (thresholdError) {
        console.error('Error fetching thresholds:', thresholdError);
      }

      // Create threshold map
      const thresholdMap = new Map(thresholds?.map(t => [t.state, t.revenue_threshold]) || []);

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
      let hasExceededThreshold = false;

      salesEvents?.forEach((event, index) => {
        cumulativeRevenue += event.amount || 0;
        
        // Check if this transaction causes us to exceed (not just meet) the threshold
        if (cumulativeRevenue > threshold && !hasExceededThreshold) {
          hasExceededThreshold = true;
        }
        
        chartPoints.push({
          transaction: index + 1,
          date: new Date(event.transaction_date).toLocaleDateString(),
          revenue: cumulativeRevenue,
          threshold: threshold,
          amount: event.amount,
          hasExceededThreshold: hasExceededThreshold,
          meetsThreshold: cumulativeRevenue >= threshold,
          exceedsThreshold: cumulativeRevenue > threshold
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
      await fetchDashboardData();
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

  const clearAllData = async () => {
    if (!currentOrg) return;

    setIsClearingData(true);
    try {
      console.log('Clearing all data for org:', currentOrg.id);
      
      // Delete all sales events for this organization
      const { error: salesError } = await supabase
        .from('sales_events')
        .delete()
        .eq('org_id', currentOrg.id);

      if (salesError) {
        console.error('Error deleting sales events:', salesError);
        throw salesError;
      }

      // Delete all nexus status records for this organization
      const { error: nexusError } = await supabase
        .from('nexus_status')
        .delete()
        .eq('org_id', currentOrg.id);

      if (nexusError) {
        console.error('Error deleting nexus status:', nexusError);
        throw nexusError;
      }

      toast({
        title: "Data cleared successfully",
        description: "All sales data and nexus analysis have been removed for this organization.",
      });

      // Refresh the data
      await fetchDashboardData();
      await fetchAllStatesData();
      await fetchSalesEventCount();
    } catch (error) {
      console.error('Error clearing data:', error);
      toast({
        title: "Error clearing data",
        description: "There was an error removing the data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsClearingData(false);
    }
  };

  const openModal = async (state: StateWithActivity) => {
    setSelectedState(state);
    setIsModalOpen(true);
    
    // Fetch real chart data for this state
    const realChartData = await fetchChartData(state.state);
    setChartData(realChartData);
  };

  const getStatusInfo = (state: StateWithActivity) => {
    // If nexus was crossed (exceeded threshold), show as crossed
    if (state.crossed_at) {
      return { variant: 'destructive' as const, text: 'Crossed' };
    }
    
    // For states without nexus records, we need to check if they meet the threshold
    // This is a simplified check - in a real implementation, you'd want to fetch
    // the threshold and compare properly
    const estimatedThreshold = 100000; // Default threshold for demonstration
    
    if (state.total_revenue >= estimatedThreshold) {
      return { variant: 'warning' as const, text: 'Met' };
    }
    
    // Check if approaching (e.g., 80% of threshold)
    if (state.total_revenue >= estimatedThreshold * 0.8) {
      return { variant: 'approaching' as const, text: 'Approaching' };
    }
    
    return { variant: 'secondary' as const, text: 'Monitoring' };
  };

  // Personal Dashboard View (when no organization selected)
  if (!currentOrg) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold text-gray-900">Nexus Tracker</h1>
                <OrganizationSwitcher />
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/settings">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Link>
                </Button>
                <span className="text-sm text-gray-600">
                  Welcome, {user?.email}
                </span>
                <Button variant="outline" onClick={signOut}>
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Personal Dashboard</h2>
            <p className="text-gray-600">Welcome back! Select an organization to manage nexus compliance or create a new one.</p>
          </div>

          {/* Personal Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="rounded-2xl shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Organizations</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{organizations.length}</div>
                <p className="text-xs text-muted-foreground">Total organizations</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Your Role</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">SALT</div>
                <p className="text-xs text-muted-foreground">Accountant</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quick Access</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <Button asChild size="sm" className="w-full">
                  <Link to="/organizations">
                    View All Organizations
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Organizations Overview */}
          <Card className="rounded-2xl shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Your Organizations
                </div>
                <Button asChild size="sm">
                  <Link to="/organizations">
                    View All
                  </Link>
                </Button>
              </CardTitle>
              <CardDescription>
                Select an organization to view its nexus compliance dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              {organizations.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No organizations yet</h3>
                  <p className="text-gray-600 mb-4">Create your first organization to get started with nexus tracking.</p>
                  <Button asChild>
                    <Link to="/organizations">
                      Create Organization
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {organizations.slice(0, 6).map((org) => (
                    <Card 
                      key={org.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => window.location.href = `/dashboard?org=${org.id}`}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-blue-500" />
                          {org.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {org.role}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {org.created_at ? new Date(org.created_at).toLocaleDateString() : 'Unknown'}
                          </span>
                        </div>
                        <Button size="sm" className="w-full mt-3" variant="outline">
                          Open Dashboard
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-900">Nexus Tracker</h1>
              <OrganizationSwitcher />
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </Button>
              <span className="text-sm text-gray-600">
                Welcome, {user?.email}
              </span>
              <Button variant="outline" onClick={signOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard - {currentOrg.name}</h2>
          <p className="text-gray-600">Monitor your sales tax nexus status and compliance</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="rounded-2xl shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">States Crossed</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeNexusStates}</div>
              <p className="text-xs text-muted-foreground">Active nexus states</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Est. Liability</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.estimatedLiability.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Outstanding tax</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sales Events</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{salesEventCount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total transactions</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.salesThisMonth.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Sales revenue</p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="mb-8">
          <Card className="rounded-2xl shadow-lg border-gradient bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Ready to upload new sales data?
                  </h3>
                  <p className="text-gray-600">
                    Upload your latest sales CSV to get updated nexus analysis
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {salesEventCount > 0 && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="lg" disabled={isClearingData}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          {isClearingData ? 'Clearing...' : 'Clear Data'}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Clear All Data</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete all sales data and nexus analysis for {currentOrg.name}. 
                            This action cannot be undone. Are you sure you want to continue?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={clearAllData}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Yes, Clear All Data
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
                    <Link to="/upload">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Data
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Nexus Analysis Results */}
        {statesData.length > 0 && (
          <Card className="rounded-2xl shadow-lg mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Nexus Analysis Results
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
                State activity and nexus status analysis. Click on any row to view detailed analysis.
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                    {statesData.map((state, index) => {
                      const statusInfo = getStatusInfo(state);
                      return (
                        <TableRow 
                          key={state.state}
                          className={`hover:bg-gray-50 cursor-pointer ${index % 2 === 0 ? 'bg-gray-25' : ''}`}
                          onClick={() => openModal(state)}
                        >
                          <TableCell className="font-medium">{state.state}</TableCell>
                          <TableCell>
                            <Badge variant={statusInfo.variant}>
                              {statusInfo.text}
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
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Nexus Status */}
          <Card className="rounded-2xl shadow-lg">
            <CardHeader>
              <CardTitle>Nexus Status by State</CardTitle>
              <CardDescription>Current nexus obligations and thresholds</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {nexusStates.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No nexus data available for this organization
                  </div>
                ) : (
                  nexusStates.map((state) => (
                    <div key={state.state} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div className="font-medium">{state.state}</div>
                        <Badge variant={state.crossed_at ? 'destructive' : 'secondary'}>
                          {state.crossed_at ? 'Crossed' : 'Monitoring'}
                        </Badge>
                      </div>
                      <div className="text-right">
                        {state.est_liability > 0 && (
                          <div className="text-sm font-medium">${state.est_liability.toFixed(2)}</div>
                        )}
                        {state.crossed_at && (
                          <div className="text-xs text-gray-500">Since {new Date(state.crossed_at).toLocaleDateString()}</div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Sales */}
          <Card className="rounded-2xl shadow-lg">
            <CardHeader>
              <CardTitle>Recent Sales Activity</CardTitle>
              <CardDescription>Latest transactions across all states</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentSales.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No sales data available for this organization
                  </div>
                ) : (
                  recentSales.map((sale, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div>
                        <div className="font-medium">${sale.amount.toFixed(2)}</div>
                        <div className="text-sm text-gray-500">{sale.date}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{sale.state}</div>
                        <div className="text-sm text-gray-500">
                          Tax: ${sale.tax.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

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
                    <CardDescription>
                      Cumulative revenue progression showing each transaction. 
                      {selectedState && chartData.length > 0 && (
                        <>
                          {chartData.some(point => point.exceedsThreshold) 
                            ? " Nexus threshold has been exceeded." 
                            : chartData.some(point => point.meetsThreshold)
                            ? " Revenue meets but has not exceeded the nexus threshold."
                            : " Revenue has not reached the nexus threshold."}
                        </>
                      )}
                    </CardDescription>
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
                            labelFormatter={(label, payload) => {
                              const point = payload?.[0]?.payload;
                              let status = '';
                              if (point) {
                                if (point.exceedsThreshold) {
                                  status = ' (Threshold Exceeded)';
                                } else if (point.meetsThreshold) {
                                  status = ' (Threshold Met)';
                                } else {
                                  status = ' (Below Threshold)';
                                }
                              }
                              return `Transaction ${label}${status}`;
                            }}
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
      </main>
    </div>
  );
};

export default Dashboard;
