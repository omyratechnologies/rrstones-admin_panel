import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { analyticsApi, orderApi } from '@/services/businessApi';
import { BarChart3, TrendingUp, Users, Package, DollarSign, ShoppingCart, RefreshCw, Activity, Clock } from 'lucide-react';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';

export function Dashboard() {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const { companyName } = useBusinessSettings();

  // Dashboard analytics with auto-refresh
  const { data: dashboardData, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-analytics'],
    queryFn: () => analyticsApi.getDashboardAnalytics(),
    refetchInterval: 30000, // 30 seconds
    refetchOnWindowFocus: true,
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  // Recent orders with frequent updates
  const { data: recentOrdersData } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: () => orderApi.getAllOrders({ limit: 5, page: 1 }),
    refetchInterval: 15000, // Update every 15 seconds
    refetchOnWindowFocus: true,
  });

  // Update last refreshed time
  useEffect(() => {
    if (dashboardData) {
      setLastUpdated(new Date());
    }
  }, [dashboardData]);

  const analytics = dashboardData?.data?.analytics || {
    summary: {
      users: { current: 0, growth: 0 },
      orders: { current: 0, growth: 0 },
      revenue: { current: 0, growth: 0 },
      products: 0,
    },
    breakdowns: {
      orderStatus: {},
    },
    recentActivity: [],
  };

  const pendingOrdersCount = (analytics.breakdowns?.orderStatus as any)?.pending?.count || 0;
  const recentOrdersList = recentOrdersData?.data?.orders || analytics.recentActivity || [];

  const handleManualRefresh = () => {
    refetch();
    setLastUpdated(new Date());
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-success';
    if (growth < 0) return 'text-error';
    return 'text-muted-foreground';
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return TrendingUp;
    if (growth < 0) return TrendingUp; // You might want a different icon for negative
    return Activity;
  };

  const statCards = [
    {
      title: 'Total Users',
      value: analytics.summary.users.current?.toLocaleString() || '0',
      description: 'Registered customers',
      icon: Users,
      color: 'text-primary',
      growth: analytics.summary.users.growth || 0,
    },
    {
      title: 'Total Orders',
      value: analytics.summary.orders.current?.toLocaleString() || '0',
      description: 'All time orders',
      icon: ShoppingCart,
      color: 'text-success',
      growth: analytics.summary.orders.growth || 0,
    },
    {
      title: 'Revenue',
      value: `$${analytics.summary.revenue.current?.toLocaleString() || '0'}`,
      description: 'Total revenue',
      icon: DollarSign,
      color: 'text-emerald-600',
      growth: analytics.summary.revenue.growth || 0,
    },
    {
      title: 'Pending Orders',
      value: pendingOrdersCount.toLocaleString(),
      description: 'Awaiting processing',
      icon: Package,
      color: 'text-warning',
      growth: 0, // Pending orders don't have growth
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your {companyName} admin dashboard
          </p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Loading...</CardTitle>
                <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted animate-pulse rounded mb-1" />
                <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your {companyName} admin dashboard
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <div className="text-sm text-muted-foreground">
              Live updates every 30s
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <Button onClick={handleManualRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const GrowthIcon = getGrowthIcon(stat.growth);
          const growthColor = getGrowthColor(stat.growth);
          
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                  {stat.growth !== 0 && (
                    <div className={`flex items-center text-xs ${growthColor}`}>
                      <GrowthIcon className="h-3 w-3 mr-1" />
                      {stat.growth > 0 ? '+' : ''}{stat.growth.toFixed(1)}%
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts and Tables */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Sales Overview
                </CardTitle>
                <CardDescription>
                  Your sales performance for this month
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  Chart will be displayed here
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Orders
                </CardTitle>
                <CardDescription>
                  Latest orders from customers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentOrdersList.length > 0 ? (
                    recentOrdersList.slice(0, 5).map((order: any) => (
                      <div key={order._id} className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <div className="flex-1 text-sm">
                          <p className="font-medium">Order #{order._id?.slice(-6)}</p>
                          <p className="text-muted-foreground">
                            {order.userId?.name || 'Customer'} - ${order.total?.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex flex-col items-end">
                          <Badge variant={
                            order.status === 'completed' ? 'default' :
                            order.status === 'pending' ? 'secondary' :
                            order.status === 'processing' ? 'outline' : 'destructive'
                          }>
                            {order.status}
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {new Date(order.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No recent orders</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Order Status Breakdown</CardTitle>
                <CardDescription>
                  Current order distribution by status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries((analytics.breakdowns?.orderStatus as any) || {}).map(([status, data]: [string, any]) => (
                    <div key={status} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${
                          status === 'completed' ? 'bg-success' :
                          status === 'pending' ? 'bg-warning' :
                          status === 'processing' ? 'bg-primary' :
                          status === 'cancelled' ? 'bg-error' : 'bg-gray-500'
                        }`} />
                        <span className="capitalize">{status}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{data.count}</div>
                        <div className="text-xs text-muted-foreground">${data.revenue?.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Products</CardTitle>
                <CardDescription>
                  Best performing products by revenue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {((analytics as any).topProducts || []).slice(0, 5).map((product: any, index: number) => (
                    <div key={product._id} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium">#{index + 1}</div>
                        <div>
                          <div className="font-medium text-sm">{product.productName}</div>
                          <div className="text-xs text-muted-foreground">{product.productColor}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${product.totalRevenue?.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{product.totalQuantity} sold</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Reports</CardTitle>
              <CardDescription>
                Generate and download business reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                Report generation interface will be displayed here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
