import type { SortDirection } from './types'

interface SortIconProps {
  direction?: SortDirection
}

export function SortIcon({ direction }: SortIconProps) {
  return (
    <span className="data-table-sort-icon" aria-hidden="true">
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Ascending triangle (top) */}
        <path
          d="M6 2L9 5H3L6 2Z"
          className={`data-table-sort-asc ${direction === 'ascending' ? 'active' : ''}`}
        />
        {/* Descending triangle (bottom) */}
        <path
          d="M6 10L3 7H9L6 10Z"
          className={`data-table-sort-desc ${direction === 'descending' ? 'active' : ''}`}
        />
      </svg>
    </span>
  )
}
