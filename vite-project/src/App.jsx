import React, { Suspense, lazy } from 'react'
import { Navigate, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { LoaderCircle } from 'lucide-react'
import DashboardLayout from './components/DashboardLayout.jsx'
import PackageRoute from './components/PackageRoute.jsx'
import PermissionRoute from './components/PermissionRoute.jsx'
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
          <Route
            path="/notes"
            element={<PermissionRoute permission="notes.read" title="Notes access is restricted"><LazyScreen><HomePages /></LazyScreen></PermissionRoute>}
          />
          <Route
            path="/todos"
            element={<PermissionRoute permission="todos.read" title="Tasks access is restricted"><LazyScreen><TodoPage /></LazyScreen></PermissionRoute>}
          />
          <Route
            path="/accounting"
            element={<PermissionRoute permission="accounting.read" title="Finance access is restricted"><LazyScreen><AccountingPage /></LazyScreen></PermissionRoute>}
          />
          <Route
            path="/inventory"
            element={<PermissionRoute permission="inventory.read" title="Stock access is restricted"><LazyScreen><InventoryPage /></LazyScreen></PermissionRoute>}
          />
          <Route
            path="/reports"
            element={<PermissionRoute permission="reports.read" title="Report access is restricted"><LazyScreen><ReportsPage /></LazyScreen></PermissionRoute>}
          />
          <Route
            path="/purchases"
            element={<PermissionRoute permission="purchases.read" title="Purchase access is restricted"><LazyScreen><PurchasePage /></LazyScreen></PermissionRoute>}
          />
          <Route
            path="/customers"
            element={<PermissionRoute permission="customers.read" title="Customer access is restricted"><LazyScreen><CustomersPage /></LazyScreen></PermissionRoute>}
          />
          <Route
            path="/invoices"
            element={(
              <PermissionRoute
                permission="invoices.read"
                title="Invoice access is restricted"
                message="This workspace is available only to roles with invoice access."
              >
                <LazyScreen><InvoicesPage /></LazyScreen>
              </PermissionRoute>
            )}
          />
          <Route
            path="/invoices/new"
            element={(
              <PermissionRoute
                permission="invoices.create"
                title="Invoice creation is restricted"
                message="Your role can open the workspace, but it cannot create new invoices."
              >
                <LazyScreen><InvoiceFormPage /></LazyScreen>
              </PermissionRoute>
            )}
          />
          <Route
            path="/invoices/:id"
            element={(
              <PermissionRoute
                permission="invoices.read"
                title="Invoice access is restricted"
                message="Your role does not have permission to open invoice details."
              >
                <LazyScreen><InvoiceDetailPage /></LazyScreen>
              </PermissionRoute>
            )}
          />
          <Route
            path="/invoices/:id/edit"
            element={(
              <PermissionRoute
                permission="invoices.update"
                title="Invoice editing is restricted"
                message="Your role does not have permission to edit invoice records."
              >
                <LazyScreen><InvoiceFormPage /></LazyScreen>
              </PermissionRoute>
            )}
          />
          <Route
            path="/crm"
            element={<PermissionRoute permission="crm.read" title="CRM access is restricted"><LazyScreen><CRMPage /></LazyScreen></PermissionRoute>}
          />
          <Route path="/crm/leads" element={<Navigate to="/crm" replace />} />
          <Route path="/crm/leads/new" element={<Navigate to="/crm" replace />} />
          <Route path="/crm/leads/:id/edit" element={<Navigate to="/crm" replace />} />
          <Route path="/crm/pipeline" element={<Navigate to="/crm" replace />} />
          <Route
            path="/pos"
            element={<PermissionRoute permission="pos.read" title="POS access is restricted"><LazyScreen><POSDashboard /></LazyScreen></PermissionRoute>}
          />
          <Route
            path="/pos/products"
            element={<PermissionRoute permission="pos.products.read" title="Menu item access is restricted"><LazyScreen><ProductManagement /></LazyScreen></PermissionRoute>}
          />
          <Route
            path="/pos/customers"
            element={<PermissionRoute permission="pos.customers.read" title="Guest access is restricted"><LazyScreen><CustomerManagement /></LazyScreen></PermissionRoute>}
          />
          <Route
            path="/pos/billing"
            element={<PermissionRoute permission="pos.sales.create" title="Billing access is restricted"><LazyScreen><BillingScreen /></LazyScreen></PermissionRoute>}
          />
          <Route
            path="/pos/sales"
            element={<PermissionRoute permission="pos.sales.read" title="Sales history access is restricted"><LazyScreen><SalesHistory /></LazyScreen></PermissionRoute>}
          />
          <Route
            path="/pos/sales/:id"
            element={<PermissionRoute permission="pos.sales.read" title="Sale detail access is restricted"><LazyScreen><PosInvoiceDetail /></LazyScreen></PermissionRoute>}
          />
          <Route
            path="/pos/tables"
            element={<PermissionRoute permission="pos.tables.read" title="Floor access is restricted"><LazyScreen><TableManagement /></LazyScreen></PermissionRoute>}
          />
          <Route
            path="/pos/kds"
            element={<PermissionRoute permission="pos.kitchen.read" title="Kitchen access is restricted"><LazyScreen><KitchenDisplay /></LazyScreen></PermissionRoute>}
          />
          <Route
            path="/pos/shifts"
            element={<PermissionRoute permission="pos.shifts.read" title="Shift access is restricted"><LazyScreen><ShiftManagement /></LazyScreen></PermissionRoute>}
          />
          <Route path="/apps" element={<LazyScreen><AppSwitcher /></LazyScreen>} />
          <Route
            path="/settings"
            element={<PermissionRoute permission="settings.read" title="Settings access is restricted"><LazyScreen><SettingsPage /></LazyScreen></PermissionRoute>}
          />
        </Route>
      </Routes>
    </div>
  )
}

export default App
