import { SearchField as AriaSearchField, Input, Button } from 'react-aria-components'
import type { SearchFieldProps as AriaSearchFieldProps } from 'react-aria-components'

export interface SearchFieldProps extends AriaSearchFieldProps {
  placeholder?: string
  width?: number | string
}

export function SearchField({
  placeholder = 'Search...',
  width,
  className,
  ...props
}: SearchFieldProps) {
  return (
    <AriaSearchField
      className={`search-field ${className ?? ''}`}
      style={{ width }}
      {...props}
    >
      <div className="search-field-icon">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M7.333 12.667A5.333 5.333 0 1 0 7.333 2a5.333 5.333 0 0 0 0 10.667ZM14 14l-2.9-2.9"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <Input className="search-field-input" placeholder={placeholder} />
      <Button className="search-field-clear">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M10.5 3.5L3.5 10.5M3.5 3.5l7 7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Button>
    </AriaSearchField>
  )
}
