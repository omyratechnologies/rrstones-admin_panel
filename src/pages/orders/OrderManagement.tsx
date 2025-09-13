import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, Search, Filter, Edit, Trash2, Eye, Download, 
  Package, Truck, CheckCircle, XCircle, Clock 
} from 'lucide-react';
import { orderApi } from '@/services/businessApi';
import type { Order } from '@/types';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const paymentStatusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
};

export function OrderManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  // Fetch orders
  const { data: ordersResponse, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders', statusFilter],
    queryFn: () => orderApi.getAllOrders({ 
      status: statusFilter === 'all' ? undefined : statusFilter,
      page: 1,
      limit: 20
    }),
  });

  const orders = ordersResponse?.data?.orders || [];

  // Mutations
  const updateOrderMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      orderApi.updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const filteredOrders = orders.filter((order: Order) =>
    order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'processing': return <Package className="h-4 w-4" />;
      case 'shipped': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order Management</h1>
          <p className="text-muted-foreground">
            Track and manage customer orders
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Order
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search orders by ID or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Order List</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {ordersLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-20 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order: Order) => (
                <Card key={order._id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">Order #{order._id.slice(-8)}</CardTitle>
                        <CardDescription>
                          Created: {new Date(order.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge 
                        className={`${statusColors[order.status as keyof typeof statusColors]} border-0`}
                      >
                        {getStatusIcon(order.status)}
                        <span className="ml-1 capitalize">{order.status}</span>
                      </Badge>
                      <Badge 
                        className={`${paymentStatusColors[order.paymentStatus as keyof typeof paymentStatusColors]} border-0`}
                      >
                        <span className="capitalize">Payment: {order.paymentStatus}</span>
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-medium text-sm mb-2">Order Details</h4>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Items: {order.items.length}</p>
                          <p>Total: ₹{order.totalAmount.toLocaleString()}</p>
                          <p>Discount: ₹{order.discountAmount.toLocaleString()}</p>
                          <p className="font-medium text-foreground">Final: ₹{order.finalAmount.toLocaleString()}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm mb-2">Items</h4>
                        <div className="text-sm text-muted-foreground space-y-1">
                          {order.items.slice(0, 2).map((item, index) => (
                            <p key={index} className="truncate">
                              {item.quantity}x Product (₹{item.price})
                            </p>
                          ))}
                          {order.items.length > 2 && (
                            <p className="text-blue-600">+{order.items.length - 2} more items</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm mb-2">Delivery</h4>
                        <div className="text-sm text-muted-foreground space-y-1">
                          {order.deliveredAt ? (
                            <p>Delivered: {new Date(order.deliveredAt).toLocaleDateString()}</p>
                          ) : order.cancelledAt ? (
                            <p>Cancelled: {new Date(order.cancelledAt).toLocaleDateString()}</p>
                          ) : (
                            <p>Estimated: TBD</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {order.notes && (
                      <div className="pt-2 border-t">
                        <p className="text-sm text-muted-foreground">
                          <strong>Notes:</strong> {order.notes}
                        </p>
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="flex gap-2 pt-2 border-t">
                      {order.status === 'pending' && (
                        <Button 
                          size="sm" 
                          onClick={() => updateOrderMutation.mutate({ 
                            id: order._id, 
                            status: 'confirmed' 
                          })}
                        >
                          Confirm Order
                        </Button>
                      )}
                      {order.status === 'confirmed' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateOrderMutation.mutate({ 
                            id: order._id, 
                            status: 'processing' 
                          })}
                        >
                          Start Processing
                        </Button>
                      )}
                      {order.status === 'processing' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateOrderMutation.mutate({ 
                            id: order._id, 
                            status: 'shipped' 
                          })}
                        >
                          Mark as Shipped
                        </Button>
                      )}
                      {order.status === 'shipped' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateOrderMutation.mutate({ 
                            id: order._id, 
                            status: 'delivered' 
                          })}
                        >
                          Mark as Delivered
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Orders</CardDescription>
                <CardTitle className="text-2xl">{orders.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Pending Orders</CardDescription>
                <CardTitle className="text-2xl text-yellow-600">
                  {orders.filter((o: Order) => o.status === 'pending').length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Delivered Orders</CardDescription>
                <CardTitle className="text-2xl text-green-600">
                  {orders.filter((o: Order) => o.status === 'delivered').length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Revenue</CardDescription>
                <CardTitle className="text-2xl text-blue-600">
                  ₹{orders.reduce((sum: number, o: Order) => sum + o.finalAmount, 0).toLocaleString()}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Revenue Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
              <CardDescription>Monthly revenue and order trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded">
                <p className="text-muted-foreground">Revenue charts coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
