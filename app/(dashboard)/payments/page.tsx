"use client"

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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"
import { paymentsApi, studentsApi } from "@/lib/api"
import type { Payment, Student, StudentFee } from "@/lib/types"

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { className: string; icon: React.ReactNode }> = {
    completed: { className: "bg-success/10 text-success border-success/20", icon: <CheckCircle2 className="h-3 w-3" /> },
    pending: { className: "bg-warning/10 text-warning-foreground border-warning/20", icon: <Clock className="h-3 w-3" /> },
    failed: { className: "bg-destructive/10 text-destructive border-destructive/20", icon: <XCircle className="h-3 w-3" /> },
    refunded: { className: "bg-muted text-muted-foreground border-muted", icon: <AlertTriangle className="h-3 w-3" /> },
  }
  
  const variant = variants[status] || variants.pending
  
  return (
    <Badge variant="outline" className={`gap-1 ${variant.className}`}>
      {variant.icon}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}

// Payment mode badge
function PaymentModeBadge({ mode }: { mode: string }) {
  const modeLabels: Record<string, { label: string; className: string }> = {
    upi: { label: "UPI", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
    cash: { label: "Cash", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
    card: { label: "Card", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
    bank_transfer: { label: "Bank Transfer", className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
    cheque: { label: "Cheque", className: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300" },
    online: { label: "Online", className: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300" },
  }
  
  const config = modeLabels[mode] || { label: mode, className: "bg-muted text-muted-foreground" }
  
  return (
    <Badge variant="secondary" className={`font-normal ${config.className}`}>
      {config.label}
    </Badge>
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

// Format date
function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export default function PaymentsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [modeFilter, setModeFilter] = useState<string>("all")
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
  const filteredPayments = useMemo(() => {
    return paymentsWithInfo.filter((payment) => {
      const studentName = `${payment.student?.firstName} ${payment.student?.lastName}`.toLowerCase()
      const matchesSearch =
        studentName.includes(searchQuery.toLowerCase()) ||
        payment.transactionId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `RCP${String(payment.id).padStart(4, "0")}`.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter === "all" || payment.status === statusFilter
      const matchesMode = modeFilter === "all" || payment.mode === modeFilter
      
      // Date filter
      let matchesDate = true
      if (dateFilter !== "all") {
        const paymentDate = new Date(payment.paymentDate)
        const today = new Date()
        if (dateFilter === "today") {
          matchesDate = paymentDate.toDateString() === today.toDateString()
        } else if (dateFilter === "week") {
          const weekAgo = new Date(today.setDate(today.getDate() - 7))
          matchesDate = paymentDate >= weekAgo
        } else if (dateFilter === "month") {
          matchesDate = paymentDate.getMonth() === today.getMonth() && paymentDate.getFullYear() === today.getFullYear()
        }
      }
      
      return matchesSearch && matchesStatus && matchesMode && matchesDate
    })
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
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Payments</h1>
          <p className="text-sm text-muted-foreground">
            Track and manage all fee payments
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setPaymentDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Record Payment
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Payment data unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {isLoading && !error && (
        <div className="text-sm text-muted-foreground">Loading payments...</div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Total Collected</CardDescription>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalCollected)}</div>
            <p className="text-xs text-muted-foreground">{stats.transactionCount} transactions</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Today&apos;s Collection</CardDescription>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(stats.todayCollection)}</div>
            <p className="text-xs text-muted-foreground">Current day</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Pending</CardDescription>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning-foreground">{formatCurrency(stats.pendingAmount)}</div>
            <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Most Used Mode</CardDescription>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">UPI</div>
            <p className="text-xs text-muted-foreground">65% of transactions</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by student, receipt no, transaction ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Select value={modeFilter} onValueChange={setModeFilter}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modes</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-36">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {/* Payments Table */}
      <Card>
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
                <TableRow>
                  <TableHead>Receipt #</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Installment</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                      No payments found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium font-mono">
                        RCP{String(payment.id).padStart(4, "0")}
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                      <TableCell>
                        {payment.installment?.name || (
                          <span className="text-muted-foreground">General</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(payment.amountPaid)}
                      </TableCell>
                      <TableCell>
                        <PaymentModeBadge mode={payment.mode} />
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {payment.transactionId || "-"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={payment.status || "completed"} />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Receipt className="mr-2 h-4 w-4" />
                              Download Receipt
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="mr-2 h-4 w-4" />
                              Email Receipt
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
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
    </div>
  )
}
