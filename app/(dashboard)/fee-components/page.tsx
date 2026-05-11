"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { EntityPage } from "@/components/entity-page"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { feeComponentsApi } from "@/lib/api"
import type { FeeComponent } from "@/lib/types"

const feeFrequencies = ["Monthly", "OneTime", "Quarterly"]

export default function FeeComponentsPage() {
  const [rows, setRows] = useState<FeeComponent[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: "",
    code: "",
    frequency: feeFrequencies[0],
    isOptional: false,
    isTransportRelated: false,
    description: "",
  })

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
      setForm({
        name: "",
        code: "",
        frequency: feeFrequencies[0],
        isOptional: false,
        isTransportRelated: false,
        description: "",
      })
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
      columns={["ID", "Name", "Code", "Frequency", "Optional", "Transport", "Description"]}
      getRowKey={(row) => row.id}
      renderRow={(row) => [
        row.id,
        row.name,
        row.code || "-",
        row.frequency || "-",
        row.isOptional ? "Yes" : "No",
        row.isTransportRelated ? "Yes" : "No",
        row.description || "-",
      ]}
      onDelete={handleDelete}
      onSubmit={handleSubmit}
      renderForm={
        <>
          <div className="grid gap-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required /></div>
          <div className="grid gap-2">
            <Label>Code</Label>
            <Input value={form.code} onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))} required />
          </div>
          <div className="grid gap-2">
            <Label>Frequency</Label>
            <Select value={form.frequency} onValueChange={(value) => setForm((prev) => ({ ...prev, frequency: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {feeFrequencies.map((frequency) => <SelectItem key={frequency} value={frequency}>{frequency}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} required />
          </div>
          <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
            <div>
              <Label className="text-sm">Optional</Label>
              <p className="text-xs text-muted-foreground">Mark this fee component as optional.</p>
            </div>
            <Checkbox checked={form.isOptional} onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isOptional: checked === true }))} />
          </div>
          <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
            <div>
              <Label className="text-sm">Transport Related</Label>
              <p className="text-xs text-muted-foreground">Use for transport-related charges.</p>
            </div>
            <Checkbox checked={form.isTransportRelated} onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isTransportRelated: checked === true }))} />
          </div>
        </>
      }
    />
  )
}
