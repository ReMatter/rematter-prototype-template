import type { ReactNode } from 'react'

export interface DescriptionsItemProps {
  /** Label for the item */
  label: ReactNode
  /** Content/value */
  children?: ReactNode
  /** Number of columns this item spans */
  span?: number
}

export function DescriptionsItem({ label, children, span }: DescriptionsItemProps) {
  return (
    <div
      className="descriptions-item"
      style={span ? { gridColumn: `span ${span}` } : undefined}
    >
      <div className="descriptions-label">{label}</div>
      <div className="descriptions-content">{children || '-'}</div>
    </div>
  )
}

export interface DescriptionsProps {
  /** Title of the descriptions block */
  title?: ReactNode
  /** Whether to show border */
  bordered?: boolean
  /** Number of columns */
  column?: number | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number }
  /** Size of the descriptions */
  size?: 'small' | 'default' | 'large'
  /** Layout direction */
  layout?: 'horizontal' | 'vertical'
  /** Colon after labels */
  colon?: boolean
  /** Custom class name */
  className?: string
  /** Custom style */
  style?: React.CSSProperties
  children?: ReactNode
}

export function Descriptions({
  title,
  bordered = false,
  column = 3,
  size = 'default',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  layout: _layout = 'horizontal',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  colon: _colon = true,
  className,
  style,
  children,
}: DescriptionsProps) {
  // Handle responsive columns
  const cols = typeof column === 'number' ? column : column.md || 3

  return (
    <div
      className={`descriptions ${bordered ? 'descriptions-bordered' : ''} descriptions-${size} ${className || ''}`}
      style={style}
    >
      {title && <div className="descriptions-title">{title}</div>}
      <div
        className="descriptions-view"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: size === 'small' ? '12px' : size === 'large' ? '24px' : '16px',
        }}
      >
        {children}
      </div>
    </div>
  )
}

// Convenience alias
Descriptions.Item = DescriptionsItem
