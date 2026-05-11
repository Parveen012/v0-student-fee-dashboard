"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Edit3, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { feeComponentsApi } from "@/lib/api"
import type { CreateFeeComponentCommand, FeeComponent, Frequency } from "@/lib/types"

const frequencyOptions: Frequency[] = ["Monthly", "Quarterly", "HalfYearly", "Yearly", "OneTime"]

function formatCurrency(amount?: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

export default function FeeComponentsPage() {
  const [rows, setRows] = useState<FeeComponent[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingRow, setEditingRow] = useState<FeeComponent | null>(null)
  const [form, setForm] = useState<CreateFeeComponentCommand>({
    name: "",
    code: "",
    type: "",
    amount: 0,
    frequency: "Monthly",
    isOptional: false,
    isTransportRelated: false,
    description: "",
  })

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setRows(await feeComponentsApi.getAll())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load fee components.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const openCreateDialog = () => {
    setEditingRow(null)
    setForm({
      name: "",
      code: "",
      type: "",
      amount: 0,
      frequency: "Monthly",
      isOptional: false,
      isTransportRelated: false,
      description: "",
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (row: FeeComponent) => {
    setEditingRow(row)
    setForm({
      name: row.name,
      code: row.code ?? "",
      type: row.type ?? "",
      amount: row.amount || 0,
      frequency: (row.frequency as Frequency) || "Monthly",
      isOptional: row.isOptional ?? false,
      isTransportRelated: row.isTransportRelated ?? false,
      description: row.description ?? "",
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!form.name.trim()) {
      toast.error("Component name is required.")
      return
    }

    if (!form.frequency) {
      toast.error("Frequency is required.")
      return
    }

    if ((form.amount || 0) < 0) {
      toast.error("Amount must be greater than zero.")
      return
    }

    try {
      if (editingRow) {
        await feeComponentsApi.update(editingRow.id, form)
        toast.success("Fee component updated")
      } else {
        await feeComponentsApi.create(form)
        toast.success("Fee component created")
      }

      setForm({
        name: "",
        code: "",
        type: "",
        amount: 0,
        frequency: "Monthly",
        isOptional: false,
        isTransportRelated: false,
        description: "",
      })
      setIsDialogOpen(false)
      setEditingRow(null)
      await loadData()
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : editingRow
          ? "Failed to update fee component."
          : "Failed to create fee component."
      )
    }
  }

  const handleDelete = async (row: FeeComponent) => {
    try {
      await feeComponentsApi.delete(row.id)
      toast.success("Fee component deleted")
      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete fee component.")
    }
  }

  const totalBaseAmount = useMemo(() => rows.reduce((sum, row) => sum + (row.amount || 0), 0), [rows])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Fee Components</h1>
          <p className="text-sm text-muted-foreground">Manage reusable fee heads with frequency, optional flags, and base amounts.</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 size-4" />
          Add Component
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Fee component data unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {isLoading && !error && <div className="text-sm text-muted-foreground">Loading fee components...</div>}

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Fee Component Records</CardTitle>
              <CardDescription>{rows.length} record{rows.length !== 1 ? "s" : ""} found</CardDescription>
            </div>
            <Badge variant="outline" className="w-fit">Total base amount: {formatCurrency(totalBaseAmount)}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Base Amount</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Optional</TableHead>
                  <TableHead>Transport</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-28">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                      No records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-xs">{row.id}</TableCell>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell>{row.code || "-"}</TableCell>
                      <TableCell>{row.type || "-"}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.amount)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal">{row.frequency || "-"}</Badge>
                      </TableCell>
                      <TableCell>{row.isOptional ? "Yes" : "No"}</TableCell>
                      <TableCell>{row.isTransportRelated ? "Yes" : "No"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{row.description || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(row)}>
                            <Edit3 className="size-4 text-primary" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(row)}>
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRow ? "Edit Fee Component" : "Add Fee Component"}</DialogTitle>
            <DialogDescription>
              {editingRow ? "Update component details." : "Create a reusable fee component."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Component Name</Label>
                <Input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} required />
              </div>
              <div className="grid gap-2">
                <Label>Code</Label>
                <Input value={form.code || ""} onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Type</Label>
                <Input value={form.type || ""} onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Base Amount</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.amount || 0}
                  onChange={(event) => setForm((prev) => ({ ...prev, amount: Number(event.target.value) }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Frequency</Label>
                <Select value={String(form.frequency)} onValueChange={(value) => setForm((prev) => ({ ...prev, frequency: value as Frequency }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {frequencyOptions.map((frequency) => (
                      <SelectItem key={frequency} value={frequency}>{frequency}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
                <div>
                  <Label className="text-sm">Optional</Label>
                  <p className="text-xs text-muted-foreground">Mark this fee component as optional.</p>
                </div>
                <Checkbox checked={form.isOptional === true} onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isOptional: checked === true }))} />
              </div>
              <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
                <div>
                  <Label className="text-sm">Transport Related</Label>
                  <p className="text-xs text-muted-foreground">Use for transport-related charges.</p>
                </div>
                <Checkbox checked={form.isTransportRelated === true} onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isTransportRelated: checked === true }))} />
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea value={form.description || ""} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit">{editingRow ? "Update" : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
