import type { ReactNode } from 'react'
import { Button } from './Button'

// Plus icon SVG
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M8 3.333v9.334M3.333 8h9.334"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

interface PageHeaderProps {
  title: string
  subtitle?: string
  primaryAction?: {
    label: string
    onClick: () => void
    icon?: ReactNode
  }
  extra?: ReactNode
}

export const PageHeader = ({ title, subtitle, primaryAction, extra }: PageHeaderProps) => {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-header-title">{title}</h1>
        {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
      </div>
      <div className="page-header-actions">
        {extra}
        {primaryAction && (
          <Button
            variant="primary"
            icon={primaryAction.icon || <PlusIcon />}
            onPress={primaryAction.onClick}
          >
            {primaryAction.label}
          </Button>
        )}
      </div>
    </div>
  )
}
