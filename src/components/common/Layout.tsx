import type { ReactNode, HTMLAttributes } from 'react'

// Card Component - Note: we use 'heading' instead of 'title' to avoid HTMLAttributes conflict
export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Card title */
  title?: ReactNode
  /** Extra content in header (right side) */
  extra?: ReactNode
  /** Whether to show header */
  bordered?: boolean
  /** Card body padding */
  bodyStyle?: React.CSSProperties
  /** Card header style */
  headStyle?: React.CSSProperties
  children?: ReactNode
}

export function Card({
  title,
  extra,
  bordered = true,
  bodyStyle,
  headStyle,
  children,
  className,
  style,
  ...props
}: CardProps) {
  const hasHeader = title || extra

  return (
    <div
      className={`card ${bordered ? '' : 'card-borderless'} ${className || ''}`}
      style={style}
      {...props}
    >
      {hasHeader && (
        <div className="card-header" style={headStyle}>
          {title && <h3 className="card-title">{title}</h3>}
          {extra && <div className="card-extra">{extra}</div>}
        </div>
      )}
      <div className="card-body" style={bodyStyle}>
        {children}
      </div>
    </div>
  )
}

// Divider Component
export interface DividerProps {
  /** Divider orientation */
  orientation?: 'left' | 'center' | 'right'
  /** Whether this is a vertical divider */
  type?: 'horizontal' | 'vertical'
  /** Text to display */
  children?: ReactNode
  /** Whether to use dashed line */
  dashed?: boolean
  /** Whether to use plain style (smaller text, no bold) */
  plain?: boolean
  /** Custom class name */
  className?: string
  /** Custom style */
  style?: React.CSSProperties
}

export function Divider({
  orientation = 'center',
  type = 'horizontal',
  children,
  dashed = false,
  plain = false,
  className,
  style,
}: DividerProps) {
  if (type === 'vertical') {
    return (
      <span
        className={`divider divider-vertical ${dashed ? 'divider-dashed' : ''} ${className || ''}`}
        style={style}
      />
    )
  }

  if (children) {
    return (
      <div
        className={`divider-with-text divider-with-text-${orientation} ${plain ? 'divider-plain' : ''} ${className || ''}`}
        style={style}
      >
        <span className="divider-text">{children}</span>
      </div>
    )
  }

  return (
    <hr
      className={`divider ${dashed ? 'divider-dashed' : ''} ${className || ''}`}
      style={style}
    />
  )
}

// Space Component (simple flexbox wrapper)
export interface SpaceProps {
  /** Direction of the space */
  direction?: 'horizontal' | 'vertical'
  /** Size of the gap */
  size?: 'small' | 'middle' | 'large' | number
  /** Whether to wrap */
  wrap?: boolean
  /** Alignment */
  align?: 'start' | 'end' | 'center' | 'baseline'
  /** Custom class name */
  className?: string
  /** Custom style */
  style?: React.CSSProperties
  children?: ReactNode
}

export function Space({
  direction = 'horizontal',
  size = 'small',
  wrap = false,
  align,
  className,
  style,
  children,
}: SpaceProps) {
  const gapMap = {
    small: 8,
    middle: 16,
    large: 24,
  }
  const gap = typeof size === 'number' ? size : gapMap[size]

  const alignMap = {
    start: 'flex-start',
    end: 'flex-end',
    center: 'center',
    baseline: 'baseline',
  }

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: direction === 'vertical' ? 'column' : 'row',
        gap: `${gap}px`,
        flexWrap: wrap ? 'wrap' : 'nowrap',
        alignItems: align ? alignMap[align] : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// Row Component (CSS Grid wrapper)
export interface RowProps {
  /** Gap between columns */
  gutter?: number | [number, number]
  /** Horizontal alignment */
  justify?: 'start' | 'end' | 'center' | 'space-around' | 'space-between' | 'space-evenly'
  /** Vertical alignment */
  align?: 'top' | 'middle' | 'bottom' | 'stretch'
  /** Whether to wrap */
  wrap?: boolean
  /** Custom class name */
  className?: string
  /** Custom style */
  style?: React.CSSProperties
  children?: ReactNode
}

export function Row({
  gutter = 0,
  justify,
  align,
  wrap = true,
  className,
  style,
  children,
}: RowProps) {
  const [horizontalGutter, verticalGutter] = Array.isArray(gutter)
    ? gutter
    : [gutter, gutter]

  const justifyMap = {
    start: 'flex-start',
    end: 'flex-end',
    center: 'center',
    'space-around': 'space-around',
    'space-between': 'space-between',
    'space-evenly': 'space-evenly',
  }

  const alignMap = {
    top: 'flex-start',
    middle: 'center',
    bottom: 'flex-end',
    stretch: 'stretch',
  }

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexWrap: wrap ? 'wrap' : 'nowrap',
        marginLeft: -horizontalGutter / 2,
        marginRight: -horizontalGutter / 2,
        rowGap: verticalGutter,
        justifyContent: justify ? justifyMap[justify] : undefined,
        alignItems: align ? alignMap[align] : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// Col Component
export interface ColProps {
  /** Number of columns to span (out of 24) */
  span?: number
  /** Number of columns to offset */
  offset?: number
  /** Custom class name */
  className?: string
  /** Custom style */
  style?: React.CSSProperties
  children?: ReactNode
}

export function Col({
  span = 24,
  offset = 0,
  className,
  style,
  children,
}: ColProps) {
  // Calculate width percentage based on 24-column grid
  const width = `${(span / 24) * 100}%`
  const marginLeft = offset > 0 ? `${(offset / 24) * 100}%` : undefined

  return (
    <div
      className={className}
      style={{
        flex: `0 0 ${width}`,
        maxWidth: width,
        marginLeft,
        paddingLeft: 8,
        paddingRight: 8,
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
