import type { DrawerFooterProps } from './types'
import './styles.css'

// Arrow left icon
const ArrowLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
)

export const DrawerFooter = ({
  onSave,
  saveText = 'Save',
  loading = false,
  showBack = false,
  onBack,
  saveDisabled = false,
}: DrawerFooterProps) => {
  return (
    <div className="entity-drawer-footer">
      <div className="entity-drawer-footer-left">
        {showBack && onBack && (
          <button
            type="button"
            className="entity-drawer-btn entity-drawer-btn-default entity-drawer-btn-back"
            onClick={onBack}
          >
            <ArrowLeftIcon />
            Back
          </button>
        )}
      </div>
      <div className="entity-drawer-footer-right">
        <button
          type="button"
          className="entity-drawer-btn entity-drawer-btn-primary"
          onClick={onSave}
          disabled={saveDisabled || loading}
        >
          {loading ? 'Saving...' : saveText}
        </button>
      </div>
    </div>
  )
}
