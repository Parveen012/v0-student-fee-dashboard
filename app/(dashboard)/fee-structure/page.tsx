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
import { Input } from "@/components/ui/input"
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
import { classesApi, feeComponentsApi, feeStructuresApi, sessionsApi, studentsApi, finePoliciesApi, feeStructureComponentsApi } from "@/lib/api"
import type { Class, FeeComponent, FeeStructure, Session, Student, FinePolicy } from "@/lib/types"

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
  const [finePolicies, setFinePolicies] = useState<FinePolicy[]>([])
  const [selectedSession, setSelectedSession] = useState("")
  const [selectedStructureId, setSelectedStructureId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLinkComponentDialogOpen, setIsLinkComponentDialogOpen] = useState(false)
  const [newStructure, setNewStructure] = useState({
    classId: "",
    sessionId: "",
    name: "",
    effectiveFrom: "",
    effectiveTo: "",
  })
  const [newComponent, setNewComponent] = useState({
    feeComponentId: "",
    amount: "",
    gstPercent: "",
    dueDay: "",
    finePolicyId: "",
  })

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [sessionsData, classesData, feeComponentsData, feeStructuresData, studentsData, finePoliciesData] =
        await Promise.all([
          sessionsApi.getAll(),
          classesApi.getAll(),
          feeComponentsApi.getAll(),
          feeStructuresApi.getAll(),
          studentsApi.getAll(),
          finePoliciesApi.getAll(),
        ])
      setSessions(sessionsData)
      setClasses(classesData)
      setFeeComponents(feeComponentsData)
      setFeeStructures(feeStructuresData)
      setStudents(studentsData)
      setFinePolicies(finePoliciesData)
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
      // Get components from either feeStructureComponents or classFeeStructureComponents
      const components = structure?.classFeeStructureComponents || structure?.feeStructureComponents || []
      const componentTotals = components.map((component) => ({
        name: component.feeComponent?.name || feeComponentMap.get(component.feeComponentId)?.name || "Component",
        amount: component.amount || 0,
        gstPercent: component.gstPercent,
        dueDay: component.dueDay,
        finePolicyName: component.finePolicy?.name,
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
    if (!newStructure.classId || !newStructure.sessionId || !newStructure.name || !newStructure.effectiveFrom || !newStructure.effectiveTo) {
      toast.error("Please fill in all required fields.")
      return
    }
    try {
      await feeStructuresApi.create({
        classId: Number(newStructure.classId),
        sessionId: Number(newStructure.sessionId),
        name: newStructure.name,
        effectiveFrom: new Date(newStructure.effectiveFrom).toISOString(),
        effectiveTo: new Date(newStructure.effectiveTo).toISOString(),
      })
      toast.success("Fee structure created")
      setIsDialogOpen(false)
      setNewStructure({ classId: "", sessionId: "", name: "", effectiveFrom: "", effectiveTo: "" })
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

  const handleLinkComponent = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedStructureId || !newComponent.feeComponentId || !newComponent.amount) {
      toast.error("Please fill in all required fields.")
      return
    }
    try {
      await feeStructureComponentsApi.create({
        classFeeStructureId: selectedStructureId,
        feeComponentId: Number(newComponent.feeComponentId),
        amount: Number(newComponent.amount),
        gstPercent: newComponent.gstPercent ? Number(newComponent.gstPercent) : undefined,
        dueDay: newComponent.dueDay ? Number(newComponent.dueDay) : undefined,
        finePolicyId: newComponent.finePolicyId ? Number(newComponent.finePolicyId) : undefined,
      })
      toast.success("Component linked to fee structure")
      setIsLinkComponentDialogOpen(false)
      setNewComponent({ feeComponentId: "", amount: "", gstPercent: "", dueDay: "", finePolicyId: "" })
      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to link component.")
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
              <DialogDescription>Define a fee structure with name, class, session, and effective dates.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Name</Label>
                  <Input value={newStructure.name} onChange={(e) => setNewStructure((prev) => ({ ...prev, name: e.target.value }))} placeholder="e.g., Regular Fee Structure" required />
                </div>
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
                <div className="grid gap-2">
                  <Label>Effective From</Label>
                  <Input type="date" value={newStructure.effectiveFrom} onChange={(e) => setNewStructure((prev) => ({ ...prev, effectiveFrom: e.target.value }))} required />
                </div>
                <div className="grid gap-2">
                  <Label>Effective To</Label>
                  <Input type="date" value={newStructure.effectiveTo} onChange={(e) => setNewStructure((prev) => ({ ...prev, effectiveTo: e.target.value }))} required />
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
                      {row.components.length ? row.components.map((item) => `${item.name}: ${formatCurrency(item.amount)}${item.gstPercent ? ` (+${item.gstPercent}% GST)` : ""}`).join(", ") : "No component amounts returned"}
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

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Link Fee Components</CardTitle>
              <CardDescription>Link fee components to a fee structure with GST, due date, and fine policy</CardDescription>
            </div>
            {selectedStructureId && (
              <Dialog open={isLinkComponentDialogOpen} onOpenChange={setIsLinkComponentDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="mr-2 size-4" />Add Component</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Link Fee Component</DialogTitle>
                    <DialogDescription>Add a fee component to this fee structure with all details.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleLinkComponent}>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label>Fee Component</Label>
                        <Select value={newComponent.feeComponentId} onValueChange={(value) => setNewComponent((prev) => ({ ...prev, feeComponentId: value }))}>
                          <SelectTrigger><SelectValue placeholder="Select component" /></SelectTrigger>
                          <SelectContent>{feeComponents.map((comp) => <SelectItem key={comp.id} value={comp.id.toString()}>{comp.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Amount</Label>
                        <Input type="number" value={newComponent.amount} onChange={(e) => setNewComponent((prev) => ({ ...prev, amount: e.target.value }))} placeholder="0" required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>GST Percent (%)</Label>
                          <Input type="number" value={newComponent.gstPercent} onChange={(e) => setNewComponent((prev) => ({ ...prev, gstPercent: e.target.value }))} placeholder="0" step="0.01" />
                        </div>
                        <div className="grid gap-2">
                          <Label>Due Day</Label>
                          <Input type="number" value={newComponent.dueDay} onChange={(e) => setNewComponent((prev) => ({ ...prev, dueDay: e.target.value }))} placeholder="15" />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label>Fine Policy (Optional)</Label>
                        <Select value={newComponent.finePolicyId} onValueChange={(value) => setNewComponent((prev) => ({ ...prev, finePolicyId: value }))}>
                          <SelectTrigger><SelectValue placeholder="Select fine policy" /></SelectTrigger>
                          <SelectContent>{finePolicies.map((policy) => <SelectItem key={policy.id} value={policy.id.toString()}>{policy.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsLinkComponentDialogOpen(false)}>Cancel</Button>
                      <Button type="submit">Link Component</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Select Fee Structure</Label>
              <Select value={selectedStructureId?.toString() || ""} onValueChange={(value) => setSelectedStructureId(value ? Number(value) : null)}>
                <SelectTrigger><SelectValue placeholder="Select a fee structure to view/add components" /></SelectTrigger>
                <SelectContent>
                  {feeStructures.map((structure) => {
                    const cls = classes.find((c) => c.id === structure.classId)
                    const session = sessions.find((s) => s.id === structure.sessionId)
                    return (
                      <SelectItem key={structure.id} value={structure.id.toString()}>
                        {structure.name} - {cls?.name}-{cls?.section} ({session?.name})
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {selectedStructureId && (() => {
              const structure = feeStructures.find((s) => s.id === selectedStructureId)
              // Get components from either classFeeStructureComponents or feeStructureComponents
              const components = structure?.classFeeStructureComponents || structure?.feeStructureComponents || []
              return (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Component</TableHead>
                        <TableHead className="text-center">Frequency</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-center">GST %</TableHead>
                        <TableHead className="text-center">Due Day</TableHead>
                        <TableHead>Fine Policy</TableHead>
                        <TableHead className="w-12" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {components.length > 0 ? (
                        components.map((comp) => (
                          <TableRow key={comp.id}>
                            <TableCell className="font-medium">{comp.feeComponent?.name || `Component ${comp.feeComponentId}`}</TableCell>
                            <TableCell className="text-center">{comp.feeComponent?.frequency || "-"}</TableCell>
                            <TableCell className="text-right">{formatCurrency(comp.amount)}</TableCell>
                            <TableCell className="text-center">{comp.gstPercent || "-"}</TableCell>
                            <TableCell className="text-center">{comp.dueDay || "-"}</TableCell>
                            <TableCell>{comp.finePolicy?.name || "-"}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" onClick={() => {/* TODO: Add delete component handler */}}>
                                <Trash2 className="size-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-4">
                            No components linked to this structure. Click "Add Component" to link one.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )
            })()}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
