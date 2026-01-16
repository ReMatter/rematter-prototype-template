import { useState } from 'react'
import {
  Link,
  Disclosure,
  DisclosurePanel,
  Button,
  RouterProvider,
} from 'react-aria-components'
import { useLocation } from 'wouter'
import {
  LuLayoutDashboard,
  LuChartBar,
  LuSettings,
  LuChevronDown,
  LuArrowLeft,
  LuUser,
  LuBell,
  LuPlug,
  LuShield,
} from 'react-icons/lu'

interface NavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  isActive: boolean
}

const NavItem = ({ href, icon, label, isActive }: NavItemProps) => (
  <Link
    href={href}
    className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
  >
    <span className="sidebar-nav-icon">{icon}</span>
    <span className="sidebar-nav-label">{label}</span>
  </Link>
)

interface SubNavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  isActive: boolean
}

const SubNavItem = ({ href, icon, label, isActive }: SubNavItemProps) => (
  <Link
    href={href}
    className={`sidebar-nav-item sidebar-nav-subitem ${isActive ? 'active' : ''}`}
  >
    <span className="sidebar-nav-icon">{icon}</span>
    <span className="sidebar-nav-label">{label}</span>
  </Link>
)

export const SideBar = () => {
  const [location, setLocation] = useLocation()
  const isSettingsRoute = location.startsWith('/settings')

  const isActive = (path: string) => {
    if (path === '/') return location === '/'
    if (path === '/settings') return location === '/settings'
    return location.startsWith(path)
  }

  // Settings sidebar
  if (isSettingsRoute) {
    return (
      <RouterProvider navigate={(path) => setLocation(path)}>
        <aside className="sidebar-container">
          <div className="sidebar-logo">
            <span className="sidebar-logo-text">ReMatter</span>
          </div>
          <div className="sidebar-menu-wrapper">
            <div>
              <div className="sidebar-settings-header">
                <Button
                  className="sidebar-back-button"
                  onPress={() => setLocation('/')}
                >
                  <LuArrowLeft size={16} />
                  <span>Return to App</span>
                </Button>
              </div>
              <div className="sidebar-settings-label">
                Settings
              </div>
              <nav className="sidebar-nav">
                <NavItem
                  href="/settings"
                  icon={<LuUser size={16} />}
                  label="Profile"
                  isActive={location === '/settings'}
                />
                <NavItem
                  href="/settings/preferences"
                  icon={<LuSettings size={16} />}
                  label="Preferences"
                  isActive={isActive('/settings/preferences')}
                />
                <NavItem
                  href="/settings/notifications"
                  icon={<LuBell size={16} />}
                  label="Notifications"
                  isActive={isActive('/settings/notifications')}
                />
                <NavItem
                  href="/settings/api"
                  icon={<LuPlug size={16} />}
                  label="API Configuration"
                  isActive={isActive('/settings/api')}
                />
                <NavItem
                  href="/settings/security"
                  icon={<LuShield size={16} />}
                  label="Security"
                  isActive={isActive('/settings/security')}
                />
              </nav>
            </div>
          </div>
        </aside>
      </RouterProvider>
    )
  }

  // Main app sidebar
  return (
    <RouterProvider navigate={(path) => setLocation(path)}>
      <aside className="sidebar-container">
        <div className="sidebar-logo">
          <span className="sidebar-logo-text">ReMatter</span>
        </div>
        <div className="sidebar-menu-wrapper">
          <nav className="sidebar-nav sidebar-menu-main">
            <NavItem
              href="/"
              icon={<LuLayoutDashboard size={16} />}
              label="Dashboard"
              isActive={isActive('/')}
            />
            <NavItem
              href="/analytics"
              icon={<LuChartBar size={16} />}
              label="Analytics"
              isActive={isActive('/analytics')}
            />
          </nav>
        </div>
      </aside>
    </RouterProvider>
  )
}
