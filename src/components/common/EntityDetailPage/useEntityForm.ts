import { useState, useCallback, useEffect, useMemo } from 'react'
import type { UseEntityFormOptions, UseEntityFormReturn } from './types'

/**
 * Deep clone an object (simple implementation for JSON-serializable data)
 */
function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  return JSON.parse(JSON.stringify(obj))
}

/**
 * Deep compare two objects
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a !== typeof b) return false
  if (typeof a !== 'object' || a === null || b === null) return false

  const keysA = Object.keys(a as object)
  const keysB = Object.keys(b as object)

  if (keysA.length !== keysB.length) return false

  for (const key of keysA) {
    if (!keysB.includes(key)) return false
    if (!deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
      return false
    }
  }

  return true
}

/**
 * Set a nested value in an object using dot notation path
 * e.g., setNestedValue(obj, 'address.city', 'New York')
 */
function setNestedValue<T>(obj: T, path: string, value: unknown): T {
  const result = deepClone(obj)
  const keys = path.split('.')
  let current: Record<string, unknown> = result as unknown as Record<string, unknown>

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
      current[key] = {}
    }
    current = current[key] as Record<string, unknown>
  }

  current[keys[keys.length - 1]] = value
  return result
}

/**
 * Custom hook for managing entity form state across detail page tabs
 *
 * Features:
 * - Tracks original vs current data for dirty detection
 * - Supports nested objects via updateNestedField
 * - Validation support with per-field errors
 * - Reset to original state
 */
export function useEntityForm<T extends object>({
  initialData,
  validate,
}: UseEntityFormOptions<T>): UseEntityFormReturn<T> {
  // Store original data for dirty comparison and reset
  const [originalData, setOriginalData] = useState<T | null>(initialData ? deepClone(initialData) : null)

  // Current form data
  const [formData, setFormDataState] = useState<T>(() => {
    if (initialData) {
      return deepClone(initialData)
    }
    return {} as T
  })

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Update form data when initialData changes (e.g., after fetch)
  useEffect(() => {
    if (initialData) {
      const clonedData = deepClone(initialData)
      setOriginalData(clonedData)
      setFormDataState(clonedData)
      setErrors({})
    }
  }, [initialData])

  // Check if form is dirty (has unsaved changes)
  const isDirty = useMemo(() => {
    if (!originalData) return false
    return !deepEqual(formData, originalData)
  }, [formData, originalData])

  // Update a single field
  const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setFormDataState((prev) => ({
      ...prev,
      [field]: value,
    }))
    // Clear error for this field
    setErrors((prev) => {
      if (prev[field as string]) {
        const { [field as string]: _, ...rest } = prev
        return rest
      }
      return prev
    })
  }, [])

  // Update a nested field using dot notation
  const updateNestedField = useCallback((path: string, value: unknown) => {
    setFormDataState((prev) => setNestedValue(prev, path, value))
    // Clear error for this path
    setErrors((prev) => {
      if (prev[path]) {
        const { [path]: _, ...rest } = prev
        return rest
      }
      return prev
    })
  }, [])

  // Set entire form data (for complex updates)
  const setFormData = useCallback((data: T) => {
    setFormDataState(data)
  }, [])

  // Reset form to original data
  const resetForm = useCallback(() => {
    if (originalData) {
      setFormDataState(deepClone(originalData))
      setErrors({})
    }
  }, [originalData])

  // Validate form and set errors
  const validateForm = useCallback(() => {
    if (!validate) return true

    const validationErrors = validate(formData)
    setErrors(validationErrors)
    return Object.keys(validationErrors).length === 0
  }, [formData, validate])

  // Clear a specific error
  const clearError = useCallback((field: string) => {
    setErrors((prev) => {
      if (prev[field]) {
        const { [field]: _, ...rest } = prev
        return rest
      }
      return prev
    })
  }, [])

  return {
    formData,
    originalData,
    isDirty,
    errors,
    updateField,
    updateNestedField,
    setFormData,
    resetForm,
    validateForm,
    clearError,
  }
}

/**
 * Hook to warn users about unsaved changes when navigating away
 */
export function useUnsavedChangesWarning(isDirty: boolean) {
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])
}
