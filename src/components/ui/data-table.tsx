import React, { useState } from 'react'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  // PaginationNext,
  // PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  filterField?: string
  filterPlaceholder?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  filterField,
  filterPlaceholder,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState({})
  let shifted = false

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  })

  const pageNumbers: number[] = []
  const maxPageNum = 5
  const pageNumLimit = Math.floor(maxPageNum / 2) // Current page should be in the middle if possible

  for (let i = 1; i <= table.getPageCount(); i++) {
    pageNumbers.push(i)
  }

  const activePages = pageNumbers.slice(
    Math.max(0, table.getState().pagination.pageIndex - 1 - pageNumLimit),
    Math.min(
      table.getState().pagination.pageIndex + pageNumLimit + 1,
      pageNumbers.length,
    ),
  )

  const renderPageNumbers = () => {
    const pageNumbersRendered = activePages.map((pageNumber, i) => (
      <PaginationItem key={i}>
        <PaginationLink
          isActive={table.getState().pagination.pageIndex + 1 === pageNumber}
          onClick={() => table.setPageIndex(pageNumber - 1)}
        >
          {pageNumber}
        </PaginationLink>
      </PaginationItem>
    ))

    // Add ellipsis at the start if necessary
    if (activePages[0] > 1 && !shifted) {
      pageNumbersRendered.unshift(
        <PaginationItem key="first">
          <PaginationLink onClick={() => table.setPageIndex(0)}>
            1
          </PaginationLink>
        </PaginationItem>,
        <PaginationEllipsis
          key="ellipsis-start"
          onClick={() => table.setPageIndex(activePages[0] - 1)}
        />,
      )
      shifted = true
    }

    // Add ellipsis at the end if necessary
    if (activePages[activePages.length - 1] < pageNumbers.length) {
      pageNumbersRendered.push(
        <PaginationEllipsis
          key="ellipsis-end"
          onClick={() =>
            table.setPageIndex(activePages[activePages.length - 1] + 1)
          }
        />,
        <PaginationItem key="last">
          <PaginationLink
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          >
            {table.getPageCount()}
          </PaginationLink>
        </PaginationItem>,
      )
    }

    return pageNumbersRendered
  }

  return (
    <div>
      {filterField && (
        <div className="flex items-center py-4">
          <Input
            placeholder={`Filtrar por ${filterPlaceholder}...`}
            value={
              (table.getColumn(filterField)?.getFilterValue() as string) ?? ''
            }
            onChange={(event) =>
              table.getColumn(filterField)?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        </div>
      )}
      <div className="rounder-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {table.getRowCount() > 10 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <Button
                variant="outline"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft />
                Anterior
              </Button>
            </PaginationItem>
            {renderPageNumbers()}
            <PaginationItem>
              <Button
                variant="ghost"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Próximo
                <ChevronRight />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
        // <div className="flex items-center justify-end space-x-2 py-4">
        //   <Button
        //     variant="outline"
        //     size="sm"
        //     onClick={() => table.previousPage()}
        //     disabled={!table.getCanPreviousPage()}
        //   >
        //     Anterior
        //   </Button>
        //   <Button
        //     variant="outline"
        //     size="sm"
        //     onClick={() => table.nextPage()}
        //     disabled={!table.getCanNextPage()}
        //   >
        //     Próximo
        //   </Button>
        // </div>
      )}
    </div>
  )
}
