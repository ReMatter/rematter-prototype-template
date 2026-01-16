import type { AccountLocation, LocationContact, LocationType, Address } from '../../../types'

export interface LocationsManagerProps {
  locations: AccountLocation[]
  onAdd: () => void
  onChange: (index: number, location: AccountLocation) => void
  onRemove: (index: number) => void
}

export interface LocationRowProps {
  location: AccountLocation
  index: number
  isExpanded: boolean
  onToggleExpand: () => void
  onChange: (location: AccountLocation) => void
  onRemove: () => void
}

export interface ContactsTableProps {
  contacts: LocationContact[]
  onAdd: () => void
  onChange: (index: number, contact: LocationContact) => void
  onRemove: (index: number) => void
}

export const LOCATION_TYPE_OPTIONS: { value: LocationType; label: string }[] = [
  { value: 'shipping', label: 'Shipping' },
  { value: 'billing', label: 'Billing' },
  { value: 'pickup', label: 'Pickup' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'office', label: 'Office' },
  { value: 'warehouse', label: 'Warehouse' },
]

export const CONTACT_ROLE_OPTIONS = [
  'Owner',
  'General Manager',
  'Operations Manager',
  'Yard Manager',
  'Site Supervisor',
  'Purchasing Manager',
  'Sales Manager',
  'Accounts Payable',
  'Accounts Receivable',
  'Dispatch Manager',
  'Logistics',
  'CFO',
  'Other',
]

export const DEFAULT_ADDRESS: Address = {
  street1: '',
  street2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'USA',
}

export const DEFAULT_LOCATION: Omit<AccountLocation, 'id'> = {
  name: '',
  types: [],
  address: { ...DEFAULT_ADDRESS },
  contacts: [],
  isActive: true,
  isDefaultShipping: false,
  isDefaultBilling: false,
}

export const DEFAULT_CONTACT: Omit<LocationContact, 'id'> = {
  name: '',
  email: '',
  phone: '',
  role: '',
  isPrimary: false,
}
