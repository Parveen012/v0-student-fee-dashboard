"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Calendar, FileSpreadsheet, Layers, Plus, Receipt, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { classesApi, feeComponentsApi, feeStructuresApi, sessionsApi, studentsApi } from "@/lib/api"
import type { Class, FeeComponent, FeeStructure, Session, Student } from "@/lib/types"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function FeeStructurePage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [feeComponents, setFeeComponents] = useState<FeeComponent[]>([])
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [selectedSession, setSelectedSession] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newStructure, setNewStructure] = useState({ classId: "", sessionId: "" })

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [sessionsData, classesData, feeComponentsData, feeStructuresData, studentsData] =
        await Promise.all([
          sessionsApi.getAll(),
          classesApi.getAll(),
          feeComponentsApi.getAll(),
          feeStructuresApi.getAll(),
          studentsApi.getAll(),
        ])
      setSessions(sessionsData)
      setClasses(classesData)
      setFeeComponents(feeComponentsData)
      setFeeStructures(feeStructuresData)
      setStudents(studentsData)
      const active = sessionsData.find((session) => session.isActive) || sessionsData[0]
      if (!selectedSession && active) setSelectedSession(active.id.toString())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load fee structure data.")
    } finally {
      setIsLoading(false)
    }
  }, [selectedSession])

  useEffect(() => {
    loadData()
  }, [loadData])

  const rows = useMemo(() => {
    const feeComponentMap = new Map(feeComponents.map((component) => [component.id, component]))
    const selectedSessionId = selectedSession ? Number(selectedSession) : null
    return classes.map((cls) => {
      const structure = feeStructures.find(
        (item) => item.classId === cls.id && (!selectedSessionId || item.sessionId === selectedSessionId)
      )
      const components = structure?.feeStructureComponents || []
      const componentTotals = components.map((component) => ({
        name: component.feeComponent?.name || feeComponentMap.get(component.feeComponentId)?.name || "Component",
        amount: component.amount || 0,
      }))
      const totalFee = componentTotals.reduce((sum, item) => sum + item.amount, 0)
      return {
        cls,
        structure,
        totalFee,
        components: componentTotals,
        studentCount: students.filter((student) => student.classId === cls.id).length,
      }
    })
  }, [classes, feeComponents, feeStructures, selectedSession, students])

  const stats = {
    structures: rows.filter((row) => row.structure).length,
    classes: classes.length,
    components: feeComponents.length,
    students: students.length,
  }

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!newStructure.classId || !newStructure.sessionId) {
      toast.error("Please select class and session.")
      return
    }
    try {
      await feeStructuresApi.create({
        classId: Number(newStructure.classId),
        sessionId: Number(newStructure.sessionId),
      })
      toast.success("Fee structure created")
      setIsDialogOpen(false)
      setNewStructure({ classId: "", sessionId: "" })
      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create fee structure.")
    }
  }

  const handleDelete = async (structure: FeeStructure) => {
    try {
      await feeStructuresApi.delete(structure.id)
      toast.success("Fee structure deleted")
      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete fee structure.")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Fee Structure</h1>
          <p className="text-sm text-muted-foreground">Manage class-wise fee structures and component totals</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 size-4" />Create Structure</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Fee Structure</DialogTitle>
              <DialogDescription>Connect a class with an academic session.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Class</Label>
                  <Select value={newStructure.classId} onValueChange={(value) => setNewStructure((prev) => ({ ...prev, classId: value }))}>
                    <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>{classes.map((cls) => <SelectItem key={cls.id} value={cls.id.toString()}>{cls.name}-{cls.section}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Session</Label>
                  <Select value={newStructure.sessionId} onValueChange={(value) => setNewStructure((prev) => ({ ...prev, sessionId: value }))}>
                    <SelectTrigger><SelectValue placeholder="Select session" /></SelectTrigger>
                    <SelectContent>{sessions.map((session) => <SelectItem key={session.id} value={session.id.toString()}>{session.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Create</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && <Alert variant="destructive"><AlertTitle>Fee structure data unavailable</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      {isLoading && !error && <div className="text-sm text-muted-foreground">Loading fee structures...</div>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="p-4"><div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground"><Receipt className="size-4" />Structures</div><p className="text-2xl font-semibold">{stats.structures}</p></CardContent></Card>
        <Card><CardContent className="p-4"><div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground"><Layers className="size-4" />Classes</div><p className="text-2xl font-semibold">{stats.classes}</p></CardContent></Card>
        <Card><CardContent className="p-4"><div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground"><FileSpreadsheet className="size-4" />Components</div><p className="text-2xl font-semibold">{stats.components}</p></CardContent></Card>
        <Card><CardContent className="p-4"><div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground"><Calendar className="size-4" />Students</div><p className="text-2xl font-semibold">{stats.students}</p></CardContent></Card>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Academic Session</CardTitle>
          <CardDescription>Filter class fee structures by session</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedSession} onValueChange={setSelectedSession}>
            <SelectTrigger className="w-full sm:w-64"><SelectValue placeholder="Select session" /></SelectTrigger>
            <SelectContent>{sessions.map((session) => <SelectItem key={session.id} value={session.id.toString()}>{session.name}</SelectItem>)}</SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Class Fee Matrix</CardTitle>
          <CardDescription>Shows API fee structure records and component breakdowns when returned by backend</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Components</TableHead>
                  <TableHead className="text-right">Total Fee</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.cls.id}>
                    <TableCell className="font-medium">{row.cls.name}-{row.cls.section}</TableCell>
                    <TableCell>{row.studentCount}</TableCell>
                    <TableCell className="max-w-lg text-sm text-muted-foreground">
                      {row.components.length ? row.components.map((item) => `${item.name}: ${formatCurrency(item.amount)}`).join(", ") : "No component amounts returned"}
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(row.totalFee)}</TableCell>
                    <TableCell>
                      {row.structure && (
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(row.structure!)}>
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
