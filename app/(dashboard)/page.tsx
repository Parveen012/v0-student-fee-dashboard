import { Users, IndianRupee, CheckCircle2, Clock } from "lucide-react"
import { StatCard } from "@/components/stat-card"
import { MonthlyCollectionChart, FeeStatusChart } from "@/components/dashboard-charts"
import { RecentTransactions } from "@/components/recent-transactions"
import { dashboardStats } from "@/lib/data"

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
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
          value={dashboardStats.totalStudents}
          subtitle="Active enrollments"
          icon={Users}
          trend={{ value: 12, isPositive: true }}
          iconClassName="bg-primary/10 text-primary"
        />
        <StatCard
          title="Total Fees"
          value={`₹${(dashboardStats.totalFees / 100000).toFixed(1)}L`}
          subtitle="Annual fee collection"
          icon={IndianRupee}
          iconClassName="bg-chart-2/10 text-chart-2"
        />
        <StatCard
          title="Collected Fees"
          value={`₹${(dashboardStats.collectedFees / 100000).toFixed(1)}L`}
          subtitle={`${Math.round((dashboardStats.collectedFees / dashboardStats.totalFees) * 100)}% of total`}
          icon={CheckCircle2}
          trend={{ value: 8, isPositive: true }}
          iconClassName="bg-success/10 text-success"
        />
        <StatCard
          title="Pending Fees"
          value={`₹${(dashboardStats.pendingFees / 100000).toFixed(1)}L`}
          subtitle={`${dashboardStats.pendingStudents + dashboardStats.overdueStudents} students pending`}
          icon={Clock}
          iconClassName="bg-warning/10 text-warning-foreground"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <MonthlyCollectionChart />
        <FeeStatusChart />
      </div>

      {/* Recent Transactions */}
      <RecentTransactions />
    </div>
  )
}
