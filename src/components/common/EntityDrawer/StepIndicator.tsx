import type { StepIndicatorProps } from './types'
import './styles.css'

// Checkmark icon for completed steps
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

export const StepIndicator = ({ steps, currentStep, onStepClick }: StepIndicatorProps) => {
  return (
    <div className="entity-drawer-steps">
      {steps.map((step, index) => {
        const isActive = index === currentStep
        const isCompleted = index < currentStep
        const isClickable = onStepClick && (isCompleted || index === currentStep + 1)

        return (
          <div key={step.key} className="entity-drawer-step-item">
            <div
              className={`entity-drawer-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isClickable ? 'clickable' : ''}`}
              onClick={() => isClickable && onStepClick?.(index)}
            >
              <div className="entity-drawer-step-badge">
                {isCompleted ? <CheckIcon /> : index + 1}
              </div>
              <span className="entity-drawer-step-title">{step.title}</span>
            </div>
            {index < steps.length - 1 && (
              <div className={`entity-drawer-step-divider ${isCompleted ? 'completed' : ''}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
