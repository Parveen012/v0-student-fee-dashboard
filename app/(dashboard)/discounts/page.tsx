"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Plus, Percent, Users, Award, Clock, Trash2 } from "lucide-react"
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { discountsApi, studentDiscountsApi, studentsApi } from "@/lib/api"
import type { Discount, Student, StudentDiscount } from "@/lib/types"
import { toast } from "sonner"

const discountTypeConfig = {
  sibling: { label: "Sibling Discount", icon: Users, color: "bg-chart-1/10 text-chart-1" },
  manual: { label: "Manual Discount", icon: Percent, color: "bg-chart-2/10 text-chart-2" },
  scholarship: { label: "Scholarship", icon: Award, color: "bg-chart-3/10 text-chart-3" },
  early_payment: { label: "Early Payment", icon: Clock, color: "bg-chart-4/10 text-chart-4" },
}

type DiscountCategory = keyof typeof discountTypeConfig

export default function DiscountsPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [studentDiscounts, setStudentDiscounts] = useState<StudentDiscount[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState("")
  const [selectedDiscountId, setSelectedDiscountId] = useState("")
  const [discountReason, setDiscountReason] = useState("")
  const [newDiscount, setNewDiscount] = useState({
    name: "",
    amountOrPercentage: "",
    isPercentage: false,
    discountType: "manual",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [studentsData, discountsData, studentDiscountsData] = await Promise.all([
        studentsApi.getAll(),
        discountsApi.getAll(),
        studentDiscountsApi.getAll(),
      ])
      const discountMap = new Map(discountsData.map((discount) => [discount.id, discount]))
      const studentMap = new Map(studentsData.map((student) => [student.id, student]))
      setStudents(studentsData)
      setDiscounts(discountsData)
      setStudentDiscounts(
        studentDiscountsData.map((sd) => ({
          ...sd,
          discount: sd.discount || discountMap.get(sd.discountId),
          student: sd.student || studentMap.get(sd.studentId),
        }))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load discounts.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Aggregate all discounts from students
  const allDiscounts = useMemo(() => {
    return studentDiscounts.map((sd) => {
      const discount = sd.discount
      const amount =
        sd.appliedAmount ??
        (discount?.isPercentage ? 0 : discount?.amountOrPercentage ?? 0)
      const name = discount?.name || "Discount"
      const studentName = sd.student
        ? `${sd.student.firstName} ${sd.student.lastName}`
        : `Student ${sd.studentId}`
      const studentClass = sd.student?.class
        ? `${sd.student.class.name}-${sd.student.class.section}`
        : "N/A"
      const type: DiscountCategory = (() => {
        if (discount?.discountType && (discount.discountType in discountTypeConfig)) {
          return discount.discountType as DiscountCategory
        }
        const normalized = name.toLowerCase()
        if (normalized.includes("sibling")) return "sibling"
        if (normalized.includes("scholar")) return "scholarship"
        if (normalized.includes("early")) return "early_payment"
        return "manual"
      })()

      return {
        ...sd,
        type,
        name,
        amount,
        percentage: discount?.isPercentage ? discount.amountOrPercentage : undefined,
        studentName,
        studentClass,
      }
    })
  }, [studentDiscounts])

  const totalDiscountAmount = allDiscounts.reduce((a, d) => a + d.amount, 0)
  const siblingDiscounts = allDiscounts.filter((d) => d.type === "sibling").length
  const scholarshipDiscounts = allDiscounts.filter((d) => d.type === "scholarship").length

  const handleAddDiscount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudentId || !selectedDiscountId) {
      toast.error("Please select a student and a discount.")
      return
    }

    try {
      await studentDiscountsApi.create({
        studentId: Number(selectedStudentId),
        discountId: Number(selectedDiscountId),
        reason: discountReason,
      })
      toast.success("Discount applied successfully", {
        description: "The discount has been added to the student account.",
      })
      setIsAddDialogOpen(false)
      setSelectedStudentId("")
      setSelectedDiscountId("")
      setDiscountReason("")
      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to apply discount.")
    }
  }

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = Number(newDiscount.amountOrPercentage)
    if (!newDiscount.name || !amount || amount <= 0) {
      toast.error("Please enter a valid discount name and amount.")
      return
    }

    try {
      await discountsApi.create({
        name: newDiscount.name,
        amountOrPercentage: amount,
        isPercentage: newDiscount.isPercentage,
        discountType: newDiscount.discountType,
      })
      toast.success("Discount type created")
      setIsCreateDialogOpen(false)
      setNewDiscount({ name: "", amountOrPercentage: "", isPercentage: false, discountType: "manual" })
      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create discount type.")
    }
  }

  const handleDeleteDiscount = async (discount: Discount) => {
    try {
      await discountsApi.delete(discount.id)
      toast.success("Discount type deleted")
      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete discount type.")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Discounts</h1>
          <p className="text-sm text-muted-foreground">
            Manage fee discounts and concessions
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 size-4" />
                Discount Type
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Discount Type</DialogTitle>
                <DialogDescription>Create a reusable discount definition.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateDiscount}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="discountName">Name</Label>
                    <Input
                      id="discountName"
                      value={newDiscount.name}
                      onChange={(e) => setNewDiscount((prev) => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="discountType">Type</Label>
                    <Select
                      value={newDiscount.discountType}
                      onValueChange={(value) => setNewDiscount((prev) => ({ ...prev, discountType: value }))}
                    >
                      <SelectTrigger id="discountType">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(discountTypeConfig).map(([key, cfg]) => (
                          <SelectItem key={key} value={key}>
                            {cfg.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="discountAmount">Amount or Percentage</Label>
                    <Input
                      id="discountAmount"
                      type="number"
                      value={newDiscount.amountOrPercentage}
                      onChange={(e) => setNewDiscount((prev) => ({ ...prev, amountOrPercentage: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="isPercentage">Percentage based</Label>
                    <Switch
                      id="isPercentage"
                      checked={newDiscount.isPercentage}
                      onCheckedChange={(value) => setNewDiscount((prev) => ({ ...prev, isPercentage: value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 size-4" />
                Apply Discount
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Apply Discount</DialogTitle>
              <DialogDescription>
                Apply a discount to a student&apos;s fee account.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddDiscount}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="student">Select Student</Label>
                  <Select
                    required
                    value={selectedStudentId}
                    onValueChange={setSelectedStudentId}
                  >
                    <SelectTrigger id="student">
                      <SelectValue placeholder="Choose a student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id.toString()}>
                          {student.firstName} {student.lastName} (
                          {student.class
                            ? `${student.class.name}-${student.class.section}`
                            : "Class N/A"}
                          )
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Discount</Label>
                  <Select
                    required
                    value={selectedDiscountId}
                    onValueChange={setSelectedDiscountId}
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select discount" />
                    </SelectTrigger>
                    <SelectContent>
                      {discounts.map((discount) => (
                        <SelectItem key={discount.id} value={discount.id.toString()}>
                          {discount.name} (
                          {discount.isPercentage
                            ? `${discount.amountOrPercentage}%`
                            : `₹${discount.amountOrPercentage}`}
                          )
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="reason">Reason/Note</Label>
                  <Input
                    id="reason"
                    placeholder="Enter reason for discount"
                    value={discountReason}
                    onChange={(e) => setDiscountReason(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Apply Discount</Button>
              </DialogFooter>
            </form>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Discount data unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {isLoading && !error && (
        <div className="text-sm text-muted-foreground">Loading discounts...</div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Percent className="size-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Discounts</p>
                <p className="text-xl font-semibold">{allDiscounts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-success/10 text-success">
                <Percent className="size-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-xl font-semibold">₹{totalDiscountAmount.toLocaleString("en-IN")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-chart-1/10 text-chart-1">
                <Users className="size-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sibling Discounts</p>
                <p className="text-xl font-semibold">{siblingDiscounts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-chart-3/10 text-chart-3">
                <Award className="size-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Scholarships</p>
                <p className="text-xl font-semibold">{scholarshipDiscounts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Discount Types Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(discountTypeConfig).map(([type, config]) => {
          const Icon = config.icon
          const count = allDiscounts.filter((d) => d.type === type).length
          const amount = allDiscounts
            .filter((d) => d.type === type)
            .reduce((a, d) => a + d.amount, 0)

          return (
            <Card key={type} className="border-border/50 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`flex size-10 items-center justify-center rounded-lg ${config.color}`}>
                    <Icon className="size-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{config.label}</p>
                    <p className="text-xs text-muted-foreground">{count} students</p>
                    <p className="mt-1 text-lg font-semibold">
                      ₹{amount.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Discounts Table */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Discount Types</CardTitle>
          <CardDescription>Reusable discount definitions from the Discounts API</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Name</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {discounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No discount types found.
                    </TableCell>
                  </TableRow>
                ) : (
                  discounts.map((discount) => (
                    <TableRow key={discount.id}>
                      <TableCell className="font-medium">{discount.name}</TableCell>
                      <TableCell>
                        {discount.isPercentage
                          ? `${discount.amountOrPercentage}%`
                          : `₹${discount.amountOrPercentage.toLocaleString("en-IN")}`}
                      </TableCell>
                      <TableCell>
                        {discount.discountType && discountTypeConfig[discount.discountType as keyof typeof discountTypeConfig]
                          ? discountTypeConfig[discount.discountType as keyof typeof discountTypeConfig].label
                          : discount.discountType || "N/A"}
                      </TableCell>
                      <TableCell>{discount.isPercentage ? "Percentage" : "Fixed"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteDiscount(discount)}>
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Applied Discounts</CardTitle>
          <CardDescription>
            List of all discounts applied to student accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-medium text-muted-foreground">Student</TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground">Class</TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground">Type</TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground">Discount Name</TableHead>
                  <TableHead className="text-right text-xs font-medium text-muted-foreground">
                    Amount
                  </TableHead>
                  <TableHead className="text-right text-xs font-medium text-muted-foreground">
                    Percentage
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allDiscounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      No discounts have been applied yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  allDiscounts.map((discount) => {
                    const typeConfig = discountTypeConfig[discount.type]
                    return (
                      <TableRow key={discount.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{discount.studentName}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {discount.studentClass}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={typeConfig.color}>
                            {typeConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>{discount.name}</TableCell>
                        <TableCell className="text-right font-medium text-success">
                          ₹{discount.amount.toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {discount.percentage ? `${discount.percentage}%` : "-"}
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
