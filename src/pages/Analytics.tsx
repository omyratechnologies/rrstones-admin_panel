import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, TrendingDown, Users, Package, 
  ShoppingCart, IndianRupee, AlertCircle 
} from 'lucide-react';
import { adminApi } from '@/services/businessApi';

const MetricCard = ({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: Icon 
}: {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'up' | 'down';
  icon: any;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardDescription className="text-sm font-medium">{title}</CardDescription>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {change && (
        <p className={`text-xs flex items-center gap-1 ${
          changeType === 'up' ? 'text-green-600' : 'text-red-600'
        }`}>
          {changeType === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {change} from last month
        </p>
      )}
    </CardContent>
  </Card>
);

export function Analytics() {
  // Fetch dashboard stats
  const { data: statsResponse, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: adminApi.getDashboardStats,
  });

  const stats = statsResponse?.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Comprehensive overview of your business performance
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          Array.from({ length: 4 }, (_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <MetricCard
              title="Total Revenue"
              value={`₹${stats?.totalRevenue?.toLocaleString() || '0'}`}
              change="+12.5%"
              changeType="up"
              icon={IndianRupee}
            />
            <MetricCard
              title="Total Orders"
              value={stats?.totalOrders || 0}
              change="+8.2%"
              changeType="up"
              icon={ShoppingCart}
            />
            <MetricCard
              title="Active Users"
              value={stats?.totalUsers || 0}
              change="+3.1%"
              changeType="up"
              icon={Users}
            />
            <MetricCard
              title="Products Available"
              value="247"
              change="-2.4%"
              changeType="down"
              icon={Package}
            />
          </>
        )}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Revenue Chart Placeholder */}
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>Monthly revenue trends for the past 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded">
                  <p className="text-muted-foreground">Revenue chart will be displayed here</p>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest order activities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {statsLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }, (_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    ))}
                  </div>
                ) : stats?.recentOrders && stats.recentOrders.length > 0 ? (
                  <div className="space-y-3">
                    {stats.recentOrders.slice(0, 5).map((order: any, index: number) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm">Order #{order._id?.slice(-8)} - ₹{order.finalAmount?.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No recent orders</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Order Status Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Pending</span>
                  <Badge variant="secondary">24</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Processing</span>
                  <Badge variant="secondary">18</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipped</span>
                  <Badge variant="secondary">12</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Delivered</span>
                  <Badge variant="default">156</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Granite Variants</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Kashmir White</span>
                  <Badge variant="default">45 orders</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Black Galaxy</span>
                  <Badge variant="secondary">38 orders</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tan Brown</span>
                  <Badge variant="secondary">32 orders</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Imperial Red</span>
                  <Badge variant="secondary">28 orders</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Customer Tiers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Tier 1 (Premium)</span>
                  <Badge variant="default">28 customers</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tier 2 (Standard)</span>
                  <Badge variant="secondary">156 customers</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tier 3 (Basic)</span>
                  <Badge variant="outline">342 customers</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Sales Performance</CardTitle>
                <CardDescription>Monthly sales trends and targets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded">
                  <p className="text-muted-foreground">Sales chart will be displayed here</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Product Category</CardTitle>
                <CardDescription>Breakdown of revenue by granite types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded">
                  <p className="text-muted-foreground">Category revenue chart will be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Customer Growth</CardTitle>
                <CardDescription>New customer acquisitions over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded">
                  <p className="text-muted-foreground">Customer growth chart will be displayed here</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Retention</CardTitle>
                <CardDescription>Repeat customer rates and loyalty metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded">
                  <p className="text-muted-foreground">Retention metrics will be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Stock Levels</CardTitle>
                <CardDescription>Current inventory status across all products</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded">
                  <p className="text-muted-foreground">Stock level chart will be displayed here</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Low Stock Alerts</CardTitle>
                <CardDescription>Products requiring immediate attention</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Kashmir White - 20mm</p>
                    <p className="text-xs text-muted-foreground">Stock: 5 pieces</p>
                  </div>
                  <Badge variant="destructive">Critical</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Black Galaxy - 15mm</p>
                    <p className="text-xs text-muted-foreground">Stock: 12 pieces</p>
                  </div>
                  <Badge variant="secondary">Low</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Tan Brown - 18mm</p>
                    <p className="text-xs text-muted-foreground">Stock: 8 pieces</p>
                  </div>
                  <Badge variant="secondary">Low</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
