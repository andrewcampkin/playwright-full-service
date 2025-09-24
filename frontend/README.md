# Frontend - Playwright AI Service

> **React + TypeScript + Vite frontend for the Playwright AI Service platform.**

This frontend provides a modern, responsive interface for the AI-powered test generation and execution platform.

## 🚀 **Quick Start**

```bash
# Install dependencies
yarn install

# Start development server
yarn dev

# Build for production
yarn build
```

## 🏗️ **Architecture**

### **Key Components**
- **UnauthenticatedHome** - Landing page with test generation
- **AuthenticatedDashboard** - Full-featured test management
- **TestExecutionDashboard** - Test execution and monitoring
- **TestResultsSummary** - Analytics and results

### **Authentication Flow**
- **Public Access** - Generate tests without signup
- **Sign-up Modal** - Save tests after generation
- **Login Modal** - Access existing account
- **Protected Routes** - Full dashboard access

## 🎨 **Tech Stack**

### **Core Technologies**
- **[React 18](https://reactjs.org/)** - UI framework
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Vite](https://vitejs.dev/)** - Build tool and dev server
- **[Tailwind CSS](https://tailwindcss.com/)** - Styling

### **Key Libraries**
- **[Lucide React](https://lucide.dev/)** - Icons
- **React Hooks** - State management
- **Fetch API** - HTTP requests
- **Context API** - Global state

## 🔧 **Development**

### **Available Scripts**
```bash
yarn dev          # Start development server
yarn build        # Build for production
yarn preview      # Preview production build
yarn lint         # Run ESLint
yarn type-check   # Run TypeScript compiler
```

### **Environment Variables**
```env
VITE_API_BASE_URL=http://localhost:3001/api
```

## 📱 **Features**

### **Unauthenticated Experience**
- Beautiful landing page with value proposition
- URL input for test generation
- Test results preview
- Sign-up flow to save tests

### **Authenticated Experience**
- User dashboard with project overview
- Test suite management
- Test execution monitoring
- Results analytics and trends

### **Responsive Design**
- Mobile-first approach
- Tablet and desktop optimized
- Touch-friendly interactions
- Accessible UI components

## 🎯 **User Journeys**

### **New User Flow**
1. Land on homepage
2. Enter URL and generate tests
3. See results preview
4. Sign up to save tests
5. Access full dashboard

### **Existing User Flow**
1. Sign in to dashboard
2. Select or create test suites
3. Execute tests with monitoring
4. View results and analytics
5. Get AI improvement suggestions

## 🔗 **API Integration**

The frontend integrates with the backend API:

### **Public Endpoints**
- `POST /api/crawl-and-generate` - Generate tests

### **Protected Endpoints**
- `GET /api/protected/projects` - User projects
- `POST /api/protected/crawl-and-generate` - Save tests
- `POST /api/protected/execute-test` - Run tests
- `GET /api/protected/executions` - Execution history

## 📖 **Documentation**

For complete platform documentation, see:
- **[Main Documentation](../README.md)** - Complete platform overview
- **[Test Execution Guide](../docs/test-execution.md)** - Frontend features
- **[Setup Guides](../docs/)** - Backend setup and configuration

---

**Built with React, TypeScript, and Vite for the Playwright AI Service platform.**
