
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OrganizationSwitcher } from '@/components/OrganizationSwitcher';
import { AlertTriangle, TrendingUp, MapPin, DollarSign, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user, signOut } = useAuth();

  // Mock data - you'll replace this with real data from your Supabase tables later
  const nexusStates = [
    { state: 'CA', status: 'Active', crossedAt: '2024-01-15', liability: 2450.00 },
    { state: 'NY', status: 'Active', crossedAt: '2024-02-03', liability: 1890.50 },
    { state: 'TX', status: 'Approaching', crossedAt: null, liability: 0 },
  ];

  const recentSales = [
    { date: '2024-06-15', amount: 1250.00, state: 'CA', tax: 106.25 },
    { date: '2024-06-14', amount: 890.50, state: 'NY', tax: 71.24 },
    { date: '2024-06-13', amount: 450.00, state: 'TX', tax: 0 },
  ];

  const stats = {
    totalRevenue: 125450.00,
    activeNexusStates: 2,
    estimatedLiability: 4340.50,
    salesThisMonth: 15750.00
  };

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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h2>
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
                {nexusStates.map((state) => (
                  <div key={state.state} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className="font-medium">{state.state}</div>
                      <Badge variant={state.status === 'Active' ? 'destructive' : 'secondary'}>
                        {state.status}
                      </Badge>
                    </div>
                    <div className="text-right">
                      {state.liability > 0 && (
                        <div className="text-sm font-medium">${state.liability.toFixed(2)}</div>
                      )}
                      {state.crossedAt && (
                        <div className="text-xs text-gray-500">Since {state.crossedAt}</div>
                      )}
                    </div>
                  </div>
                ))}
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
                {recentSales.map((sale, index) => (
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
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
