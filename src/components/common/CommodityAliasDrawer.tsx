import { useEffect, useState } from 'react'
import { EntityDrawer, FormSection } from './EntityDrawer'
import { FormField, Input, TextArea, ComboBox } from './Form'
import { useToast } from './Toast'
import type { CommodityAlias, CommodityAliasType, Commodity, Account } from '../../types'
import { commodityService, accountService, commodityAliasService } from '../../services'

interface CommodityAliasDrawerProps {
  open: boolean
  alias?: CommodityAlias | null
  /** Pre-select commodity (when opening from Commodity detail page) */
  commodityId?: string
  /** Pre-select account (when opening from Account detail page) */
  accountId?: string
  onSave: (alias: CommodityAlias) => void
  onCancel: () => void
}

interface FormState {
  commodityId: string
  accountId: string
  aliasType: CommodityAliasType
  aliasName: string
  aliasCode: string
  notes: string
}

const initialFormState: FormState = {
  commodityId: '',
  accountId: '',
  aliasType: 'buy',
  aliasName: '',
  aliasCode: '',
  notes: '',
}

const aliasTypeOptions = [
  { value: 'buy', label: 'Buy (when purchasing from this account)' },
  { value: 'sell', label: 'Sell (when selling to this account)' },
]

export const CommodityAliasDrawer = ({
  open,
  alias,
  commodityId: preselectedCommodityId,
  accountId: preselectedAccountId,
  onSave,
  onCancel,
}: CommodityAliasDrawerProps) => {
  const toast = useToast()
  const [formState, setFormState] = useState<FormState>(initialFormState)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [loading, setLoading] = useState(false)
  const [commodities, setCommodities] = useState<Commodity[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])

  const isEditing = !!alias

  // Load commodities and accounts
  useEffect(() => {
    const loadData = async () => {
      const [loadedCommodities, loadedAccounts] = await Promise.all([
        commodityService.getAllCommodities(),
        accountService.getAll(),
      ])
      setCommodities(loadedCommodities.filter((m) => m.isActive))
      setAccounts(loadedAccounts.filter((a) => a.isActive))
    }
    if (open) {
      loadData()
    }
  }, [open])

  // Initialize form when drawer opens
  useEffect(() => {
    if (open) {
      setErrors({})
      if (alias) {
        // Editing existing alias
        setFormState({
          commodityId: alias.commodityId,
          accountId: alias.accountId,
          aliasType: alias.aliasType,
          aliasName: alias.aliasName,
          aliasCode: alias.aliasCode || '',
          notes: alias.notes || '',
        })
      } else {
        // Creating new alias
        setFormState({
          ...initialFormState,
          commodityId: preselectedCommodityId || '',
          accountId: preselectedAccountId || '',
        })
      }
    }
  }, [open, alias, preselectedCommodityId, preselectedAccountId])

  // Auto-set alias type based on account type
  useEffect(() => {
    if (formState.accountId && !isEditing) {
      const selectedAccount = accounts.find((a) => a.id === formState.accountId)
      if (selectedAccount) {
        // Suppliers = buy, Customers = sell
        const suggestedType: CommodityAliasType =
          selectedAccount.type === 'supplier' ? 'buy' : selectedAccount.type === 'customer' ? 'sell' : formState.aliasType
        setFormState((prev) => ({ ...prev, aliasType: suggestedType }))
      }
    }
  }, [formState.accountId, accounts, isEditing])

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormState, string>> = {}

    if (!formState.commodityId) {
      newErrors.commodityId = 'Commodity is required'
    }

    if (!formState.accountId) {
      newErrors.accountId = 'Account is required'
    }

    if (!formState.aliasName.trim()) {
      newErrors.aliasName = 'Alias name is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return

    setLoading(true)
    try {
      let savedAlias: CommodityAlias | undefined

      const aliasData = {
        commodityId: formState.commodityId,
        accountId: formState.accountId,
        aliasType: formState.aliasType,
        aliasName: formState.aliasName,
        aliasCode: formState.aliasCode?.toUpperCase() || undefined,
        notes: formState.notes || undefined,
      }

      if (isEditing && alias) {
        savedAlias = await commodityAliasService.updateAlias(alias.id, aliasData)
        toast.success('Alias updated successfully')
      } else {
        savedAlias = await commodityAliasService.createAlias(aliasData)
        toast.success('Alias created successfully')
      }

      if (savedAlias) {
        onSave(savedAlias)
      }
    } catch {
      toast.error('Failed to save alias')
    } finally {
      setLoading(false)
    }
  }

  // Build options for ComboBox
  const commodityOptions = commodities.map((m) => ({
    value: m.id,
    label: `${m.code} - ${m.name}`,
  }))

  const accountOptions = accounts.map((a) => ({
    value: a.id,
    label: `${a.name}${a.code ? ` (${a.code})` : ''} - ${a.type}`,
  }))

  return (
    <EntityDrawer
      open={open}
      onClose={onCancel}
      title={isEditing ? 'Edit Commodity Alias' : 'Add Commodity Alias'}
      onSave={handleSave}
      loading={loading}
      saveText={isEditing ? 'Save Alias' : 'Add Alias'}
      width={500}
    >
      <FormSection
        title="Alias Configuration"
        description="Define how this commodity should be named when trading with this specific account."
      >
        <FormField label="Commodity" required error={errors.commodityId}>
          <ComboBox
            value={formState.commodityId}
            onChange={(value) => updateField('commodityId', value)}
            options={commodityOptions}
            placeholder="Select commodity..."
            disabled={!!preselectedCommodityId}
          />
        </FormField>

        <FormField label="Account" required error={errors.accountId}>
          <ComboBox
            value={formState.accountId}
            onChange={(value) => updateField('accountId', value)}
            options={accountOptions}
            placeholder="Select account..."
            disabled={!!preselectedAccountId}
          />
        </FormField>

        <FormField label="Type" required>
          <ComboBox
            value={formState.aliasType}
            onChange={(value) => updateField('aliasType', value as CommodityAliasType)}
            options={aliasTypeOptions}
          />
        </FormField>
      </FormSection>

      <FormSection title="Alias Details" description="The name and code this account uses for this commodity.">
        <FormField label="Alias Name" required error={errors.aliasName}>
          <Input
            value={formState.aliasName}
            onChange={(value) => updateField('aliasName', value)}
            placeholder="What does this account call this commodity?"
          />
        </FormField>

        <FormField label="Alias Code">
          <Input
            value={formState.aliasCode}
            onChange={(value) => updateField('aliasCode', value.toUpperCase())}
            placeholder="Optional code (will be uppercased)"
          />
        </FormField>

        <FormField label="Notes">
          <TextArea
            value={formState.notes}
            onChange={(value) => updateField('notes', value)}
            placeholder="Any notes about this alias..."
            rows={3}
          />
        </FormField>
      </FormSection>
    </EntityDrawer>
  )
}
