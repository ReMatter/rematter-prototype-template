import { Button } from '../Button'
import type { EntityDetailFooterProps } from './types'

export function EntityDetailFooter({
  isDirty,
  isSaving,
  onSave,
  onDiscard,
}: EntityDetailFooterProps) {
  return (
    <div className="entity-detail-footer">
      <Button
        variant="default"
        onPress={onDiscard}
        isDisabled={!isDirty || isSaving}
        className="entity-detail-footer-btn"
      >
        Discard
      </Button>
      <Button
        variant="primary"
        onPress={onSave}
        isDisabled={!isDirty || isSaving}
        className="entity-detail-footer-btn"
      >
        {isSaving ? 'Saving...' : 'Save updates'}
      </Button>
    </div>
  )
}
