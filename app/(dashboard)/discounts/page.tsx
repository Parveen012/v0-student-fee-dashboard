"use client"

import { useState } from "react"
import { Plus, Percent, Users, Award, Clock } from "lucide-react"
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
import { students } from "@/lib/data"
import { toast } from "sonner"

const discountTypeConfig = {
  sibling: { label: "Sibling Discount", icon: Users, color: "bg-chart-1/10 text-chart-1" },
  manual: { label: "Manual Discount", icon: Percent, color: "bg-chart-2/10 text-chart-2" },
  scholarship: { label: "Scholarship", icon: Award, color: "bg-chart-3/10 text-chart-3" },
  early_payment: { label: "Early Payment", icon: Clock, color: "bg-chart-4/10 text-chart-4" },
}

export default function DiscountsPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  // Aggregate all discounts from students
  const allDiscounts = students.flatMap((student) =>
    student.discounts.map((discount) => ({
      ...discount,
      studentId: student.id,
      studentName: student.name,
      studentClass: student.class,
    }))
  )

  const totalDiscountAmount = allDiscounts.reduce((a, d) => a + d.amount, 0)
  const siblingDiscounts = allDiscounts.filter((d) => d.type === "sibling").length
  const scholarshipDiscounts = allDiscounts.filter((d) => d.type === "scholarship").length

  const handleAddDiscount = (e: React.FormEvent) => {
    e.preventDefault()
    setIsAddDialogOpen(false)
    toast.success("Discount applied successfully", {
      description: "The discount has been added to the student account.",
    })
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
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 size-4" />
              Add Discount
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
                  <Select required>
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
                <div className="grid gap-2">
                  <Label htmlFor="type">Discount Type</Label>
                  <Select required>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sibling">Sibling Discount</SelectItem>
                      <SelectItem value="scholarship">Scholarship</SelectItem>
                      <SelectItem value="early_payment">Early Payment</SelectItem>
                      <SelectItem value="manual">Manual Discount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="amount">Amount (₹)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Enter amount"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="percentage">Percentage (%)</Label>
                    <Input
                      id="percentage"
                      type="number"
                      placeholder="Optional"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="reason">Reason/Note</Label>
                  <Input
                    id="reason"
                    placeholder="Enter reason for discount"
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
