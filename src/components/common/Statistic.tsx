import type { ReactNode } from 'react'

export interface StatisticProps {
  /** The title/label of the statistic */
  title?: ReactNode
  /** The value to display */
  value?: ReactNode
  /** Prefix element (e.g., currency symbol) */
  prefix?: ReactNode
  /** Suffix element (e.g., unit) */
  suffix?: ReactNode
  /** Value size */
  size?: 'small' | 'default' | 'large'
  /** Precision for number values */
  precision?: number
  /** Value style */
  valueStyle?: React.CSSProperties
  /** Custom class name */
  className?: string
  /** Custom style */
  style?: React.CSSProperties
}

export function Statistic({
  title,
  value,
  prefix,
  suffix,
  size = 'default',
  precision,
  valueStyle,
  className,
  style,
}: StatisticProps) {
  // Format number value with precision
  let displayValue = value
  if (typeof value === 'number' && precision !== undefined) {
    displayValue = value.toFixed(precision)
  }

  const sizeClass = size === 'small' ? 'statistic-value-sm' : size === 'large' ? 'statistic-value-lg' : ''

  return (
    <div className={`statistic ${className || ''}`} style={style}>
      {title && <div className="statistic-label">{title}</div>}
      <div className={`statistic-value ${sizeClass}`} style={valueStyle}>
        {prefix && <span className="statistic-prefix">{prefix}</span>}
        {displayValue}
        {suffix && <span className="statistic-suffix">{suffix}</span>}
      </div>
    </div>
  )
}

// Trend indicator helper component
export interface TrendProps {
  /** Trend direction */
  direction?: 'up' | 'down'
  /** Trend value */
  value?: ReactNode
  /** Custom class name */
  className?: string
}

export function Trend({ direction = 'up', value, className }: TrendProps) {
  const trendClass = direction === 'up' ? 'statistic-trend-up' : 'statistic-trend-down'
  const arrow = direction === 'up' ? '↑' : '↓'

  return (
    <span className={`statistic-trend ${trendClass} ${className || ''}`}>
      {arrow} {value}
    </span>
  )
}
