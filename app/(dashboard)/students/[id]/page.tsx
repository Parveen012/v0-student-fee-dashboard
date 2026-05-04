"use client"

import { use, useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  Calendar,
  GraduationCap,
  CreditCard,
  Receipt,
  Percent,
  AlertTriangle,
  Plus,
  Download,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  XCircle,
  IndianRupee,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  discountsApi,
  feeComponentsApi,
  finesApi,
  parentsApi,
  paymentsApi,
  studentFeesApi,
  studentParentsApi,
  studentDiscountsApi,
  studentFinesApi,
  studentsApi,
} from "@/lib/api"
import type {
  Discount,
  FeeComponent,
  Fine,
  Parent,
  Payment,
  Student,
  StudentDiscount,
  StudentFee,
  StudentFine,
  StudentParent,
} from "@/lib/types"

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { className: string; icon: React.ReactNode }> = {
    paid: { className: "bg-success/10 text-success border-success/20", icon: <CheckCircle2 className="h-3 w-3" /> },
    partial: { className: "bg-warning/10 text-warning-foreground border-warning/20", icon: <Clock className="h-3 w-3" /> },
    unpaid: { className: "bg-muted text-muted-foreground border-muted", icon: <Clock className="h-3 w-3" /> },
    overdue: { className: "bg-destructive/10 text-destructive border-destructive/20", icon: <XCircle className="h-3 w-3" /> },
    overpaid: { className: "bg-primary/10 text-primary border-primary/20", icon: <CheckCircle2 className="h-3 w-3" /> },
    completed: { className: "bg-success/10 text-success border-success/20", icon: <CheckCircle2 className="h-3 w-3" /> },
    pending: { className: "bg-warning/10 text-warning-foreground border-warning/20", icon: <Clock className="h-3 w-3" /> },
    failed: { className: "bg-destructive/10 text-destructive border-destructive/20", icon: <XCircle className="h-3 w-3" /> },
  }
  
  const variant = variants[status] || variants.unpaid
  
  return (
    <Badge variant="outline" className={`gap-1 ${variant.className}`}>
      {variant.icon}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}

// Payment mode badge
function PaymentModeBadge({ mode }: { mode: string }) {
  const modeLabels: Record<string, string> = {
    upi: "UPI",
    cash: "Cash",
    card: "Card",
    bank_transfer: "Bank Transfer",
    cheque: "Cheque",
    online: "Online",
  }
  return (
    <Badge variant="secondary" className="font-normal">
      {modeLabels[mode] || mode}
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

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const studentId = parseInt(id)

  const [student, setStudent] = useState<Student | null>(null)
  const [studentFee, setStudentFee] = useState<StudentFee | null>(null)
  const [studentPayments, setStudentPayments] = useState<Payment[]>([])
  const [studentParentsList, setStudentParentsList] = useState<StudentParent[]>([])
  const [studentDiscountsList, setStudentDiscountsList] = useState<StudentDiscount[]>([])
  const [studentFinesList, setStudentFinesList] = useState<StudentFine[]>([])
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [fines, setFines] = useState<Fine[]>([])
  const [feeComponents, setFeeComponents] = useState<FeeComponent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false)
  const [fineDialogOpen, setFineDialogOpen] = useState(false)
  const [selectedInstallment, setSelectedInstallment] = useState<number | null>(null)
  const [selectedFineInstallmentId, setSelectedFineInstallmentId] = useState<number | null>(null)
  
  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMode, setPaymentMode] = useState("upi")
  const [transactionId, setTransactionId] = useState("")
  
  // Discount form state
  const [selectedDiscountId, setSelectedDiscountId] = useState("")
  const [discountReason, setDiscountReason] = useState("")
  
  // Fine form state
  const [selectedFineId, setSelectedFineId] = useState("")
  
  const loadStudentData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [
        studentData,
        studentParentsData,
        parentsData,
        paymentsData,
        discountsData,
        finesData,
        studentDiscountsData,
        studentFinesData,
        feeComponentsData,
      ] = await Promise.all([
        studentsApi.getById(studentId),
        studentParentsApi.getByStudentId(studentId),
        parentsApi.getAll(),
        paymentsApi.getAll(),
        discountsApi.getAll(),
        finesApi.getAll(),
        studentDiscountsApi.getAll(),
        studentFinesApi.getAll(),
        feeComponentsApi.getAll(),
      ])

      let studentFeeData: StudentFee | null = null
      try {
        studentFeeData = await studentFeesApi.getByStudentId(studentId)
      } catch {
        // Keep fallback to embedded studentFees when dedicated endpoint is unavailable.
      }

      const discountMap = new Map(discountsData.map((discount) => [discount.id, discount]))
      const fineMap = new Map(finesData.map((fine) => [fine.id, fine]))
      const parentMap = new Map(parentsData.map((parent) => [parent.id, parent]))

      setStudent(studentData)
      setStudentFee(studentFeeData || studentData.studentFees?.[0] || null)
      setStudentPayments(paymentsData.filter((payment) => payment.studentId === studentId))
      setStudentParentsList(
        studentParentsData.map((relation) => ({
          ...relation,
          parent: relation.parent || parentMap.get(relation.parentId),
        }))
      )
      setStudentDiscountsList(
        studentDiscountsData
          .filter((sd) => sd.studentId === studentId)
          .map((sd) => ({
            ...sd,
            discount: sd.discount || discountMap.get(sd.discountId),
          }))
      )
      setStudentFinesList(
        studentFinesData
          .filter((sf) => sf.studentId === studentId)
          .map((sf) => ({
            ...sf,
            fine: sf.fine || fineMap.get(sf.fineId),
          }))
      )
      setDiscounts(discountsData)
      setFines(finesData)
      setFeeComponents(feeComponentsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load student details.")
    } finally {
      setIsLoading(false)
    }
  }, [studentId])

  useEffect(() => {
    loadStudentData()
  }, [loadStudentData])

  const feeBreakdown = useMemo(() => {
    if (!studentFee) return null
    const componentMap = new Map(feeComponents.map((component) => [component.id, component]))
    const structureComponents = studentFee.feeStructure?.feeStructureComponents || []
    const breakdown = structureComponents.map((component) => ({
      component:
        component.feeComponent?.name ||
        componentMap.get(component.feeComponentId)?.name ||
        "Fee Component",
      amount: component.amount,
    }))

    return {
      breakdown,
      totalFee: studentFee.totalAmount,
      discountAmount: studentFee.discountAmount,
      fineAmount: studentFee.fineAmount,
      netAmount: studentFee.netAmount,
      paidAmount: studentFee.paidAmount,
      balance: studentFee.balance,
    }
  }, [feeComponents, studentFee])

  const feePayerParent = useMemo(() => {
    const isFeePayer = (relation: StudentParent) =>
      relation.isFeePayer === true || relation.IsFeePayer === true

    const relation =
      studentParentsList.find(isFeePayer) ||
      studentParentsList[0]

    if (!relation) return null

    return {
      relation: relation.relation || relation.relationship || "Guardian",
      parent: relation.parent,
    }
  }, [studentParentsList])

  const parentDetails: { name: string; phone: string; email: string; relation?: string } = useMemo(() => {
    if (feePayerParent?.parent) {
      return {
        name: feePayerParent.parent.name,
        phone: feePayerParent.parent.phone,
        email: feePayerParent.parent.email,
        relation: feePayerParent.relation,
      }
    }

    if (student?.parent) {
      return {
        name: student.parent.name,
        phone: student.parent.phone,
        email: student.parent.email,
      }
    }

    return {
      name: "N/A",
      phone: "N/A",
      email: "N/A",
    }
  }, [feePayerParent, student])

  const linkedParents = useMemo(() => {
    return studentParentsList.map((relation) => ({
      id: relation.id,
      name: relation.parent?.name || `Parent ${relation.parentId}`,
      phone: relation.parent?.phone || "N/A",
      email: relation.parent?.email || "N/A",
      relation: relation.relation || relation.relationship || "Guardian",
      isFeePayer: relation.isFeePayer === true || relation.IsFeePayer === true,
    }))
  }, [studentParentsList])
  
  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading student details...</div>
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Student data unavailable</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <h2 className="text-xl font-semibold">Student not found</h2>
        <Link href="/students">
          <Button variant="link" className="mt-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Students
          </Button>
        </Link>
      </div>
    )
  }

  const collectionProgress =
    studentFee && studentFee.netAmount > 0 ? (studentFee.paidAmount / studentFee.netAmount) * 100 : 0
  
  // Handle payment submission
  const handlePaymentSubmit = async () => {
    const amount = parseFloat(paymentAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    if (!studentFee) {
      toast.error("Fee data is not available for this student.")
      return
    }

    try {
      await paymentsApi.create({
        studentFeeId: studentFee.id,
        installmentId: selectedInstallment,
        amountPaid: amount,
        paymentDate: new Date().toISOString(),
        mode: paymentMode,
        transactionId: transactionId || null,
        studentId: student.id,
        tenantId: student.tenantId,
      })
      toast.success(`Payment of ${formatCurrency(amount)} recorded successfully`)
      setPaymentDialogOpen(false)
      setPaymentAmount("")
      setTransactionId("")
      setSelectedInstallment(null)
      await loadStudentData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to record payment.")
    }
  }
  
  // Handle discount application
  const handleDiscountSubmit = async () => {
    if (!selectedDiscountId) {
      toast.error("Please select a discount type")
      return
    }

    try {
      await studentDiscountsApi.create({
        studentId: student.id,
        discountId: Number(selectedDiscountId),
        reason: discountReason,
      })
      toast.success("Discount applied successfully")
      setDiscountDialogOpen(false)
      setSelectedDiscountId("")
      setDiscountReason("")
      await loadStudentData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to apply discount.")
    }
  }
  
  // Handle fine application
  const handleFineSubmit = async () => {
    if (!selectedFineId) {
      toast.error("Please select a fine type")
      return
    }

    try {
      await studentFinesApi.create({
        studentId: student.id,
        fineId: Number(selectedFineId),
        installmentId: selectedFineInstallmentId,
        isPaid: false,
      })
      toast.success("Fine applied successfully")
      setFineDialogOpen(false)
      setSelectedFineId("")
      setSelectedFineInstallmentId(null)
      await loadStudentData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to apply fine.")
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/students">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Student Profile</h1>
            <p className="text-muted-foreground">View and manage student fee details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Generate Receipt
          </Button>
        </div>
      </div>
      
      {/* Student Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {student.firstName[0]}{student.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold">{student.firstName} {student.lastName}</h2>
                <p className="text-muted-foreground">ID: STU{String(student.id).padStart(3, "0")}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="bg-primary/5">
                    <GraduationCap className="h-3 w-3 mr-1" />
                    {student.class?.name} - {student.class?.section}
                  </Badge>
                  <StatusBadge status={studentFee?.status || "unpaid"} />
                </div>
              </div>
            </div>
            
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 md:ml-auto">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" /> Parent
                </p>
                <p className="font-medium">{parentDetails.name}</p>
                {parentDetails.relation && (
                  <p className="text-xs text-muted-foreground">{parentDetails.relation} • Fee Payer</p>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Phone
                </p>
                <p className="font-medium">{parentDetails.phone}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" /> Email
                </p>
                <p className="font-medium text-sm">{parentDetails.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Admission
                </p>
                <p className="font-medium">{formatDate(student.admissionDate)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Linked Parents</CardTitle>
          <CardDescription>
            Parent relations fetched from StudentParents for this student.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {linkedParents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No linked parents found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parent</TableHead>
                    <TableHead>Relation</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Fee Payer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linkedParents.map((parent) => (
                    <TableRow key={parent.id}>
                      <TableCell className="font-medium">{parent.name}</TableCell>
                      <TableCell>{parent.relation}</TableCell>
                      <TableCell>{parent.phone}</TableCell>
                      <TableCell>{parent.email}</TableCell>
                      <TableCell>
                        {parent.isFeePayer ? (
                          <Badge className="bg-success/10 text-success hover:bg-success/10">Yes</Badge>
                        ) : (
                          <span className="text-muted-foreground">No</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {!studentFee && (
        <Alert>
          <AlertTitle>Fee data unavailable</AlertTitle>
          <AlertDescription>
            This student does not have fee records available from the API yet.
          </AlertDescription>
        </Alert>
      )}

      {studentFee && (
        <>
          {/* Fee Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Fee</CardDescription>
                <CardTitle className="text-2xl">{formatCurrency(studentFee.totalAmount)}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Academic Year 2024-25</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Net Payable</CardDescription>
                <CardTitle className="text-2xl">{formatCurrency(studentFee.netAmount)}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  After discount (-{formatCurrency(studentFee.discountAmount)})
                  {studentFee.fineAmount > 0 && ` + fine (+${formatCurrency(studentFee.fineAmount)})`}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Amount Paid</CardDescription>
                <CardTitle className="text-2xl text-success">{formatCurrency(studentFee.paidAmount)}</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={collectionProgress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">{collectionProgress.toFixed(0)}% collected</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Balance Due</CardDescription>
                <CardTitle className={`text-2xl ${studentFee.balance > 0 ? "text-destructive" : "text-success"}`}>
                  {formatCurrency(studentFee.balance)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={() => setPaymentDialogOpen(true)}
                  disabled={studentFee.balance <= 0}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
              </CardContent>
            </Card>
          </div>
          
          {/* Tabs */}
          <Tabs defaultValue="installments" className="space-y-4">
            <TabsList>
              <TabsTrigger value="installments">Installments</TabsTrigger>
              <TabsTrigger value="payments">Payment History</TabsTrigger>
              <TabsTrigger value="breakdown">Fee Breakdown</TabsTrigger>
              <TabsTrigger value="discounts">Discounts & Fines</TabsTrigger>
            </TabsList>
        
        {/* Installments Tab */}
        <TabsContent value="installments">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Installment Plan</CardTitle>
                  <CardDescription>Quarterly fee payment schedule</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Installment</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentFee.installments?.map((installment) => (
                    <TableRow key={installment.id}>
                      <TableCell className="font-medium">{installment.name}</TableCell>
                      <TableCell>{formatDate(installment.dueDate)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(installment.amount)}</TableCell>
                      <TableCell className="text-right text-success">{formatCurrency(installment.paidAmount)}</TableCell>
                      <TableCell className="text-right">
                        {installment.balance > 0 ? (
                          <span className="text-destructive">{formatCurrency(installment.balance)}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={installment.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        {installment.balance > 0 && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedInstallment(installment.id)
                              setPaymentAmount(installment.balance.toString())
                              setPaymentDialogOpen(true)
                            }}
                          >
                            Pay Now
                          </Button>
                        )}
                        {installment.status === "paid" && installment.paidDate && (
                          <span className="text-xs text-muted-foreground">
                            Paid on {formatDate(installment.paidDate)}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Payment History</CardTitle>
                  <CardDescription>All payments made by this student</CardDescription>
                </div>
                <Button size="sm" onClick={() => setPaymentDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {studentPayments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No payments recorded yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Installment</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentPayments.map((payment) => {
                      const installment = studentFee.installments?.find(i => i.id === payment.installmentId)
                      return (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">RCP{String(payment.id).padStart(4, "0")}</TableCell>
                          <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                          <TableCell>{installment?.name || "General"}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(payment.amountPaid)}</TableCell>
                          <TableCell>
                            <PaymentModeBadge mode={payment.mode} />
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {payment.transactionId || "-"}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={payment.status || "completed"} />
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Receipt className="h-4 w-4 mr-2" />
                                  Download Receipt
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Mail className="h-4 w-4 mr-2" />
                                  Email Receipt
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Fee Breakdown Tab */}
        <TabsContent value="breakdown">
          <Card>
            <CardHeader>
              <CardTitle>Fee Breakdown</CardTitle>
              <CardDescription>Component-wise fee structure</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Component</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feeBreakdown?.breakdown.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.component}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="border-t-2">
                      <TableCell className="font-semibold">Gross Total</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(feeBreakdown?.totalFee || 0)}
                      </TableCell>
                    </TableRow>
                    {(feeBreakdown?.discountAmount || 0) > 0 && (
                      <TableRow className="text-success">
                        <TableCell>Discount Applied</TableCell>
                        <TableCell className="text-right">
                          -{formatCurrency(feeBreakdown?.discountAmount || 0)}
                        </TableCell>
                      </TableRow>
                    )}
                    {(feeBreakdown?.fineAmount || 0) > 0 && (
                      <TableRow className="text-destructive">
                        <TableCell>Fine Applied</TableCell>
                        <TableCell className="text-right">
                          +{formatCurrency(feeBreakdown?.fineAmount || 0)}
                        </TableCell>
                      </TableRow>
                    )}
                    <TableRow className="bg-muted/50">
                      <TableCell className="font-bold">Net Payable</TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(feeBreakdown?.netAmount || 0)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Discounts & Fines Tab */}
        <TabsContent value="discounts">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Discounts */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Percent className="h-5 w-5 text-success" />
                      Discounts Applied
                    </CardTitle>
                    <CardDescription>Active discounts for this student</CardDescription>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setDiscountDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Discount
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {studentDiscountsList.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Percent className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No discounts applied</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {studentDiscountsList.map((sd) => (
                      <div key={sd.id} className="flex items-center justify-between p-3 rounded-lg border bg-success/5 border-success/20">
                        <div>
                          <p className="font-medium">{sd.discount?.name}</p>
                          <p className="text-sm text-muted-foreground">{sd.reason}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-success">
                            -{formatCurrency(sd.appliedAmount || 0)}
                          </p>
                          {sd.discount?.isPercentage && (
                            <p className="text-xs text-muted-foreground">
                              {sd.discount.amountOrPercentage}% off
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Fines */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      Fines Applied
                    </CardTitle>
                    <CardDescription>Penalties and late fees</CardDescription>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setFineDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Fine
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {studentFinesList.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No fines applied</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {studentFinesList.map((sf) => {
                      const installment = studentFee.installments?.find(i => i.id === sf.installmentId)
                      return (
                        <div key={sf.id} className="flex items-center justify-between p-3 rounded-lg border bg-destructive/5 border-destructive/20">
                          <div>
                            <p className="font-medium">{sf.fine?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {installment ? `For ${installment.name}` : "General"}
                              {sf.appliedDate && ` • Applied on ${formatDate(sf.appliedDate)}`}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-destructive">
                              +{formatCurrency(sf.fine?.amount || 0)}
                            </p>
                            <Badge variant={sf.isPaid ? "default" : "destructive"} className="text-xs">
                              {sf.isPaid ? "Paid" : "Unpaid"}
                            </Badge>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Record Payment
            </DialogTitle>
            <DialogDescription>
              Record a new payment for {student.firstName} {student.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
              <p className="text-xs text-muted-foreground">
                Balance due: {formatCurrency(studentFee.balance)}
              </p>
            </div>
            
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
            
            {selectedInstallment && (
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-sm font-medium">
                  Paying for: {studentFee.installments?.find(i => i.id === selectedInstallment)?.name}
                </p>
              </div>
            )}
            
            {parseFloat(paymentAmount) > studentFee.balance && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-sm font-medium text-primary flex items-center gap-2">
                  <IndianRupee className="h-4 w-4" />
                  Overpayment of {formatCurrency(parseFloat(paymentAmount) - studentFee.balance)} will be recorded
                </p>
              </div>
            )}
          </div>
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
      
      {/* Discount Dialog */}
      <Dialog open={discountDialogOpen} onOpenChange={setDiscountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Apply Discount
            </DialogTitle>
            <DialogDescription>
              Apply a discount to {student.firstName} {student.lastName}&apos;s fee
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Discount Type</Label>
              <Select value={selectedDiscountId} onValueChange={setSelectedDiscountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select discount type" />
                </SelectTrigger>
                <SelectContent>
                  {discounts.map((d) => (
                    <SelectItem key={d.id} value={d.id.toString()}>
                      {d.name} ({d.isPercentage ? `${d.amountOrPercentage}%` : formatCurrency(d.amountOrPercentage)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea
                placeholder="Enter reason for applying discount"
                value={discountReason}
                onChange={(e) => setDiscountReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDiscountDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDiscountSubmit}>
              Apply Discount
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Fine Dialog */}
      <Dialog open={fineDialogOpen} onOpenChange={setFineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Apply Fine
            </DialogTitle>
            <DialogDescription>
              Apply a fine to {student.firstName} {student.lastName}&apos;s account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Fine Type</Label>
              <Select value={selectedFineId} onValueChange={setSelectedFineId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select fine type" />
                </SelectTrigger>
                <SelectContent>
                  {fines.map((f) => (
                    <SelectItem key={f.id} value={f.id.toString()}>
                      {f.name} ({formatCurrency(f.amount)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Apply to Installment (Optional)</Label>
              <Select
                value={selectedFineInstallmentId ? selectedFineInstallmentId.toString() : "none"}
                onValueChange={(value) =>
                  setSelectedFineInstallmentId(value === "none" ? null : Number(value))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select installment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific installment</SelectItem>
                  {studentFee?.installments?.map((i) => (
                    <SelectItem key={i.id} value={i.id.toString()}>
                      {i.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFineDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleFineSubmit}>
              Apply Fine
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </>
      )}
    </div>
  )
}
