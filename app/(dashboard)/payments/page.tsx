"use client"

<<<<<<< HEAD
import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Plus,
  Search,
  Filter,
  Download,
  Receipt,
  CreditCard,
  IndianRupee,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  MoreHorizontal,
  Mail,
  Eye,
} from "lucide-react"
=======
import { useState, useMemo } from "react"
import { Plus, Search, Filter, Download } from "lucide-react"
import { format } from "date-fns"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
<<<<<<< HEAD
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"
import { paymentsApi, studentsApi } from "@/lib/api"
import type { Payment, Student, StudentFee } from "@/lib/types"
=======
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { StatusBadge } from "@/components/status-badge"
import { payments, students } from "@/lib/data"
import { toast } from "sonner"
>>>>>>> 747b1495436d4f81a92794c03cd1b2285918ac8f

const paymentModeLabels = {
  upi: "UPI",
  cash: "Cash",
  card: "Card",
  bank_transfer: "Bank Transfer",
}

export default function PaymentsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [modeFilter, setModeFilter] = useState<string>("all")
<<<<<<< HEAD
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [studentFees, setStudentFees] = useState<StudentFee[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Payment form state
  const [selectedStudentId, setSelectedStudentId] = useState("")
  const [selectedInstallmentId, setSelectedInstallmentId] = useState("")
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMode, setPaymentMode] = useState("upi")
  const [transactionId, setTransactionId] = useState("")

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [studentsData, paymentsData] = await Promise.all([
        studentsApi.getAll(),
        paymentsApi.getAll(),
      ])
      setStudents(studentsData)
      setStudentFees(studentsData.flatMap((student) => student.studentFees || []))
      setPayments(paymentsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load payments.")
    } finally {
      setIsLoading(false)
    }
  }, [payments, studentFees, students])

  useEffect(() => {
    loadData()
  }, [loadData])
  
  // Get payments with student info
  const paymentsWithInfo = useMemo(() => {
    return payments.map(p => {
      const student = students.find(s => s.id === p.studentId)
      const studentFee = studentFees.find(sf => sf.studentId === p.studentId)
      const installment = studentFee?.installments?.find(i => i.id === p.installmentId)
      return {
        ...p,
        student,
        studentFee,
        installment,
      }
    })
  }, [payments])
  
  // Filter payments
=======
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<string>("")
  const [paymentAmount, setPaymentAmount] = useState("")
  const [applyDiscount, setApplyDiscount] = useState(false)
  const [discountAmount, setDiscountAmount] = useState("")
  const [applyFine, setApplyFine] = useState(false)
  const [fineAmount, setFineAmount] = useState("")

>>>>>>> 747b1495436d4f81a92794c03cd1b2285918ac8f
  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const matchesSearch =
        payment.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.id.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesMode = modeFilter === "all" || payment.mode === modeFilter
      const matchesStatus = statusFilter === "all" || payment.status === statusFilter

      return matchesSearch && matchesMode && matchesStatus
    })
<<<<<<< HEAD
  }, [paymentsWithInfo, searchQuery, statusFilter, modeFilter, dateFilter])
  
  // Summary stats
  const stats = useMemo(() => {
    const totalCollected = payments.filter(p => p.status === "completed").reduce((sum, p) => sum + p.amountPaid, 0)
    const pendingAmount = payments.filter(p => p.status === "pending").reduce((sum, p) => sum + p.amountPaid, 0)
    const todayCollection = payments
      .filter(p => p.status === "completed" && new Date(p.paymentDate).toDateString() === new Date().toDateString())
      .reduce((sum, p) => sum + p.amountPaid, 0)
    const transactionCount = payments.filter(p => p.status === "completed").length
    
    return { totalCollected, pendingAmount, todayCollection, transactionCount }
  }, [])
  
  // Get selected student's fee info
  const selectedStudentFee = useMemo(() => {
    if (!selectedStudentId) return null
    return studentFees.find(sf => sf.studentId === parseInt(selectedStudentId))
  }, [selectedStudentId, studentFees])
  
  // Get selected installment info
  const selectedInstallment = useMemo(() => {
    if (!selectedInstallmentId || !selectedStudentFee) return null
    return selectedStudentFee.installments?.find(i => i.id === parseInt(selectedInstallmentId))
  }, [selectedInstallmentId, selectedStudentFee])
  
  // Payment type indicator
  const paymentType = useMemo(() => {
    if (!paymentAmount || !selectedStudentFee) return null
    const amount = parseFloat(paymentAmount)
    const balance = selectedInstallment?.balance || selectedStudentFee.balance
    
    if (amount < balance) return { type: "partial", message: `Partial payment. ${formatCurrency(balance - amount)} will remain due.` }
    if (amount > balance) return { type: "overpayment", message: `Overpayment of ${formatCurrency(amount - balance)} will be credited.` }
    return { type: "full", message: "Full payment. Balance will be cleared." }
  }, [paymentAmount, selectedInstallment, selectedStudentFee])
  
  // Handle payment submission
  const handlePaymentSubmit = async () => {
    const amount = parseFloat(paymentAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount")
      return
    }
    
    if (!selectedStudentId) {
      toast.error("Please select a student")
      return
    }

    const studentId = Number(selectedStudentId)
    const student = students.find((s) => s.id === studentId)
    if (!student) {
      toast.error("Selected student not found.")
      return
    }

    const studentFee = studentFees.find((sf) => sf.studentId === studentId)
    if (!studentFee) {
      toast.error("No fee record found for the selected student.")
      return
    }

    try {
      await paymentsApi.create({
        studentFeeId: studentFee.id,
        installmentId: selectedInstallmentId ? Number(selectedInstallmentId) : null,
        amountPaid: amount,
        paymentDate: new Date().toISOString(),
        mode: paymentMode,
        transactionId: transactionId || null,
        studentId: student.id,
        tenantId: student.tenantId,
      })
      toast.success("Payment recorded successfully", {
        description: `Payment of ${formatCurrency(amount)} has been recorded.`,
      })
      setPaymentDialogOpen(false)
      setSelectedStudentId("")
      setSelectedInstallmentId("")
      setPaymentAmount("")
      setTransactionId("")
      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to record payment.")
    }
=======
  }, [searchQuery, modeFilter, statusFilter])

  const selectedStudentData = useMemo(() => {
    return students.find((s) => s.id === selectedStudent)
  }, [selectedStudent])

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault()
    setIsPaymentDialogOpen(false)
    setSelectedStudent("")
    setPaymentAmount("")
    setApplyDiscount(false)
    setDiscountAmount("")
    setApplyFine(false)
    setFineAmount("")
    toast.success("Payment recorded successfully", {
      description: "The payment has been added to the system.",
    })
>>>>>>> 747b1495436d4f81a92794c03cd1b2285918ac8f
  }

  const totalCollected = payments
    .filter((p) => p.status === "completed")
    .reduce((a, p) => a + p.amount, 0)

  const totalPending = payments
    .filter((p) => p.status === "pending")
    .reduce((a, p) => a + p.amount, 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Payments</h1>
          <p className="text-sm text-muted-foreground">
            Track and manage all fee payments
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 size-4" />
            Export
          </Button>
          <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 size-4" />
                Add Payment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Record New Payment</DialogTitle>
                <DialogDescription>
                  Enter the payment details to record a new fee payment.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddPayment}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="student">Select Student</Label>
                    <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                      <SelectTrigger id="student">
                        <SelectValue placeholder="Choose a student" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.name} ({student.class})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedStudentData && (
                    <div className="rounded-lg border border-border bg-muted/50 p-4">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Total Fee</p>
                          <p className="font-semibold">
                            ₹{selectedStudentData.totalFee.toLocaleString("en-IN")}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Paid</p>
                          <p className="font-semibold text-success">
                            ₹{selectedStudentData.paidAmount.toLocaleString("en-IN")}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Due</p>
                          <p className="font-semibold text-destructive">
                            ₹{selectedStudentData.dueAmount.toLocaleString("en-IN")}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="Enter amount"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="mode">Payment Mode</Label>
                      <Select required>
                        <SelectTrigger id="mode">
                          <SelectValue placeholder="Select mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="upi">UPI</SelectItem>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="installment">Select Installment (Optional)</Label>
                    <Select>
                      <SelectTrigger id="installment">
                        <SelectValue placeholder="Select installment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="q1">Q1 Fee - Due Apr 15</SelectItem>
                        <SelectItem value="q2">Q2 Fee - Due Jul 15</SelectItem>
                        <SelectItem value="q3">Q3 Fee - Due Oct 15</SelectItem>
                        <SelectItem value="q4">Q4 Fee - Due Jan 15</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="discount"
                        checked={applyDiscount}
                        onCheckedChange={(checked) => setApplyDiscount(checked === true)}
                      />
                      <Label htmlFor="discount" className="text-sm font-normal">
                        Apply Discount
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="fine"
                        checked={applyFine}
                        onCheckedChange={(checked) => setApplyFine(checked === true)}
                      />
                      <Label htmlFor="fine" className="text-sm font-normal">
                        Add Fine (Overdue)
                      </Label>
                    </div>
                  </div>

                  {applyDiscount && (
                    <div className="grid gap-2">
                      <Label htmlFor="discountAmount">Discount Amount</Label>
                      <Input
                        id="discountAmount"
                        type="number"
                        placeholder="Enter discount"
                        value={discountAmount}
                        onChange={(e) => setDiscountAmount(e.target.value)}
                      />
                    </div>
                  )}

                  {applyFine && (
                    <div className="grid gap-2">
                      <Label htmlFor="fineAmount">Fine Amount</Label>
                      <Input
                        id="fineAmount"
                        type="number"
                        placeholder="Enter fine"
                        value={fineAmount}
                        onChange={(e) => setFineAmount(e.target.value)}
                      />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Record Payment</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

<<<<<<< HEAD
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Payment data unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {isLoading && !error && (
        <div className="text-sm text-muted-foreground">Loading payments...</div>
      )}

=======
>>>>>>> 747b1495436d4f81a92794c03cd1b2285918ac8f
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Payments</p>
            <p className="text-2xl font-semibold">{payments.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Collected Amount</p>
            <p className="text-2xl font-semibold text-success">
              ₹{totalCollected.toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pending Amount</p>
            <p className="text-2xl font-semibold text-warning-foreground">
              ₹{totalPending.toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by student name or payment ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={modeFilter} onValueChange={setModeFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="mr-2 size-4" />
                <SelectValue placeholder="Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modes</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Payment Records</CardTitle>
          <CardDescription>
            {filteredPayments.length} payment{filteredPayments.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-medium text-muted-foreground">Payment ID</TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground">Student</TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground">Class</TableHead>
                  <TableHead className="text-right text-xs font-medium text-muted-foreground">
                    Amount
                  </TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground">Mode</TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground">Date</TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground">Status</TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      No payments found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {payment.id}
                      </TableCell>
                      <TableCell className="font-medium">{payment.studentName}</TableCell>
                      <TableCell className="text-muted-foreground">{payment.class}</TableCell>
                      <TableCell className="text-right font-medium">
                        ₹{payment.amount.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell>
<<<<<<< HEAD
                        <Link href={`/students/${payment.studentId}`} className="hover:underline">
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {payment.student?.firstName} {payment.student?.lastName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {payment.student?.class
                                ? `${payment.student.class.name}-${payment.student.class.section}`
                                : "Class N/A"}
                            </span>
                          </div>
                        </Link>
=======
                        <Badge variant="secondary" className="font-normal">
                          {paymentModeLabels[payment.mode]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(payment.date), "dd MMM yyyy")}
>>>>>>> 747b1495436d4f81a92794c03cd1b2285918ac8f
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={payment.status} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {payment.discountApplied && (
                          <span className="text-success">
                            -₹{payment.discountApplied.toLocaleString("en-IN")} discount
                          </span>
                        )}
                        {payment.fineApplied && (
                          <span className="text-destructive">
                            +₹{payment.fineApplied.toLocaleString("en-IN")} fine
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
<<<<<<< HEAD
      
      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Record Payment
            </DialogTitle>
            <DialogDescription>
              Record a new fee payment for a student
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              <TabsTrigger value="quick">Quick Pay</TabsTrigger>
            </TabsList>
            
            <TabsContent value="manual" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Select Student</Label>
                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.firstName} {s.lastName} -{" "}
                        {s.class ? `${s.class.name}-${s.class.section}` : "Class N/A"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedStudentFee && (
                <>
                  <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Fee:</span>
                      <span>{formatCurrency(selectedStudentFee.netAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Paid:</span>
                      <span className="text-success">{formatCurrency(selectedStudentFee.paidAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium">
                      <span>Balance:</span>
                      <span className="text-destructive">{formatCurrency(selectedStudentFee.balance)}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Installment (Optional)</Label>
                    <Select value={selectedInstallmentId} onValueChange={setSelectedInstallmentId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select installment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No specific installment</SelectItem>
                        {selectedStudentFee.installments?.filter(i => i.balance > 0).map((i) => (
                          <SelectItem key={i.id} value={i.id.toString()}>
                            {i.name} - Balance: {formatCurrency(i.balance)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              
              <div className="space-y-2">
                <Label>Payment Amount</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              
              {paymentType && (
                <Alert variant={paymentType.type === "overpayment" ? "default" : paymentType.type === "partial" ? "destructive" : "default"}>
                  <AlertDescription>
                    {paymentType.type === "partial" && <Clock className="h-4 w-4 inline mr-2" />}
                    {paymentType.type === "overpayment" && <AlertTriangle className="h-4 w-4 inline mr-2" />}
                    {paymentType.type === "full" && <CheckCircle2 className="h-4 w-4 inline mr-2" />}
                    {paymentType.message}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label>Payment Mode</Label>
                <Select value={paymentMode} onValueChange={setPaymentMode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Transaction ID (Optional)</Label>
                <Input
                  placeholder="Enter transaction reference"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="quick" className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Quick pay allows you to record payments for students with pending installments.
              </p>
              
              <div className="space-y-3">
                {studentFees
                  .filter(sf => sf.balance > 0)
                  .slice(0, 5)
                  .map((sf) => {
                    const student = students.find(s => s.id === sf.studentId)
                    const nextInstallment = sf.installments?.find(i => i.status !== "paid")
                    return (
                      <div
                        key={sf.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                        onClick={() => {
                          setSelectedStudentId(sf.studentId.toString())
                          if (nextInstallment) {
                            setSelectedInstallmentId(nextInstallment.id.toString())
                            setPaymentAmount(nextInstallment.balance.toString())
                          }
                        }}
                      >
                        <div>
                          <p className="font-medium">{student?.firstName} {student?.lastName}</p>
                          <p className="text-xs text-muted-foreground">
                            {nextInstallment?.name} - Due: {nextInstallment ? formatDate(nextInstallment.dueDate) : "N/A"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(nextInstallment?.balance || sf.balance)}</p>
                          <Badge variant="outline" className="text-xs">
                            {nextInstallment?.status}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePaymentSubmit}>
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
=======
>>>>>>> 747b1495436d4f81a92794c03cd1b2285918ac8f
    </div>
  )
}
