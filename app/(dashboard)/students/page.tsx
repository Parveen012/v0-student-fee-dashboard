"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Eye, Filter, Mail, MoreHorizontal, Phone, Plus, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
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
import { StatusBadge } from "@/components/status-badge"
import { classesApi, studentsApi } from "@/lib/api"
import type { Class, CreateStudentCommand, Student, StudentFee } from "@/lib/types"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function StudentsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [classFilter, setClassFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load student data.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const rows = useMemo(() => {
    const classMap = new Map(classes.map((cls) => [cls.id, cls]))
    return students.map((student) => {
      const fee = student.studentFees?.[0]
      const classInfo = student.class || (student.classId ? classMap.get(student.classId) : undefined)
      return {
        student,
        fee,
        className: classInfo ? `${classInfo.name}-${classInfo.section}` : "N/A",
      }
    })
  }, [classes, students])

  const filteredRows = useMemo(() => {
    const query = searchQuery.toLowerCase()
    return rows.filter(({ student, fee, className }) => {
      const name = `${student.firstName} ${student.lastName}`.toLowerCase()
      const code = `STU${String(student.id).padStart(3, "0")}`.toLowerCase()
      const matchesSearch = name.includes(query) || code.includes(query)
      const matchesClass = classFilter === "all" || className === classFilter
      const matchesStatus = statusFilter === "all" || (fee?.status || "unpaid") === statusFilter
      return matchesSearch && matchesClass && matchesStatus
    })
  }, [classFilter, rows, searchQuery, statusFilter])

  const allFees = useMemo(
    () => students.flatMap((student) => student.studentFees || []),
    [students]
  )

  const stats = {
    total: students.length,
    paid: allFees.filter((fee) => fee.status === "paid").length,
    partial: allFees.filter((fee) => fee.status === "partial").length,
    overdue: allFees.flatMap((fee) => fee.installments || []).filter((item) => item.status === "overdue").length,
  }

  const handleAddStudent = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!newStudent.firstName || !newStudent.lastName || !newStudent.classId || !newStudent.gender) {
      toast.error("Please fill all required student fields.")
      return
    }

    const payload: CreateStudentCommand = {
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
      toast.success("Student added successfully")
      setIsAddDialogOpen(false)
      setNewStudent({ firstName: "", lastName: "", classId: "", gender: "", dob: "", admissionDate: "" })
      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add student.")
    }
  }

  const handleDeleteStudent = async (student: Student) => {
    try {
      await studentsApi.delete(student.id)
      toast.success("Student deleted")
      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete student.")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Students</h1>
          <p className="text-sm text-muted-foreground">Manage student records and fee information</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 size-4" />Add Student</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
              <DialogDescription>Enter the student details to add them to the system.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddStudent}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" value={newStudent.firstName} onChange={(e) => setNewStudent((prev) => ({ ...prev, firstName: e.target.value }))} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" value={newStudent.lastName} onChange={(e) => setNewStudent((prev) => ({ ...prev, lastName: e.target.value }))} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Class</Label>
                    <Select value={newStudent.classId} onValueChange={(value) => setNewStudent((prev) => ({ ...prev, classId: value }))} required>
                      <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                      <SelectContent>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id.toString()}>{cls.name}-{cls.section}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Gender</Label>
                    <Select value={newStudent.gender} onValueChange={(value) => setNewStudent((prev) => ({ ...prev, gender: value }))} required>
                      <SelectTrigger><SelectValue placeholder="Gender" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Input type="date" value={newStudent.dob} onChange={(e) => setNewStudent((prev) => ({ ...prev, dob: e.target.value }))} required />
                <Input type="date" value={newStudent.admissionDate} onChange={(e) => setNewStudent((prev) => ({ ...prev, admissionDate: e.target.value }))} required />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Add Student</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && <Alert variant="destructive"><AlertTitle>Student data unavailable</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      {isLoading && !error && <div className="text-sm text-muted-foreground">Loading students...</div>}

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardDescription>Total Students</CardDescription><CardTitle className="text-3xl">{stats.total}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Fully Paid</CardDescription><CardTitle className="text-3xl text-success">{stats.paid}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Partial Payment</CardDescription><CardTitle className="text-3xl text-warning-foreground">{stats.partial}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Overdue Installments</CardDescription><CardTitle className="text-3xl text-destructive">{stats.overdue}</CardTitle></CardHeader></Card>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4"><CardTitle className="text-base font-semibold">Filters</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by name or ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-full sm:w-44"><Filter className="mr-2 size-4" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((cls) => <SelectItem key={cls.id} value={`${cls.name}-${cls.section}`}>{cls.name}-{cls.section}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
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

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Student Records</CardTitle>
          <CardDescription>{filteredRows.length} student{filteredRows.length !== 1 ? "s" : ""} found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total Fee</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Due</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="h-32 text-center text-muted-foreground">No students found.</TableCell></TableRow>
                ) : (
                  filteredRows.map(({ student, fee, className }) => {
                    const progress = fee && fee.netAmount > 0 ? (fee.paidAmount / fee.netAmount) * 100 : 0
                    return (
                      <TableRow key={student.id}>
                        <TableCell>
                          <Link href={`/students/${student.id}`} className="block hover:underline">
                            <span className="font-medium">{student.firstName} {student.lastName}</span>
                            <span className="block text-xs text-muted-foreground">STU{String(student.id).padStart(3, "0")}</span>
                          </Link>
                        </TableCell>
                        <TableCell>{className}</TableCell>
                        <TableCell><StatusBadge status={fee?.status || "unpaid"} /></TableCell>
                        <TableCell className="text-right">{formatCurrency(fee?.netAmount || 0)}</TableCell>
                        <TableCell className="text-right text-success">{formatCurrency(fee?.paidAmount || 0)}</TableCell>
                        <TableCell className="text-right text-destructive">{fee?.balance ? formatCurrency(fee.balance) : "-"}</TableCell>
                        <TableCell><Progress value={progress} className="h-2 w-24" /></TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-8"><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild><Link href={`/students/${student.id}`}><Eye className="mr-2 size-4" />View Details</Link></DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast.info("Reminder action is ready for backend messaging.")}><Mail className="mr-2 size-4" />Send Reminder</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast.info(student.parent?.phone || "No parent phone available.")}><Phone className="mr-2 size-4" />Call Parent</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteStudent(student)}><Trash2 className="mr-2 size-4" />Delete Student</DropdownMenuItem>
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
