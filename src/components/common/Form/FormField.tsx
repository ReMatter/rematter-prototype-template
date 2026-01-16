import type { FormFieldProps } from './types'

export const FormField = ({
  label,
  required,
  error,
  children,
  className = '',
}: FormFieldProps) => {
  return (
    <div className={`entity-drawer-field ${className}`}>
      {label && (
        <div className="entity-drawer-label">
          <span className="entity-drawer-label-text">{label}</span>
          {required && <span className="entity-drawer-label-required">*</span>}
        </div>
      )}
      {children}
      {error && (
        <span className="entity-drawer-field-error">{error}</span>
      )}
    </div>
  )
}
