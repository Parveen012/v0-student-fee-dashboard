"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AlertCircle, Check, ChevronLeft, ChevronRight, ClipboardList, GraduationCap, IndianRupee, School, Users, Eye } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { classesApi, feeGenerationApi, sessionsApi, studentsApi, studentFeesApi } from "@/lib/api"
import { StudentFeeDetails } from "@/components/student-fee-details"
import type { Class, Session, Student, StudentFee } from "@/lib/types"

type GenerationMode = "student" | "class"

type GenerationPreview =
  | {
      kind: "student" | "class"
      success?: boolean
      message?: string
      raw: unknown
    }

const steps = ["Mode", "Target", "Options", "Review"]

function formatCurrency(amount?: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

function formatDateTimeInput(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, "0")
  const day = String(value.getDate()).padStart(2, "0")
  const hours = String(value.getHours()).padStart(2, "0")
  const minutes = String(value.getMinutes()).padStart(2, "0")
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function studentLabel(student?: Student) {
  if (!student) return "Select student"
  const classLabel = student.className || (student.class ? `${student.class.name}-${student.class.section}` : "No class")
  return `${student.firstName} ${student.lastName} - ${classLabel}`
}

function classLabel(classItem?: Class) {
  if (!classItem) return "Select class"
  return `${classItem.name} - ${classItem.section}`
}

function sessionLabel(session?: Session) {
  if (!session) return "Select session"
  return `${session.name}${session.isActive ? " (Active)" : ""}`
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
  const [mode, setMode] = useState<GenerationMode>("student")
  const [sessions, setSessions] = useState<Session[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState("")
  const [selectedStudentId, setSelectedStudentId] = useState("")
  const [selectedClassId, setSelectedClassId] = useState("")
  const [billingDate, setBillingDate] = useState(formatDateTimeInput(new Date()))
  const [fineAssessmentDate, setFineAssessmentDate] = useState(formatDateTimeInput(new Date()))
  const [includeTransportFee, setIncludeTransportFee] = useState(true)
  const [applyFine, setApplyFine] = useState(true)
  const [preview, setPreview] = useState<GenerationPreview | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Fee viewing state
  const [viewMode, setViewMode] = useState<"generate" | "view">("generate")
  const [studentFees, setStudentFees] = useState<StudentFee[]>([])
  const [selectedFeeId, setSelectedFeeId] = useState<number | null>(null)
  const [selectedFee, setSelectedFee] = useState<StudentFee | null>(null)
  const [isFeeLoading, setIsFeeLoading] = useState(false)

  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === Number(selectedSessionId)),
    [selectedSessionId, sessions]
  )

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === Number(selectedStudentId)),
    [selectedStudentId, students]
  )

  const selectedClass = useMemo(
    () => classes.find((classItem) => classItem.id === Number(selectedClassId)),
    [classes, selectedClassId]
  )

  const targetSummary = useMemo(() => {
    if (mode === "student") return selectedStudent ? studentLabel(selectedStudent) : "No student selected"
    return selectedClass ? classLabel(selectedClass) : "No class selected"
  }, [mode, selectedClass, selectedStudent])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [sessionsData, studentsData, classesData] = await Promise.all([
        sessionsApi.getAll(),
        studentsApi.getAll(),
        classesApi.getAll(),
      ])
      setSessions(sessionsData)
      setStudents(studentsData)
      setClasses(classesData)

      if (!selectedSessionId && sessionsData[0]) setSelectedSessionId(String(sessionsData[0].id))
      if (!selectedStudentId && studentsData[0]) setSelectedStudentId(String(studentsData[0].id))
      if (!selectedClassId && classesData[0]) setSelectedClassId(String(classesData[0].id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load fee generation data.")
    } finally {
      setIsLoading(false)
    }
  }, [selectedClassId, selectedStudentId, selectedSessionId])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    setPreview(null)
  }, [mode, selectedSessionId, selectedStudentId, selectedClassId, billingDate, fineAssessmentDate, includeTransportFee, applyFine])

  const canProceed = () => {
    if (currentStep === 0) return !!mode
    if (currentStep === 1) return mode === "student" ? !!selectedStudentId : !!selectedClassId
    if (currentStep === 2) return !!selectedSessionId && !!billingDate && (!applyFine || !!fineAssessmentDate)
    return true
  }

  const handleGenerate = async () => {
    const sessionId = Number(selectedSessionId)
    if (!sessionId || sessionId <= 0) {
      toast.error("Please select a valid session.")
      return
    }

    setIsSubmitting(true)
    try {
      const common = {
        sessionId,
        billingDate: new Date(billingDate).toISOString(),
        includeTransportFee,
        applyFine,
        fineAssessmentDate: new Date(fineAssessmentDate || billingDate).toISOString(),
      }

      if (mode === "student") {
        if (!selectedStudent) {
          toast.error("Please select a student.")
          return
        }
        const result = await feeGenerationApi.generateStudent({
          ...common,
          studentId: selectedStudent.id,
        })
        setPreview({ kind: "student", raw: result, success: typeof result === "object" && result !== null ? (result as { isSuccess?: boolean }).isSuccess : undefined, message: typeof result === "object" && result !== null ? (result as { message?: string }).message : undefined })
      } else {
        if (!selectedClass) {
          toast.error("Please select a class.")
          return
        }
        const result = await feeGenerationApi.generateClass({
          ...common,
          classId: selectedClass.id,
        })
        setPreview({ kind: "class", raw: result, success: typeof result === "object" && result !== null ? (result as { isSuccess?: boolean }).isSuccess : undefined, message: typeof result === "object" && result !== null ? (result as { message?: string }).message : undefined })
      }

      setCurrentStep(3)
      toast.success("Fee generation request completed")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate fees.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const loadStudentFees = useCallback(async (studentId: number) => {
    setIsFeeLoading(true)
    try {
      const fees = await studentFeesApi.getAll()
      const filtered = fees.filter((fee) => fee.studentId === studentId)
      setStudentFees(filtered)
      console.log("Loaded student fees:", filtered)
      if (filtered.length === 0) {
        toast.info("No fees found for this student.")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load student fees.")
    } finally {
      setIsFeeLoading(false)
    }
  }, [])

  const loadFeeDetails = useCallback(async (feeId: number) => {
    setIsFeeLoading(true)
    try {
      const fee = await studentFeesApi.getById(feeId)
      setSelectedFee(fee)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load fee details.")
      setSelectedFee(null)
    } finally {
      setIsFeeLoading(false)
    }
  }, [])

  useEffect(() => {
    if (viewMode === "view" && selectedStudentId && !selectedFeeId) {
      loadStudentFees(Number(selectedStudentId))
    }
  }, [viewMode, selectedStudentId, selectedFeeId, loadStudentFees])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Fee Management</h1>
          <p className="text-sm text-muted-foreground">
            {viewMode === "generate"
              ? "Generate fees for one student or an entire class using the current backend contract."
              : "View and manage student fees with detailed component breakdowns."}
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2">
          <Button
            variant={viewMode === "generate" ? "default" : "outline"}
            onClick={() => {
              setViewMode("generate")
              setCurrentStep(0)
              setSelectedFeeId(null)
              setSelectedFee(null)
            }}
          >
            <ClipboardList className="mr-2 h-4 w-4" />
            Generate Fees
          </Button>
          <Button
            variant={viewMode === "view" ? "default" : "outline"}
            onClick={() => {
              setViewMode("view")
              setSelectedFee(null)
            }}
          >
            <Eye className="mr-2 h-4 w-4" />
            View Fees
          </Button>
        </div>
      </div>

      {error && viewMode === "generate" && (
        <Alert variant="destructive">
          <AlertTitle>Fee generation data unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {isLoading && !error && viewMode === "generate" && (
        <div className="text-sm text-muted-foreground">Loading fee generation data...</div>
      )}

      {/* VIEW MODE */}
      {viewMode === "view" && (
        <div className="space-y-4">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Select Student</CardTitle>
              <CardDescription>Choose a student to view their fees.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Student</Label>
                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={String(student.id)}>
                        {studentLabel(student)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Student Fees List */}
          {selectedStudentId && (
            <>
              {isFeeLoading ? (
                <Card className="border-border/50">
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">Loading fees...</div>
                  </CardContent>
                </Card>
              ) : studentFees.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No Fees Found</AlertTitle>
                  <AlertDescription>This student has no generated fees yet. Generate fees from the Generate tab.</AlertDescription>
                </Alert>
              ) : (
                <>
                  <Card className="border-border/50 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base">Student Fees</CardTitle>
                      <CardDescription>Total {studentFees.length} fee records found</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Fee ID</TableHead>
                              <TableHead>Session</TableHead>
                              <TableHead>Period</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                              <TableHead className="text-right">Paid</TableHead>
                              <TableHead className="text-right">Due</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {studentFees.map((fee) => {
                              const dueAmount = fee.dueAmount ?? fee.balance ?? 0
                              const period =
                                fee.billPeriodMonth && fee.billPeriodYear
                                  ? `${fee.billPeriodMonth}/${fee.billPeriodYear}`
                                  : "—"
                              return (
                                <TableRow key={fee.id}>
                                  <TableCell className="font-medium">#{fee.id}</TableCell>
                                  <TableCell>{fee?.sessionName || "—"}</TableCell>
                                  <TableCell>{period}</TableCell>
                                  <TableCell className="text-right">{formatCurrency(fee.totalAmount)}</TableCell>
                                  <TableCell className="text-right text-green-600">{formatCurrency(fee.paidAmount)}</TableCell>
                                  <TableCell className="text-right text-red-600">{formatCurrency(dueAmount)}</TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        String(fee.status).toLowerCase() === "paid" ||
                                        String(fee.status) === "2"
                                          ? "default"
                                          : "secondary"
                                      }
                                    >
                                      {String(fee.status).charAt(0).toUpperCase() +
                                        String(fee.status).slice(1)}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedFeeId(fee.id)
                                        loadFeeDetails(fee.id)
                                      }}
                                      disabled={isFeeLoading}
                                    >
                                      View
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Fee Details */}
                  {selectedFee && (
                    <div>
                      <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Fee Details</h2>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedFeeId(null)
                            setSelectedFee(null)
                          }}
                        >
                          Close
                        </Button>
                      </div>
                      <StudentFeeDetails fee={selectedFee} />
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* GENERATE MODE */}
      {viewMode === "generate" && (
        <>
          <StepIndicator currentStep={currentStep} />

      {currentStep === 0 && (
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <ClipboardList className="h-5 w-5 text-primary" />
              Choose Generation Mode
            </CardTitle>
            <CardDescription>Select whether you want to generate fees for a single student or a whole class.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setMode("student")}
              className={`rounded-lg border p-4 text-left transition-colors ${mode === "student" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"}`}
            >
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <GraduationCap className="size-5" />
                </div>
                <div>
                  <p className="font-semibold">Student Fee Generation</p>
                  <p className="text-sm text-muted-foreground">Generate a fee record for one student.</p>
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setMode("class")}
              className={`rounded-lg border p-4 text-left transition-colors ${mode === "class" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"}`}
            >
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-chart-3/10 text-chart-3">
                  <Users className="size-5" />
                </div>
                <div>
                  <p className="font-semibold">Class Fee Generation</p>
                  <p className="text-sm text-muted-foreground">Generate fees for every student in a class.</p>
                </div>
              </div>
            </button>
          </CardContent>
        </Card>
      )}

      {currentStep === 1 && (
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              {mode === "student" ? <GraduationCap className="h-5 w-5 text-primary" /> : <School className="h-5 w-5 text-primary" />}
              Select Target
            </CardTitle>
            <CardDescription>{mode === "student" ? "Pick a student." : "Pick a class."}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Session</Label>
              <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select session" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((session) => (
                    <SelectItem key={session.id} value={String(session.id)}>
                      {sessionLabel(session)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {mode === "student" ? (
              <div className="grid gap-2 md:col-span-1">
                <Label>Student</Label>
                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={String(student.id)}>
                        {studentLabel(student)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="grid gap-2 md:col-span-1">
                <Label>Class</Label>
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((classItem) => (
                      <SelectItem key={classItem.id} value={String(classItem.id)}>
                        {classLabel(classItem)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="rounded-lg border border-border bg-muted/30 p-4 md:col-span-2">
              <p className="text-sm text-muted-foreground">Selected target</p>
              <p className="font-semibold">{targetSummary}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="outline">Mode: {mode}</Badge>
                {selectedSession && <Badge variant="secondary">Session: {selectedSession.name}</Badge>}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 2 && (
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <IndianRupee className="h-5 w-5 text-primary" />
              Generation Options
            </CardTitle>
            <CardDescription>These map directly to the backend fee generation request.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Billing Date</Label>
              <Input type="datetime-local" value={billingDate} onChange={(e) => setBillingDate(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Fine Assessment Date</Label>
              <Input
                type="datetime-local"
                value={fineAssessmentDate}
                onChange={(e) => setFineAssessmentDate(e.target.value)}
                disabled={!applyFine}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="font-medium">Include Transport Fee</p>
                <p className="text-sm text-muted-foreground">Adds transport charges to the generation request.</p>
              </div>
              <Switch checked={includeTransportFee} onCheckedChange={setIncludeTransportFee} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="font-medium">Apply Fine</p>
                <p className="text-sm text-muted-foreground">Include fine assessment in the generation request.</p>
              </div>
              <Switch checked={applyFine} onCheckedChange={setApplyFine} />
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
              <CardDescription>Review the exact payload before submitting.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg bg-muted/30 p-4 text-sm">
                <p className="text-muted-foreground">Mode</p>
                <p className="font-semibold capitalize">{mode}</p>
                <p className="mt-3 text-muted-foreground">Target</p>
                <p className="font-semibold">{targetSummary}</p>
                <p className="mt-3 text-muted-foreground">Session</p>
                <p className="font-semibold">{selectedSession?.name || "N/A"}</p>
                <p className="mt-3 text-muted-foreground">Billing Date</p>
                <p className="font-semibold">{billingDate ? new Date(billingDate).toLocaleString("en-IN") : "N/A"}</p>
                <p className="mt-3 text-muted-foreground">Fine Assessment Date</p>
                <p className="font-semibold">{applyFine ? new Date(fineAssessmentDate).toLocaleString("en-IN") : "Disabled"}</p>
              </div>
              <div className="rounded-lg border border-border bg-background p-4 text-sm">
                <p className="font-medium">Options</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant={includeTransportFee ? "default" : "secondary"}>
                    {includeTransportFee ? "Transport Fee On" : "Transport Fee Off"}
                  </Badge>
                  <Badge variant={applyFine ? "default" : "secondary"}>
                    {applyFine ? "Fine On" : "Fine Off"}
                  </Badge>
                </div>
                <div className="mt-4 rounded-md bg-muted/30 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Payload shape</p>
                  <pre className="mt-2 overflow-auto text-xs leading-5 text-muted-foreground">
{mode === "student"
  ? JSON.stringify(
      {
        sessionId: Number(selectedSessionId),
        studentId: Number(selectedStudentId),
        billingDate: new Date(billingDate).toISOString(),
        includeTransportFee,
        applyFine,
        fineAssessmentDate: new Date(fineAssessmentDate).toISOString(),
      },
      null,
      2
    )
  : JSON.stringify(
      {
        sessionId: Number(selectedSessionId),
        classId: Number(selectedClassId),
        billingDate: new Date(billingDate).toISOString(),
        includeTransportFee,
        applyFine,
        fineAssessmentDate: new Date(fineAssessmentDate).toISOString(),
      },
      null,
      2
    )}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>

          {preview && (
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Check className="h-5 w-5 text-success" />
                  Backend Response
                </CardTitle>
                <CardDescription>
                  The backend response is rendered as-is so it stays safe if the contract evolves.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert variant={preview.success === false ? "destructive" : "default"}>
                  <AlertTitle>
                    {preview.message || (preview.success === false ? "Generation failed" : "Generation completed")}
                  </AlertTitle>
                  <AlertDescription>
                    {preview.kind === "student" ? "Student fee generation response." : "Class fee generation response."}
                  </AlertDescription>
                </Alert>
                <div className="overflow-auto rounded-lg border border-border bg-muted/30 p-4">
                  <pre className="text-xs leading-5 text-muted-foreground">{JSON.stringify(preview.raw, null, 2)}</pre>
                </div>
              </CardContent>
            </Card>
          )}

          {!preview && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Preview not generated yet</AlertTitle>
              <AlertDescription>Click the generate button to send the request and inspect the backend response.</AlertDescription>
            </Alert>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))} disabled={currentStep === 0}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        {currentStep < steps.length - 1 ? (
          <Button onClick={() => setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1))} disabled={!canProceed()}>
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleGenerate} disabled={isSubmitting}>
            <Check className="mr-2 h-4 w-4" />
            {isSubmitting ? "Generating..." : mode === "student" ? "Generate Student Fees" : "Generate Class Fees"}
          </Button>
        )}
      </div>
        </>
      )}
    </div>
  )
}
