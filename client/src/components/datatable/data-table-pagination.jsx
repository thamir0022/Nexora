import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination"

export function DataTablePagination({ table, isLoading }) {
  const pageSizeOptions = [10, 20, 30, 40, 50]

  // Get pagination state
  const pagination = table.getState().pagination
  const pageCount = table.getPageCount()
  const pageIndex = pagination.pageIndex
  const pageSize = pagination.pageSize

  // Calculate pagination info
  const currentPage = pageIndex + 1
  const totalRows = table.getFilteredRowModel().rows.length
  const startRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRows)

  // Pagination button states
  const canPreviousPage = table.getCanPreviousPage()
  const canNextPage = table.getCanNextPage()
  const isFirstPage = pageIndex === 0
  const isLastPage = pageIndex === pageCount - 1

  // Handle "Go to page" input change
  const handleGoToPage = (e) => {
    const value = e.target.value
    if (value === "") return

    const page = Number.parseInt(value, 10) - 1

    // Validate page number
    if (!isNaN(page) && page >= 0 && page < pageCount) {
      table.setPageIndex(page)
    }
  }

  // Handle "Go to page" on Enter key
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleGoToPage(e)
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-2">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium">Show</p>
        <Select
          value={`${pageSize}`}
          onValueChange={(value) => {
            table.setPageSize(Number(value))
          }}
          disabled={isLoading}
        >
          <SelectTrigger className="h-8 w-[70px]">
            <SelectValue placeholder={pageSize} />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={`${size}`}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">entries</p>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing <span className="font-medium">{startRow}</span> to <span className="font-medium">{endRow}</span> of{" "}
        <span className="font-medium">{totalRows}</span> results
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-4">
        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            {/* Go to First Page */}
            <PaginationItem>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => table.setPageIndex(0)}
                disabled={isFirstPage || isLoading}
                aria-label="Go to first page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
            </PaginationItem>

            {/* Previous Page */}
            <PaginationItem>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => table.previousPage()}
                disabled={!canPreviousPage || isLoading}
                aria-label="Go to previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </PaginationItem>

            {/* Page Input */}
            <PaginationItem>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={1}
                  max={pageCount}
                  value={currentPage}
                  onChange={handleGoToPage}
                  onKeyPress={handleKeyPress}
                  className="h-8 w-12 text-center"
                  disabled={isLoading || pageCount <= 1}
                  aria-label="Go to page"
                />
                <span className="text-sm text-muted-foreground">/ {pageCount}</span>
              </div>
            </PaginationItem>

            {/* Next Page */}
            <PaginationItem>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => table.nextPage()}
                disabled={!canNextPage || isLoading}
                aria-label="Go to next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </PaginationItem>

            {/* Go to Last Page */}
            <PaginationItem>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => table.setPageIndex(pageCount - 1)}
                disabled={isLastPage || isLoading}
                aria-label="Go to last page"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}
