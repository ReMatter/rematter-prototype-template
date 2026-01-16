import { useLocation } from 'wouter'
import { Button } from '../Button'
import type { EntityDetailHeaderProps, ActionConfig } from './types'

// Icons
const ArrowLeftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5" />
    <path d="m12 19-7-7 7-7" />
  </svg>
)

const CopyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
)

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <line x1="10" x2="10" y1="11" y2="17" />
    <line x1="14" x2="14" y1="11" y2="17" />
  </svg>
)

const statusColors: Record<string, { bg: string; border: string; text: string }> = {
  blue: {
    bg: 'rgba(39, 104, 231, 0.1)',
    border: 'rgba(39, 104, 231, 0.2)',
    text: '#2768E7',
  },
  orange: {
    bg: 'rgba(255, 122, 0, 0.1)',
    border: 'rgba(255, 122, 0, 0.2)',
    text: '#CC6200',
  },
  cyan: {
    bg: 'rgba(0, 188, 212, 0.1)',
    border: 'rgba(0, 188, 212, 0.2)',
    text: '#00838F',
  },
  green: {
    bg: 'rgba(76, 175, 80, 0.1)',
    border: 'rgba(76, 175, 80, 0.2)',
    text: '#2E7D32',
  },
  red: {
    bg: 'rgba(223, 23, 62, 0.1)',
    border: 'rgba(223, 23, 62, 0.2)',
    text: '#DF173E',
  },
  gray: {
    bg: 'rgba(7, 20, 41, 0.05)',
    border: 'rgba(7, 20, 41, 0.2)',
    text: 'rgba(7, 20, 41, 0.75)',
  },
}

export function EntityDetailHeader({
  title,
  entityId,
  subtitle,
  backPath,
  status,
  progress,
  actions = [],
}: EntityDetailHeaderProps) {
  const [, setLocation] = useLocation()

  const handleBack = () => {
    setLocation(backPath)
  }

  const colors = statusColors[status.color] || statusColors.gray

  return (
    <div className="entity-detail-header">
      <div className="entity-detail-header-title-row">
        <div className="entity-detail-header-left">
          <button
            type="button"
            className="entity-detail-back-btn"
            onClick={handleBack}
            aria-label="Go back"
          >
            <ArrowLeftIcon />
          </button>
          <div className="entity-detail-title-group">
            <div className="entity-detail-title-main">
              <h1 className="entity-detail-title">
                {title} {entityId}
              </h1>
              <div
                className="entity-detail-status-badge"
                style={{
                  backgroundColor: colors.bg,
                  borderColor: colors.border,
                  color: colors.text,
                }}
              >
                {status.label}
              </div>
            </div>
            {subtitle && (
              <div className="entity-detail-subtitle">{subtitle}</div>
            )}
          </div>
          {progress && (
            <div className="entity-detail-progress">
              <div className="entity-detail-progress-bar">
                <div
                  className="entity-detail-progress-fill"
                  style={{ width: `${Math.min(progress.percent, 100)}%` }}
                />
                <div className="entity-detail-progress-empty" />
              </div>
              <span className="entity-detail-progress-label">
                {progress.label || `${progress.percent}%`}
              </span>
            </div>
          )}
        </div>
        <div className="entity-detail-header-right">
          <div className="entity-detail-actions">
            {actions.map((action) => (
              <ActionButton key={action.key} action={action} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ActionButton({ action }: { action: ActionConfig }) {
  const isIconOnly = !action.label || action.key === 'copy'

  if (action.danger) {
    return (
      <Button
        variant="danger"
        size="large"
        onPress={action.onClick}
        isDisabled={action.disabled}
        className="entity-detail-action-btn"
      >
        <TrashIcon />
        {action.label && <span>{action.label}</span>}
      </Button>
    )
  }

  if (action.primary) {
    return (
      <Button
        variant="primary"
        size="large"
        onPress={action.onClick}
        isDisabled={action.disabled}
        className="entity-detail-action-btn"
      >
        {action.icon}
        {action.label && <span>{action.label}</span>}
      </Button>
    )
  }

  if (isIconOnly) {
    return (
      <button
        type="button"
        className="entity-detail-icon-btn"
        onClick={action.onClick}
        disabled={action.disabled}
        aria-label={action.label || action.key}
      >
        {action.icon || <CopyIcon />}
      </button>
    )
  }

  return (
    <Button
      variant="default"
      size="large"
      onPress={action.onClick}
      isDisabled={action.disabled}
      className="entity-detail-action-btn"
    >
      {action.icon}
      {action.label && <span>{action.label}</span>}
    </Button>
  )
}
