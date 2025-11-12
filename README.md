# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

# RRStones Admin Dashboard

A modern, enterprise-grade admin dashboard for RRStones granite business management system built with React, TypeScript, and TailwindCSS.

## 🚀 Features

### ✅ Completed Features

- **Authentication & Authorization**
  - Role-based access control (SuperAdmin, Admin, Staff, Customer)
  - JWT token-based authentication
  - Secure login/logout system
  - Protected routes

- **User Management**
  - Complete CRUD operations for users
  - User status management (active/inactive)
  - Role and tier management
  - Advanced search and filtering
  - Bulk operations
  - CSV/Excel export
  - Real-time statistics dashboard

- **Modern UI/UX**
  - Responsive design with TailwindCSS
  - Dark/Light theme support
  - shadcn/ui component library
  - Mobile-friendly sidebar navigation
  - Real-time notifications
  - Loading states and error handling

### 🚧 In Development

- **Granite Management System**
  - Hierarchical product structure (Variant → Specific Variant → Product)
  - Image management and galleries
  - Inventory tracking
  - Pricing with tier-based discounts
  - Bulk import/export capabilities

- **Order Management**
  - Order lifecycle management
  - Status tracking and updates
  - Invoice generation
  - Payment status monitoring

- **CRM Module**
  - Customer lifecycle management
  - Activity history tracking
  - Notes and communications
  - Customer journey analytics

- **Analytics & Reporting**
  - Sales analytics with charts
  - Inventory analytics
  - Customer behavior insights
  - Custom report generation
  - Data visualization with Recharts

- **Audit & Logging**
  - Activity logs for all critical actions
  - Security logs for failed logins
  - Queryable and filterable logs
  - Export capabilities

## 🛠️ Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Styling**: TailwindCSS + shadcn/ui components
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Routing**: React Router v6
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite
- **Charts**: Recharts
- **Icons**: Lucide React

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/                 # Reusable UI components (shadcn/ui)
│   └── layout/             # Layout components (Sidebar, Header)
├── pages/                  # Page components
│   ├── users/             # User management pages
│   ├── granite/           # Granite management pages
│   └── ...
├── services/              # API services
│   ├── apiService.ts      # Base API client
│   ├── authApi.ts         # Authentication API
│   ├── graniteApi.ts      # Granite management API
│   └── businessApi.ts     # Business operations API
├── store/                 # Zustand stores
│   ├── authStore.ts       # Authentication state
│   └── uiStore.ts         # UI state (theme, notifications)
├── types/                 # TypeScript type definitions
├── lib/                   # Utility functions
└── App.tsx               # Main application component
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- RRStones backend API running on `http://localhost:5000`

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

3. **Access the application**
   - Open http://localhost:5173 in your browser
   - Use backend admin credentials to login

### Building for Production

```bash
npm run build
npm run preview
```

## 🔐 Authentication

Role-based access control with SuperAdmin, Admin, Staff, and Customer roles.

## 📱 Responsive Design

Fully responsive with mobile-first approach and touch-friendly interface.

---

**Built with ❤️ for RRStones - Modern granite business management**

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
# RRStones-admin
