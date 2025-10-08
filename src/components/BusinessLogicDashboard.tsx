import React, { useState, useEffect } from 'react';
import {
  Calculator,
  Weight,
  Package,
  Percent,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info,
  Truck
} from 'lucide-react';

interface BusinessMetrics {
  totalOrders: number;
  totalFillerCharges: number;
  weightOverageCount: number;
  tierDistribution: {
    T1: number;
    T2: number;
    T3: number;
  };
  averageOrderWeight: number;
  pickupForcedOrders: number;
}

const BusinessLogicDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Mock data for demonstration - replace with actual API calls
  const fetchBusinessMetrics = async () => {
    try {
      setLoading(true);
      
      // In a real implementation, you'd fetch this from your backend
      const mockMetrics: BusinessMetrics = {
        totalOrders: 156,
        totalFillerCharges: 2847.50,
        weightOverageCount: 23,
        tierDistribution: {
          T1: 45,
          T2: 78,
          T3: 33
        },
        averageOrderWeight: 28500,
        pickupForcedOrders: 12
      };
      
      setMetrics(mockMetrics);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinessMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
        <AlertTriangle className="h-5 w-5 text-red-500" />
        <span className="text-red-700">{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <Calculator className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Business Logic Dashboard</h2>
      </div>

      {/* Business Rules Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Percent className="h-5 w-5 text-blue-600" />
            <h3 className="font-medium text-blue-800">Filler Charges</h3>
          </div>
          <p className="text-2xl font-bold text-blue-900">50%</p>
          <p className="text-sm text-blue-700">Rate for incomplete crates</p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Weight className="h-5 w-5 text-yellow-600" />
            <h3 className="font-medium text-yellow-800">Weight Limit</h3>
          </div>
          <p className="text-2xl font-bold text-yellow-900">48,000</p>
          <p className="text-sm text-yellow-700">Pounds per delivery</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <h3 className="font-medium text-green-800">Tier Discounts</h3>
          </div>
          <p className="text-sm font-bold text-green-900">T1: 20% | T2: 15% | T3: 10%</p>
          <p className="text-sm text-green-700">Customer tier benefits</p>
        </div>
      </div>

      {/* Current Metrics */}
      {metrics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Package className="h-5 w-5 text-gray-600" />
                <h3 className="font-medium">Total Orders</h3>
              </div>
              <p className="text-2xl font-bold">{metrics.totalOrders}</p>
              <p className="text-sm text-gray-600">This month</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Calculator className="h-5 w-5 text-orange-600" />
                <h3 className="font-medium">Filler Charges</h3>
              </div>
              <p className="text-2xl font-bold">${metrics.totalFillerCharges.toFixed(2)}</p>
              <p className="text-sm text-gray-600">Revenue from fillers</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Weight className="h-5 w-5 text-yellow-600" />
                <h3 className="font-medium">Avg Order Weight</h3>
              </div>
              <p className="text-2xl font-bold">{metrics.averageOrderWeight.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Pounds per order</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <h3 className="font-medium">Weight Overages</h3>
              </div>
              <p className="text-2xl font-bold">{metrics.weightOverageCount}</p>
              <p className="text-sm text-gray-600">Orders over 48K lbs</p>
            </div>
          </div>

          {/* Tier Distribution */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Customer Tier Distribution</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="bg-blue-100 rounded-lg p-4 mb-2">
                  <p className="text-3xl font-bold text-blue-800">{metrics.tierDistribution.T1}</p>
                  <p className="text-sm text-blue-600">Tier 1 Customers</p>
                </div>
                <div className="bg-blue-50 rounded p-2">
                  <p className="text-sm font-medium text-blue-800">20% Discount</p>
                  <p className="text-xs text-blue-600">Premium tier</p>
                </div>
              </div>

              <div className="text-center">
                <div className="bg-green-100 rounded-lg p-4 mb-2">
                  <p className="text-3xl font-bold text-green-800">{metrics.tierDistribution.T2}</p>
                  <p className="text-sm text-green-600">Tier 2 Customers</p>
                </div>
                <div className="bg-green-50 rounded p-2">
                  <p className="text-sm font-medium text-green-800">15% Discount</p>
                  <p className="text-xs text-green-600">Standard tier</p>
                </div>
              </div>

              <div className="text-center">
                <div className="bg-gray-100 rounded-lg p-4 mb-2">
                  <p className="text-3xl font-bold text-gray-800">{metrics.tierDistribution.T3}</p>
                  <p className="text-sm text-gray-600">Tier 3 Customers</p>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-sm font-medium text-gray-800">10% Discount</p>
                  <p className="text-xs text-gray-600">Basic tier</p>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <Truck className="h-5 w-5" />
                <span>Delivery Insights</span>
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Forced Pickup Orders:</span>
                  <span className="font-medium">{metrics.pickupForcedOrders}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Weight Limit Exceeded:</span>
                  <span className="font-medium">{metrics.weightOverageCount}</span>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-yellow-700">
                      {metrics.pickupForcedOrders} orders required pickup due to weight limits
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <Calculator className="h-5 w-5" />
                <span>Business Logic Impact</span>
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Filler Revenue:</span>
                  <span className="font-medium text-green-600">${metrics.totalFillerCharges.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Avg Filler per Order:</span>
                  <span className="font-medium">${(metrics.totalFillerCharges / metrics.totalOrders).toFixed(2)}</span>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-700">
                      Business logic is generating additional revenue
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Business Rules Reference */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <Info className="h-5 w-5" />
          <span>Active Business Rules</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium mb-2">Pricing Rules:</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• Filler pieces charged at 50% rate</li>
              <li>• Tier-based discounts apply to all items</li>
              <li>• Custom discounts override tier discounts</li>
              <li>• Price calculated per unit/piece</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Logistics Rules:</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• Maximum 48,000 lbs per delivery</li>
              <li>• Orders over limit force pickup</li>
              <li>• Weight calculated per item</li>
              <li>• Delivery method affects pricing</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessLogicDashboard;