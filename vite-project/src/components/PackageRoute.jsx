import React, { useContext } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import AppContext from '../context/app-context.js'
import { getRedirectPathForBusiness, isPathSupportedForBusiness } from '../config/businessConfigs.js'

const PackageRoute = ({ children }) => {
  const location = useLocation()
  const { orgBusinessType } = useContext(AppContext)

  if (isPathSupportedForBusiness(location.pathname, orgBusinessType)) {
    return children
  }

  return (
    <Navigate
      to={getRedirectPathForBusiness(location.pathname, orgBusinessType)}
      replace
      state={{ blockedPath: location.pathname }}
    />
  )
}

export default PackageRoute
