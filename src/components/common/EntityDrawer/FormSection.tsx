import type { FormSectionProps } from './types'
import './styles.css'

export const FormSection = ({ title, children, description }: FormSectionProps) => {
  return (
    <div className="entity-drawer-section">
      <h4 className="entity-drawer-section-title">{title}</h4>
      {description && (
        <p className="entity-drawer-section-description">{description}</p>
      )}
      {children}
    </div>
  )
}
