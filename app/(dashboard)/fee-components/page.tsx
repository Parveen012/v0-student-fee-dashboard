"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { EntityPage } from "@/components/entity-page"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { feeComponentsApi } from "@/lib/api"
import type { FeeComponent } from "@/lib/types"

const feeTypes = ["Monthly", "OneTime", "Quarterly"]

export default function FeeComponentsPage() {
  const [rows, setRows] = useState<FeeComponent[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", type: feeTypes[0] })

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setRows(await feeComponentsApi.getAll())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load fee components.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      await feeComponentsApi.create(form)
      toast.success("Fee component created")
      setForm({ name: "", type: feeTypes[0] })
      setIsDialogOpen(false)
      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create fee component.")
    }
  }

  const handleDelete = async (row: FeeComponent) => {
    try {
      await feeComponentsApi.delete(row.id)
      toast.success("Fee component deleted")
      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete fee component.")
    }
  }

  return (
    <EntityPage
      title="Fee Components"
      description="Manage reusable fee heads such as tuition, transport, and exam fees"
      addLabel="Add Component"
      dialogTitle="Add Fee Component"
      dialogDescription="Create a reusable fee component."
      isDialogOpen={isDialogOpen}
      setIsDialogOpen={setIsDialogOpen}
      isLoading={isLoading}
      error={error}
      rows={rows}
      columns={["ID", "Name", "Type"]}
      getRowKey={(row) => row.id}
      renderRow={(row) => [row.id, row.name, row.type]}
      onDelete={handleDelete}
      onSubmit={handleSubmit}
      renderForm={
        <>
          <div className="grid gap-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required /></div>
          <div className="grid gap-2">
            <Label>Type</Label>
            <Select value={form.type} onValueChange={(value) => setForm((prev) => ({ ...prev, type: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {feeTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </>
      }
    />
  )
}
