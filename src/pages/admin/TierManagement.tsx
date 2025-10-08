import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, Search, Users, ShoppingCart, BarChart3, Star, Gift, UserCheck, Activity } from 'lucide-react';
import type { Tier } from '@/types';
import { tierApi } from '@/services/businessApi';

interface TierStats {
  totalTiers: number;
  activeTiers: number;
  totalUsers: number;
  distributionData: {
    tier: string;
    userCount: number;
    percentage: number;
  }[];
  revenueByTier: {
    tier: string;
    revenue: number;
  }[];
}

const TierManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
  const [tierStats, setTierStats] = useState<TierStats | null>(null);

  // Form state for tier creation/editing
  const [formData, setFormData] = useState({
    tier: '' as 'T1' | 'T2' | 'T3' | '',
    discountPercent: 0,
    description: '',
    isActive: true,
    minimumOrderValue: 0,
    benefits: [] as string[]
  });

  // Fetch tiers data
  const fetchTiers = async () => {
    try {
      setLoading(true);
      const response = await tierApi.getTiers();
      if (response.data) {
        setTiers(response.data.tiers);
      }
    } catch (error) {
      console.error('Error fetching tiers:', error);
      alert('Failed to fetch tiers data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch tier statistics
  const fetchTierStats = async () => {
    try {
      const response = await tierApi.getTierStats();
      if (response.data) {
        // Transform the response to match our TierStats interface
        const stats: TierStats = {
          totalTiers: response.data.tiers.length,
          activeTiers: response.data.tiers.filter(t => t.isActive).length,
          totalUsers: response.data.totalUsers,
          distributionData: response.data.tiers.map(tier => ({
            tier: tier.tier,
            userCount: tier.userCount || 0,
            percentage: response.data!.totalUsers > 0 ? ((tier.userCount || 0) / response.data!.totalUsers) * 100 : 0
          })),
          revenueByTier: response.data.tiers.map(tier => ({
            tier: tier.tier,
            revenue: 0 // This would need to be calculated from actual data
          }))
        };
        setTierStats(stats);
      }
    } catch (error) {
      console.error('Error fetching tier stats:', error);
    }
  };

  useEffect(() => {
    fetchTiers();
    fetchTierStats();
  }, []);

  // Filter tiers based on search and status
  const filteredTiers = tiers.filter(tier => {
    const matchesSearch = tier.tier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && tier.isActive) ||
      (statusFilter === 'inactive' && !tier.isActive);
    return matchesSearch && matchesStatus;
  });

  // Reset form data
  const resetForm = () => {
    setFormData({
      tier: '' as 'T1' | 'T2' | 'T3' | '',
      discountPercent: 0,
      description: '',
      isActive: true,
      minimumOrderValue: 0,
      benefits: []
    });
  };

  // Handle tier creation
  const handleCreateTier = async () => {
    if (!formData.tier) {
      alert('Please select a tier');
      return;
    }
    
    try {
      const tierData = {
        tier: formData.tier as 'T1' | 'T2' | 'T3',
        discountPercent: formData.discountPercent,
        description: formData.description,
        isActive: formData.isActive,
        minimumOrderValue: formData.minimumOrderValue,
        benefits: formData.benefits
      };
      await tierApi.createTier(tierData);
      alert('Tier created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
      fetchTiers();
      fetchTierStats();
    } catch (error) {
      console.error('Error creating tier:', error);
      alert('Failed to create tier');
    }
  };

  // Handle tier update
  const handleUpdateTier = async () => {
    if (!selectedTier) return;
    
    try {
      const tierData = {
        tier: formData.tier as 'T1' | 'T2' | 'T3',
        discountPercent: formData.discountPercent,
        description: formData.description,
        isActive: formData.isActive,
        minimumOrderValue: formData.minimumOrderValue,
        benefits: formData.benefits
      };
      await tierApi.updateTier(selectedTier.tier, tierData);
      alert('Tier updated successfully');
      setIsEditDialogOpen(false);
      setSelectedTier(null);
      resetForm();
      fetchTiers();
      fetchTierStats();
    } catch (error) {
      console.error('Error updating tier:', error);
      alert('Failed to update tier');
    }
  };

  // Handle tier deletion
  const handleDeleteTier = async (tierName: string) => {
    if (window.confirm('Are you sure you want to delete this tier?')) {
      try {
        await tierApi.deleteTier(tierName);
        alert('Tier deleted successfully');
        fetchTiers();
        fetchTierStats();
      } catch (error) {
        console.error('Error deleting tier:', error);
        alert('Failed to delete tier');
      }
    }
  };

  // Open edit dialog with tier data
  const openEditDialog = (tier: Tier) => {
    setSelectedTier(tier);
    setFormData({
      tier: tier.tier as 'T1' | 'T2' | 'T3',
      discountPercent: tier.discountPercent,
      description: tier.description,
      isActive: tier.isActive,
      minimumOrderValue: tier.minimumOrderValue || 0,
      benefits: tier.benefits || []
    });
    setIsEditDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading tier management...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tier Management</h1>
          <p className="text-muted-foreground mt-2">Manage customer tiers and discount levels</p>
        </div>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Tier
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="manage">Manage Tiers</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {tierStats && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Tiers</CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{tierStats.totalTiers}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Tiers</CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{tierStats.activeTiers}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{tierStats.totalUsers}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tier Distribution</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{tierStats.distributionData.length}</div>
                    <p className="text-xs text-muted-foreground">Active distributions</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Tier Distribution</CardTitle>
                    <CardDescription>User distribution across tiers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {tierStats.distributionData.map((item, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{item.tier}</span>
                            <span>{item.userCount} users ({item.percentage.toFixed(1)}%)</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${item.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Revenue by Tier</CardTitle>
                    <CardDescription>Revenue performance across tiers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {tierStats.revenueByTier.map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="font-medium">{item.tier}</span>
                          <span className="text-lg font-bold">₹{item.revenue.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Manage Tiers Tab */}
        <TabsContent value="manage" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tiers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md"
              >
                <option value="all">All Tiers</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTiers.map((tier) => (
              <Card key={tier._id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{tier.tier}</CardTitle>
                      <CardDescription>
                        {tier.discountPercent}% discount
                      </CardDescription>
                    </div>
                    <Badge variant={tier.isActive ? "default" : "secondary"}>
                      {tier.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {tier.minimumOrderValue && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ShoppingCart className="h-4 w-4" />
                        Min Order: ₹{tier.minimumOrderValue.toLocaleString()}
                      </div>
                    )}
                    {tier.benefits && tier.benefits.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Gift className="h-4 w-4" />
                        {tier.benefits.join(', ')}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(tier)}
                      className="flex-1"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTier(tier.tier)}
                      className="text-error hover:text-error"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTiers.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Star className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No tiers found</h3>
                <p className="text-muted-foreground text-center">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Create your first tier to get started.'
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="bg-primary-lighter border border-primary-light rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <p className="text-primary">
                Tier analytics help you understand user distribution and revenue performance across different tiers.
              </p>
            </div>
          </div>

          {tierStats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Growth by Tier</CardTitle>
                  <CardDescription>Track how users are distributed across tiers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tierStats.distributionData.map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{item.tier}</span>
                          <div className="text-right">
                            <div className="font-bold">{item.userCount}</div>
                            <div className="text-sm text-muted-foreground">{item.percentage.toFixed(1)}%</div>
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-success h-2 rounded-full" 
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue Performance</CardTitle>
                  <CardDescription>Revenue generated by each tier</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tierStats.revenueByTier.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-background rounded-lg">
                        <div>
                          <div className="font-medium">{item.tier}</div>
                          <div className="text-sm text-muted-foreground">Tier Revenue</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">₹{item.revenue.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">Total</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Tier Modal */}
      {isCreateDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 max-w-md w-full m-4">
            <h2 className="text-xl font-bold mb-4">Create New Tier</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tier Name</label>
                <select 
                  value={formData.tier}
                  onChange={(e) => setFormData({ ...formData, tier: e.target.value as 'T1' | 'T2' | 'T3' | '' })}
                  className="w-full px-3 py-2 border border-input rounded-md"
                >
                  <option value="">Select Tier</option>
                  <option value="T1">T1</option>
                  <option value="T2">T2</option>
                  <option value="T3">T3</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tier description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Discount Percentage</label>
                <Input
                  type="number"
                  value={formData.discountPercent}
                  onChange={(e) => setFormData({ ...formData, discountPercent: Number(e.target.value) })}
                  placeholder="0"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Minimum Order Value</label>
                <Input
                  type="number"
                  value={formData.minimumOrderValue}
                  onChange={(e) => setFormData({ ...formData, minimumOrderValue: Number(e.target.value) })}
                  placeholder="0"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Benefits (comma-separated)</label>
                <textarea
                  value={formData.benefits.join(', ')}
                  onChange={(e) => setFormData({ ...formData, benefits: e.target.value.split(',').map(b => b.trim()).filter(b => b) })}
                  placeholder="Fast shipping, Priority support, etc."
                  rows={3}
                  className="w-full px-3 py-2 border border-input rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select 
                  value={formData.isActive ? 'active' : 'inactive'} 
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                  className="w-full px-3 py-2 border border-input rounded-md"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button onClick={handleCreateTier} className="flex-1">
                Create Tier
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  resetForm();
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Tier Modal */}
      {isEditDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 max-w-md w-full m-4">
            <h2 className="text-xl font-bold mb-4">Edit Tier</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tier Name</label>
                <select 
                  value={formData.tier}
                  onChange={(e) => setFormData({ ...formData, tier: e.target.value as 'T1' | 'T2' | 'T3' | '' })}
                  className="w-full px-3 py-2 border border-input rounded-md"
                >
                  <option value="">Select Tier</option>
                  <option value="T1">T1</option>
                  <option value="T2">T2</option>
                  <option value="T3">T3</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tier description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Discount Percentage</label>
                <Input
                  type="number"
                  value={formData.discountPercent}
                  onChange={(e) => setFormData({ ...formData, discountPercent: Number(e.target.value) })}
                  placeholder="0"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Minimum Order Value</label>
                <Input
                  type="number"
                  value={formData.minimumOrderValue}
                  onChange={(e) => setFormData({ ...formData, minimumOrderValue: Number(e.target.value) })}
                  placeholder="0"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Benefits (comma-separated)</label>
                <textarea
                  value={formData.benefits.join(', ')}
                  onChange={(e) => setFormData({ ...formData, benefits: e.target.value.split(',').map(b => b.trim()).filter(b => b) })}
                  placeholder="Fast shipping, Priority support, etc."
                  rows={3}
                  className="w-full px-3 py-2 border border-input rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select 
                  value={formData.isActive ? 'active' : 'inactive'} 
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                  className="w-full px-3 py-2 border border-input rounded-md"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button onClick={handleUpdateTier} className="flex-1">
                Update Tier
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedTier(null);
                  resetForm();
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TierManagement;
