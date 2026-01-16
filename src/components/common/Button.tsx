import { Button as AriaButton } from 'react-aria-components'
import type { ButtonProps as AriaButtonProps } from 'react-aria-components'
import type { ReactNode } from 'react'

export interface ButtonProps extends Omit<AriaButtonProps, 'children'> {
  children?: ReactNode
  variant?: 'default' | 'primary' | 'link' | 'danger' | 'ghost'
  size?: 'small' | 'default' | 'large'
  icon?: ReactNode
  iconPosition?: 'start' | 'end'
}

export function Button({
  children,
  variant = 'default',
  size = 'default',
  icon,
  iconPosition = 'start',
  className,
  ...props
}: ButtonProps) {
  const classes = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    icon && !children ? 'btn-icon-only' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <AriaButton className={classes} {...props}>
      {icon && iconPosition === 'start' && <span className="btn-icon">{icon}</span>}
      {children && <span className="btn-text">{children}</span>}
      {icon && iconPosition === 'end' && <span className="btn-icon">{icon}</span>}
    </AriaButton>
  )
}
