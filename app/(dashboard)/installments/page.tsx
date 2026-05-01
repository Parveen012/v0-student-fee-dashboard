"use client"

import { useState, useMemo } from "react"
import { Search, ChevronDown, ChevronRight, Calendar, IndianRupee } from "lucide-react"
import { format } from "date-fns"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Progress } from "@/components/ui/progress"
import { StatusBadge } from "@/components/status-badge"
import { students, classes } from "@/lib/data"

export default function InstallmentsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [classFilter, setClassFilter] = useState<string>("all")
  const [expandedStudents, setExpandedStudents] = useState<string[]>([])

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.id.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesClass = classFilter === "all" || student.class === classFilter

      return matchesSearch && matchesClass
    })
  }, [searchQuery, classFilter])

  const toggleExpanded = (studentId: string) => {
    setExpandedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    )
  }

  const totalInstallments = students.reduce((a, s) => a + s.installments.length, 0)
  const paidInstallments = students.reduce(
    (a, s) => a + s.installments.filter((i) => i.status === "paid").length,
    0
  )
  const overdueInstallments = students.reduce(
    (a, s) => a + s.installments.filter((i) => i.status === "overdue").length,
    0
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Installments</h1>
        <p className="text-sm text-muted-foreground">
          View and manage student fee installment plans
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Installments</p>
            <p className="text-2xl font-semibold">{totalInstallments}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Paid Installments</p>
            <p className="text-2xl font-semibold text-success">{paidInstallments}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Overdue Installments</p>
            <p className="text-2xl font-semibold text-destructive">{overdueInstallments}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Search Students</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Class" />
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
          </div>
        </CardContent>
      </Card>

      {/* Student Installments */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Student Installment Plans</CardTitle>
          <CardDescription>
            {filteredStudents.length} student{filteredStudents.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredStudents.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              No students found matching your criteria.
            </div>
          ) : (
            filteredStudents.map((student) => {
              const isExpanded = expandedStudents.includes(student.id)
              const paidCount = student.installments.filter((i) => i.status === "paid").length
              const progress = (paidCount / student.installments.length) * 100

              return (
                <Collapsible
                  key={student.id}
                  open={isExpanded}
                  onOpenChange={() => toggleExpanded(student.id)}
                >
                  <div className="rounded-lg border border-border bg-card">
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="flex h-auto w-full items-center justify-between p-4 hover:bg-muted/50"
                      >
                        <div className="flex flex-1 items-center gap-4">
                          {isExpanded ? (
                            <ChevronDown className="size-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="size-4 text-muted-foreground" />
                          )}
                          <div className="flex flex-col items-start gap-1">
                            <span className="font-medium">{student.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {student.class} | {student.id}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="hidden flex-col items-end sm:flex">
                            <span className="text-sm font-medium">
                              {paidCount}/{student.installments.length} Paid
                            </span>
                            <Progress value={progress} className="mt-1 h-2 w-24" />
                          </div>
                          <StatusBadge status={student.feeStatus} />
                        </div>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="border-t border-border p-4">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          {student.installments.map((installment) => (
                            <div
                              key={installment.id}
                              className="rounded-lg border border-border bg-muted/30 p-4"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{installment.name}</span>
                                <StatusBadge status={installment.status} />
                              </div>
                              <div className="mt-3 space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <IndianRupee className="size-3.5" />
                                  <span>₹{installment.amount.toLocaleString("en-IN")}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Calendar className="size-3.5" />
                                  <span>Due: {format(new Date(installment.dueDate), "dd MMM yyyy")}</span>
                                </div>
                                {installment.paidDate && (
                                  <div className="flex items-center gap-2 text-success">
                                    <Calendar className="size-3.5" />
                                    <span>
                                      Paid: {format(new Date(installment.paidDate), "dd MMM yyyy")}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 flex items-center justify-between rounded-lg bg-muted/50 p-3 text-sm">
                          <span className="text-muted-foreground">Total Fee:</span>
                          <span className="font-semibold">
                            ₹{student.totalFee.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
