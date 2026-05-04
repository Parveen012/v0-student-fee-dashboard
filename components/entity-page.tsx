"use client"

import type { ReactNode } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface EntityPageProps<T> {
  title: string
  description: string
  addLabel: string
  dialogTitle: string
  dialogDescription: string
  isDialogOpen: boolean
  setIsDialogOpen: (open: boolean) => void
  isLoading: boolean
  error: string | null
  rows: T[]
  columns: string[]
  renderForm: ReactNode
  renderRow: (row: T) => ReactNode[]
  onSubmit: (event: React.FormEvent) => void
  onDelete?: (row: T) => void
  getRowKey: (row: T) => string | number
}

export function EntityPage<T>({
  title,
  description,
  addLabel,
  dialogTitle,
  dialogDescription,
  isDialogOpen,
  setIsDialogOpen,
  isLoading,
  error,
  rows,
  columns,
  renderForm,
  renderRow,
  onSubmit,
  onDelete,
  getRowKey,
}: EntityPageProps<T>) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 size-4" />{addLabel}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{dialogTitle}</DialogTitle>
              <DialogDescription>{dialogDescription}</DialogDescription>
            </DialogHeader>
            <form onSubmit={onSubmit}>
              <div className="grid gap-4 py-4">{renderForm}</div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && <Alert variant="destructive"><AlertTitle>{title} data unavailable</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      {isLoading && !error && <div className="text-sm text-muted-foreground">Loading {title.toLowerCase()}...</div>}

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">{title} Records</CardTitle>
          <CardDescription>{rows.length} record{rows.length !== 1 ? "s" : ""} found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => <TableHead key={column}>{column}</TableHead>)}
                  {onDelete && <TableHead className="w-12" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length + (onDelete ? 1 : 0)} className="h-32 text-center text-muted-foreground">
                      No records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={getRowKey(row)}>
                      {renderRow(row).map((cell, index) => <TableCell key={index}>{cell}</TableCell>)}
                      {onDelete && (
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => onDelete(row)}>
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
