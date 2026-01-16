import type { ReactNode } from 'react'

export interface FormFieldProps {
  label?: string
  required?: boolean
  error?: string
  children: ReactNode
  className?: string
}

export interface InputProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  type?: 'text' | 'email' | 'password' | 'tel'
  className?: string
  name?: string
  style?: React.CSSProperties
}

export interface TextAreaProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  rows?: number
  className?: string
  name?: string
}

export interface NumberInputProps {
  value?: number | null
  onChange?: (value: number | null) => void
  placeholder?: string
  disabled?: boolean
  min?: number
  max?: number
  step?: number
  prefix?: string
  suffix?: string
  className?: string
  name?: string
}

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  options: SelectOption[]
  className?: string
  name?: string
}

export interface DatePickerProps {
  /** Value can be a Date object, ISO string (YYYY-MM-DD), or null */
  value?: Date | string | null
  /** onChange returns a string in YYYY-MM-DD format or null */
  onChange?: (value: string | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  name?: string
}
