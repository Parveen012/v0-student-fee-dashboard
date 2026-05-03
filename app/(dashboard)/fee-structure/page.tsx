"use client"

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"
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
  }
  
  const handleSave = () => {
    // API call would go here
    toast.success("Fee structure updated", {
      description: "The fee structure has been saved successfully."
    })
    setEditingClassId(null)
    setEditValues({})
  }
  
  const handleCancel = () => {
    setEditingClassId(null)
    setEditValues({})
  }
  
  const calculateEditTotal = () => {
    return Object.values(editValues).reduce((sum, val) => sum + (val || 0), 0)
  }
  
  // Class selection for fee generation
  const handleClassToggle = (classId: number) => {
    setSelectedClasses(prev => 
      prev.includes(classId) 
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    )
  }
  
  const handleSelectAllClasses = () => {
    if (selectedClasses.length === classes.length) {
      setSelectedClasses([])
    } else {
      setSelectedClasses(classes.map(c => c.id))
    }
  }
  
  // Handle installment preset change
  const handleInstallmentPresetChange = (value: string) => {
    setInstallmentPreset(value)
    const preset = installmentPresets.find(p => p.value === value)
    if (preset) {
      const baseYear = 2024
      setCustomInstallments(preset.splits.map((split, index) => ({
        name: split.name,
        percentage: split.percentage,
        dueDate: new Date(baseYear, 3 + (index * Math.floor(12 / preset.splits.length)), 15).toISOString().split('T')[0],
      })))
    }
  }
  
  // Generate fees
  const handleGenerateFees = () => {
    // API call would go here: feesApi.generateFees({ sessionId, classIds, installments })
    toast.success("Fees generated successfully", {
      description: `Generated fee records for ${selectedClasses.length} classes with ${customInstallments.length} installments.`
    })
    setGenerateDialogOpen(false)
    setGenerationStep(1)
    setSelectedClasses([])
  }
  
  // Open generation dialog
  const openGenerateDialog = () => {
    setGenerationStep(1)
    setSelectedClasses([])
    handleInstallmentPresetChange("4")
    setGenerateDialogOpen(true)
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Fee Structure</h1>
          <p className="text-sm text-muted-foreground">
            Manage fee components and generate student fees
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedSession} onValueChange={setSelectedSession}>
            <SelectTrigger className="w-36">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sessions.map((session) => (
                <SelectItem key={session.id} value={session.id.toString()}>
                  {session.name} {session.isActive && "(Active)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={openGenerateDialog}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Generate Fees
          </Button>
        </div>
      </div>

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
        <CardHeader>
          <CardTitle className="text-base font-semibold">Class-wise Fee Structure</CardTitle>
          <CardDescription>
            Session: {sessions.find(s => s.id.toString() === selectedSession)?.name} | Click edit to modify fee components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead className="text-right">Tuition</TableHead>
                  <TableHead className="text-right">Transport</TableHead>
                  <TableHead className="text-right">Lab</TableHead>
                  <TableHead className="text-right">Library</TableHead>
                  <TableHead className="text-right">Sports</TableHead>
                  <TableHead className="text-right">Exam</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-center">Students</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feeStructureData.map((structure) => (
                  <TableRow key={structure.classId}>
                    <TableCell className="font-medium">{structure.className}</TableCell>
                    {editingClassId === structure.classId ? (
                      <>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={editValues.tuitionFee || ""}
                            onChange={(e) => setEditValues(prev => ({ ...prev, tuitionFee: parseInt(e.target.value) || 0 }))}
                            className="h-8 w-24 text-right ml-auto"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={editValues.transportFee || ""}
                            onChange={(e) => setEditValues(prev => ({ ...prev, transportFee: parseInt(e.target.value) || 0 }))}
                            className="h-8 w-24 text-right ml-auto"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={editValues.labFee || ""}
                            onChange={(e) => setEditValues(prev => ({ ...prev, labFee: parseInt(e.target.value) || 0 }))}
                            className="h-8 w-24 text-right ml-auto"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={editValues.libraryFee || ""}
                            onChange={(e) => setEditValues(prev => ({ ...prev, libraryFee: parseInt(e.target.value) || 0 }))}
                            className="h-8 w-24 text-right ml-auto"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={editValues.sportsFee || ""}
                            onChange={(e) => setEditValues(prev => ({ ...prev, sportsFee: parseInt(e.target.value) || 0 }))}
                            className="h-8 w-24 text-right ml-auto"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={editValues.examFee || ""}
                            onChange={(e) => setEditValues(prev => ({ ...prev, examFee: parseInt(e.target.value) || 0 }))}
                            className="h-8 w-24 text-right ml-auto"
                          />
                        </TableCell>
                        <TableCell className="text-right font-semibold text-primary">
                          {formatCurrency(calculateEditTotal())}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {structure.studentCount}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSave}>
                              <Save className="h-4 w-4 text-success" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCancel}>
                              <X className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="text-right text-muted-foreground">
                          {formatCurrency(structure.tuitionFee)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatCurrency(structure.transportFee)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatCurrency(structure.labFee)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatCurrency(structure.libraryFee)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatCurrency(structure.sportsFee)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatCurrency(structure.examFee)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(structure.totalFee)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{structure.studentCount}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(structure.classId)}
                          >
                            <Pencil className="h-4 w-4" />
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
      
      {/* Fee Generation Dialog */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Generate Student Fees
            </DialogTitle>
            <DialogDescription>
              Generate fee records for students in selected classes
            </DialogDescription>
          </DialogHeader>
          
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 py-4">
            <div className={`flex items-center gap-2 ${generationStep >= 1 ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${generationStep >= 1 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                1
              </div>
              <span className="text-sm font-medium">Select Classes</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <div className={`flex items-center gap-2 ${generationStep >= 2 ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${generationStep >= 2 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                2
              </div>
              <span className="text-sm font-medium">Configure Installments</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <div className={`flex items-center gap-2 ${generationStep >= 3 ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${generationStep >= 3 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                3
              </div>
              <span className="text-sm font-medium">Review & Generate</span>
            </div>
          </div>
          
          {/* Step 1: Select Classes */}
          {generationStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Select Classes for Fee Generation</Label>
                <Button variant="ghost" size="sm" onClick={handleSelectAllClasses}>
                  {selectedClasses.length === classes.length ? "Deselect All" : "Select All"}
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto border rounded-lg p-3">
                {classes.map((cls) => {
                  const structure = feeStructureData.find(f => f.classId === cls.id)
                  return (
                    <div
                      key={cls.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedClasses.includes(cls.id) ? "bg-primary/5 border-primary" : "hover:bg-muted/50"
                      }`}
                      onClick={() => handleClassToggle(cls.id)}
                    >
                      <Checkbox checked={selectedClasses.includes(cls.id)} />
                      <div>
                        <p className="font-medium text-sm">{cls.name}-{cls.section}</p>
                        <p className="text-xs text-muted-foreground">{structure?.studentCount || 0} students</p>
                      </div>
                    </div>
                  )
                })}
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedClasses.length} class{selectedClasses.length !== 1 ? "es" : ""} selected
              </p>
            </div>
          )}
          
          {/* Step 2: Configure Installments */}
          {generationStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Installment Schedule</Label>
                <Select value={installmentPreset} onValueChange={handleInstallmentPresetChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {installmentPresets.map((preset) => (
                      <SelectItem key={preset.value} value={preset.value}>
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Installment Details</Label>
                <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
                  {customInstallments.map((inst, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <Input
                          value={inst.name}
                          onChange={(e) => {
                            const updated = [...customInstallments]
                            updated[index].name = e.target.value
                            setCustomInstallments(updated)
                          }}
                          placeholder="Installment name"
                          className="h-8"
                        />
                      </div>
                      <div className="w-20">
                        <Input
                          type="number"
                          value={inst.percentage}
                          onChange={(e) => {
                            const updated = [...customInstallments]
                            updated[index].percentage = parseFloat(e.target.value) || 0
                            setCustomInstallments(updated)
                          }}
                          className="h-8 text-right"
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">%</span>
                      <div className="w-36">
                        <Input
                          type="date"
                          value={inst.dueDate}
                          onChange={(e) => {
                            const updated = [...customInstallments]
                            updated[index].dueDate = e.target.value
                            setCustomInstallments(updated)
                          }}
                          className="h-8"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCustomInstallments(prev => prev.filter((_, i) => i !== index))}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCustomInstallments(prev => [...prev, { name: "", percentage: 0, dueDate: "" }])}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Installment
                </Button>
              </div>
              
              {Math.abs(customInstallments.reduce((sum, i) => sum + i.percentage, 0) - 100) > 0.1 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Invalid percentages</AlertTitle>
                  <AlertDescription>
                    Installment percentages must add up to 100%. Current total: {customInstallments.reduce((sum, i) => sum + i.percentage, 0).toFixed(1)}%
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          
          {/* Step 3: Review & Generate */}
          {generationStep === 3 && (
            <div className="space-y-4">
              <Alert>
                <FileSpreadsheet className="h-4 w-4" />
                <AlertTitle>Review Fee Generation</AlertTitle>
                <AlertDescription>
                  You are about to generate fees for the following configuration:
                </AlertDescription>
              </Alert>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Selected Classes</CardDescription>
                    <CardTitle className="text-lg">{selectedClasses.length} Classes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {selectedClasses.slice(0, 5).map((classId) => {
                        const cls = classes.find(c => c.id === classId)
                        return (
                          <Badge key={classId} variant="secondary">
                            {cls?.name}-{cls?.section}
                          </Badge>
                        )
                      })}
                      {selectedClasses.length > 5 && (
                        <Badge variant="outline">+{selectedClasses.length - 5} more</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Students Affected</CardDescription>
                    <CardTitle className="text-lg">
                      {feeStructureData
                        .filter(f => selectedClasses.includes(f.classId))
                        .reduce((sum, f) => sum + f.studentCount, 0)} Students
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Installment Schedule ({customInstallments.length} installments)</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Installment</TableHead>
                        <TableHead className="text-right">Percentage</TableHead>
                        <TableHead>Due Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customInstallments.map((inst, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{inst.name}</TableCell>
                          <TableCell className="text-right">{inst.percentage.toFixed(1)}%</TableCell>
                          <TableCell>{new Date(inst.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
          
          <DialogFooter>
            {generationStep > 1 && (
              <Button variant="outline" onClick={() => setGenerationStep(prev => prev - 1)}>
                Back
              </Button>
            )}
            {generationStep < 3 ? (
              <Button 
                onClick={() => setGenerationStep(prev => prev + 1)}
                disabled={generationStep === 1 && selectedClasses.length === 0}
              >
                Continue
              </Button>
            ) : (
              <Button onClick={handleGenerateFees}>
                Generate Fees
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
