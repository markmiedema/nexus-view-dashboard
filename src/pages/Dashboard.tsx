
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OrganizationSwitcher } from '@/components/OrganizationSwitcher';
import { AlertTriangle, TrendingUp, MapPin, DollarSign, Upload, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { currentOrg } = useOrganization();
  const [nexusStates, setNexusStates] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeNexusStates: 0,
    estimatedLiability: 0,
    salesThisMonth: 0
  });

  useEffect(() => {
    if (currentOrg) {
      fetchDashboardData();
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
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Organization Selected</h2>
            <p className="text-gray-600 mb-6">Please select an organization or create a new one to view your dashboard.</p>
            <Button asChild>
              <Link to="/settings">Go to Settings</Link>
            </Button>
          </div>
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
              <CardTitle className="text-sm font-medium">Last Run</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Today</div>
              <p className="text-xs text-muted-foreground">Analysis completed</p>
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
                <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
                  <Link to="/upload">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Data
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

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
      </main>
    </div>
  );
};

export default Dashboard;
