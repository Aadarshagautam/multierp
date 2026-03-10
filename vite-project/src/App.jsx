import React, { Suspense, lazy } from 'react'
import { Navigate, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { LoaderCircle } from 'lucide-react'
import DashboardLayout from './components/DashboardLayout.jsx'
import PackageRoute from './components/PackageRoute.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import StatePanel from './components/StatePanel.jsx'

const Login = lazy(() => import('./Pages/Auth/Login.jsx'))
const EmailVerifty = lazy(() => import('./Pages/Auth/EmailVerifty.jsx'))
const ResetPassword = lazy(() => import('./Pages/Auth/ResetPassword.jsx'))
const CreatePages = lazy(() => import('./Pages/CreatePages.jsx'))
const NoteDetailPage = lazy(() => import('./Pages/NoteDetailPage.jsx'))
const Dashboard = lazy(() => import('./Pages/Dashboard.jsx'))
const HomePages = lazy(() => import('./Pages/HomePages.jsx'))
const TodoPage = lazy(() => import('./Pages/TodoPage.jsx'))
const AccountingPage = lazy(() => import('./Pages/AccountingPage.jsx'))
const InventoryPage = lazy(() => import('./Pages/InventoryPage.jsx'))
const ReportsPage = lazy(() => import('./Pages/ReportsPage.jsx'))
const PurchasePage = lazy(() => import('./Pages/PurchasePage.jsx'))
const CustomersPage = lazy(() => import('./Pages/CustomersPage.jsx'))
const InvoicesPage = lazy(() => import('./Pages/InvoicesPage.jsx'))
const InvoiceFormPage = lazy(() => import('./Pages/InvoiceFormPage.jsx'))
const InvoiceDetailPage = lazy(() => import('./Pages/InvoiceDetailPage.jsx'))
const CRMPage = lazy(() => import('./Pages/CRMPage.jsx'))
const AppSwitcher = lazy(() => import('./components/AppSwitcher.jsx'))
const SettingsPage = lazy(() => import('./Pages/SettingsPage.jsx'))
const SuiteHomePage = lazy(() => import('./Pages/SuiteHomePage.jsx'))
const LandingPage = lazy(() => import('./Pages/LandingPage.jsx'))
const SoftwareProductPage = lazy(() => import('./Pages/SoftwareProductPage.jsx'))
const POSDashboard = lazy(() => import('./features/pos/POSDashboard.jsx'))
const ProductManagement = lazy(() => import('./features/pos/ProductManagement.jsx'))
const CustomerManagement = lazy(() => import('./features/pos/CustomerManagement.jsx'))
const BillingScreen = lazy(() => import('./features/pos/BillingScreen.jsx'))
const SalesHistory = lazy(() => import('./features/pos/SalesHistory.jsx'))
const PosInvoiceDetail = lazy(() => import('./features/pos/InvoiceDetail.jsx'))
const TableManagement = lazy(() => import('./features/pos/TableManagement.jsx'))
const KitchenDisplay = lazy(() => import('./features/pos/KitchenDisplay.jsx'))
const ShiftManagement = lazy(() => import('./features/pos/ShiftManagement.jsx'))

const RouteLoader = () => (
  <div className="page-shell">
    <StatePanel
      icon={LoaderCircle}
      tone="teal"
      title="Loading workspace"
      message="Preparing the next screen, syncing your workspace, and keeping the navigation responsive."
      className="animate-fade-in"
    />
  </div>
)

const LazyScreen = ({ children }) => (
  <Suspense fallback={<RouteLoader />}>{children}</Suspense>
)

const App = () => {
  return (
    <div className="min-h-screen bg-stone-50">
      <Toaster position="top-right" />
      <Routes>
        <Route
          path="/"
          element={
            <LazyScreen>
              <LandingPage />
            </LazyScreen>
          }
        />
        <Route
          path="/software/:slug"
          element={
            <LazyScreen>
              <SoftwareProductPage />
            </LazyScreen>
          }
        />

        <Route
          path="/login"
          element={
            <LazyScreen>
              <Login />
            </LazyScreen>
          }
        />
        <Route
          path="/email-verifty"
          element={
            <LazyScreen>
              <EmailVerifty />
            </LazyScreen>
          }
        />
        <Route
          path="/reset-password"
          element={
            <LazyScreen>
              <ResetPassword />
            </LazyScreen>
          }
        />

        <Route
          path="/create"
          element={
            <ProtectedRoute>
              <LazyScreen>
                <CreatePages />
              </LazyScreen>
            </ProtectedRoute>
          }
        />
        <Route
          path="/notes/:id"
          element={
            <ProtectedRoute>
              <LazyScreen>
                <NoteDetailPage />
              </LazyScreen>
            </ProtectedRoute>
          }
        />

        <Route
          element={
            <ProtectedRoute>
              <PackageRoute>
                <DashboardLayout />
              </PackageRoute>
            </ProtectedRoute>
          }
        >
          <Route path="/home" element={<LazyScreen><SuiteHomePage /></LazyScreen>} />
          <Route path="/dashboard" element={<LazyScreen><Dashboard /></LazyScreen>} />
          <Route path="/notes" element={<LazyScreen><HomePages /></LazyScreen>} />
          <Route path="/todos" element={<LazyScreen><TodoPage /></LazyScreen>} />
          <Route path="/accounting" element={<LazyScreen><AccountingPage /></LazyScreen>} />
          <Route path="/inventory" element={<LazyScreen><InventoryPage /></LazyScreen>} />
          <Route path="/reports" element={<LazyScreen><ReportsPage /></LazyScreen>} />
          <Route path="/purchases" element={<LazyScreen><PurchasePage /></LazyScreen>} />
          <Route path="/customers" element={<LazyScreen><CustomersPage /></LazyScreen>} />
          <Route path="/invoices" element={<LazyScreen><InvoicesPage /></LazyScreen>} />
          <Route path="/invoices/new" element={<LazyScreen><InvoiceFormPage /></LazyScreen>} />
          <Route path="/invoices/:id" element={<LazyScreen><InvoiceDetailPage /></LazyScreen>} />
          <Route path="/invoices/:id/edit" element={<LazyScreen><InvoiceFormPage /></LazyScreen>} />
          <Route path="/crm" element={<LazyScreen><CRMPage /></LazyScreen>} />
          <Route path="/crm/leads" element={<Navigate to="/crm" replace />} />
          <Route path="/crm/leads/new" element={<Navigate to="/crm" replace />} />
          <Route path="/crm/leads/:id/edit" element={<Navigate to="/crm" replace />} />
          <Route path="/crm/pipeline" element={<Navigate to="/crm" replace />} />
          <Route path="/pos" element={<LazyScreen><POSDashboard /></LazyScreen>} />
          <Route path="/pos/products" element={<LazyScreen><ProductManagement /></LazyScreen>} />
          <Route path="/pos/customers" element={<LazyScreen><CustomerManagement /></LazyScreen>} />
          <Route path="/pos/billing" element={<LazyScreen><BillingScreen /></LazyScreen>} />
          <Route path="/pos/sales" element={<LazyScreen><SalesHistory /></LazyScreen>} />
          <Route path="/pos/sales/:id" element={<LazyScreen><PosInvoiceDetail /></LazyScreen>} />
          <Route path="/pos/tables" element={<LazyScreen><TableManagement /></LazyScreen>} />
          <Route path="/pos/kds" element={<LazyScreen><KitchenDisplay /></LazyScreen>} />
          <Route path="/pos/shifts" element={<LazyScreen><ShiftManagement /></LazyScreen>} />
          <Route path="/apps" element={<LazyScreen><AppSwitcher /></LazyScreen>} />
          <Route path="/settings" element={<LazyScreen><SettingsPage /></LazyScreen>} />
        </Route>
      </Routes>
    </div>
  )
}

export default App
