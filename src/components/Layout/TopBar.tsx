import { useLocation } from 'wouter'
import {
  LuSearch,
  LuMapPin,
  LuUser,
  LuChevronDown,
  LuBell,
  LuCircleHelp,
  LuMail,
  LuSettings,
} from 'react-icons/lu'

export const TopBar = () => {
  const [location, setLocation] = useLocation()
  const isSettingsActive = location.startsWith('/settings')
  return (
    <header className="topbar">
      <div className="topbar-left">
        {/* Search Input */}
        <div className="topbar-search">
          <span className="topbar-search-icon">
            <LuSearch size={16} />
          </span>
          <input
            type="text"
            className="topbar-search-input"
            placeholder="Search"
          />
          <span className="topbar-search-shortcut">⌘ + Click</span>
        </div>
      </div>

      <div className="topbar-right">
        {/* Location/Resource Dropdown */}
        <div className="topbar-dropdown">
          <span className="topbar-dropdown-icon">
            <LuMapPin size={16} />
          </span>
          <span className="topbar-dropdown-text">All Privileged Resources</span>
          <span className="topbar-dropdown-chevron">
            <LuChevronDown size={16} />
          </span>
        </div>

        {/* User Dropdown */}
        <div className="topbar-dropdown">
          <span className="topbar-dropdown-icon">
            <LuUser size={16} />
          </span>
          <span className="topbar-dropdown-text">Oliver Smith</span>
          <span className="topbar-dropdown-chevron">
            <LuChevronDown size={16} />
          </span>
        </div>

        {/* Notification Bell */}
        <button className="topbar-icon-btn">
          <LuBell size={16} />
          <span className="topbar-badge">2</span>
        </button>

        {/* Help */}
        <button className="topbar-icon-btn">
          <LuCircleHelp size={16} />
        </button>

        {/* Mail */}
        <button className="topbar-icon-btn">
          <LuMail size={16} />
        </button>

        {/* Settings */}
        <button
          className={`topbar-icon-btn ${isSettingsActive ? 'active' : ''}`}
          onClick={() => setLocation('/settings')}
        >
          <LuSettings size={16} />
        </button>
      </div>
    </header>
  )
}
