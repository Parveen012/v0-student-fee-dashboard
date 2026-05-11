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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { discountTypesApi, discountPoliciesApi, studentDiscountsApi, studentsApi } from "@/lib/api"
import type { DiscountType, DiscountPolicy, Student, StudentDiscount } from "@/lib/types"
import { toast } from "sonner"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function DiscountsPage() {
  const [isCreateTypeDialogOpen, setIsCreateTypeDialogOpen] = useState(false)
  const [isCreatePolicyDialogOpen, setIsCreatePolicyDialogOpen] = useState(false)
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false)
  
  const [students, setStudents] = useState<Student[]>([])
  const [discountTypes, setDiscountTypes] = useState<DiscountType[]>([])
  const [discountPolicies, setDiscountPolicies] = useState<DiscountPolicy[]>([])
  const [studentDiscounts, setStudentDiscounts] = useState<StudentDiscount[]>([])
  
  const [selectedStudentId, setSelectedStudentId] = useState("")
  const [selectedPolicyId, setSelectedPolicyId] = useState("")
  const [discountReason, setDiscountReason] = useState("")
  const [approvedBy, setApprovedBy] = useState("")
  
  const [newType, setNewType] = useState({
    name: "",
    isAutoApply: false,
    description: "",
  })
  
  const [newPolicy, setNewPolicy] = useState({
    discountTypeId: "",
    amount: "",
    percentage: "",
    isPercentage: false,
    startDate: "",
    endDate: "",
  })
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [studentsData, typesData, policiesData, studentDiscountsData] = await Promise.all([
        studentsApi.getAll(),
        discountTypesApi.getAll(),
        discountPoliciesApi.getAll(),
        studentDiscountsApi.getAll(),
      ])
      const typeMap = new Map(typesData.map((type) => [type.id, type]))
      const policyMap = new Map(policiesData.map((policy) => [policy.id, policy]))
      const studentMap = new Map(studentsData.map((student) => [student.id, student]))
      
      setStudents(studentsData)
      setDiscountTypes(typesData)
      setDiscountPolicies(policiesData)
      setStudentDiscounts(
        studentDiscountsData.map((sd) => ({
          ...sd,
          discountPolicy: sd.discountPolicy || policyMap.get(sd.discountPolicyId),
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

  const stats = useMemo(() => {
    return {
      totalPolicies: discountPolicies.length,
      totalTypes: discountTypes.length,
      appliedDiscounts: studentDiscounts.length,
      totalAmount: studentDiscounts.reduce((sum, sd) => {
        const policy = sd.discountPolicy
        if (!policy) return sum
        const amount = policy.isPercentage ? (policy.percentage || 0) : (policy.amount || 0)
        return sum + amount
      }, 0),
    }
  }, [discountPolicies, discountTypes, studentDiscounts])
  const handleCreateType = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newType.name) {
      toast.error("Please enter a discount type name.")
      return
    }

    try {
      await discountTypesApi.create({
        name: newType.name,
        isAutoApply: newType.isAutoApply,
        description: newType.description,
      })
      toast.success("Discount type created")
      setIsCreateTypeDialogOpen(false)
      setNewType({ name: "", isAutoApply: false, description: "" })
      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create discount type.")
    }
  }

  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPolicy.discountTypeId || !newPolicy.startDate || !newPolicy.endDate) {
      toast.error("Please fill in all required fields.")
      return
    }
    
    const amount = newPolicy.amount ? Number(newPolicy.amount) : undefined
    const percentage = newPolicy.percentage ? Number(newPolicy.percentage) : undefined
    
    if (!amount && !percentage) {
      toast.error("Please enter either amount or percentage.")
      return
    }

    try {
      await discountPoliciesApi.create({
        discountTypeId: Number(newPolicy.discountTypeId),
        amount,
        percentage,
        isPercentage: newPolicy.isPercentage,
        startDate: new Date(newPolicy.startDate).toISOString(),
        endDate: new Date(newPolicy.endDate).toISOString(),
      })
      toast.success("Discount policy created")
      setIsCreatePolicyDialogOpen(false)
      setNewPolicy({ discountTypeId: "", amount: "", percentage: "", isPercentage: false, startDate: "", endDate: "" })
      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create discount policy.")
    }
  }

  const handleApplyDiscount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudentId || !selectedPolicyId) {
      toast.error("Please select a student and discount policy.")
      return
    }

    try {
      await studentDiscountsApi.create({
        studentId: Number(selectedStudentId),
        discountPolicyId: Number(selectedPolicyId),
        approvedBy: approvedBy ? Number(approvedBy) : undefined,
        reason: discountReason,
      })
      toast.success("Discount applied successfully")
      setIsApplyDialogOpen(false)
      setSelectedStudentId("")
      setSelectedPolicyId("")
      setDiscountReason("")
      setApprovedBy("")
      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to apply discount.")
    }
  }

  const handleDeleteType = async (type: DiscountType) => {
    try {
      await discountTypesApi.delete(type.id)
      toast.success("Discount type deleted")
      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete discount type.")
    }
  }

  const handleDeletePolicy = async (policy: DiscountPolicy) => {
    try {
      await discountPoliciesApi.delete(policy.id)
      toast.success("Discount policy deleted")
      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete discount policy.")
    }
  }

  const handleDeleteStudentDiscount = async (discount: StudentDiscount) => {
    try {
      await studentDiscountsApi.delete(discount.id)
      toast.success("Student discount removed")
      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove discount.")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Discounts</h1>
          <p className="text-sm text-muted-foreground">
            Manage discount types, policies, and student applications
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateTypeDialogOpen} onOpenChange={setIsCreateTypeDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 size-4" />
                Discount Type
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Discount Type</DialogTitle>
                <DialogDescription>Create a new discount category.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateType}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="typeName">Name</Label>
                    <Input
                      id="typeName"
                      value={newType.name}
                      onChange={(e) => setNewType((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Sibling Discount"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="typeDescription">Description</Label>
                    <Input
                      id="typeDescription"
                      value={newType.description}
                      onChange={(e) => setNewType((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Optional description"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="autoApply">Auto Apply</Label>
                    <Switch
                      id="autoApply"
                      checked={newType.isAutoApply}
                      onCheckedChange={(value) => setNewType((prev) => ({ ...prev, isAutoApply: value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateTypeDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreatePolicyDialogOpen} onOpenChange={setIsCreatePolicyDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 size-4" />
                Discount Policy
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Discount Policy</DialogTitle>
                <DialogDescription>Create a discount policy with dates and amounts.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreatePolicy}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="policyType">Discount Type</Label>
                    <Select value={newPolicy.discountTypeId} onValueChange={(value) => setNewPolicy((prev) => ({ ...prev, discountTypeId: value }))}>
                      <SelectTrigger id="policyType">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {discountTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="policyAmount">Amount</Label>
                    <Input
                      id="policyAmount"
                      type="number"
                      value={newPolicy.amount}
                      onChange={(e) => setNewPolicy((prev) => ({ ...prev, amount: e.target.value }))}
                      placeholder="0"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="policyPercentage">Percentage</Label>
                    <Input
                      id="policyPercentage"
                      type="number"
                      value={newPolicy.percentage}
                      onChange={(e) => setNewPolicy((prev) => ({ ...prev, percentage: e.target.value }))}
                      placeholder="0"
                      step="0.01"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="isPercentage">Percentage Based</Label>
                    <Switch
                      id="isPercentage"
                      checked={newPolicy.isPercentage}
                      onCheckedChange={(value) => setNewPolicy((prev) => ({ ...prev, isPercentage: value }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={newPolicy.startDate}
                        onChange={(e) => setNewPolicy((prev) => ({ ...prev, startDate: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={newPolicy.endDate}
                        onChange={(e) => setNewPolicy((prev) => ({ ...prev, endDate: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreatePolicyDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 size-4" />
                Apply Discount
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Apply Discount</DialogTitle>
                <DialogDescription>Apply a discount policy to a student.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleApplyDiscount}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="student">Student</Label>
                    <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                      <SelectTrigger id="student">
                        <SelectValue placeholder="Choose a student" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id.toString()}>
                            {student.firstName} {student.lastName} ({student.class?.name}-{student.class?.section})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="policy">Discount Policy</Label>
                    <Select value={selectedPolicyId} onValueChange={setSelectedPolicyId}>
                      <SelectTrigger id="policy">
                        <SelectValue placeholder="Select policy" />
                      </SelectTrigger>
                      <SelectContent>
                        {discountPolicies.map((policy) => {
                          const type = discountTypes.find((t) => t.id === policy.discountTypeId)
                          const value = policy.isPercentage ? `${policy.percentage}%` : formatCurrency(policy.amount || 0)
                          return (
                            <SelectItem key={policy.id} value={policy.id.toString()}>
                              {type?.name} - {value}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="reason">Reason</Label>
                    <Input
                      id="reason"
                      value={discountReason}
                      onChange={(e) => setDiscountReason(e.target.value)}
                      placeholder="Reason for discount"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="approved">Approved By (ID)</Label>
                    <Input
                      id="approved"
                      type="number"
                      value={approvedBy}
                      onChange={(e) => setApprovedBy(e.target.value)}
                      placeholder="User ID"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsApplyDialogOpen(false)}>
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
      {isLoading && !error && <div className="text-sm text-muted-foreground">Loading discounts...</div>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Percent className="size-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Discount Types</p>
                <p className="text-xl font-semibold">{stats.totalTypes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                <Percent className="size-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Policies</p>
                <p className="text-xl font-semibold">{stats.totalPolicies}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-success/10 text-success">
                <Users className="size-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Applied</p>
                <p className="text-xl font-semibold">{stats.appliedDiscounts}</p>
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
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-xl font-semibold">{stats.totalAmount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Discount Types</CardTitle>
          <CardDescription>Master list of discount categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center">Auto Apply</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {discountTypes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      No discount types found.
                    </TableCell>
                  </TableRow>
                ) : (
                  discountTypes.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell className="font-medium">{type.name}</TableCell>
                      <TableCell>{type.description || "-"}</TableCell>
                      <TableCell className="text-center">{type.isAutoApply ? "Yes" : "No"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteType(type)}>
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
          <CardTitle className="text-base font-semibold">Discount Policies</CardTitle>
          <CardDescription>Discount definitions with amounts and date ranges</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {discountPolicies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No discount policies found.
                    </TableCell>
                  </TableRow>
                ) : (
                  discountPolicies.map((policy) => {
                    const type = discountTypes.find((t) => t.id === policy.discountTypeId)
                    const value = policy.isPercentage ? `${policy.percentage}%` : formatCurrency(policy.amount || 0)
                    return (
                      <TableRow key={policy.id}>
                        <TableCell className="font-medium">{type?.name || "N/A"}</TableCell>
                        <TableCell>{value}</TableCell>
                        <TableCell>{policy.isPercentage ? "Percentage" : "Fixed"}</TableCell>
                        <TableCell>{new Date(policy.startDate).toLocaleDateString("en-IN")}</TableCell>
                        <TableCell>{new Date(policy.endDate).toLocaleDateString("en-IN")}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => handleDeletePolicy(policy)}>
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
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

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Applied Student Discounts</CardTitle>
          <CardDescription>Discounts applied to student accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Discount Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Applied Date</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentDiscounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No student discounts applied yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  studentDiscounts.map((sd) => {
                    const policy = sd.discountPolicy
                    const type = policy && discountTypes.find((t) => t.id === policy.discountTypeId)
                    const value = policy ? (policy.isPercentage ? `${policy.percentage}%` : formatCurrency(policy.amount || 0)) : "-"
                    return (
                      <TableRow key={sd.id}>
                        <TableCell className="font-medium">
                          {sd.student ? `${sd.student.firstName} ${sd.student.lastName}` : `Student ${sd.studentId}`}
                        </TableCell>
                        <TableCell>
                          {sd.student?.class ? `${sd.student.class.name}-${sd.student.class.section}` : "N/A"}
                        </TableCell>
                        <TableCell>{type?.name || "N/A"}</TableCell>
                        <TableCell>{value}</TableCell>
                        <TableCell>{sd.appliedDate ? new Date(sd.appliedDate).toLocaleDateString("en-IN") : "-"}</TableCell>
                        <TableCell>{sd.reason || "-"}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteStudentDiscount(sd)}>
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
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
