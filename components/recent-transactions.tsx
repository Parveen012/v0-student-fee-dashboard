"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatusBadge } from "@/components/status-badge"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import type { PaymentStatus } from "@/lib/types"

const paymentModeLabels: Record<string, string> = {
  upi: "UPI",
  cash: "Cash",
  card: "Card",
  bank_transfer: "Bank Transfer",
  cheque: "Cheque",
  online: "Online",
}

export interface RecentPayment {
  id: number
  studentName: string
  className: string
  amountPaid: number
  mode: string
  paymentDate: string
  status?: PaymentStatus
}

interface RecentTransactionsProps {
  payments: RecentPayment[]
}

export function RecentTransactions({ payments }: RecentTransactionsProps) {
  const recentPayments = payments.slice(0, 6)

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
        <CardDescription>Latest fee payments and transactions</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-medium text-muted-foreground">Student</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">Class</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">Amount</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">Mode</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">Date</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentPayments.map((payment) => (
              <TableRow key={payment.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">{payment.studentName}</TableCell>
                <TableCell className="text-muted-foreground">{payment.className}</TableCell>
                <TableCell className="font-medium">
                  ₹{payment.amountPaid.toLocaleString("en-IN")}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-normal">
                    {paymentModeLabels[payment.mode] || payment.mode}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(payment.paymentDate), "dd MMM yyyy")}
                </TableCell>
                <TableCell>
                  <StatusBadge status={payment.status || "completed"} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
