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
import { routeStopsApi, studentTransportApi, studentsApi, transportRoutesApi } from "@/lib/api"
import type { CreateStudentTransportCommand, RouteStop, Student, StudentTransport, TransportRoute } from "@/lib/types"
import { formatDate, fromDateInputValue, getRouteName, getStopName, getStudentName, toDateInputValue } from "../_components/transport-utils"

type AssignmentForm = {
  studentId: number
  routeId: number
  stopId: number
  startDate: string
  endDate: string
  pickupShift: string
  dropShift: string
}

const emptyForm: AssignmentForm = {
  studentId: 0,
  routeId: 0,
  stopId: 0,
  startDate: "",
  endDate: "",
  pickupShift: "",
  dropShift: "",
}

export default function StudentTransportAssignmentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [routes, setRoutes] = useState<TransportRoute[]>([])
  const [stops, setStops] = useState<RouteStop[]>([])
  const [assignments, setAssignments] = useState<StudentTransport[]>([])
  const [form, setForm] = useState<AssignmentForm>(emptyForm)
  const [editingRow, setEditingRow] = useState<StudentTransport | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [studentsData, routesData, stopsData, assignmentsData] = await Promise.all([
        studentsApi.getAll(),
        transportRoutesApi.getAll(),
        routeStopsApi.getAll(),
        studentTransportApi.getAll(),
      ])
      setStudents(studentsData)
      setRoutes(routesData)
      setStops(stopsData)
      setAssignments(assignmentsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load transport assignments.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const studentMap = useMemo(() => new Map(students.map((student) => [student.id, student])), [students])
  const routeMap = useMemo(() => new Map(routes.map((route) => [route.id, route])), [routes])
  const stopMap = useMemo(() => new Map(stops.map((stop) => [stop.id, stop])), [stops])
  const filteredStops = useMemo(
    () => stops
      .filter((stop) => form.routeId > 0 && stop.routeId === form.routeId)
      .sort((a, b) => Number(a.sequenceNo || 0) - Number(b.sequenceNo || 0)),
    [form.routeId, stops]
  )

  const openCreateDialog = () => {
    const defaultRouteId = routes[0]?.id || 0
    const defaultStopId = stops.find((stop) => stop.routeId === defaultRouteId)?.id || 0
    setEditingRow(null)
    const today = new Date().toISOString().slice(0, 10)
    setForm({
      ...emptyForm,
      studentId: students[0]?.id || 0,
      routeId: defaultRouteId,
      stopId: defaultStopId,
      startDate: today,
      endDate: today,
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (row: StudentTransport) => {
    setEditingRow(row)
    setForm({
      studentId: row.studentId,
      routeId: row.routeId,
      stopId: row.stopId,
      startDate: toDateInputValue(row.startDate),
      endDate: toDateInputValue(row.endDate),
      pickupShift: row.pickupShift,
      dropShift: row.dropShift,
    })
    setIsDialogOpen(true)
  }

  const updateRoute = (routeId: number) => {
    const firstStop = stops
      .filter((stop) => stop.routeId === routeId)
      .sort((a, b) => Number(a.sequenceNo || 0) - Number(b.sequenceNo || 0))[0]

    setForm((prev) => ({
      ...prev,
      routeId,
      stopId: firstStop?.id || 0,
    }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.studentId || !form.routeId || !form.stopId || !form.pickupShift.trim() || !form.dropShift.trim()) {
      toast.error("Student, route, stop, pickup shift, and drop shift are required.")
      return
    }

    if (!form.startDate || !form.endDate) {
      toast.error("Start date and end date are required.")
      return
    }

    const startDate = new Date(form.startDate)
    const endDate = new Date(form.endDate)
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate < startDate) {
      toast.error("Please enter a valid date range.")
      return
    }

    try {
      const payload: CreateStudentTransportCommand = {
        studentId: Number(form.studentId),
        routeId: Number(form.routeId),
        stopId: Number(form.stopId),
        startDate: fromDateInputValue(form.startDate),
        endDate: fromDateInputValue(form.endDate),
        pickupShift: form.pickupShift,
        dropShift: form.dropShift,
      }

      if (editingRow) {
        await studentTransportApi.update(editingRow.id, payload)
        toast.success("Transport assignment updated")
      } else {
        await studentTransportApi.create(payload)
        toast.success("Transport assignment created")
      }
      setIsDialogOpen(false)
      setEditingRow(null)
      setForm(emptyForm)
      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save transport assignment.")
    }
  }

  const handleDelete = async (row: StudentTransport) => {
    try {
      await studentTransportApi.delete(row.id)
      toast.success("Transport assignment removed")
      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove transport assignment.")
    }
  }

  const canCreate = students.length > 0 && routes.length > 0 && stops.length > 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Transport Assignments</h1>
          <p className="text-sm text-muted-foreground">Assign students to route stops used by transport fee generation.</p>
        </div>
        <Button onClick={openCreateDialog} disabled={!canCreate}><Plus className="mr-2 size-4" />Assign Student</Button>
      </div>

      {error && <Alert variant="destructive"><AlertTitle>Transport assignment data unavailable</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      {isLoading && !error && <div className="text-sm text-muted-foreground">Loading transport assignments...</div>}

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Student Transport Records</CardTitle>
          <CardDescription>{assignments.length} record{assignments.length !== 1 ? "s" : ""} found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Stop</TableHead>
                  <TableHead>Pickup Shift</TableHead>
                  <TableHead>Drop Shift</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead className="w-28">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="h-32 text-center text-muted-foreground">No transport assignments found.</TableCell></TableRow>
                ) : assignments.map((assignment) => {
                  const student = assignment.student || studentMap.get(assignment.studentId)
                  const route = assignment.route || assignment.transportRoute || routeMap.get(assignment.routeId)
                  const stop = assignment.stop || assignment.routeStop || stopMap.get(assignment.stopId)

                  return (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">{getStudentName(student)}</TableCell>
                      <TableCell>{getRouteName(route)}</TableCell>
                      <TableCell>{getStopName(stop)}</TableCell>
                      <TableCell>{assignment.pickupShift}</TableCell>
                      <TableCell>{assignment.dropShift}</TableCell>
                      <TableCell>{formatDate(assignment.startDate)}</TableCell>
                      <TableCell>{formatDate(assignment.endDate)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(assignment)}><Edit3 className="size-4 text-primary" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(assignment)}><Trash2 className="size-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRow ? "Edit Assignment" : "Assign Student"}</DialogTitle>
            <DialogDescription>{editingRow ? "Update the student's route and stop." : "Connect a student to a transport route stop."}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Student</Label>
                <Select value={form.studentId ? form.studentId.toString() : ""} onValueChange={(value) => setForm((prev) => ({ ...prev, studentId: Number(value) }))}>
                  <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id.toString()}>{getStudentName(student)} - {student.admissionNo || `STU${String(student.id).padStart(3, "0")}`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Route</Label>
                <Select value={form.routeId ? form.routeId.toString() : ""} onValueChange={(value) => updateRoute(Number(value))}>
                  <SelectTrigger><SelectValue placeholder="Select route" /></SelectTrigger>
                  <SelectContent>
                    {routes.map((route) => (
                      <SelectItem key={route.id} value={route.id.toString()}>{route.routeName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Stop</Label>
                <Select value={form.stopId ? form.stopId.toString() : ""} onValueChange={(value) => setForm((prev) => ({ ...prev, stopId: Number(value) }))}>
                  <SelectTrigger><SelectValue placeholder="Select stop" /></SelectTrigger>
                  <SelectContent>
                    {filteredStops.map((stop) => (
                      <SelectItem key={stop.id} value={stop.id.toString()}>{stop.sequenceNo}. {stop.stopName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2"><Label>Pickup Shift</Label><Input value={form.pickupShift} onChange={(event) => setForm((prev) => ({ ...prev, pickupShift: event.target.value }))} required /></div>
              <div className="grid gap-2"><Label>Drop Shift</Label><Input value={form.dropShift} onChange={(event) => setForm((prev) => ({ ...prev, dropShift: event.target.value }))} required /></div>
              <div className="grid gap-2"><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))} required /></div>
              <div className="grid gap-2"><Label>End Date</Label><Input type="date" value={form.endDate} onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))} required /></div>
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
