import type { ReactNode } from 'react'

export type TagColor =
  | 'gray'
  | 'blue'
  | 'orange'
  | 'green'
  | 'olive'
  | 'brown'
  | 'red'
  | 'purple'
  | 'slate'
  | 'magenta'
  | 'cyan'

export interface TagProps {
  children: ReactNode
  color?: TagColor
  icon?: ReactNode
  className?: string
}

export function Tag({ children, color = 'gray', icon, className }: TagProps) {
  return (
    <span className={`tag tag-${color} ${className ?? ''}`}>
      {icon && <span className="tag-icon">{icon}</span>}
      {children}
    </span>
  )
}
