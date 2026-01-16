import type { Account, AccountType, AccountLocation, LocationContact, AccountLocationOption, LocationType } from '../types'
import { accountsCollection } from '../storage'
import { generateId } from '../schema'

export const accountService = {
  async getAll(): Promise<Account[]> {
    return accountsCollection.getAll()
  },

  async getByType(type: AccountType): Promise<Account[]> {
    return accountsCollection.query(a => a.type === type)
  },

  async getById(id: string): Promise<Account | undefined> {
    return accountsCollection.getById(id)
  },

  async getCustomers(): Promise<Account[]> {
    return this.getByType('customer')
  },

  async getSuppliers(): Promise<Account[]> {
    return this.getByType('supplier')
  },

  async getCarriers(): Promise<Account[]> {
    return this.getByType('carrier')
  },

  async search(query: string): Promise<Account[]> {
    const lowerQuery = query.toLowerCase()
    return accountsCollection.query(a =>
      a.name.toLowerCase().includes(lowerQuery) ||
      a.code?.toLowerCase().includes(lowerQuery) ||
      a.locations.some(loc =>
        loc.name.toLowerCase().includes(lowerQuery) ||
        loc.address.city.toLowerCase().includes(lowerQuery) ||
        loc.contacts.some(c =>
          c.name.toLowerCase().includes(lowerQuery) ||
          c.email?.toLowerCase().includes(lowerQuery)
        )
      )
    )
  },

  async create(data: Omit<Account, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<Account> {
    const now = new Date().toISOString()
    const newAccount: Account = {
      ...data,
      id: generateId('acct'),
      createdBy: 'current-user',
      createdAt: now,
      updatedAt: now,
    }
    await accountsCollection.create(newAccount)
    return newAccount
  },

  async update(id: string, data: Partial<Account>): Promise<Account | undefined> {
    const existing = await accountsCollection.getById(id)
    if (!existing) return undefined

    const updated: Account = {
      ...existing,
      ...data,
      id, // Prevent ID from being changed
      updatedAt: new Date().toISOString(),
    }
    return accountsCollection.update(id, updated)
  },

  async delete(id: string): Promise<boolean> {
    return accountsCollection.delete(id)
  },

  async toggleActive(id: string): Promise<Account | undefined> {
    const account = await this.getById(id)
    if (!account) return undefined
    return this.update(id, { isActive: !account.isActive })
  },

  // ========== Location CRUD Methods ==========

  async addLocation(accountId: string, location: Omit<AccountLocation, 'id'>): Promise<AccountLocation | undefined> {
    const account = await this.getById(accountId)
    if (!account) return undefined

    const newLocation: AccountLocation = {
      ...location,
      id: generateId('loc'),
    }

    // If this is marked as default, unmark others
    const locations = [...account.locations]
    if (newLocation.isDefaultShipping) {
      locations.forEach(loc => loc.isDefaultShipping = false)
    }
    if (newLocation.isDefaultBilling) {
      locations.forEach(loc => loc.isDefaultBilling = false)
    }

    locations.push(newLocation)
    await this.update(accountId, { locations })
    return newLocation
  },

  async updateLocation(accountId: string, locationId: string, data: Partial<AccountLocation>): Promise<AccountLocation | undefined> {
    const account = await this.getById(accountId)
    if (!account) return undefined

    const locationIndex = account.locations.findIndex(l => l.id === locationId)
    if (locationIndex === -1) return undefined

    const locations = [...account.locations]

    // Handle default flags - only one location can be default
    if (data.isDefaultShipping) {
      locations.forEach(loc => loc.isDefaultShipping = false)
    }
    if (data.isDefaultBilling) {
      locations.forEach(loc => loc.isDefaultBilling = false)
    }

    locations[locationIndex] = {
      ...locations[locationIndex],
      ...data,
      id: locationId, // Prevent ID change
    }

    await this.update(accountId, { locations })
    return locations[locationIndex]
  },

  async deleteLocation(accountId: string, locationId: string): Promise<boolean> {
    const account = await this.getById(accountId)
    if (!account) return false

    const index = account.locations.findIndex(l => l.id === locationId)
    if (index === -1) return false

    const locations = account.locations.filter(l => l.id !== locationId)
    await this.update(accountId, { locations })
    return true
  },

  // ========== Contact CRUD Methods ==========

  async addContact(accountId: string, locationId: string, contact: Omit<LocationContact, 'id'>): Promise<LocationContact | undefined> {
    const account = await this.getById(accountId)
    if (!account) return undefined

    const location = account.locations.find(l => l.id === locationId)
    if (!location) return undefined

    const newContact: LocationContact = {
      ...contact,
      id: generateId('contact'),
    }

    // If marked as primary, unmark others
    const contacts = [...location.contacts]
    if (newContact.isPrimary) {
      contacts.forEach(c => c.isPrimary = false)
    }
    contacts.push(newContact)

    const locations = account.locations.map(l =>
      l.id === locationId ? { ...l, contacts } : l
    )
    await this.update(accountId, { locations })
    return newContact
  },

  async updateContact(accountId: string, locationId: string, contactId: string, data: Partial<LocationContact>): Promise<LocationContact | undefined> {
    const account = await this.getById(accountId)
    if (!account) return undefined

    const location = account.locations.find(l => l.id === locationId)
    if (!location) return undefined

    const contactIndex = location.contacts.findIndex(c => c.id === contactId)
    if (contactIndex === -1) return undefined

    const contacts = [...location.contacts]

    // Handle primary flag
    if (data.isPrimary) {
      contacts.forEach(c => c.isPrimary = false)
    }

    contacts[contactIndex] = {
      ...contacts[contactIndex],
      ...data,
      id: contactId,
    }

    const locations = account.locations.map(l =>
      l.id === locationId ? { ...l, contacts } : l
    )
    await this.update(accountId, { locations })
    return contacts[contactIndex]
  },

  async deleteContact(accountId: string, locationId: string, contactId: string): Promise<boolean> {
    const account = await this.getById(accountId)
    if (!account) return false

    const location = account.locations.find(l => l.id === locationId)
    if (!location) return false

    const contactIndex = location.contacts.findIndex(c => c.id === contactId)
    if (contactIndex === -1) return false

    const contacts = location.contacts.filter(c => c.id !== contactId)
    const locations = account.locations.map(l =>
      l.id === locationId ? { ...l, contacts } : l
    )
    await this.update(accountId, { locations })
    return true
  },

  // ========== Location Query Helpers ==========

  async getLocationsForDropdown(accountType?: AccountType, locationType?: LocationType): Promise<AccountLocationOption[]> {
    const accounts = accountType ? await this.getByType(accountType) : await this.getAll()
    const options: AccountLocationOption[] = []

    accounts.forEach(account => {
      if (!account.isActive) return

      account.locations
        .filter(loc => {
          if (!loc.isActive) return false
          if (locationType && !loc.types.includes(locationType)) return false
          return true
        })
        .forEach(loc => {
          options.push({
            value: `${account.id}:${loc.id}`,
            label: `${account.name} - ${loc.name}`,
            accountId: account.id,
            accountName: account.name,
            locationId: loc.id,
            locationName: loc.name,
            address: loc.address,
            locationType: loc.types,
          })
        })
    })

    return options
  },

  async getDefaultShippingLocation(accountId: string): Promise<AccountLocation | undefined> {
    const account = await this.getById(accountId)
    if (!account) return undefined
    return account.locations.find(l => l.isDefaultShipping && l.isActive)
  },

  async getDefaultBillingLocation(accountId: string): Promise<AccountLocation | undefined> {
    const account = await this.getById(accountId)
    if (!account) return undefined
    return account.locations.find(l => l.isDefaultBilling && l.isActive)
  },

  parseLocationValue(value: string): { accountId: string; locationId: string } | null {
    const parts = value.split(':')
    if (parts.length !== 2) return null
    return { accountId: parts[0], locationId: parts[1] }
  },

  // Reset data (useful for development)
  async reset(): Promise<void> {
    await accountsCollection.clear()
    // Data will be re-seeded on next storage initialization
  },
}
