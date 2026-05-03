"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Download, FileSpreadsheet, Filter, TrendingUp, TrendingDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { classesApi, paymentsApi, studentsApi } from "@/lib/api"
import type { Class, MonthlyCollection, Payment, Student, StudentFee } from "@/lib/types"
import { toast } from "sonner"

export default function ReportsPage() {
  const [classFilter, setClassFilter] = useState<string>("all")
  const [dateRange, setDateRange] = useState<string>("year")
  const [students, setStudents] = useState<Student[]>([])
  const [studentFees, setStudentFees] = useState<StudentFee[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [studentsData, paymentsData, classesData] = await Promise.all([
        studentsApi.getAll(),
        paymentsApi.getAll(),
        classesApi.getAll(),
      ])
      setStudents(studentsData)
      setStudentFees(studentsData.flatMap((student) => student.studentFees || []))
      setPayments(paymentsData)
      setClasses(classesData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredStudents = useMemo(() => {
    if (classFilter === "all") return students
    const classMap = new Map(classes.map((cls) => [cls.id, cls]))
    return students.filter((s) => {
      const classInfo = s.class || (s.classId ? classMap.get(s.classId) : undefined)
      const className = classInfo ? `${classInfo.name}-${classInfo.section}` : "N/A"
      return className === classFilter
    })
  }, [classFilter, classes, students])

  const reportStats = useMemo(() => {
    const feeRecords = studentFees.filter((fee) =>
      filteredStudents.some((student) => student.id === fee.studentId)
    )
    const totalCollected =
      feeRecords.length > 0
        ? feeRecords.reduce((sum, fee) => sum + fee.paidAmount, 0)
        : payments
            .filter((payment) => payment.status === "completed")
            .reduce((sum, payment) => sum + payment.amountPaid, 0)
    const totalPending =
      feeRecords.length > 0
        ? feeRecords.reduce((sum, fee) => sum + fee.balance, 0)
        : payments
            .filter((payment) => payment.status === "pending")
            .reduce((sum, payment) => sum + payment.amountPaid, 0)
    const totalFees =
      feeRecords.length > 0 ? feeRecords.reduce((sum, fee) => sum + fee.totalAmount, 0) : 0
    const collectionRate = totalFees > 0 ? (totalCollected / totalFees) * 100 : 0

    return {
      totalCollected,
      totalPending,
      totalFees,
      collectionRate,
      studentCount: filteredStudents.length,
      paidCount: feeRecords.filter((f) => f.status === "paid" || f.status === "overpaid").length,
      pendingCount: feeRecords.filter((f) => f.status === "partial").length,
      overdueCount: feeRecords.filter((f) => f.installments?.some((i) => i.status === "overdue")).length,
    }
  }, [filteredStudents, payments, studentFees])

  const classwiseData = useMemo(() => {
    return classes.map((cls) => {
      const classStudents = students.filter((student) => student.classId === cls.id)
      const classFees = studentFees.filter((fee) =>
        classStudents.some((student) => student.id === fee.studentId)
      )
      const collected = classFees.reduce((sum, fee) => sum + fee.paidAmount, 0)
      const pending = classFees.reduce((sum, fee) => sum + fee.balance, 0)
      return {
        class: `${cls.name}-${cls.section}`,
        collected,
        pending,
        total: collected + pending,
      }
    })
  }, [classes, studentFees, students])

  const monthlyCollections = useMemo<MonthlyCollection[]>(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const monthMap = new Map<string, { year: number; month: number; collected: number; pending: number }>()

    payments.forEach((payment) => {
      const date = new Date(payment.paymentDate)
      if (Number.isNaN(date.getTime())) return
      const key = `${date.getFullYear()}-${date.getMonth()}`
      const existing = monthMap.get(key) || {
        year: date.getFullYear(),
        month: date.getMonth(),
        collected: 0,
        pending: 0,
      }
      if (payment.status === "pending") {
        existing.pending += payment.amountPaid
      } else {
        existing.collected += payment.amountPaid
      }
      monthMap.set(key, existing)
    })

    return Array.from(monthMap.values())
      .sort((a, b) => (a.year === b.year ? a.month - b.month : a.year - b.year))
      .map((item) => ({
        month: monthNames[item.month],
        collected: item.collected,
        pending: item.pending,
      }))
  }, [payments])

  const handleExport = () => {
    toast.success("Report exported", {
      description: "Your report has been downloaded as an Excel file.",
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Generate and view fee collection reports
          </p>
        </div>
        <Button onClick={handleExport}>
          <Download className="mr-2 size-4" />
          Export Report
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Report data unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {isLoading && !error && (
        <div className="text-sm text-muted-foreground">Loading reports...</div>
      )}

      {/* Filters */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Report Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="mr-2 size-4" />
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((cls) => {
                  const className = `${cls.name}-${cls.section}`
                  return (
                    <SelectItem key={cls.id} value={className}>
                      {className}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Collected</p>
                <p className="text-2xl font-semibold text-success">
                  ₹{(reportStats.totalCollected / 100000).toFixed(2)}L
                </p>
              </div>
              <TrendingUp className="size-8 text-success/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Amount</p>
                <p className="text-2xl font-semibold text-destructive">
                  ₹{(reportStats.totalPending / 100000).toFixed(2)}L
                </p>
              </div>
              <TrendingDown className="size-8 text-destructive/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Collection Rate</p>
            <p className="text-2xl font-semibold">{reportStats.collectionRate.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Students</p>
            <p className="text-2xl font-semibold">{reportStats.studentCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Monthly Collection Trend</CardTitle>
            <CardDescription>Fee collection over the academic year</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyCollections}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, ""]}
                  />
                  <Line
                    type="monotone"
                    dataKey="collected"
                    name="Collected"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--chart-1))", strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Class-wise Collection</CardTitle>
            <CardDescription>Fee collection breakdown by class</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classwiseData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    tickLine={false}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                  />
                  <YAxis
                    type="category"
                    dataKey="class"
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, ""]}
                  />
                  <Bar
                    dataKey="collected"
                    name="Collected"
                    fill="hsl(var(--success))"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={30}
                  />
                  <Bar
                    dataKey="pending"
                    name="Pending"
                    fill="hsl(var(--destructive))"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={30}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Report Table */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Detailed Report</CardTitle>
            <CardDescription>Student-wise fee status breakdown</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <FileSpreadsheet className="mr-2 size-4" />
            Export to Excel
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-medium text-muted-foreground">Student</TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground">Class</TableHead>
                  <TableHead className="text-right text-xs font-medium text-muted-foreground">
                    Total Fee
                  </TableHead>
                  <TableHead className="text-right text-xs font-medium text-muted-foreground">
                    Collected
                  </TableHead>
                  <TableHead className="text-right text-xs font-medium text-muted-foreground">
                    Pending
                  </TableHead>
                  <TableHead className="text-right text-xs font-medium text-muted-foreground">
                    Collection %
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => {
                  const fee = studentFees.find((sf) => sf.studentId === student.id)
                  const totalFee = fee?.totalAmount || 0
                  const collected = fee?.paidAmount || 0
                  const pending = fee?.balance || 0
                  const collectionPercent = totalFee > 0 ? (collected / totalFee) * 100 : 0
                  const classInfo =
                    student.class || (student.classId ? classes.find((cls) => cls.id === student.classId) : undefined)
                  const className = classInfo ? `${classInfo.name}-${classInfo.section}` : "N/A"
                  return (
                    <TableRow key={student.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        {student.firstName} {student.lastName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{className}</TableCell>
                      <TableCell className="text-right">
                        ₹{totalFee.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="text-right text-success">
                        ₹{collected.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="text-right text-destructive">
                        ₹{pending.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {collectionPercent.toFixed(0)}%
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
