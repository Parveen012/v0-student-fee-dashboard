"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { CreditCard, IndianRupee, Search, Users } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatusBadge } from "@/components/status-badge"
import { groupPaymentsApi, paymentsApi, studentFeesApi, studentsApi } from "@/lib/api"
import type { Installment, Payment, Student, StudentFee } from "@/lib/types"

const paymentModeLabels: Record<string, string> = {
  upi: "UPI",
  cash: "Cash",
  card: "Card",
  bank_transfer: "Bank Transfer",
  cheque: "Cheque",
  online: "Online",
}

function formatCurrency(amount?: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

function studentName(student?: Student) {
  if (!student) return "Student N/A"
  return `${student.firstName} ${student.lastName}`
}

function paymentStudentName(payment: Payment, student?: Student) {
  if (payment.studentName) return payment.studentName
  return studentName(student)
}

function paymentTypeLabel(paymentType?: string, installmentId?: number | null) {
  const type = paymentType || (installmentId ? "installment" : "full")
  return type === "installment" ? "Installment" : "Full"
}

function feeRemaining(fee: StudentFee) {
  return fee.remainingAmount ?? fee.balance
}

export default function PaymentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState("")
  const [studentFee, setStudentFee] = useState<StudentFee | null>(null)
  const [selectedInstallments, setSelectedInstallments] = useState<number[]>([])
  const [amountPaid, setAmountPaid] = useState("")
  const [paymentType, setPaymentType] = useState<"full" | "installment">("full")
  const [paymentMode, setPaymentMode] = useState("upi")
  const [transactionId, setTransactionId] = useState("")
  const [groupStudentIds, setGroupStudentIds] = useState<number[]>([])
  const [groupFeeMap, setGroupFeeMap] = useState<Record<number, StudentFee>>({})
  const [groupTotalAmount, setGroupTotalAmount] = useState("")
  const [groupAmounts, setGroupAmounts] = useState<Record<number, string>>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isFeeLoading, setIsFeeLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feeError, setFeeError] = useState<string | null>(null)

  const loadBaseData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [studentsData, paymentsData] = await Promise.all([
        studentsApi.getAll(),
        paymentsApi.getAll(),
      ])
      setStudents(studentsData)
      setPayments(paymentsData)
      if (!selectedStudentId && studentsData[0]) {
        setSelectedStudentId(studentsData[0].id.toString())
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load payments data.")
    } finally {
      setIsLoading(false)
    }
  }, [selectedStudentId])

  const loadStudentFee = useCallback(async (studentId: string) => {
    if (!studentId) {
      setStudentFee(null)
      return
    }

    setIsFeeLoading(true)
    setFeeError(null)
    try {
      const data = await studentFeesApi.getByStudentId(Number(studentId))
      setStudentFee(data)
      setSelectedInstallments([])
      setPaymentType("full")
    } catch (err) {
      const fallbackFee = students.find((student) => student.id === Number(studentId))?.studentFees?.[0]
      if (fallbackFee) {
        setStudentFee(fallbackFee)
        setSelectedInstallments([])
        setPaymentType("full")
        setFeeError(null)
      } else {
        setStudentFee(null)
        setFeeError(err instanceof Error ? err.message : "Failed to load student fee.")
      }
    } finally {
      setIsFeeLoading(false)
    }
  }, [students])

  useEffect(() => {
    loadBaseData()
  }, [loadBaseData])

  useEffect(() => {
    loadStudentFee(selectedStudentId)
  }, [loadStudentFee, selectedStudentId])

  const studentMap = useMemo(
    () => new Map(students.map((student) => [student.id, student])),
    [students]
  )

  const selectedStudent = studentMap.get(Number(selectedStudentId))

  const paymentRows = useMemo(() => {
    const query = searchQuery.toLowerCase()
    return payments.filter((payment) => {
      const student = payment.student || studentMap.get(payment.studentId)
      const name = paymentStudentName(payment, student).toLowerCase()
      return name.includes(query) || String(payment.id).includes(query)
    })
  }, [payments, searchQuery, studentMap])

  const toggleInstallment = (installment: Installment) => {
    setSelectedInstallments((prev) => {
      const next = prev.includes(installment.id)
        ? prev.filter((id) => id !== installment.id)
        : [...prev, installment.id]

      setPaymentType(next.length > 0 ? "installment" : "full")
      return next
    })
  }

  const handleSinglePayment = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedStudent || !studentFee) {
      toast.error("Please select a student with a fee record.")
      return
    }

    const amount = Number(amountPaid)
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount.")
      return
    }

    if (paymentType === "installment" && selectedInstallments.length === 0) {
      toast.error("Please select at least one installment for installment payments.")
      return
    }

    setIsSubmitting(true)
    try {
      await paymentsApi.create({
        studentId: selectedStudent.id,
        tenantId: selectedStudent.tenantId,
        studentFeeId: studentFee.id,
        amountPaid: amount,
        paymentType,
        mode: paymentMode,
        transactionId: transactionId || null,
        installments: paymentType === "installment" ? selectedInstallments : [],
      })
      toast.success("Payment recorded successfully")
      setAmountPaid("")
      setTransactionId("")
      setSelectedInstallments([])
      setPaymentType("full")
      await Promise.all([loadStudentFee(selectedStudentId), loadBaseData()])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to record payment.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleGroupStudent = async (student: Student, checked: boolean) => {
    if (!checked) {
      setGroupStudentIds((prev) => prev.filter((id) => id !== student.id))
      setGroupAmounts((prev) => {
        const next = { ...prev }
        delete next[student.id]
        return next
      })
      return
    }

    setGroupStudentIds((prev) => [...prev, student.id])
    if (!groupFeeMap[student.id]) {
      try {
        const fee = await studentFeesApi.getByStudentId(student.id)
        setGroupFeeMap((prev) => ({ ...prev, [student.id]: fee }))
      } catch (err) {
        const fallbackFee = student.studentFees?.[0]
        if (fallbackFee) {
          setGroupFeeMap((prev) => ({ ...prev, [student.id]: fallbackFee }))
        } else {
          toast.error(err instanceof Error ? err.message : `Failed to load fee for ${studentName(student)}.`)
        }
      }
    }
  }

  const handleGroupPayment = async (event: React.FormEvent) => {
    event.preventDefault()
    if (groupStudentIds.length === 0) {
      toast.error("Please select at least one student.")
      return
    }

    const totalAmount = Number(groupTotalAmount)
    if (!totalAmount || totalAmount <= 0) {
      toast.error("Please enter a valid total amount.")
      return
    }

    const missingFee = groupStudentIds.find((studentId) => !groupFeeMap[studentId]?.id)
    if (missingFee) {
      toast.error("Student fee data is required for every selected student.")
      return
    }

    setIsSubmitting(true)
    try {
      await groupPaymentsApi.create({
        amountPaid: totalAmount,
        studentIds: groupStudentIds,
        payments: groupStudentIds.map((studentId) => ({
          studentId,
          studentFeeId: groupFeeMap[studentId].id,
          amountPaid: groupAmounts[studentId] ? Number(groupAmounts[studentId]) : undefined,
          installments: [],
        })),
      })
      toast.success("Group payment recorded successfully")
      setGroupStudentIds([])
      setGroupAmounts({})
      setGroupTotalAmount("")
      await loadBaseData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to record group payment.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Payments</h1>
        <p className="text-sm text-muted-foreground">
          Record individual and group payments using backend student fee records.
        </p>
      </div>

      {error && <Alert variant="destructive"><AlertTitle>Payment data unavailable</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      {feeError && <Alert variant="destructive"><AlertTitle>Student fee unavailable</AlertTitle><AlertDescription>{feeError}</AlertDescription></Alert>}
      {isLoading && !error && <div className="text-sm text-muted-foreground">Loading payments...</div>}

      <Tabs defaultValue="single" className="space-y-4">
        <TabsList>
          <TabsTrigger value="single">Single Payment</TabsTrigger>
          <TabsTrigger value="group">Group Payment</TabsTrigger>
        </TabsList>

        <TabsContent value="single">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <CreditCard className="size-5 text-primary" />
                Normal Payment
              </CardTitle>
              <CardDescription>GET /api/StudentFees/{"{studentId}"} then POST /api/Payments</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSinglePayment} className="grid gap-5">
                <div className="grid gap-4 lg:grid-cols-[1fr_180px_180px_180px_1fr]">
                  <div className="grid gap-2">
                    <Label>Student</Label>
                    <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                      <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                      <SelectContent>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id.toString()}>
                            {studentName(student)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Payment Type</Label>
                    <Select
                      value={paymentType}
                      onValueChange={(value) => {
                        const nextType = value as "full" | "installment"
                        setPaymentType(nextType)
                        if (nextType === "full") {
                          setSelectedInstallments([])
                        }
                      }}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full Payment</SelectItem>
                        <SelectItem value="installment">Installment Payment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Amount Paid</Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input type="number" value={amountPaid} onChange={(event) => setAmountPaid(event.target.value)} className="pl-9" required />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Mode</Label>
                    <Select value={paymentMode} onValueChange={setPaymentMode}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(paymentModeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Transaction ID</Label>
                    <Input value={transactionId} onChange={(event) => setTransactionId(event.target.value)} placeholder="Optional" />
                  </div>
                </div>

                {isFeeLoading && <div className="text-sm text-muted-foreground">Loading student fee...</div>}
                {studentFee && (
                  <div className="grid gap-4 rounded-lg border border-border bg-muted/30 p-4 md:grid-cols-4">
                    <div><p className="text-sm text-muted-foreground">Total Fee</p><p className="font-semibold">{formatCurrency(studentFee.totalAmount)}</p></div>
                    <div><p className="text-sm text-muted-foreground">Paid</p><p className="font-semibold text-success">{formatCurrency(studentFee.paidAmount)}</p></div>
                    <div><p className="text-sm text-muted-foreground">Remaining</p><p className="font-semibold text-destructive">{formatCurrency(feeRemaining(studentFee))}</p></div>
                    <div><p className="text-sm text-muted-foreground">Status</p><div className="mt-1"><StatusBadge status={studentFee.status} /></div></div>
                  </div>
                )}

                {studentFee?.installments?.length ? (
                  <div className="rounded-lg border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Installment</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Paid</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {studentFee.installments.map((installment) => (
                          <TableRow key={installment.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedInstallments.includes(installment.id)}
                                onCheckedChange={() => toggleInstallment(installment)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{installment.name}</TableCell>
                            <TableCell>{format(new Date(installment.dueDate), "dd MMM yyyy")}</TableCell>
                            <TableCell className="text-right">{formatCurrency(installment.amount)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(installment.paidAmount)}</TableCell>
                            <TableCell><StatusBadge status={installment.status} /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  selectedStudentId && !isFeeLoading && (
                    <div className="text-sm text-muted-foreground">No installments returned for this student fee.</div>
                  )
                )}

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmitting || !studentFee}>
                    Record Payment
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="group">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Users className="size-5 text-primary" />
                Group Payment
              </CardTitle>
              <CardDescription>Select multiple students and POST /api/GroupPayments</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGroupPayment} className="grid gap-5">
                <div className="grid gap-2 md:max-w-sm">
                  <Label>Total Amount</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input type="number" value={groupTotalAmount} onChange={(event) => setGroupTotalAmount(event.target.value)} className="pl-9" required />
                  </div>
                </div>

                <div className="rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Student Fee ID</TableHead>
                        <TableHead>Remaining</TableHead>
                        <TableHead className="w-48">Assigned Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student) => {
                        const checked = groupStudentIds.includes(student.id)
                        const fee = groupFeeMap[student.id]
                        return (
                          <TableRow key={student.id}>
                            <TableCell>
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(value) => toggleGroupStudent(student, value === true)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{studentName(student)}</TableCell>
                            <TableCell>{fee?.id || "-"}</TableCell>
                            <TableCell>{fee ? formatCurrency(feeRemaining(fee)) : "-"}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={groupAmounts[student.id] || ""}
                                onChange={(event) => setGroupAmounts((prev) => ({ ...prev, [student.id]: event.target.value }))}
                                disabled={!checked}
                                placeholder="Optional"
                              />
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmitting}>
                    Record Group Payment
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Payment Records</CardTitle>
              <CardDescription>{paymentRows.length} payment{paymentRows.length !== 1 ? "s" : ""} found</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search payments..." className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment ID</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentRows.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground">No payments found.</TableCell></TableRow>
                ) : (
                  paymentRows.map((payment) => {
                    const student = payment.student || studentMap.get(payment.studentId)
                    const displayStudentName = paymentStudentName(payment, student)
                    return (
                      <TableRow key={payment.id}>
                        <TableCell className="font-mono text-xs">PAY{String(payment.id).padStart(4, "0")}</TableCell>
                        <TableCell>
                          {student ? (
                            <Link href={`/students/${student.id}`} className="font-medium hover:underline">
                              {displayStudentName}
                            </Link>
                          ) : displayStudentName}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-normal">
                            {paymentTypeLabel(payment.paymentType, payment.installmentId)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(payment.amountPaid)}</TableCell>
                        <TableCell><Badge variant="secondary" className="font-normal">{paymentModeLabels[payment.mode] || payment.mode}</Badge></TableCell>
                        <TableCell>{format(new Date(payment.paymentDate), "dd MMM yyyy")}</TableCell>
                        <TableCell><StatusBadge status={payment.status || "completed"} /></TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
