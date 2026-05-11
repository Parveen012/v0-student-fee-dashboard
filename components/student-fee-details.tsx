"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { StudentFee } from "@/lib/types"
import { AlertCircle, CheckCircle2, Clock, IndianRupee } from "lucide-react"

function formatCurrency(amount?: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

function getStatusBadge(status: StudentFee["status"]) {
  const statusStr = String(status).toLowerCase()
  switch (statusStr) {
    case "paid":
      return <Badge className="bg-green-500/10 text-green-700">Paid</Badge>
    case "partial":
      return <Badge className="bg-blue-500/10 text-blue-700">Partial</Badge>
    case "unpaid":
      return <Badge className="bg-red-500/10 text-red-700">Unpaid</Badge>
    case "0":
    case "unpaid":
      return <Badge className="bg-red-500/10 text-red-700">Unpaid</Badge>
    case "1":
    case "partial":
      return <Badge className="bg-blue-500/10 text-blue-700">Partial</Badge>
    case "2":
    case "paid":
      return <Badge className="bg-green-500/10 text-green-700">Paid</Badge>
    default:
      return <Badge variant="outline">{statusStr}</Badge>
  }
}

function getStatusIcon(status: StudentFee["status"]) {
  const statusStr = String(status).toLowerCase()
  if (statusStr === "paid" || statusStr === "2") {
    return <CheckCircle2 className="h-5 w-5 text-green-600" />
  }
  if (statusStr === "partial" || statusStr === "1") {
    return <Clock className="h-5 w-5 text-blue-600" />
  }
  return <AlertCircle className="h-5 w-5 text-red-600" />
}

interface StudentFeeDetailsProps {
  fee: StudentFee
  compact?: boolean
}

export function StudentFeeDetails({ fee, compact = false }: StudentFeeDetailsProps) {
  const student = fee.student
  const dueAmount = fee.dueAmount ?? fee.balance ?? 0
  const generatedDate = fee.generatedDate
    ? new Date(fee.generatedDate).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—"

  return (
    <div className="space-y-4">
      {/* Student & Fee Header */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                {student?.firstName} {student?.lastName}
                {getStatusIcon(fee.status)}
              </CardTitle>
              <CardDescription className="mt-1">
                {student?.className && `Class: ${student.className}`}
                {student?.admissionNo && ` • Admission: ${student.admissionNo}`}
              </CardDescription>
            </div>
            <div className="flex flex-col items-start gap-2 md:items-end">
              <div className="flex gap-2">{getStatusBadge(fee.status)}</div>
              <div className="text-right text-sm text-muted-foreground">
                <div>Session: {fee.sessionName || "—"}</div>
                <div>Generated: {generatedDate}</div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Fee Summary Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-lg font-semibold">{formatCurrency(fee.totalAmount)}</p>
              </div>
              <IndianRupee className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-blue-50/50">
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Discount</p>
              <p className="text-lg font-semibold text-blue-700">
                {fee.discountAmount ? `-${formatCurrency(fee.discountAmount)}` : "—"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-orange-50/50">
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Fine</p>
              <p className="text-lg font-semibold text-orange-700">
                {fee.fineAmount ? `+${formatCurrency(fee.fineAmount)}` : "—"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-green-50/50">
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Paid</p>
              <p className="text-lg font-semibold text-green-700">{formatCurrency(fee.paidAmount)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-border/50 ${dueAmount > 0 ? "bg-red-50/50" : "bg-green-50/50"}`}>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Due</p>
              <p className={`text-lg font-semibold ${dueAmount > 0 ? "text-red-700" : "text-green-700"}`}>
                {formatCurrency(dueAmount)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fee Components Breakdown */}
      {!compact && fee.details && fee.details.length > 0 && (
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Fee Components Breakdown</CardTitle>
            <CardDescription>Detailed breakdown of all fee components</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Component</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Discount</TableHead>
                    <TableHead className="text-right">Fine</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fee.details.map((detail) => (
                    <TableRow key={detail.id}>
                      <TableCell className="font-medium">
                        <div>
                          <p>{detail.feeComponentName}</p>
                          {detail.isTransportRelated && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              Transport
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{detail.feeComponentCode || "—"}</TableCell>
                      <TableCell className="text-sm">{detail.frequency || "—"}</TableCell>
                      <TableCell className="text-right">{formatCurrency(detail.amount)}</TableCell>
                      <TableCell className="text-right text-blue-600">
                        {detail.discountAmount ? `-${formatCurrency(detail.discountAmount)}` : "—"}
                      </TableCell>
                      <TableCell className="text-right text-orange-600">
                        {detail.fineAmount ? `+${formatCurrency(detail.fineAmount)}` : "—"}
                      </TableCell>
                      <TableCell className="text-right text-green-600">{formatCurrency(detail.paidAmount)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(detail.netAmount)}</TableCell>
                      <TableCell>{getStatusBadge(detail.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Student Contact Info */}
      {!compact && student && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Student Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{student.email || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Mobile</p>
              <p className="font-medium">{student.mobile || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Class</p>
              <p className="font-medium">{student.className || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Roll No.</p>
              <p className="font-medium">{student.rollNo || "—"}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
