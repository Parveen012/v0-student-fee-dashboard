"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { FileText, Search } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { invoiceDetailsApi, invoicesApi } from "@/lib/api"
import type { Invoice, InvoiceDetail } from "@/lib/types"

function formatCurrency(amount?: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

function formatDate(date?: string) {
  if (!date) return "-"
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetail[]>([])
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [invoicesData, invoiceDetailsData] = await Promise.all([
        invoicesApi.getAll(),
        invoiceDetailsApi.getAll(),
      ])
      setInvoices(invoicesData)
      setInvoiceDetails(invoiceDetailsData)
      if (!selectedInvoiceId && invoicesData[0]) {
        setSelectedInvoiceId(invoicesData[0].id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load invoices.")
    } finally {
      setIsLoading(false)
    }
  }, [selectedInvoiceId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredInvoices = useMemo(() => {
    const query = searchQuery.toLowerCase()
    return invoices.filter((invoice) => {
      const invoiceNumber = invoice.invoiceNumber?.toLowerCase() || ""
      const status = invoice.status?.toLowerCase() || ""
      const studentName = invoice.student
        ? `${invoice.student.firstName} ${invoice.student.lastName}`.toLowerCase()
        : ""
      return invoiceNumber.includes(query) || status.includes(query) || studentName.includes(query)
    })
  }, [invoices, searchQuery])

  const selectedInvoice = invoices.find((invoice) => invoice.id === selectedInvoiceId)
  const selectedDetails = invoiceDetails.filter((detail) => detail.invoiceId === selectedInvoiceId)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Invoices</h1>
        <p className="text-sm text-muted-foreground">
          View invoices and invoice detail lines from the backend.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Invoice data unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {isLoading && !error && (
        <div className="text-sm text-muted-foreground">Loading invoices...</div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <FileText className="size-5 text-primary" />
                  Invoice List
                </CardTitle>
                <CardDescription>GET /api/Invoices</CardDescription>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                        No invoices found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInvoices.map((invoice) => (
                      <TableRow
                        key={invoice.id}
                        className="cursor-pointer"
                        onClick={() => setSelectedInvoiceId(invoice.id)}
                      >
                        <TableCell className="font-medium">
                          {invoice.invoiceNumber || `INV${String(invoice.id).padStart(4, "0")}`}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {invoice.student
                            ? `${invoice.student.firstName} ${invoice.student.lastName}`
                            : invoice.studentId || "-"}
                        </TableCell>
                        <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(invoice.totalAmount)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-normal">
                            {invoice.status || "N/A"}
                          </Badge>
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
            <CardTitle className="text-base font-semibold">Invoice Details</CardTitle>
            <CardDescription>
              GET /api/InvoiceDetails
              {selectedInvoice ? ` for ${selectedInvoice.invoiceNumber || selectedInvoice.id}` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedDetails.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                        Select an invoice to view detail lines.
                      </TableCell>
                    </TableRow>
                  ) : (
                    selectedDetails.map((detail) => (
                      <TableRow key={detail.id}>
                        <TableCell className="font-medium">
                          {detail.description || detail.feeComponentName || `Line ${detail.id}`}
                        </TableCell>
                        <TableCell className="text-right">{detail.quantity || "-"}</TableCell>
                        <TableCell className="text-right">{formatCurrency(detail.amount)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
