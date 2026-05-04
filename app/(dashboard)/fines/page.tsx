"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { EntityPage } from "@/components/entity-page"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { finesApi } from "@/lib/api"
import type { Fine } from "@/lib/types"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function FinesPage() {
  const [rows, setRows] = useState<Fine[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", amount: "", gracePeriodDays: "" })

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setRows(await finesApi.getAll())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load fines.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      await finesApi.create({
        name: form.name,
        amount: Number(form.amount),
        gracePeriodDays: Number(form.gracePeriodDays),
      })
      toast.success("Fine created")
      setForm({ name: "", amount: "", gracePeriodDays: "" })
      setIsDialogOpen(false)
      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create fine.")
    }
  }

  const handleDelete = async (row: Fine) => {
    try {
      await finesApi.delete(row.id)
      toast.success("Fine deleted")
      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete fine.")
    }
  }

  return (
    <EntityPage
      title="Fines"
      description="Manage late fee and penalty definitions"
      addLabel="Add Fine"
      dialogTitle="Add Fine"
      dialogDescription="Create a fine that can be assigned to students."
      isDialogOpen={isDialogOpen}
      setIsDialogOpen={setIsDialogOpen}
      isLoading={isLoading}
      error={error}
      rows={rows}
      columns={["ID", "Name", "Amount", "Grace Days"]}
      getRowKey={(row) => row.id}
      renderRow={(row) => [row.id, row.name, formatCurrency(row.amount), row.gracePeriodDays]}
      onDelete={handleDelete}
      onSubmit={handleSubmit}
      renderForm={
        <>
          <div className="grid gap-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Amount</Label><Input type="number" value={form.amount} onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))} required /></div>
            <div className="grid gap-2"><Label>Grace Days</Label><Input type="number" value={form.gracePeriodDays} onChange={(e) => setForm((prev) => ({ ...prev, gracePeriodDays: e.target.value }))} required /></div>
          </div>
        </>
      }
    />
  )
}
