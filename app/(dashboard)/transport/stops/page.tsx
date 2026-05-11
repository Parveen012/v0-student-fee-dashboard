"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Edit3, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { routeStopsApi, transportRoutesApi } from "@/lib/api"
import type { CreateRouteStopCommand, RouteStop, TransportRoute } from "@/lib/types"
import { formatCurrency, getRouteName, validatePositiveNumber } from "../_components/transport-utils"

const emptyForm: CreateRouteStopCommand = {
  routeId: 0,
  stopName: "",
  distanceFromSchool: 0,
  monthlyAmount: 0,
  sequenceNo: 1,
}

export default function RouteStopsPage() {
  const [routes, setRoutes] = useState<TransportRoute[]>([])
  const [stops, setStops] = useState<RouteStop[]>([])
  const [selectedRouteId, setSelectedRouteId] = useState("")
  const [form, setForm] = useState<CreateRouteStopCommand>(emptyForm)
  const [editingRow, setEditingRow] = useState<RouteStop | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [routesData, stopsData] = await Promise.all([
        transportRoutesApi.getAll(),
        routeStopsApi.getAll(),
      ])
      setRoutes(routesData)
      setStops(stopsData)
      if (!selectedRouteId && routesData[0]) {
        setSelectedRouteId(routesData[0].id.toString())
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load route stops.")
    } finally {
      setIsLoading(false)
    }
  }, [selectedRouteId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const selectedRoute = routes.find((route) => route.id.toString() === selectedRouteId)
  const filteredStops = useMemo(
    () => stops
      .filter((stop) => !selectedRouteId || stop.routeId.toString() === selectedRouteId)
      .sort((a, b) => Number(a.sequenceNo || 0) - Number(b.sequenceNo || 0)),
    [selectedRouteId, stops]
  )

  const openCreateDialog = () => {
    setEditingRow(null)
    setForm({
      ...emptyForm,
      routeId: selectedRouteId ? Number(selectedRouteId) : routes[0]?.id || 0,
      sequenceNo: filteredStops.length + 1,
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (row: RouteStop) => {
    setEditingRow(row)
    setForm({
      routeId: row.routeId,
      stopName: row.stopName,
      distanceFromSchool: Number(row.distanceFromSchool || 0),
      monthlyAmount: Number(row.monthlyAmount || 0),
      sequenceNo: Number(row.sequenceNo || 1),
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.routeId || !form.stopName.trim()) {
      toast.error("Route and stop name are required.")
      return
    }

    const distanceError = validatePositiveNumber(Number(form.distanceFromSchool), "Distance", true)
    const amountError = validatePositiveNumber(Number(form.monthlyAmount), "Monthly fee", true)
    const sequenceError = validatePositiveNumber(Number(form.sequenceNo), "Sequence")
    if (distanceError || amountError || sequenceError) {
      toast.error(distanceError || amountError || sequenceError || "Invalid stop details.")
      return
    }

    try {
      const payload = {
        ...form,
        routeId: Number(form.routeId),
        distanceFromSchool: Number(form.distanceFromSchool),
        monthlyAmount: Number(form.monthlyAmount),
        sequenceNo: Number(form.sequenceNo),
      }
      if (editingRow) {
        await routeStopsApi.update(editingRow.id, payload)
        toast.success("Route stop updated")
      } else {
        await routeStopsApi.create(payload)
        toast.success("Route stop created")
      }
      setSelectedRouteId(payload.routeId.toString())
      setIsDialogOpen(false)
      setEditingRow(null)
      setForm(emptyForm)
      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save route stop.")
    }
  }

  const handleDelete = async (row: RouteStop) => {
    try {
      await routeStopsApi.delete(row.id)
      toast.success("Route stop deleted")
      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete route stop.")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Route Stops</h1>
          <p className="text-sm text-muted-foreground">Manage route-wise stops, sequence, distance, and monthly transport fee.</p>
        </div>
        <Button onClick={openCreateDialog} disabled={routes.length === 0}><Plus className="mr-2 size-4" />Add Stop</Button>
      </div>

      {error && <Alert variant="destructive"><AlertTitle>Route stop data unavailable</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      {isLoading && !error && <div className="text-sm text-muted-foreground">Loading routes and stops...</div>}

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <div className="grid gap-4 md:grid-cols-[1fr_280px] md:items-end">
            <div>
              <CardTitle className="text-base font-semibold">Stops for {selectedRoute ? getRouteName(selectedRoute) : "Selected Route"}</CardTitle>
              <CardDescription>{filteredStops.length} stop{filteredStops.length !== 1 ? "s" : ""} found</CardDescription>
            </div>
            <div className="grid gap-2">
              <Label>Select Route</Label>
              <Select value={selectedRouteId} onValueChange={setSelectedRouteId}>
                <SelectTrigger><SelectValue placeholder="Select route" /></SelectTrigger>
                <SelectContent>
                  {routes.map((route) => (
                    <SelectItem key={route.id} value={route.id.toString()}>{route.routeName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sequence</TableHead>
                  <TableHead>Stop Name</TableHead>
                  <TableHead className="text-right">Distance</TableHead>
                  <TableHead className="text-right">Monthly Fee</TableHead>
                  <TableHead className="w-28">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStops.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">No stops found for the selected route.</TableCell></TableRow>
                ) : filteredStops.map((stop) => (
                  <TableRow key={stop.id}>
                    <TableCell>{stop.sequenceNo}</TableCell>
                    <TableCell className="font-medium">{stop.stopName}</TableCell>
                    <TableCell className="text-right">{Number(stop.distanceFromSchool || 0)} km</TableCell>
                    <TableCell className="text-right">{formatCurrency(stop.monthlyAmount)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(stop)}><Edit3 className="size-4 text-primary" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(stop)}><Trash2 className="size-4 text-destructive" /></Button>
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
            <DialogTitle>{editingRow ? "Edit Stop" : "Add Stop"}</DialogTitle>
            <DialogDescription>{editingRow ? "Update stop details." : "Create a stop and attach it to a route."}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Route</Label>
                <Select value={form.routeId ? form.routeId.toString() : ""} onValueChange={(value) => setForm((prev) => ({ ...prev, routeId: Number(value) }))}>
                  <SelectTrigger><SelectValue placeholder="Select route" /></SelectTrigger>
                  <SelectContent>
                    {routes.map((route) => (
                      <SelectItem key={route.id} value={route.id.toString()}>{route.routeName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2"><Label>Stop Name</Label><Input value={form.stopName} onChange={(event) => setForm((prev) => ({ ...prev, stopName: event.target.value }))} required /></div>
              <div className="grid gap-2"><Label>Distance From School</Label><Input type="number" min={0} step="0.1" value={form.distanceFromSchool} onChange={(event) => setForm((prev) => ({ ...prev, distanceFromSchool: Number(event.target.value) }))} required /></div>
              <div className="grid gap-2"><Label>Monthly Fee</Label><Input type="number" min={0} value={form.monthlyAmount} onChange={(event) => setForm((prev) => ({ ...prev, monthlyAmount: Number(event.target.value) }))} required /></div>
              <div className="grid gap-2"><Label>Sequence</Label><Input type="number" min={1} value={form.sequenceNo} onChange={(event) => setForm((prev) => ({ ...prev, sequenceNo: Number(event.target.value) }))} required /></div>
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
