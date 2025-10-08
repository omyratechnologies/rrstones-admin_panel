import React, { useState } from 'react';
import { 
  Calculator, 
  ShoppingCart, 
  Package, 
  BarChart3
} from 'lucide-react';
import CartManagement from '@/components/CartManagement';
import EnhancedOrderManagement from '@/components/EnhancedOrderManagement';
import BusinessLogicDashboard from '@/components/BusinessLogicDashboard';

type TabType = 'dashboard' | 'cart' | 'orders';

const BusinessLogicPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');

  const tabs = [
    {
      id: 'dashboard' as TabType,
      name: 'Business Logic Dashboard',
      icon: BarChart3,
      description: 'View business rules and metrics'
    },
    {
      id: 'cart' as TabType,
      name: 'Cart Management',
      icon: ShoppingCart,
      description: 'Manage cart with business logic'
    },
    {
      id: 'orders' as TabType,
      name: 'Enhanced Orders',
      icon: Package,
      description: 'View orders with business calculations'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <BusinessLogicDashboard />;
      case 'cart':
        return <CartManagement />;
      case 'orders':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="Enter Order ID"
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => setSelectedOrderId('')}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Clear
              </button>
            </div>
            <EnhancedOrderManagement orderId={selectedOrderId} />
          </div>
        );
      default:
        return <BusinessLogicDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Calculator className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">RR Stone Business Logic</h1>
          </div>
          <p className="text-gray-600">
            Advanced business logic implementation with filler charges, weight validation, and tier-based pricing
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border border-gray-200 rounded-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Description */}
          <div className="px-6 py-3 bg-gray-50">
            <p className="text-sm text-gray-600">
              {tabs.find(tab => tab.id === activeTab)?.description}
            </p>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          {renderTabContent()}
        </div>

        {/* Business Logic Summary */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">
            Implemented Business Logic Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h3 className="font-medium text-blue-800 mb-2">Pricing Logic</h3>
              <ul className="space-y-1 text-blue-700">
                <li>• 50% filler charges for incomplete crates</li>
                <li>• Tier-based discounts (T1: 20%, T2: 15%, T3: 10%)</li>
                <li>• Dynamic price calculations</li>
                <li>• Custom discount overrides</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-blue-800 mb-2">Weight Management</h3>
              <ul className="space-y-1 text-blue-700">
                <li>• 48,000 lbs delivery limit</li>
                <li>• Automatic pickup enforcement</li>
                <li>• Per-item weight calculations</li>
                <li>• Delivery method optimization</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-blue-800 mb-2">Order Processing</h3>
              <ul className="space-y-1 text-blue-700">
                <li>• Mixed crate/piece ordering</li>
                <li>• Stock reservation system</li>
                <li>• Business logic integration</li>
                <li>• Enhanced order metadata</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessLogicPage;