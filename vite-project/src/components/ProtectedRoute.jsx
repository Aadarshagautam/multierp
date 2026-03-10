import React, { useContext } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import AppContext from '../context/app-context.js'
import StatePanel from './StatePanel.jsx'

const ProtectedRoute = ({ children }) => {
  const { isLoggedin, loading, hasCheckedAuth } = useContext(AppContext)
  const location = useLocation()

  if (!hasCheckedAuth || loading) {
    return (
      <div className="page-shell">
        <StatePanel
          icon={ShieldCheck}
          tone="teal"
          title="Checking workspace access"
          message="Verifying your session, branch, and permissions before the workspace opens."
        />
      </div>
    )
  }

  if (!isLoggedin) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}

export default ProtectedRoute
