import React, { useContext } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import AppContext from '../context/app-context.js'
import StatePanel from './StatePanel.jsx'

const PermissionRoute = ({
  children,
  permission,
  title = 'Access restricted',
  message = 'Your role does not currently allow this workspace.',
  actionLabel = 'Return to dashboard',
  actionTo = '/dashboard',
}) => {
  const location = useLocation()
  const { hasPermission } = useContext(AppContext)

  if (!permission || hasPermission(permission)) {
    return children
  }

  return (
    <div className="page-shell">
      <StatePanel
        icon={ShieldAlert}
        tone="amber"
        title={title}
        message={`${message} Blocked route: ${location.pathname}`}
        action={(
          <Link
            to={actionTo}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {actionLabel}
          </Link>
        )}
      />
    </div>
  )
}

export default PermissionRoute
