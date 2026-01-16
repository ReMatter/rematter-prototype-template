import { useMemo } from 'react'
import type { ReactNode } from 'react'

interface TablePaginationProps {
  current: number
  pageSize: number
  total: number
  pageSizeOptions?: number[]
  showSizeChanger?: boolean
  showTotal?: (total: number, range: [number, number]) => ReactNode
  onChange: (page: number, pageSize: number) => void
}

export function TablePagination({
  current,
  pageSize,
  total,
  pageSizeOptions = [10, 20, 50, 100],
  showSizeChanger = true,
  showTotal,
  onChange,
}: TablePaginationProps) {
  const totalPages = Math.ceil(total / pageSize)

  const range: [number, number] = useMemo(() => {
    const start = (current - 1) * pageSize + 1
    const end = Math.min(current * pageSize, total)
    return [start, end]
  }, [current, pageSize, total])

  const pageNumbers = useMemo(() => {
    const pages: (number | 'ellipsis')[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible + 2) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      if (current <= 3) {
        // Near start
        for (let i = 2; i <= 4; i++) {
          pages.push(i)
        }
        pages.push('ellipsis')
        pages.push(totalPages)
      } else if (current >= totalPages - 2) {
        // Near end
        pages.push('ellipsis')
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        // Middle
        pages.push('ellipsis')
        for (let i = current - 1; i <= current + 1; i++) {
          pages.push(i)
        }
        pages.push('ellipsis')
        pages.push(totalPages)
      }
    }

    return pages
  }, [current, totalPages])

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== current) {
      onChange(page, pageSize)
    }
  }

  const handlePageSizeChange = (newPageSize: number) => {
    // Reset to page 1 when changing page size
    onChange(1, newPageSize)
  }

  if (total === 0) {
    return null
  }

  return (
    <div className="data-table-pagination">
      <div className="data-table-pagination-info">
        {showTotal ? showTotal(total, range) : `Total ${total.toLocaleString()} items`}
      </div>

      <div className="data-table-pagination-controls">
        {/* Previous button */}
        <button
          className="data-table-pagination-nav"
          onClick={() => handlePageChange(current - 1)}
          disabled={current === 1}
          aria-label="Previous page"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 18L9 12L15 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Page numbers */}
        <div className="data-table-pagination-pages">
          {pageNumbers.map((page, index) =>
            page === 'ellipsis' ? (
              <span key={`ellipsis-${index}`} className="data-table-pagination-ellipsis">
                ...
              </span>
            ) : (
              <button
                key={page}
                className="data-table-pagination-btn"
                data-current={page === current ? true : undefined}
                onClick={() => handlePageChange(page)}
                aria-label={`Page ${page}`}
                aria-current={page === current ? 'page' : undefined}
              >
                {page}
              </button>
            )
          )}
        </div>

        {/* Page size select */}
        {showSizeChanger && (
          <div className="data-table-pagination-size-wrapper">
            <select
              className="data-table-pagination-size-select"
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              aria-label="Page size"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>
            <svg className="data-table-pagination-size-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 9L12 15L18 9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}

        {/* Next button */}
        <button
          className="data-table-pagination-nav"
          onClick={() => handlePageChange(current + 1)}
          disabled={current === totalPages}
          aria-label="Next page"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 18L15 12L9 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
