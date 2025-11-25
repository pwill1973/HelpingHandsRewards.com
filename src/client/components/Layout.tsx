import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Layout() {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-ton-blue to-blue-600 rounded-lg"></div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  2×2 Community Matrix
                </span>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" className="text-gray-700 dark:text-gray-300 hover:text-ton-blue">
                    Dashboard
                  </Link>
                  <Link to="/matrix" className="text-gray-700 dark:text-gray-300 hover:text-ton-blue">
                    Matrix
                  </Link>
                  {user?.isAdmin && (
                    <Link to="/admin" className="text-gray-700 dark:text-gray-300 hover:text-ton-blue">
                      Admin
                    </Link>
                  )}
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {user?.fullName}
                  </div>
                  <button onClick={handleLogout} className="btn-secondary text-sm py-1 px-4">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-gray-700 dark:text-gray-300 hover:text-ton-blue">
                    Sign In
                  </Link>
                  <Link to="/join" className="btn-primary">
                    Join Community
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main>
        <Outlet />
      </main>

      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-600 dark:text-gray-400 text-sm">
            © 2025 2×2 Community Matrix on TON. Decentralized community support system.
          </p>
        </div>
      </footer>
    </div>
  )
}
