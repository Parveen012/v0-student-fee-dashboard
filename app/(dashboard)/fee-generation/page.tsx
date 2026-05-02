"use client"

import { useState, useMemo } from "react"
import { 
  CalendarDays, 
  GraduationCap, 
  IndianRupee, 
  Check,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  AlertCircle,
  Users,
  FileText,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
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
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { toast } from "sonner"
import { sessions, classes, feeComponents, students } from "@/lib/mock-data"

// Step indicator component
function StepIndicator({ currentStep, steps }: { currentStep: number; steps: string[] }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center">
          <div className="flex flex-col items-center">
            <div 
              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                index < currentStep 
                  ? "bg-primary border-primary text-primary-foreground"
                  : index === currentStep
                  ? "border-primary text-primary"
                  : "border-muted-foreground/30 text-muted-foreground"
              }`}
            >
              {index < currentStep ? (
                <Check className="h-5 w-5" />
              ) : (
                <span className="font-semibold">{index + 1}</span>
              )}
            </div>
            <span className={`text-xs mt-1 ${index === currentStep ? "font-medium" : "text-muted-foreground"}`}>
              {step}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div 
              className={`w-16 h-0.5 mx-2 ${
                index < currentStep ? "bg-primary" : "bg-muted-foreground/30"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// Format currency
function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

interface Installment {
  id: number
  name: string
  dueDate: string
  percentage: number
}

interface ComponentAmount {
  componentId: number
  amount: number
}

export default function FeeGenerationPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedSession, setSelectedSession] = useState<string>("")
  const [selectedClasses, setSelectedClasses] = useState<number[]>([])
  const [componentAmounts, setComponentAmounts] = useState<Record<number, ComponentAmount[]>>({})
  const [installments, setInstallments] = useState<Installment[]>([
    { id: 1, name: "Q1 (Apr-Jun)", dueDate: "2024-04-15", percentage: 25 },
    { id: 2, name: "Q2 (Jul-Sep)", dueDate: "2024-07-15", percentage: 25 },
    { id: 3, name: "Q3 (Oct-Dec)", dueDate: "2024-10-15", percentage: 25 },
    { id: 4, name: "Q4 (Jan-Mar)", dueDate: "2025-01-15", percentage: 25 },
  ])
  
  const steps = ["Session", "Classes", "Components", "Installments", "Review"]
  
  // Get active session
  const activeSession = sessions.find(s => s.id.toString() === selectedSession)
  
  // Calculate totals
  const classTotals = useMemo(() => {
    const totals: Record<number, number> = {}
    selectedClasses.forEach(classId => {
      const amounts = componentAmounts[classId] || []
      totals[classId] = amounts.reduce((sum, ca) => sum + ca.amount, 0)
    })
    return totals
  }, [selectedClasses, componentAmounts])
  
  // Calculate affected students
  const affectedStudents = useMemo(() => {
    return students.filter(s => selectedClasses.includes(s.classId || 0))
  }, [selectedClasses])
  
  // Initialize component amounts for a class
  const initializeClassComponents = (classId: number) => {
    if (!componentAmounts[classId]) {
      const defaultAmounts: ComponentAmount[] = feeComponents.map(fc => ({
        componentId: fc.id,
        amount: fc.type === "tuition" ? 45000 : 
                fc.type === "transport" ? 12000 : 
                fc.type === "lab" ? 5000 :
                fc.type === "library" ? 3000 :
                fc.type === "sports" ? 4000 : 2000
      }))
      setComponentAmounts(prev => ({ ...prev, [classId]: defaultAmounts }))
    }
  }
  
  // Toggle class selection
  const toggleClass = (classId: number) => {
    if (selectedClasses.includes(classId)) {
      setSelectedClasses(prev => prev.filter(id => id !== classId))
    } else {
      setSelectedClasses(prev => [...prev, classId])
      initializeClassComponents(classId)
    }
  }
  
  // Update component amount
  const updateComponentAmount = (classId: number, componentId: number, amount: number) => {
    setComponentAmounts(prev => ({
      ...prev,
      [classId]: (prev[classId] || []).map(ca => 
        ca.componentId === componentId ? { ...ca, amount } : ca
      )
    }))
  }
  
  // Add installment
  const addInstallment = () => {
    const newId = Math.max(...installments.map(i => i.id)) + 1
    setInstallments(prev => [...prev, {
      id: newId,
      name: `Installment ${newId}`,
      dueDate: "",
      percentage: 0,
    }])
  }
  
  // Remove installment
  const removeInstallment = (id: number) => {
    if (installments.length <= 1) return
    setInstallments(prev => prev.filter(i => i.id !== id))
  }
  
  // Update installment
  const updateInstallment = (id: number, field: keyof Installment, value: string | number) => {
    setInstallments(prev => prev.map(i => 
      i.id === id ? { ...i, [field]: value } : i
    ))
  }
  
  // Validate current step
  const canProceed = () => {
    switch (currentStep) {
      case 0: return !!selectedSession
      case 1: return selectedClasses.length > 0
      case 2: return Object.values(classTotals).every(t => t > 0)
      case 3: {
        const totalPercentage = installments.reduce((sum, i) => sum + i.percentage, 0)
        return totalPercentage === 100 && installments.every(i => i.dueDate && i.name)
      }
      default: return true
    }
  }
  
  // Handle generation
  const handleGenerate = () => {
    toast.success("Fee structure generated successfully", {
      description: `Generated fees for ${affectedStudents.length} students across ${selectedClasses.length} classes.`,
    })
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Generate Fee Structure</h1>
        <p className="text-muted-foreground">
          Create and apply fee structures to students for the academic session
        </p>
      </div>
      
      <StepIndicator currentStep={currentStep} steps={steps} />
      
      {/* Step 1: Select Session */}
      {currentStep === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Select Academic Session
            </CardTitle>
            <CardDescription>
              Choose the academic session for which you want to generate fees
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => setSelectedSession(session.id.toString())}
                  className={`relative flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors ${
                    selectedSession === session.id.toString()
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <CalendarDays className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{session.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(session.startDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })} - {new Date(session.endDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                    </p>
                  </div>
                  {session.isActive && (
                    <Badge variant="secondary">Active</Badge>
                  )}
                  {selectedSession === session.id.toString() && (
                    <div className="absolute right-4 top-4">
                      <Check className="h-5 w-5 text-primary" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Step 2: Select Classes */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Select Classes
            </CardTitle>
            <CardDescription>
              Choose the classes for which you want to generate fee structures
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (selectedClasses.length === classes.length) {
                    setSelectedClasses([])
                  } else {
                    classes.forEach(c => initializeClassComponents(c.id))
                    setSelectedClasses(classes.map(c => c.id))
                  }
                }}
              >
                {selectedClasses.length === classes.length ? "Deselect All" : "Select All"}
              </Button>
              <span className="text-sm text-muted-foreground">
                {selectedClasses.length} of {classes.length} classes selected
              </span>
            </div>
            
            <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
              {classes.map((cls) => {
                const isSelected = selectedClasses.includes(cls.id)
                const studentCount = students.filter(s => s.classId === cls.id).length
                return (
                  <div
                    key={cls.id}
                    onClick={() => toggleClass(cls.id)}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                      isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                    }`}
                  >
                    <Checkbox checked={isSelected} />
                    <div className="flex-1">
                      <p className="font-medium">{cls.name} - {cls.section}</p>
                      <p className="text-xs text-muted-foreground">{studentCount} students</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Step 3: Fee Components */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5" />
              Configure Fee Components
            </CardTitle>
            <CardDescription>
              Set the fee amount for each component per class
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {selectedClasses.map((classId) => {
                const cls = classes.find(c => c.id === classId)
                const amounts = componentAmounts[classId] || []
                return (
                  <div key={classId} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{cls?.name} - {cls?.section}</h3>
                      <Badge variant="outline">
                        Total: {formatCurrency(classTotals[classId] || 0)}
                      </Badge>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      {feeComponents.map((fc) => {
                        const ca = amounts.find(a => a.componentId === fc.id)
                        return (
                          <div key={fc.id} className="space-y-2">
                            <Label htmlFor={`${classId}-${fc.id}`}>{fc.name}</Label>
                            <div className="relative">
                              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                id={`${classId}-${fc.id}`}
                                type="number"
                                value={ca?.amount || 0}
                                onChange={(e) => updateComponentAmount(classId, fc.id, parseInt(e.target.value) || 0)}
                                className="pl-9"
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <hr className="my-4" />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Step 4: Installments */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configure Installments
            </CardTitle>
            <CardDescription>
              Set up the payment installment schedule
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {installments.reduce((sum, i) => sum + i.percentage, 0) !== 100 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Invalid Distribution</AlertTitle>
                <AlertDescription>
                  Total percentage must equal 100%. Current total: {installments.reduce((sum, i) => sum + i.percentage, 0)}%
                </AlertDescription>
              </Alert>
            )}
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Installment Name</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Percentage (%)</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {installments.map((installment) => (
                  <TableRow key={installment.id}>
                    <TableCell>
                      <Input
                        value={installment.name}
                        onChange={(e) => updateInstallment(installment.id, "name", e.target.value)}
                        placeholder="Installment name"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        value={installment.dueDate}
                        onChange={(e) => updateInstallment(installment.id, "dueDate", e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={installment.percentage}
                        onChange={(e) => updateInstallment(installment.id, "percentage", parseInt(e.target.value) || 0)}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeInstallment(installment.id)}
                        disabled={installments.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            <Button variant="outline" onClick={addInstallment}>
              <Plus className="h-4 w-4 mr-2" />
              Add Installment
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Step 5: Review */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Review Fee Structure
              </CardTitle>
              <CardDescription>
                Review the fee structure before generating
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                  <CalendarDays className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Session</p>
                    <p className="font-semibold">{activeSession?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                  <GraduationCap className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Classes</p>
                    <p className="font-semibold">{selectedClasses.length} selected</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                  <Users className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Students Affected</p>
                    <p className="font-semibold">{affectedStudents.length} students</p>
                  </div>
                </div>
              </div>
              
              {/* Class-wise breakdown */}
              <div>
                <h4 className="font-semibold mb-3">Class-wise Fee Structure</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead className="text-right">Total Fee</TableHead>
                      <TableHead className="text-right">Expected Collection</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedClasses.map((classId) => {
                      const cls = classes.find(c => c.id === classId)
                      const studentCount = students.filter(s => s.classId === classId).length
                      const total = classTotals[classId] || 0
                      return (
                        <TableRow key={classId}>
                          <TableCell className="font-medium">{cls?.name} - {cls?.section}</TableCell>
                          <TableCell>{studentCount}</TableCell>
                          <TableCell className="text-right">{formatCurrency(total)}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(total * studentCount)}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    <TableRow className="bg-muted/50">
                      <TableCell className="font-bold">Total</TableCell>
                      <TableCell className="font-bold">{affectedStudents.length}</TableCell>
                      <TableCell></TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(
                          selectedClasses.reduce((sum, classId) => {
                            const studentCount = students.filter(s => s.classId === classId).length
                            return sum + (classTotals[classId] || 0) * studentCount
                          }, 0)
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              
              {/* Installment schedule */}
              <div>
                <h4 className="font-semibold mb-3">Installment Schedule</h4>
                <div className="grid gap-3 md:grid-cols-4">
                  {installments.map((inst) => (
                    <div key={inst.id} className="p-4 rounded-lg border">
                      <p className="font-medium">{inst.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Due: {new Date(inst.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                      <Badge variant="outline" className="mt-2">{inst.percentage}%</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              This action will create fee records for {affectedStudents.length} students. 
              Make sure all information is correct before proceeding.
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(prev => prev - 1)}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        
        {currentStep < steps.length - 1 ? (
          <Button
            onClick={() => setCurrentStep(prev => prev + 1)}
            disabled={!canProceed()}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleGenerate}>
            <Check className="h-4 w-4 mr-2" />
            Generate Fee Structure
          </Button>
        )}
      </div>
    </div>
  )
}
