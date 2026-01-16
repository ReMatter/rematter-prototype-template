import { useState, useEffect } from 'react'
import { EntityDetailHeader } from './EntityDetailHeader'
import { EntityDetailTabs } from './EntityDetailTabs'
import { EntityDetailFooter } from './EntityDetailFooter'
import { useUnsavedChangesWarning } from './useEntityForm'
import type { EntityDetailPageProps } from './types'
import './styles.css'

export function EntityDetailPage({
  title,
  entityId,
  subtitle,
  backPath,
  status,
  progress,
  actions,
  tabs,
  defaultTab,
  onTabChange,
  isDirty,
  isLoading,
  isSaving,
  onSave,
  onDiscard,
}: EntityDetailPageProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.key || '')

  // Warn about unsaved changes when navigating away
  useUnsavedChangesWarning(isDirty)

  // Update active tab when defaultTab changes
  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab)
    }
  }, [defaultTab])

  const handleTabChange = (tabKey: string) => {
    setActiveTab(tabKey)
    onTabChange?.(tabKey)
  }

  if (isLoading) {
    return (
      <div className="entity-detail-page">
        <div className="entity-detail-loading">
          <div className="entity-detail-loading-spinner" />
        </div>
      </div>
    )
  }

  return (
    <div className="entity-detail-page">
      <EntityDetailHeader
        title={title}
        entityId={entityId}
        subtitle={subtitle}
        backPath={backPath}
        status={status}
        progress={progress}
        actions={actions}
      />
      <EntityDetailTabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />
      <div className="entity-detail-content-wrapper">
        <div className="entity-detail-content">
          <div className="entity-detail-content-inner">
            {tabs.map((tab) => (
              <div
                key={tab.key}
                className={`entity-detail-tab-panel ${
                  tab.key === activeTab ? 'entity-detail-tab-panel--active' : ''
                }`}
                role="tabpanel"
                aria-hidden={tab.key !== activeTab}
              >
                {tab.children}
              </div>
            ))}
          </div>
          <EntityDetailFooter
            isDirty={isDirty}
            isSaving={isSaving}
            onSave={onSave}
            onDiscard={onDiscard}
          />
        </div>
      </div>
    </div>
  )
}

// Re-export types and hooks for convenience
export type {
  EntityDetailPageProps,
  TabConfig,
  ActionConfig,
  StatusConfig,
  ProgressConfig,
  UseEntityFormOptions,
  UseEntityFormReturn,
} from './types'
export { useEntityForm, useUnsavedChangesWarning } from './useEntityForm'
export { EntityDetailHeader } from './EntityDetailHeader'
export { EntityDetailTabs } from './EntityDetailTabs'
export { EntityDetailFooter } from './EntityDetailFooter'

// Form section component for consistency
interface FormSectionProps {
  title: string
  description?: string
  children: React.ReactNode
}

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <div className="entity-detail-section">
      <h3 className="entity-detail-section-title">{title}</h3>
      {description && <p className="entity-detail-section-description">{description}</p>}
      {children}
    </div>
  )
}

// Divider component
export function Divider() {
  return <hr className="entity-detail-divider" />
}

// Form row component for 2-4 column layouts
interface FormRowProps {
  children: React.ReactNode
}

export function FormRow({ children }: FormRowProps) {
  return <div className="entity-detail-form-row">{children}</div>
}
