import { Dialog, Modal, ModalOverlay } from 'react-aria-components'
import { StepIndicator } from './StepIndicator'
import { DrawerFooter } from './DrawerFooter'
import type { EntityDrawerProps } from './types'
import './styles.css'

// X icon for close button
const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

export function EntityDrawer<T>({
  open,
  onClose,
  title,
  entity,
  onSave,
  steps,
  currentStep = 0,
  onStepChange,
  children,
  footer,
  saveText,
  width = 600,
  loading = false,
}: EntityDrawerProps<T>) {
  const isEditing = !!entity
  const hasSteps = steps && steps.length > 1
  const isLastStep = !hasSteps || currentStep === (steps?.length || 1) - 1

  // Determine default save button text
  const defaultSaveText = isEditing
    ? 'Save'
    : isLastStep
      ? 'Save'
      : 'Next'

  const handleSave = () => {
    if (hasSteps && !isLastStep && onStepChange) {
      // Move to next step
      onStepChange(currentStep + 1)
    } else {
      // Call save handler
      onSave({} as Partial<T>)
    }
  }

  const handleBack = () => {
    if (hasSteps && currentStep > 0 && onStepChange) {
      onStepChange(currentStep - 1)
    }
  }

  const handleStepClick = (step: number) => {
    if (onStepChange && step <= currentStep + 1) {
      onStepChange(step)
    }
  }

  return (
    <ModalOverlay
      isOpen={open}
      onOpenChange={(isOpen) => !isOpen && onClose()}
      isDismissable
      className="entity-drawer-overlay"
    >
      <Modal
        className="entity-drawer-modal"
        style={{ width }}
      >
        <Dialog className="entity-drawer-dialog" aria-label={title}>
          {/* Header */}
          <div className="entity-drawer-header">
            <div className="entity-drawer-header-row">
              <h2 className="entity-drawer-title">{title}</h2>
              <button
                type="button"
                className="entity-drawer-close-btn"
                onClick={onClose}
                aria-label="Close"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Steps */}
          {hasSteps && steps && (
            <StepIndicator
              steps={steps}
              currentStep={currentStep}
              onStepClick={handleStepClick}
            />
          )}

          {/* Content */}
          <div className="entity-drawer-content">
            {children}
          </div>

          {/* Footer */}
          {footer ?? (
            <DrawerFooter
              onSave={handleSave}
              saveText={saveText || defaultSaveText}
              loading={loading}
              showBack={hasSteps && currentStep > 0}
              onBack={handleBack}
            />
          )}
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}

// Re-export sub-components and types for composition
export { StepIndicator } from './StepIndicator'
export { FormSection } from './FormSection'
export { DrawerFooter } from './DrawerFooter'
export type {
  EntityDrawerProps,
  StepConfig,
  StepIndicatorProps,
  FormSectionProps,
  DrawerFooterProps,
} from './types'
