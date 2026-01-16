import type { EntityDetailTabsProps } from './types'

export function EntityDetailTabs({ tabs, activeTab, onTabChange }: EntityDetailTabsProps) {
  return (
    <div className="entity-detail-tabs">
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab
        return (
          <button
            key={tab.key}
            type="button"
            className={`entity-detail-tab ${isActive ? 'entity-detail-tab--active' : ''}`}
            onClick={() => onTabChange(tab.key)}
            role="tab"
            aria-selected={isActive}
          >
            <span className="entity-detail-tab-label">{tab.label}</span>
            {tab.badge !== undefined && (
              <span className="entity-detail-tab-badge">{tab.badge}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
