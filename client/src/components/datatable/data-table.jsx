import { useState } from "react"
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ChevronUp, ChevronDown, Loader2 } from "lucide-react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DataTablePagination } from "./data-table-pagination"
import { cn } from "@/lib/utils"

export function DataTable({
  columns,
  data = [],
  pageSize = 10,
  pageCount = -1,
  pagination: propPagination,
  onPaginationChange,
  manualPagination = false,
  manualSorting = false,
  onSortingChange,
  sorting: propSorting,
  className = "",
  onRowClick,
  isLoading = false,
  ref
}) {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize,
  })

  const [sorting, setSorting] = useState(propSorting || [])

  const table = useReactTable({
    data,
    columns,
    pageCount: manualPagination ? pageCount : Math.ceil(data.length / pageSize),
    state: {
      pagination: manualPagination ? propPagination : pagination,
      sorting: manualSorting ? propSorting : sorting,
    },
    onPaginationChange: (updater) => {
      const newPagination =
        typeof updater === "function" ? updater(manualPagination ? propPagination : pagination) : updater

      if (manualPagination) {
        onPaginationChange?.(newPagination)
      } else {
        setPagination(newPagination)
      }
    },
    onSortingChange: manualSorting
      ? onSortingChange
      : (updater) => {
          const newSorting = typeof updater === "function" ? updater(sorting) : updater
          setSorting(newSorting)
        },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination,
    manualSorting,
    // Add these for better pagination control
    autoResetPageIndex: false,
    enableRowSelection: false,
  })

  return (
    <div className={cn("space-y-4 dark:bg-black", className)}>
      <div className="rounded-md border">
        <Table ref={ref}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      header.column.getCanSort() && "cursor-pointer select-none",
                      "hover:bg-muted/50 transition-colors",
                    )}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-2">
                      {!header.isPlaceholder && flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <div className="ml-2">
                          {header.column.getIsSorted() === "asc" ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : header.column.getIsSorted() === "desc" ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronUp className="h-4 w-4 opacity-30" />
                          )}
                        </div>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="text-muted-foreground">Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(onRowClick && "cursor-pointer hover:bg-muted/50", row.getIsSelected() && "bg-muted/30")}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} isLoading={isLoading} />
    </div>
  )
}
