"use client"

import { useState, useMemo } from "react"
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
import { students, payments, monthlyCollections, classes, feeStructures } from "@/lib/data"
import { toast } from "sonner"

export default function ReportsPage() {
  const [classFilter, setClassFilter] = useState<string>("all")
  const [dateRange, setDateRange] = useState<string>("year")

  const filteredStudents = useMemo(() => {
    if (classFilter === "all") return students
    return students.filter((s) => s.class === classFilter)
  }, [classFilter])

  const reportStats = useMemo(() => {
    const totalCollected = filteredStudents.reduce((a, s) => a + s.paidAmount, 0)
    const totalPending = filteredStudents.reduce((a, s) => a + s.dueAmount, 0)
    const totalFees = filteredStudents.reduce((a, s) => a + s.totalFee, 0)
    const collectionRate = totalFees > 0 ? (totalCollected / totalFees) * 100 : 0

    return {
      totalCollected,
      totalPending,
      totalFees,
      collectionRate,
      studentCount: filteredStudents.length,
      paidCount: filteredStudents.filter((s) => s.feeStatus === "paid").length,
      pendingCount: filteredStudents.filter((s) => s.feeStatus === "pending").length,
      overdueCount: filteredStudents.filter((s) => s.feeStatus === "overdue").length,
    }
  }, [filteredStudents])

  const classwiseData = useMemo(() => {
    return feeStructures.map((fs) => {
      const classStudents = students.filter((s) => s.class.startsWith(fs.class.replace(" Grade", "")))
      const collected = classStudents.reduce((a, s) => a + s.paidAmount, 0)
      const pending = classStudents.reduce((a, s) => a + s.dueAmount, 0)
      return {
        class: fs.class,
        collected,
        pending,
        total: collected + pending,
      }
    })
  }, [])

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
                {classes.map((cls) => (
                  <SelectItem key={cls} value={cls}>
                    {cls}
                  </SelectItem>
                ))}
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
                  const collectionPercent = (student.paidAmount / student.totalFee) * 100
                  return (
                    <TableRow key={student.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell className="text-muted-foreground">{student.class}</TableCell>
                      <TableCell className="text-right">
                        ₹{student.totalFee.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="text-right text-success">
                        ₹{student.paidAmount.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="text-right text-destructive">
                        ₹{student.dueAmount.toLocaleString("en-IN")}
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
