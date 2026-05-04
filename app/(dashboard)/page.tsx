"use client"

import { useEffect, useMemo, useState } from "react"
import { Users, IndianRupee, CheckCircle2, Clock } from "lucide-react"
import { StatCard } from "@/components/stat-card"
import { MonthlyCollectionChart, FeeStatusChart } from "@/components/dashboard-charts"
import { RecentTransactions, type RecentPayment } from "@/components/recent-transactions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { paymentsApi, studentFeesApi, studentsApi } from "@/lib/api"
import type { DashboardStats, MonthlyCollection, Payment, Student, StudentFee } from "@/lib/types"

export default function DashboardPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [studentFees, setStudentFees] = useState<StudentFee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setIsLoading(true)
    setError(null)

    Promise.all([
      studentsApi.getAll(),
      paymentsApi.getAll(),
      studentFeesApi.getAll().catch(() => []),
    ])
      .then(([studentsData, paymentsData, feesData]) => {
        if (!active) return
        setStudents(studentsData)
        setPayments(paymentsData)
        setStudentFees(
          feesData.length > 0
            ? feesData
            : studentsData.flatMap((student) => student.studentFees || [])
        )
      })
      .catch((err) => {
        if (!active) return
        setError(err instanceof Error ? err.message : "Failed to load dashboard data.")
      })
      .finally(() => {
        if (!active) return
        setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const stats = useMemo<DashboardStats>(() => {
    const collectedFromPayments = payments
      .filter((payment) => (payment.status || "completed") === "completed")
      .reduce((sum, payment) => sum + payment.amountPaid, 0)
    const pendingFromPayments = payments
      .filter((payment) => payment.status === "pending")
      .reduce((sum, payment) => sum + payment.amountPaid, 0)

    const totalFees =
      studentFees.length > 0
        ? studentFees.reduce((sum, fee) => sum + fee.totalAmount, 0)
        : collectedFromPayments + pendingFromPayments
    const collectedFees =
      studentFees.length > 0
        ? studentFees.reduce((sum, fee) => sum + fee.paidAmount, 0)
        : collectedFromPayments
    const pendingFees =
      studentFees.length > 0
        ? studentFees.reduce((sum, fee) => sum + fee.balance, 0)
        : pendingFromPayments

    const overdueAmount =
      studentFees.length > 0
        ? studentFees.reduce((sum, fee) => {
            const overdue = fee.installments?.filter((i) => i.status === "overdue") || []
            return sum + overdue.reduce((subSum, i) => subSum + i.balance, 0)
          }, 0)
        : 0

    const paidStudents =
      studentFees.length > 0
        ? studentFees.filter((fee) => fee.status === "paid" || fee.status === "overpaid").length
        : 0
    const pendingStudents =
      studentFees.length > 0 ? studentFees.filter((fee) => fee.status === "partial").length : 0
    const overdueStudents =
      studentFees.length > 0
        ? studentFees.filter((fee) => fee.installments?.some((i) => i.status === "overdue")).length
        : 0

    return {
      totalStudents: students.length,
      totalFees,
      collectedFees,
      pendingFees,
      overdueAmount,
      paidStudents,
      pendingStudents,
      overdueStudents,
    }
  }, [payments, studentFees, students.length])

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

  const recentPayments = useMemo<RecentPayment[]>(() => {
    const studentMap = new Map<number, Student>()
    students.forEach((student) => studentMap.set(student.id, student))

    return [...payments]
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
      .map((payment) => {
        const student = payment.student || studentMap.get(payment.studentId)
        const className = student?.class ? `${student.class.name}-${student.class.section}` : "N/A"
        return {
          id: payment.id,
          studentName: student ? `${student.firstName} ${student.lastName}` : `Student ${payment.studentId}`,
          className,
          amountPaid: payment.amountPaid,
          mode: payment.mode,
          paymentDate: payment.paymentDate,
          status: payment.status,
        }
      })
  }, [payments, students])

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Dashboard data unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {isLoading && !error && (
        <div className="text-sm text-muted-foreground">Loading dashboard data...</div>
      )}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your fee management system
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Students"
            value={stats.totalStudents}
            subtitle="Active enrollments"
            icon={Users}
            trend={{ value: 12, isPositive: true }}
            iconClassName="bg-primary/10 text-primary"
          />
          <StatCard
            title="Total Fees"
            value={`₹${(stats.totalFees / 100000).toFixed(1)}L`}
            subtitle="Annual fee collection"
            icon={IndianRupee}
            iconClassName="bg-chart-2/10 text-chart-2"
          />
          <StatCard
            title="Collected Fees"
            value={`₹${(stats.collectedFees / 100000).toFixed(1)}L`}
            subtitle={`${Math.round((stats.collectedFees / (stats.totalFees || 1)) * 100)}% of total`}
            icon={CheckCircle2}
            trend={{ value: 8, isPositive: true }}
            iconClassName="bg-success/10 text-success"
          />
          <StatCard
            title="Pending Fees"
            value={`₹${(stats.pendingFees / 100000).toFixed(1)}L`}
            subtitle={`${stats.pendingStudents + stats.overdueStudents} students pending`}
            icon={Clock}
            iconClassName="bg-warning/10 text-warning-foreground"
          />
        </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <MonthlyCollectionChart data={monthlyCollections} />
        <FeeStatusChart stats={stats} />
      </div>

      {/* Recent Transactions */}
      <RecentTransactions payments={recentPayments} />
    </div>
  )
}
