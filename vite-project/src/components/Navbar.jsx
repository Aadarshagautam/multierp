import React, { useContext } from 'react'
import { Plus, User, LogOut, Mail, Menu, Bell, Search, LayoutGrid } from 'lucide-react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import AppContext from '../context/app-context.js'
import axios from 'axios'
import { toast } from 'react-hot-toast'

const Navbar = ({ toggleSidebar }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { userData, backendUrl, setUserData, setIsLoggedin, isLoggedin, currentOrgId, currentOrgName } = useContext(AppContext)

  const hideNavbar = ['/login', '/register', '/email-verifty', '/reset-password'].includes(location.pathname)
  const isEditorPage = location.pathname.includes('/create') || (location.pathname.includes('/notes/') && location.pathname !== '/notes')
  
  if (hideNavbar || isEditorPage) return null

  const sendVerificationOtp = async () => {
    try {
      axios.defaults.withCredentials = true
      const { data } = await axios.post(backendUrl + "/api/auth/send-verify-opt")
      if (data.success) {
        toast.success(data.message)
        navigate('/email-verifty')
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const logout = async () => {
    try {
      axios.defaults.withCredentials = true
      const { data } = await axios.post(backendUrl + "/api/auth/logout")
      if (data.success) {
        setIsLoggedin(false)
        setUserData(null)
        toast.success("Logged out successfully")
        navigate('/login')
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-sm">
      <div className="mx-auto px-6 lg:pl-72">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Toggle + Logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-all duration-200"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>

            <Link to="/dashboard" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-200 shadow-lg">
                  <span className="text-white font-bold text-lg">T</span>
                </div>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold gradient-text">
                  ThinkBoard
                </h1>
                <p className="text-xs text-gray-500 -mt-1">Stay Organized</p>
              </div>
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isLoggedin ? (
              <>
                {/* New Note Button */}
                {/* <Link 
                  to="/create" 
                  className="flex items-center gap-2 btn-primary"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">New Note</span>
                </Link> */}

                {/* App Switcher */}
                <Link to="/apps" className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-200" title="All Apps">
                  <LayoutGrid className="w-5 h-5 text-gray-600" />
                </Link>

                {/* Notifications */}
                <button className="relative p-2 hover:bg-gray-100 rounded-xl transition-all duration-200">
                  <Bell className="w-5 h-5 text-gray-600" />
                  {/* Notification badge */}
                  {userData && !userData.isAccountVerified && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>

                {/* User Menu */}
                <div className="relative group">
                  <button className="flex items-center gap-3 p-1.5 pr-3 hover:bg-gray-100 rounded-xl transition-all duration-200">
                    <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold text-sm shadow-md">
                      {userData?.username?.[0]?.toUpperCase() || <User className="w-5 h-5" />}
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium text-gray-900">
                        {userData?.username || 'User'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {userData?.email?.split('@')[0] || 'user'}
                      </p>
                    </div>
                  </button>
                  
                  {/* Dropdown */}
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
                    {/* User Info Header */}
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-lg font-bold backdrop-blur-sm">
                          {userData?.username?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{userData?.username || 'User'}</p>
                          <p className="text-xs text-indigo-100 truncate">{userData?.email}</p>
                          <p className="text-[11px] text-indigo-100/90 truncate">
                            Org: {currentOrgName || (currentOrgId ? currentOrgId.toString().slice(-6) : 'none')}
                          </p>
                        </div>
                      </div>
                      {userData && !userData.isAccountVerified && (
                        <div className="mt-3 bg-amber-500/20 backdrop-blur-sm border border-amber-300/30 rounded-lg px-3 py-2">
                          <p className="text-xs text-amber-100 flex items-center gap-2">
                            <span className="w-2 h-2 bg-amber-300 rounded-full animate-pulse"></span>
                            Email not verified
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                      {userData && !userData.isAccountVerified && (
                        <button
                          onClick={sendVerificationOtp}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 rounded-xl transition-colors"
                        >
                          <Mail className="w-4 h-4 text-indigo-600" />
                          <span>Verify Email</span>
                        </button>
                      )}
                      <Link
                        to="/dashboard"
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                      >
                        <User className="w-4 h-4 text-gray-600" />
                        <span>My Profile</span>
                      </Link>
                      <div className="h-px bg-gray-200 my-2"></div>
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="btn-primary"
              >
                <User className="w-4 h-4 inline mr-2" />
                Login
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar;
