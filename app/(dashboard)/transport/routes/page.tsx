"use client"

import { useCallback, useEffect, useState } from "react"
import { Edit3, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { transportRoutesApi } from "@/lib/api"
import type { CreateTransportRouteCommand, TransportRoute } from "@/lib/types"
import { validatePositiveNumber } from "../_components/transport-utils"

const emptyForm: CreateTransportRouteCommand = {
  routeName: "",
  vehicleNo: "",
  driverName: "",
  capacity: 0,
}

export default function TransportRoutesPage() {
  const [rows, setRows] = useState<TransportRoute[]>([])
  const [form, setForm] = useState<CreateTransportRouteCommand>(emptyForm)
  const [editingRow, setEditingRow] = useState<TransportRoute | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setRows(await transportRoutesApi.getAll())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load transport routes.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const openCreateDialog = () => {
    setEditingRow(null)
    setForm(emptyForm)
    setIsDialogOpen(true)
  }

  const openEditDialog = (row: TransportRoute) => {
    setEditingRow(row)
    setForm({
      routeName: row.routeName,
      vehicleNo: row.vehicleNo,
      driverName: row.driverName,
      capacity: Number(row.capacity || 0),
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.routeName.trim() || !form.vehicleNo.trim() || !form.driverName.trim()) {
      toast.error("Route name, vehicle number, and driver name are required.")
      return
    }

    const numericError = validatePositiveNumber(Number(form.capacity), "Capacity")
    if (numericError) {
      toast.error(numericError)
      return
    }

    try {
      const payload = { ...form, capacity: Number(form.capacity) }
      if (editingRow) {
        await transportRoutesApi.update(editingRow.id, payload)
        toast.success("Transport route updated")
      } else {
        await transportRoutesApi.create(payload)
        toast.success("Transport route created")
      }
      setIsDialogOpen(false)
      setEditingRow(null)
      setForm(emptyForm)
      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save transport route.")
    }
  }

  const handleDelete = async (row: TransportRoute) => {
    try {
      await transportRoutesApi.delete(row.id)
      toast.success("Transport route deleted")
      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete transport route.")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Transport Routes</h1>
          <p className="text-sm text-muted-foreground">Create and manage routes, vehicles, drivers, and capacity.</p>
        </div>
        <Button onClick={openCreateDialog}><Plus className="mr-2 size-4" />Add Route</Button>
      </div>

      {error && <Alert variant="destructive"><AlertTitle>Transport route data unavailable</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      {isLoading && !error && <div className="text-sm text-muted-foreground">Loading transport routes...</div>}

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Route Records</CardTitle>
          <CardDescription>{rows.length} record{rows.length !== 1 ? "s" : ""} found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Route Name</TableHead>
                  <TableHead>Vehicle Number</TableHead>
                  <TableHead>Driver Name</TableHead>
                  <TableHead className="text-right">Capacity</TableHead>
                  <TableHead className="w-28">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">No transport routes found.</TableCell></TableRow>
                ) : rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.routeName}</TableCell>
                    <TableCell>{row.vehicleNo}</TableCell>
                    <TableCell>{row.driverName}</TableCell>
                    <TableCell className="text-right">{row.capacity}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(row)}><Edit3 className="size-4 text-primary" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(row)}><Trash2 className="size-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRow ? "Edit Route" : "Add Route"}</DialogTitle>
            <DialogDescription>{editingRow ? "Update the selected transport route." : "Create a route used by stops and student assignments."}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label>Route Name</Label><Input value={form.routeName} onChange={(event) => setForm((prev) => ({ ...prev, routeName: event.target.value }))} required /></div>
              <div className="grid gap-2"><Label>Vehicle Number</Label><Input value={form.vehicleNo} onChange={(event) => setForm((prev) => ({ ...prev, vehicleNo: event.target.value }))} required /></div>
              <div className="grid gap-2"><Label>Driver Name</Label><Input value={form.driverName} onChange={(event) => setForm((prev) => ({ ...prev, driverName: event.target.value }))} required /></div>
              <div className="grid gap-2"><Label>Capacity</Label><Input type="number" min={1} value={form.capacity} onChange={(event) => setForm((prev) => ({ ...prev, capacity: Number(event.target.value) }))} required /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
