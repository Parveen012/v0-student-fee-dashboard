"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AlertCircle, Check, ChevronLeft, ChevronRight, ClipboardList, GraduationCap, IndianRupee, Layers3 } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { feeComponentsApi, feeStructuresApi, sessionsApi, studentsApi } from "@/lib/api"
import type {
  FeeComponent,
  FeeGenerationResponse,
  FeeGenerationValidationResponse,
  FeeStructuresGenerateResponse,
  GenerateFeeStructureCommand,
  Student,
} from "@/lib/types"

const steps = ["Student", "Components", "Installments", "Preview"]
const installmentOptions = [1, 2, 4, 12]

function formatCurrency(amount?: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

function studentLabel(student?: Student) {
  if (!student) return "Select student"
  const classLabel = student.className || (student.class ? `${student.class.name}-${student.class.section}` : "No class")
  return `${student.firstName} ${student.lastName} - ${classLabel}`
}

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors ${
              index < currentStep
                ? "border-primary bg-primary text-primary-foreground"
                : index === currentStep
                  ? "border-primary text-primary"
                  : "border-muted-foreground/30 text-muted-foreground"
            }`}
          >
            {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
          </div>
          <span className={`text-sm ${index === currentStep ? "font-medium text-foreground" : "text-muted-foreground"}`}>
            {step}
          </span>
          {index < steps.length - 1 && <div className="hidden h-px w-10 bg-muted-foreground/30 md:block" />}
        </div>
      ))}
    </div>
  )
}

export default function FeeGenerationPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [students, setStudents] = useState<Student[]>([])
  const [feeComponents, setFeeComponents] = useState<FeeComponent[]>([])
  const [sessionId, setSessionId] = useState<string>(process.env.NEXT_PUBLIC_SESSION_ID || "")
  const [selectedStudentId, setSelectedStudentId] = useState("")
  const [selectedComponentIds, setSelectedComponentIds] = useState<number[]>([])
  const [installmentCount, setInstallmentCount] = useState("4")
  const [generationResult, setGenerationResult] = useState<FeeStructuresGenerateResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isFeeGenerationResponse = (result: FeeStructuresGenerateResponse): result is FeeGenerationResponse => {
    return Array.isArray((result as FeeGenerationResponse).installments)
  }

  const isValidationResponse = (result: FeeStructuresGenerateResponse): result is FeeGenerationValidationResponse => {
    return typeof (result as FeeGenerationValidationResponse).isSuccess === "boolean" && Array.isArray((result as FeeGenerationValidationResponse).failedRecords)
  }

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === Number(selectedStudentId)),
    [selectedStudentId, students]
  )

  const selectedComponents = useMemo(
    () => feeComponents.filter((component) => selectedComponentIds.includes(component.id)),
    [feeComponents, selectedComponentIds]
  )

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [studentsData, componentsData, sessionsData] = await Promise.all([
        studentsApi.getAll(),
        feeComponentsApi.getAll(),
        sessionsApi.getAll(),
      ])
      setStudents(studentsData)
      setFeeComponents(componentsData)
      if (!sessionId && sessionsData?.[0]) {
        setSessionId(String(sessionsData[0].id))
      }
      if (!selectedStudentId && studentsData[0]) {
        setSelectedStudentId(studentsData[0].id.toString())
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load fee generation data.")
    } finally {
      setIsLoading(false)
    }
  }, [selectedStudentId, sessionId])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    setGenerationResult(null)
  }, [selectedStudentId, installmentCount, sessionId])

  const canProceed = () => {
    if (currentStep === 0) return !!selectedStudentId
    if (currentStep === 1) return selectedComponentIds.length > 0
    if (currentStep === 2) return !!installmentCount
    return true
  }

  const toggleComponent = (componentId: number) => {
    setSelectedComponentIds((prev) => {
      const next = prev.includes(componentId)
        ? prev.filter((id) => id !== componentId)
        : [...prev, componentId]
      return next
    })
    setGenerationResult(null)
  }

  const handleGenerate = async () => {
    if (!selectedStudent) {
      toast.error("Please select a student.")
      return
    }

    const parsedSessionId = Number(sessionId)
    if (!parsedSessionId || parsedSessionId <= 0) {
      toast.error("SessionId must be greater than 0.")
      return
    }

    const parsedClassId = selectedStudent.classId ?? selectedStudent.class?.id
    if (!parsedClassId || parsedClassId <= 0) {
      toast.error("Selected student must have a valid class.")
      return
    }

    if (selectedComponentIds.length === 0) {
      toast.error("Please select at least one fee component.")
      return
    }

    const parsedInstallmentCount = Number(installmentCount)
    if (!parsedInstallmentCount || parsedInstallmentCount <= 0) {
      toast.error("Please select a valid installment count.")
      return
    }

    const selectedComponentPayload = feeComponents
      .filter((component) => selectedComponentIds.includes(component.id))
      .map((component) => ({ componentId: component.id, amount: component.amount }))

    const totalSelectedAmount = selectedComponentPayload.reduce((sum, component) => sum + (component.amount || 0), 0)
    if (totalSelectedAmount <= 0) {
      toast.error("Selected fee components must have a total amount greater than 0.")
      return
    }

    const now = new Date()
    const installmentBaseAmount = parsedInstallmentCount > 0 ? Math.floor(totalSelectedAmount / parsedInstallmentCount) : 0
    const installmentsPayload = Array.from({ length: parsedInstallmentCount }, (_, index) => {
      const installmentNo = index + 1
      const dueDate = new Date(now)
      dueDate.setMonth(dueDate.getMonth() + index)
      const amount =
        installmentNo === parsedInstallmentCount
          ? totalSelectedAmount - installmentBaseAmount * (parsedInstallmentCount - 1)
          : installmentBaseAmount

      return {
        name: parsedInstallmentCount === 1 ? "Full Payment" : `Installment ${installmentNo}`,
        dueDate: dueDate.toISOString(),
        amount,
      }
    })

    const payload: GenerateFeeStructureCommand = {
      sessionId: parsedSessionId,
      installmentCount: parsedInstallmentCount,
      classes: [
        {
          classId: parsedClassId,
          studentIds: [selectedStudent.id],
          components: selectedComponentPayload,
          installments: installmentsPayload,
        },
      ],
    }

    setIsSubmitting(true)
    try {
      const result = await feeStructuresApi.generate(payload)
      setGenerationResult(result)
      setCurrentStep(3)
      if (isValidationResponse(result) && !result.isSuccess) {
        toast.error(result.message || "Validation failed")
      } else {
        toast.success("Fee generation completed")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate fee structure.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Generate Fee Structure</h1>
        <p className="text-sm text-muted-foreground">
          Collect the student, selected fee components, and installment count. The app sends a complete fee plan for backend validation.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Fee generation data unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {isLoading && !error && <div className="text-sm text-muted-foreground">Loading fee generation data...</div>}

      <StepIndicator currentStep={currentStep} />

      {currentStep === 0 && (
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <GraduationCap className="h-5 w-5 text-primary" />
              Select Student
            </CardTitle>
            <CardDescription>Choose the student for whom the backend should generate the fee structure.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 md:max-w-lg">
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id.toString()}>
                      {studentLabel(student)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedStudent && (
              <div className="grid gap-4 rounded-lg border border-border bg-muted/30 p-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Student</p>
                  <p className="font-semibold">{selectedStudent.firstName} {selectedStudent.lastName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Class</p>
                  <p className="font-semibold">{selectedStudent.className || (selectedStudent.class ? `${selectedStudent.class.name}-${selectedStudent.class.section}` : "N/A")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Student ID</p>
                  <p className="font-semibold">STU{String(selectedStudent.id).padStart(3, "0")}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {currentStep === 1 && (
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Layers3 className="h-5 w-5 text-primary" />
              Select Fee Components
            </CardTitle>
            <CardDescription>Select one or more fee components. Amounts are handled by the backend.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12" />
                    <TableHead>Component</TableHead>
                    <TableHead className="text-right">Base Amount</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Optional</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feeComponents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-28 text-center text-muted-foreground">
                        No fee components found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    feeComponents.map((component) => {
                      const checked = selectedComponentIds.includes(component.id)
                      return (
                        <TableRow key={component.id}>
                          <TableCell>
                            <Checkbox checked={checked} onCheckedChange={() => toggleComponent(component.id)} />
                          </TableCell>
                          <TableCell className="font-medium">{component.name}</TableCell>
                          <TableCell className="text-right">{formatCurrency(component.amount)}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="font-normal">{component.frequency}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={component.isOptional ? "secondary" : "default"} className="font-normal">
                              {component.isOptional ? "Yes" : "No"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {component.description || "-"}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {selectedComponents.length > 0 && (
              <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">Selected components</p>
                <p className="font-semibold">{selectedComponents.length} component{selectedComponents.length !== 1 ? "s" : ""}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedComponents.map((component) => (
                    <Badge key={component.id} variant="outline">{component.name}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {currentStep === 2 && (
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <IndianRupee className="h-5 w-5 text-primary" />
              Select Installment Count
            </CardTitle>
            <CardDescription>The fee plan will include the selected number of installments.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 md:max-w-sm">
              <Select value={installmentCount} onValueChange={setInstallmentCount}>
                <SelectTrigger>
                  <SelectValue placeholder="Select installments" />
                </SelectTrigger>
                <SelectContent>
                  {installmentOptions.map((count) => (
                    <SelectItem key={count} value={count.toString()}>
                      {count} installment{count > 1 ? "s" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              Installments are generated before submission and validated again by the backend.
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 3 && (
        <div className="space-y-4">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <ClipboardList className="h-5 w-5 text-primary" />
                Request Preview
              </CardTitle>
              <CardDescription>Review the request before sending it to the calculation engine.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">Student</p>
                  <p className="font-semibold">{selectedStudent ? studentLabel(selectedStudent) : "N/A"}</p>
                </div>
                <div className="rounded-lg bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">Components</p>
                  <p className="font-semibold">{selectedComponents.length}</p>
                </div>
                <div className="rounded-lg bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">Installments</p>
                  <p className="font-semibold">{installmentCount}</p>
                </div>
              </div>

              <div className="rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Component</TableHead>
                      <TableHead className="text-right">Base Amount</TableHead>
                      <TableHead>Frequency</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedComponents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                          No components selected.
                        </TableCell>
                      </TableRow>
                    ) : (
                      selectedComponents.map((component) => (
                        <TableRow key={component.id}>
                          <TableCell>{component.name}</TableCell>
                          <TableCell className="text-right">{formatCurrency(component.amount)}</TableCell>
                          <TableCell>{component.frequency}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {generationResult && (
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Check className="h-5 w-5 text-success" />
                  Backend Preview
                </CardTitle>
                <CardDescription>The backend response is the source of truth for totals and installment distribution.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isFeeGenerationResponse(generationResult) ? (
                  <>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="rounded-lg bg-muted/30 p-4">
                        <p className="text-sm text-muted-foreground">Total Amount</p>
                        <p className="text-2xl font-semibold">{formatCurrency(generationResult.totalAmount)}</p>
                      </div>
                      <div className="rounded-lg bg-muted/30 p-4">
                        <p className="text-sm text-muted-foreground">Yearly Amount</p>
                        <p className="text-2xl font-semibold">{formatCurrency(generationResult.yearlyAmount)}</p>
                      </div>
                      <div className="rounded-lg bg-muted/30 p-4">
                        <p className="text-sm text-muted-foreground">Remaining Balance</p>
                        <p className="text-2xl font-semibold">{formatCurrency(generationResult.remainingBalance)}</p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>No.</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead className="text-right">Remaining Balance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {generationResult.installments.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                No installment breakdown returned.
                              </TableCell>
                            </TableRow>
                          ) : (
                            generationResult.installments.map((installment) => (
                              <TableRow key={installment.installmentNo}>
                                <TableCell>{installment.installmentNo}</TableCell>
                                <TableCell className="text-right">{formatCurrency(installment.amount)}</TableCell>
                                <TableCell>{installment.dueDate ? new Date(installment.dueDate).toLocaleDateString("en-IN") : "-"}</TableCell>
                                <TableCell className="text-right">{formatCurrency(installment.remainingBalance)}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                ) : isValidationResponse(generationResult) ? (
                  <Alert variant={generationResult.isSuccess ? "default" : "destructive"}>
                    <AlertTitle>{generationResult.message || (generationResult.isSuccess ? "Completed" : "Validation failed")}</AlertTitle>
                    <AlertDescription>
                      {generationResult.failedRecords?.length ? (
                        <ul className="list-disc pl-5">
                          {generationResult.failedRecords.map((record, idx) => (
                            <li key={`${record.studentId}-${record.classId}-${idx}`}>{record.reason}</li>
                          ))}
                        </ul>
                      ) : (
                        "No additional details returned."
                      )}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <AlertTitle>Unexpected response</AlertTitle>
                    <AlertDescription>Backend did not return an installment breakdown.</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {!generationResult && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Preview not generated yet</AlertTitle>
              <AlertDescription>
                Click Generate Fee Structure to send the request and render the backend-calculated preview.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setCurrentStep((prev) => prev - 1)} disabled={currentStep === 0}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        {currentStep < steps.length - 1 ? (
          <Button onClick={() => setCurrentStep((prev) => prev + 1)} disabled={!canProceed()}>
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleGenerate} disabled={isSubmitting}>
            <Check className="mr-2 h-4 w-4" />
            {isSubmitting ? "Generating..." : "Generate Fee Structure"}
          </Button>
        )}
      </div>
    </div>
  )
}
