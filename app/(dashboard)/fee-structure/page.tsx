"use client"

<<<<<<< HEAD
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Plus,
  Pencil,
  Save,
  X,
  Trash2,
  Calendar,
  IndianRupee,
  Layers,
  Settings2,
  FileSpreadsheet,
  ChevronRight,
  AlertCircle,
} from "lucide-react"
=======
import { useState } from "react"
import { Pencil, Save, X } from "lucide-react"
>>>>>>> 747b1495436d4f81a92794c03cd1b2285918ac8f
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { feeStructures, type FeeStructure } from "@/lib/data"
import { toast } from "sonner"
<<<<<<< HEAD
import { classesApi, feeComponentsApi, feeStructuresApi, sessionsApi, studentsApi } from "@/lib/api"
import type { Class, FeeComponent, FeeStructure, Session, Student } from "@/lib/types"

// Fee by class (simulated existing fee structure)
const feeByClass: Record<number, number> = {
  1: 60000, 2: 60000,
  3: 65000, 4: 65000,
  5: 70000, 6: 70000, 7: 70000,
  8: 75000, 9: 75000,
  10: 85000, 11: 85000,
}

// Format currency
function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

// Installment preset options
const installmentPresets = [
  { value: "1", label: "Annual (1 Payment)", splits: [{ name: "Full Year", percentage: 100 }] },
  { value: "2", label: "Semi-Annual (2 Payments)", splits: [{ name: "First Half", percentage: 50 }, { name: "Second Half", percentage: 50 }] },
  { value: "4", label: "Quarterly (4 Payments)", splits: [
    { name: "Q1 (Apr-Jun)", percentage: 25 },
    { name: "Q2 (Jul-Sep)", percentage: 25 },
    { name: "Q3 (Oct-Dec)", percentage: 25 },
    { name: "Q4 (Jan-Mar)", percentage: 25 },
  ]},
  { value: "12", label: "Monthly (12 Payments)", splits: Array.from({ length: 12 }, (_, i) => ({
    name: new Date(2024, 3 + i, 1).toLocaleString("en-IN", { month: "short" }),
    percentage: 100 / 12,
  }))},
]

export default function FeeStructurePage() {
  const [selectedSession, setSelectedSession] = useState("")
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false)
  const [editingClassId, setEditingClassId] = useState<number | null>(null)
  const [editValues, setEditValues] = useState<Record<string, number>>({})
  const [sessions, setSessions] = useState<Session[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [feeComponents, setFeeComponents] = useState<FeeComponent[]>([])
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Fee generation form state
  const [selectedClasses, setSelectedClasses] = useState<number[]>([])
  const [installmentPreset, setInstallmentPreset] = useState("4")
  const [customInstallments, setCustomInstallments] = useState<{ name: string; percentage: number; dueDate: string }[]>([])
  const [generationStep, setGenerationStep] = useState(1)

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
      if (!selectedSession) {
        const activeSession = sessionsData.find((session) => session.isActive) || sessionsData[0]
        if (activeSession) setSelectedSession(activeSession.id.toString())
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load fee structure data.")
    } finally {
      setIsLoading(false)
    }
  }, [selectedSession])

  useEffect(() => {
    loadData()
  }, [loadData])
  
  // Build fee structure data from API
  const feeStructureData = useMemo(() => {
    const feeComponentMap = new Map(feeComponents.map((component) => [component.id, component]))
    const feeStructureMap = new Map<number, FeeStructure>()
    const selectedSessionId = selectedSession ? Number(selectedSession) : null
    feeStructures.forEach((structure) => {
      if (!selectedSessionId || structure.sessionId === selectedSessionId) {
        feeStructureMap.set(structure.classId, structure)
      }
    })

    return classes.map((cls) => {
      const structure = feeStructureMap.get(cls.id)
      const components = structure?.feeStructureComponents || []
      const totals = {
        tuitionFee: 0,
        transportFee: 0,
        labFee: 0,
        libraryFee: 0,
        sportsFee: 0,
        examFee: 0,
        otherFee: 0,
      }

      components.forEach((component) => {
        const componentType =
          component.feeComponent?.type || feeComponentMap.get(component.feeComponentId)?.type || "other"
        const amount = component.amount || 0
        if (componentType === "tuition") totals.tuitionFee += amount
        else if (componentType === "transport") totals.transportFee += amount
        else if (componentType === "lab") totals.labFee += amount
        else if (componentType === "library") totals.libraryFee += amount
        else if (componentType === "sports") totals.sportsFee += amount
        else if (componentType === "exam") totals.examFee += amount
        else totals.otherFee += amount
      })

      const totalFee = components.length
        ? Object.values(totals).reduce((sum, value) => sum + value, 0)
        : feeByClass[cls.id] || 0
      const studentCount = students.filter((student) => student.classId === cls.id).length

      return {
        classId: cls.id,
        className: `${cls.name}-${cls.section}`,
        totalFee,
        ...totals,
        studentCount,
      }
    })
  }, [classes, feeComponents, feeStructures, selectedSession, students])

  const hasComponentBreakdown = useMemo(() => {
    return feeStructures.some((structure) => (structure.feeStructureComponents || []).length > 0)
  }, [feeStructures])
  
  // Stats
  const stats = useMemo(() => {
    const fees = feeStructureData.map(f => f.totalFee)
    if (fees.length === 0) {
      return {
        avgFee: 0,
        maxFee: 0,
        minFee: 0,
        totalClasses: 0,
        totalStudents: 0,
      }
    }
    return {
      avgFee: Math.round(fees.reduce((a, b) => a + b, 0) / fees.length),
      maxFee: Math.max(...fees),
      minFee: Math.min(...fees),
      totalClasses: feeStructureData.length,
      totalStudents: feeStructureData.reduce((sum, f) => sum + f.studentCount, 0),
    }
  }, [feeStructureData])
  
  // Handle edit
  const handleEdit = (classId: number) => {
    const structure = feeStructureData.find(f => f.classId === classId)
    if (structure) {
      setEditingClassId(classId)
      setEditValues({
        tuitionFee: structure.tuitionFee,
        transportFee: structure.transportFee,
        labFee: structure.labFee,
        libraryFee: structure.libraryFee,
        sportsFee: structure.sportsFee,
        examFee: structure.examFee,
      })
    }
=======

export default function FeeStructurePage() {
  const [structures, setStructures] = useState<FeeStructure[]>(feeStructures)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Partial<FeeStructure>>({})

  const handleEdit = (structure: FeeStructure) => {
    setEditingId(structure.id)
    setEditValues({ ...structure })
>>>>>>> 747b1495436d4f81a92794c03cd1b2285918ac8f
  }

  const handleSave = () => {
    if (!editingId || !editValues) return

    setStructures((prev) =>
      prev.map((s) => {
        if (s.id === editingId) {
          const updated = {
            ...s,
            ...editValues,
            totalFee:
              (editValues.tuitionFee || 0) +
              (editValues.transportFee || 0) +
              (editValues.labFee || 0) +
              (editValues.libraryFee || 0) +
              (editValues.sportsFee || 0),
          }
          return updated
        }
        return s
      })
    )

    setEditingId(null)
    setEditValues({})
    toast.success("Fee structure updated", {
      description: "The fee structure has been saved successfully.",
    })
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditValues({})
  }

  const handleInputChange = (field: keyof FeeStructure, value: string) => {
    const numValue = parseInt(value) || 0
    setEditValues((prev) => ({ ...prev, [field]: numValue }))
  }

  const calculateTotal = () => {
    return (
      (editValues.tuitionFee || 0) +
      (editValues.transportFee || 0) +
      (editValues.labFee || 0) +
      (editValues.libraryFee || 0) +
      (editValues.sportsFee || 0)
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Fee Structure</h1>
        <p className="text-sm text-muted-foreground">
          Manage fee breakdowns for each class
        </p>
      </div>

<<<<<<< HEAD
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Fee structure data unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {isLoading && !error && (
        <div className="text-sm text-muted-foreground">Loading fee structures...</div>
      )}
      {!isLoading && !error && !hasComponentBreakdown && (
        <Alert>
          <AlertTitle>Fee component amounts missing</AlertTitle>
          <AlertDescription>
            The API did not return fee component amounts for the selected session, so default
            placeholders are shown. Update the backend to include fee structure components to see
            accurate totals.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Layers className="h-4 w-4" />
              Total Classes
            </div>
            <p className="text-2xl font-semibold">{stats.totalClasses}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <IndianRupee className="h-4 w-4" />
              Average Fee
            </div>
            <p className="text-2xl font-semibold">{formatCurrency(stats.avgFee)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Highest Fee</p>
            <p className="text-2xl font-semibold">{formatCurrency(stats.maxFee)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Lowest Fee</p>
            <p className="text-2xl font-semibold">{formatCurrency(stats.minFee)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Total Students</p>
            <p className="text-2xl font-semibold">{stats.totalStudents}</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Fee Components */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Fee Components</CardTitle>
              <CardDescription>Defined fee components for the institution</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Settings2 className="mr-2 h-4 w-4" />
              Manage Components
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {feeComponents.map((component) => (
              <Badge key={component.id} variant="secondary" className="px-3 py-1.5">
                {component.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Class-wise Fee Structure */}
      <Card>
=======
      <Card className="border-border/50 shadow-sm">
>>>>>>> 747b1495436d4f81a92794c03cd1b2285918ac8f
        <CardHeader>
          <CardTitle className="text-base font-semibold">Class-wise Fee Structure</CardTitle>
          <CardDescription>
            Click the edit button to modify fee components for each class
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-medium text-muted-foreground">Class</TableHead>
                  <TableHead className="text-right text-xs font-medium text-muted-foreground">
                    Tuition Fee
                  </TableHead>
                  <TableHead className="text-right text-xs font-medium text-muted-foreground">
                    Transport Fee
                  </TableHead>
                  <TableHead className="text-right text-xs font-medium text-muted-foreground">
                    Lab Fee
                  </TableHead>
                  <TableHead className="text-right text-xs font-medium text-muted-foreground">
                    Library Fee
                  </TableHead>
                  <TableHead className="text-right text-xs font-medium text-muted-foreground">
                    Sports Fee
                  </TableHead>
                  <TableHead className="text-right text-xs font-medium text-muted-foreground">
                    Total Fee
                  </TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {structures.map((structure) => (
                  <TableRow key={structure.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{structure.class}</TableCell>
                    {editingId === structure.id ? (
                      <>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={editValues.tuitionFee || ""}
                            onChange={(e) => handleInputChange("tuitionFee", e.target.value)}
                            className="h-8 w-24 text-right ml-auto"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={editValues.transportFee || ""}
                            onChange={(e) => handleInputChange("transportFee", e.target.value)}
                            className="h-8 w-24 text-right ml-auto"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={editValues.labFee || ""}
                            onChange={(e) => handleInputChange("labFee", e.target.value)}
                            className="h-8 w-24 text-right ml-auto"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={editValues.libraryFee || ""}
                            onChange={(e) => handleInputChange("libraryFee", e.target.value)}
                            className="h-8 w-24 text-right ml-auto"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={editValues.sportsFee || ""}
                            onChange={(e) => handleInputChange("sportsFee", e.target.value)}
                            className="h-8 w-24 text-right ml-auto"
                          />
                        </TableCell>
                        <TableCell className="text-right font-semibold text-primary">
                          ₹{calculateTotal().toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="size-8" onClick={handleSave}>
                              <Save className="size-4 text-success" />
                            </Button>
                            <Button variant="ghost" size="icon" className="size-8" onClick={handleCancel}>
                              <X className="size-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="text-right text-muted-foreground">
                          ₹{structure.tuitionFee.toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          ₹{structure.transportFee.toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          ₹{structure.labFee.toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          ₹{structure.libraryFee.toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          ₹{structure.sportsFee.toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ₹{structure.totalFee.toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => handleEdit(structure)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Average Fee</p>
            <p className="text-xl font-semibold">
              ₹{Math.round(structures.reduce((a, s) => a + s.totalFee, 0) / structures.length).toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Highest Fee</p>
            <p className="text-xl font-semibold">
              ₹{Math.max(...structures.map((s) => s.totalFee)).toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Lowest Fee</p>
            <p className="text-xl font-semibold">
              ₹{Math.min(...structures.map((s) => s.totalFee)).toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Classes</p>
            <p className="text-xl font-semibold">{structures.length}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
