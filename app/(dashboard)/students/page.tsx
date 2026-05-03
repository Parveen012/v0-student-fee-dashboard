"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Plus, Search, Filter, MoreHorizontal, Mail, Phone, Eye, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"
import { classesApi, studentsApi } from "@/lib/api"
import type { Class, CreateStudentCommand, Student, StudentFee } from "@/lib/types"

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    paid: "bg-success/10 text-success border-success/20",
    partial: "bg-warning/10 text-warning-foreground border-warning/20",
    unpaid: "bg-muted text-muted-foreground border-muted",
    overdue: "bg-destructive/10 text-destructive border-destructive/20",
    overpaid: "bg-primary/10 text-primary border-primary/20",
  }
  
  return (
    <Badge variant="outline" className={variants[status] || variants.unpaid}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
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

export default function StudentsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [classFilter, setClassFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [studentFees, setStudentFees] = useState<StudentFee[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newStudent, setNewStudent] = useState({
    firstName: "",
    lastName: "",
    classId: "",
    gender: "",
    dob: "",
    admissionDate: "",
  })

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [studentsData, classesData] = await Promise.all([
        studentsApi.getAll(),
        classesApi.getAll(),
      ])
      setStudents(studentsData)
      setClasses(classesData)
      setStudentFees(studentsData.flatMap((student) => student.studentFees || []))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load student data.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const tenantId = useMemo(() => {
    const envTenant = process.env.NEXT_PUBLIC_TENANT_ID
    if (envTenant && !Number.isNaN(Number(envTenant))) return Number(envTenant)
    return students[0]?.tenantId ?? 1
  }, [students])

  // Combine student data with fees
  const studentsWithFees = useMemo(() => {
    const classMap = new Map(classes.map((cls) => [cls.id, cls]))
    return students.map((student) => {
      const fee = studentFees.find((sf) => sf.studentId === student.id)
      const classInfo = student.class || (student.classId ? classMap.get(student.classId) : undefined)
      return {
        ...student,
        fee,
        className: classInfo ? `${classInfo.name}-${classInfo.section}` : "N/A",
      }
    })
  }, [classes, studentFees, students])

  // Get unique class names for filter
  const classNames = useMemo(() => {
    const names = new Set(classes.map((c) => `${c.name}-${c.section}`))
    return Array.from(names).sort()
  }, [classes])

  const filteredStudents = useMemo(() => {
    return studentsWithFees.filter((student) => {
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase()
      const matchesSearch =
        fullName.includes(searchQuery.toLowerCase()) ||
        student.id.toString().includes(searchQuery) ||
        `STU${String(student.id).padStart(3, "0")}`.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesClass = classFilter === "all" || student.className === classFilter
      const matchesStatus = statusFilter === "all" || student.fee?.status === statusFilter

      return matchesSearch && matchesClass && matchesStatus
    })
  }, [studentsWithFees, searchQuery, classFilter, statusFilter])

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newStudent.firstName || !newStudent.lastName || !newStudent.classId || !newStudent.gender) {
      toast.error("Please fill all required student fields.")
      return
    }

    const payload: CreateStudentCommand = {
      tenantId,
      firstName: newStudent.firstName,
      lastName: newStudent.lastName,
      dob: newStudent.dob ? new Date(newStudent.dob).toISOString() : null,
      gender: newStudent.gender,
      classId: Number(newStudent.classId),
      admissionDate: newStudent.admissionDate
        ? new Date(newStudent.admissionDate).toISOString()
        : new Date().toISOString(),
      status: "active",
    }

    try {
      await studentsApi.create(payload)
      toast.success("Student added successfully", {
        description: "The new student has been added to the system.",
      })
      setIsAddDialogOpen(false)
      setNewStudent({
        firstName: "",
        lastName: "",
        classId: "",
        gender: "",
        dob: "",
        admissionDate: "",
      })
      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add student.")
    }
  }

  // Summary stats
  const stats = useMemo(() => {
    const total = studentsWithFees.length
    const paid = studentsWithFees.filter(s => s.fee?.status === "paid" || s.fee?.status === "overpaid").length
    const partial = studentsWithFees.filter(s => s.fee?.status === "partial").length
    const overdue = studentsWithFees.filter(s => 
      s.fee?.installments?.some(i => i.status === "overdue")
    ).length
    return { total, paid, partial, overdue }
  }, [studentsWithFees])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Students</h1>
          <p className="text-sm text-muted-foreground">
            Manage student records and fee information
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 size-4" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
              <DialogDescription>
                Enter the student details to add them to the system.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddStudent}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="First name"
                      required
                      value={newStudent.firstName}
                      onChange={(e) =>
                        setNewStudent((prev) => ({ ...prev, firstName: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Last name"
                      required
                      value={newStudent.lastName}
                      onChange={(e) =>
                        setNewStudent((prev) => ({ ...prev, lastName: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="class">Class</Label>
                    <Select
                      required
                      value={newStudent.classId}
                      onValueChange={(value) =>
                        setNewStudent((prev) => ({ ...prev, classId: value }))
                      }
                    >
                      <SelectTrigger id="class">
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id.toString()}>
                            {cls.name}-{cls.section}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      required
                      value={newStudent.gender}
                      onValueChange={(value) =>
                        setNewStudent((prev) => ({ ...prev, gender: value }))
                      }
                    >
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    required
                    value={newStudent.dob}
                    onChange={(e) => setNewStudent((prev) => ({ ...prev, dob: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="admissionDate">Admission Date</Label>
                  <Input
                    id="admissionDate"
                    type="date"
                    required
                    value={newStudent.admissionDate}
                    onChange={(e) =>
                      setNewStudent((prev) => ({ ...prev, admissionDate: e.target.value }))
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Student</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Student data unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {isLoading && !error && (
        <div className="text-sm text-muted-foreground">Loading students...</div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Students</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Fully Paid</CardDescription>
            <CardTitle className="text-3xl text-success">{stats.paid}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Partial Payment</CardDescription>
            <CardTitle className="text-3xl text-warning-foreground">{stats.partial}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overdue</CardDescription>
            <CardTitle className="text-3xl text-destructive">{stats.overdue}</CardTitle>
          </CardHeader>
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
                placeholder="Search by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <Filter className="mr-2 size-4" />
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classNames.map((cls) => (
                  <SelectItem key={cls} value={cls}>
                    {cls}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="overpaid">Overpaid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Student Records</CardTitle>
          <CardDescription>
            {filteredStudents.length} student{filteredStudents.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-medium text-muted-foreground">Student</TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground">Class</TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground">Status</TableHead>
                  <TableHead className="text-right text-xs font-medium text-muted-foreground">
                    Total Fee
                  </TableHead>
                  <TableHead className="text-right text-xs font-medium text-muted-foreground">
                    Paid
                  </TableHead>
                  <TableHead className="text-right text-xs font-medium text-muted-foreground">
                    Balance
                  </TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground">Progress</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      No students found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => {
                    const progress =
                      student.fee && student.fee.netAmount > 0
                        ? (student.fee.paidAmount / student.fee.netAmount) * 100
                        : 0
                    return (
                      <TableRow key={student.id} className="hover:bg-muted/50">
                        <TableCell>
                          <Link href={`/students/${student.id}`} className="block hover:underline">
                            <div className="flex flex-col">
                              <span className="font-medium">{student.firstName} {student.lastName}</span>
                              <span className="text-xs text-muted-foreground">
                                STU{String(student.id).padStart(3, "0")}
                              </span>
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{student.className}</TableCell>
                        <TableCell>
                          <StatusBadge status={student.fee?.status || "unpaid"} />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(student.fee?.netAmount || 0)}
                        </TableCell>
                        <TableCell className="text-right text-success">
                          {formatCurrency(student.fee?.paidAmount || 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          {(student.fee?.balance || 0) > 0 ? (
                            <span className="text-destructive">
                              {formatCurrency(student.fee?.balance || 0)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={progress} className="h-2 w-20" />
                            <span className="text-xs text-muted-foreground w-10">
                              {progress.toFixed(0)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8">
                                <MoreHorizontal className="size-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link href={`/students/${student.id}`}>
                                  <Eye className="mr-2 size-4" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 size-4" />
                                Edit Student
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Mail className="mr-2 size-4" />
                                Send Reminder
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Phone className="mr-2 size-4" />
                                Call Parent
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="mr-2 size-4" />
                                Delete Student
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
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
