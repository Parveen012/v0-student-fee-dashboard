"use client"

import { useState, useMemo } from "react"
import { Plus, Search, Filter, Download } from "lucide-react"
import { format } from "date-fns"
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
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { StatusBadge } from "@/components/status-badge"
import { payments, students } from "@/lib/data"
import { toast } from "sonner"

const paymentModeLabels = {
  upi: "UPI",
  cash: "Cash",
  card: "Card",
  bank_transfer: "Bank Transfer",
}

export default function PaymentsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [modeFilter, setModeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<string>("")
  const [paymentAmount, setPaymentAmount] = useState("")
  const [applyDiscount, setApplyDiscount] = useState(false)
  const [discountAmount, setDiscountAmount] = useState("")
  const [applyFine, setApplyFine] = useState(false)
  const [fineAmount, setFineAmount] = useState("")

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const matchesSearch =
        payment.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.id.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesMode = modeFilter === "all" || payment.mode === modeFilter
      const matchesStatus = statusFilter === "all" || payment.status === statusFilter

      return matchesSearch && matchesMode && matchesStatus
    })
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
                        <Badge variant="secondary" className="font-normal">
                          {paymentModeLabels[payment.mode]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(payment.date), "dd MMM yyyy")}
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
    </div>
  )
}
