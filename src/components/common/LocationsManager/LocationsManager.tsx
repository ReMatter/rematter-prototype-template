import { useState } from 'react'
import type { AccountLocation, LocationContact, LocationType, Address } from '../../../types'
import { PlusIcon, TrashIcon } from '../Icons'
import { LOCATION_TYPE_OPTIONS } from './types'
import './styles.css'

interface LocationsManagerProps {
  locations: AccountLocation[]
  onAdd: () => void
  onChange: (index: number, location: AccountLocation) => void
  onRemove: (index: number) => void
}

export function LocationsManager({
  locations,
  onAdd,
  onChange,
  onRemove,
}: LocationsManagerProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(
    locations.length > 0 ? 0 : null
  )

  const handleToggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index)
  }

  return (
    <div className="locations-manager">
      <div className="locations-manager-header">
        <h3 className="locations-manager-title">Locations</h3>
        <button className="locations-manager-add-btn" onClick={onAdd}>
          <PlusIcon />
          Add Location
        </button>
      </div>

      <div className="locations-list">
        {locations.length === 0 ? (
          <div className="locations-empty">
            <p className="locations-empty-text">No locations added yet</p>
            <button className="locations-manager-add-btn" onClick={onAdd}>
              <PlusIcon />
              Add Location
            </button>
          </div>
        ) : (
          locations.map((location, index) => (
            <LocationRow
              key={location.id}
              location={location}
              index={index}
              isExpanded={expandedIndex === index}
              onToggleExpand={() => handleToggleExpand(index)}
              onChange={(updated) => onChange(index, updated)}
              onRemove={() => onRemove(index)}
            />
          ))
        )}
      </div>
    </div>
  )
}

// Chevron icon for expand/collapse
function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

interface LocationRowProps {
  location: AccountLocation
  index: number
  isExpanded: boolean
  onToggleExpand: () => void
  onChange: (location: AccountLocation) => void
  onRemove: () => void
}

function LocationRow({
  location,
  isExpanded,
  onToggleExpand,
  onChange,
  onRemove,
}: LocationRowProps) {
  const updateField = <K extends keyof AccountLocation>(
    field: K,
    value: AccountLocation[K]
  ) => {
    onChange({ ...location, [field]: value })
  }

  const updateAddress = (field: keyof Address, value: string) => {
    onChange({
      ...location,
      address: { ...location.address, [field]: value },
    })
  }

  const handleTypeToggle = (type: LocationType) => {
    const newTypes = location.types.includes(type)
      ? location.types.filter((t) => t !== type)
      : [...location.types, type]
    updateField('types', newTypes)
  }

  // Contact handlers
  const handleAddContact = () => {
    const newContact: LocationContact = {
      id: `temp-contact-${Date.now()}`,
      name: '',
      email: '',
      phone: '',
      role: '',
      isPrimary: location.contacts.length === 0,
    }
    updateField('contacts', [...location.contacts, newContact])
  }

  const handleContactChange = (
    contactIndex: number,
    field: keyof LocationContact,
    value: unknown
  ) => {
    const updatedContacts = [...location.contacts]

    // Handle primary flag - only one can be primary
    if (field === 'isPrimary' && value === true) {
      updatedContacts.forEach((c) => (c.isPrimary = false))
    }

    updatedContacts[contactIndex] = {
      ...updatedContacts[contactIndex],
      [field]: value,
    }
    updateField('contacts', updatedContacts)
  }

  const handleContactRemove = (contactIndex: number) => {
    updateField(
      'contacts',
      location.contacts.filter((_, i) => i !== contactIndex)
    )
  }

  return (
    <div className={`location-row ${!location.isActive ? 'location-row--inactive' : ''}`}>
      <div className="location-row-header" onClick={onToggleExpand}>
        <button
          className={`location-row-expand ${isExpanded ? 'location-row-expand--expanded' : ''}`}
          onClick={(e) => {
            e.stopPropagation()
            onToggleExpand()
          }}
        >
          <ChevronRightIcon />
        </button>

        <span className="location-row-name">
          {location.name || 'Untitled Location'}
        </span>

        <div className="location-row-types">
          {location.types.map((type) => (
            <span key={type} className="location-row-type-tag">
              {type}
            </span>
          ))}
        </div>

        <div className="location-row-defaults">
          {location.isDefaultShipping && (
            <span className="location-row-default-badge">Default Shipping</span>
          )}
          {location.isDefaultBilling && (
            <span className="location-row-default-badge">Default Billing</span>
          )}
        </div>

        <div className="location-row-actions">
          <button
            className="location-row-delete"
            onClick={(e) => {
              e.stopPropagation()
              if (confirm('Are you sure you want to remove this location?')) {
                onRemove()
              }
            }}
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="location-row-content">
          {/* Basic Info */}
          <div className="location-section">
            <h4 className="location-section-title">Location Info</h4>
            <div className="location-form-row">
              <div className="location-form-field location-form-field--wide">
                <label className="location-form-label">Location Name</label>
                <input
                  type="text"
                  className="location-form-input"
                  value={location.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="e.g., Main Warehouse, West Coast Facility"
                />
              </div>
              <div className="location-form-field">
                <label className="location-form-label">Active</label>
                <label className="location-active-toggle">
                  <input
                    type="checkbox"
                    checked={location.isActive}
                    onChange={(e) => updateField('isActive', e.target.checked)}
                  />
                  <span>{location.isActive ? 'Active' : 'Inactive'}</span>
                </label>
              </div>
            </div>
          </div>

          {/* Location Types */}
          <div className="location-section">
            <h4 className="location-section-title">Location Types</h4>
            <div className="location-types-grid">
              {LOCATION_TYPE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`location-type-checkbox ${
                    location.types.includes(option.value)
                      ? 'location-type-checkbox--selected'
                      : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={location.types.includes(option.value)}
                    onChange={() => handleTypeToggle(option.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Default Settings */}
          <div className="location-section">
            <h4 className="location-section-title">Default Settings</h4>
            <div className="location-defaults-row">
              <label className="location-default-checkbox">
                <input
                  type="checkbox"
                  checked={location.isDefaultShipping}
                  onChange={(e) => updateField('isDefaultShipping', e.target.checked)}
                />
                <span>Default Shipping Location</span>
              </label>
              <label className="location-default-checkbox">
                <input
                  type="checkbox"
                  checked={location.isDefaultBilling}
                  onChange={(e) => updateField('isDefaultBilling', e.target.checked)}
                />
                <span>Default Billing Location</span>
              </label>
            </div>
          </div>

          {/* Address */}
          <div className="location-section">
            <h4 className="location-section-title">Address</h4>
            <div className="location-form-row">
              <div className="location-form-field location-form-field--wide">
                <label className="location-form-label">Street Address</label>
                <input
                  type="text"
                  className="location-form-input"
                  value={location.address.street1}
                  onChange={(e) => updateAddress('street1', e.target.value)}
                  placeholder="123 Main St"
                />
              </div>
            </div>
            <div className="location-form-row">
              <div className="location-form-field location-form-field--wide">
                <label className="location-form-label">Street Address 2</label>
                <input
                  type="text"
                  className="location-form-input"
                  value={location.address.street2 || ''}
                  onChange={(e) => updateAddress('street2', e.target.value)}
                  placeholder="Suite 100"
                />
              </div>
            </div>
            <div className="location-form-row">
              <div className="location-form-field">
                <label className="location-form-label">City</label>
                <input
                  type="text"
                  className="location-form-input"
                  value={location.address.city}
                  onChange={(e) => updateAddress('city', e.target.value)}
                  placeholder="City"
                />
              </div>
              <div className="location-form-field">
                <label className="location-form-label">State</label>
                <input
                  type="text"
                  className="location-form-input"
                  value={location.address.state}
                  onChange={(e) => updateAddress('state', e.target.value)}
                  placeholder="State"
                />
              </div>
              <div className="location-form-field">
                <label className="location-form-label">Postal Code</label>
                <input
                  type="text"
                  className="location-form-input"
                  value={location.address.postalCode}
                  onChange={(e) => updateAddress('postalCode', e.target.value)}
                  placeholder="12345"
                />
              </div>
              <div className="location-form-field">
                <label className="location-form-label">Country</label>
                <input
                  type="text"
                  className="location-form-input"
                  value={location.address.country}
                  onChange={(e) => updateAddress('country', e.target.value)}
                  placeholder="USA"
                />
              </div>
            </div>
          </div>

          {/* Contacts */}
          <div className="location-section">
            <h4 className="location-section-title">Contacts</h4>
            <div className="contacts-table">
              <div className="contacts-table-header">
                <span className="contacts-table-header-cell">Name</span>
                <span className="contacts-table-header-cell">Email</span>
                <span className="contacts-table-header-cell">Phone</span>
                <span className="contacts-table-header-cell">Role</span>
                <span className="contacts-table-header-cell">Primary</span>
                <span className="contacts-table-header-cell"></span>
              </div>
              <div className="contacts-table-body">
                {location.contacts.length === 0 ? (
                  <div className="contacts-empty">No contacts added</div>
                ) : (
                  location.contacts.map((contact, contactIndex) => (
                    <div key={contact.id} className="contacts-table-row">
                      <input
                        type="text"
                        className="contacts-table-input"
                        value={contact.name}
                        onChange={(e) =>
                          handleContactChange(contactIndex, 'name', e.target.value)
                        }
                        placeholder="Name"
                      />
                      <input
                        type="email"
                        className="contacts-table-input"
                        value={contact.email || ''}
                        onChange={(e) =>
                          handleContactChange(contactIndex, 'email', e.target.value)
                        }
                        placeholder="Email"
                      />
                      <input
                        type="tel"
                        className="contacts-table-input"
                        value={contact.phone || ''}
                        onChange={(e) =>
                          handleContactChange(contactIndex, 'phone', e.target.value)
                        }
                        placeholder="Phone"
                      />
                      <input
                        type="text"
                        className="contacts-table-input"
                        value={contact.role || ''}
                        onChange={(e) =>
                          handleContactChange(contactIndex, 'role', e.target.value)
                        }
                        placeholder="Role"
                      />
                      <div className="contacts-table-primary">
                        <input
                          type="checkbox"
                          checked={contact.isPrimary}
                          onChange={(e) =>
                            handleContactChange(
                              contactIndex,
                              'isPrimary',
                              e.target.checked
                            )
                          }
                        />
                      </div>
                      <button
                        className="contacts-table-delete"
                        onClick={() => handleContactRemove(contactIndex)}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  ))
                )}
              </div>
              <div className="contacts-table-footer">
                <button className="contacts-add-btn" onClick={handleAddContact}>
                  <PlusIcon />
                  Add Contact
                </button>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="location-section">
            <h4 className="location-section-title">Notes</h4>
            <textarea
              className="location-notes-textarea"
              value={location.notes || ''}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Internal notes about this location..."
            />
          </div>
        </div>
      )}
    </div>
  )
}
