// User Types
export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  address?: string;
  tier: 'T1' | 'T2' | 'T3';
  customDiscount?: number;
  isActive: boolean;
  role: 'super_admin' | 'admin' | 'staff' | 'customer';
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
  tier?: 'T1' | 'T2' | 'T3';
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
  name: 'T1' | 'T2' | 'T3';
  description: string;
  discountPercentage: number;
  minOrderValue: number;
  features: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Dashboard Analytics Types
export interface DashboardStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  recentOrders: Order[];
  recentUsers: User[];
  salesData: Array<{
    date: string;
    sales: number;
    orders: number;
  }>;
  userGrowth: Array<{
    date: string;
    users: number;
  }>;
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
  _id: string;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

// Security Log Types
export interface SecurityLog {
  _id: string;
  type: 'failed_login' | 'token_expired' | 'suspicious_activity' | 'access_denied';
  userId?: string;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
  timestamp: string;
}
