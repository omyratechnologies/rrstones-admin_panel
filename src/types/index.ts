// User Types
export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  address?: string;
  tier: string; // Changed from 'T1' | 'T2' | 'T3' to string for dynamic tiers
  customDiscount?: number;
  isActive: boolean;
  role: 'super_admin' | 'admin' | 'staff' | 'customer';
  permissions?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  phone: string;
  company?: string;
  address?: string;
  password: string;
  role: 'admin' | 'staff' | 'customer';
  tier?: string; // Changed from 'T1' | 'T2' | 'T3' to string for dynamic tiers
  customDiscount?: number;
}

// Granite Types
export interface GraniteVariant {
  _id: string;
  name: string;
  image: string;
  description: string;
  meta_data?: any;
  createdAt: string;
  updatedAt: string;
}

export interface SpecificGraniteVariant {
  _id: string;
  variantId: string;
  name: string;
  image: string;
  description: string;
  meta_data?: any;
  createdAt: string;
  updatedAt: string;
}

export interface Dimension {
  length: string;
  width: string;
  thickness: string;
}

export interface GraniteProduct {
  _id: string;
  variantSpecificId: string;
  name: string;
  finish: string[];
  dimensions: Dimension[];
  unit: string;
  basePrice: number;
  stock: number;
  images: string[];
  applications: string[];
  status: 'active' | 'inactive' | 'out_of_stock';
  createdAt: string;
  updatedAt: string;
}

// Order Types
export interface OrderItem {
  productId: string;
  quantity: number;
  dimensions: Dimension;
  finish: string;
  price: number;
  discount: number;
  total: number;
}

export interface Order {
  _id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
  cancelledAt?: string;
}

// Invoice Types
export interface Invoice {
  _id: string;
  orderId: string;
  userId: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Tier Types
export interface Tier {
  _id: string;
  tier: string; // Changed from 'T1' | 'T2' | 'T3' to string for dynamic tiers
  discountPercent: number;
  description: string;
  minimumOrderValue?: number;
  benefits?: string[];
  isActive: boolean;
  userCount?: number; // For analytics
  createdAt: string;
  updatedAt: string;
}

// Dashboard Analytics Types
export interface DashboardStats {
  analytics: {
    period: string;
    summary: {
      revenue: {
        current: number;
        previous: number;
        growth: number;
      };
      orders: {
        current: number;
        previous: number;
        growth: number;
      };
      users: {
        current: number;
        previous: number;
        growth: number;
      };
      products: number;
      averageOrderValue: number;
    };
    breakdowns: {
      orderStatus: Record<string, { count: number; revenue: number }>;
      paymentStatus: Record<string, { count: number; revenue: number }>;
      userTiers: Record<string, number>;
    };
    topProducts: Array<{
      _id: string;
      totalRevenue: number;
      totalQuantity: number;
      orderCount: number;
      productName: string;
      productColor: string;
    }>;
    recentActivity: Order[];
  };
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  responseTime?: number;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Extended response for user management with additional data structure
export interface UserManagementResponse {
  success: boolean;
  message: string;
  data: {
    users: User[];
    pagination: {
      current: number;
      total: number;
      totalItems: number;
      limit: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    filters: {
      tier: string | null;
      role: string | null;
      isActive: boolean | null;
      search: string | null;
    };
  };
}

// Form Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends CreateUserData {}

// Filter Types
export interface UserFilters {
  role?: string;
  tier?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeCustomers?: string; // 'true' | 'false' to control customer visibility in admin panel
}

export interface OrderFilters {
  status?: string;
  paymentStatus?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Activity Log Types
export interface ActivityLog {
  id: string;
  userId?: string;
  user: string;
  action: string;
  details: string;
  result?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

// Security Log Types
export interface SecurityLog {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  event: string;
  details: string;
  status: string;
  timestamp: string;
}

// Session Types
export interface Session {
  id: string;
  userId: string;
  userEmail: string;
  device: string;
  location: string;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
  lastActivity: string;
  loginTime: string;
  duration: string;
}

export interface SessionsResponse {
  sessions: Session[];
}
