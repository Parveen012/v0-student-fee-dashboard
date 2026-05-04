"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { EntityPage } from "@/components/entity-page"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { sessionsApi } from "@/lib/api"
import type { Session } from "@/lib/types"

export default function SessionsPage() {
  const [rows, setRows] = useState<Session[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", startDate: "", endDate: "", isActive: false })

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setRows(await sessionsApi.getAll())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sessions.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      await sessionsApi.create({
        name: form.name,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        isActive: form.isActive,
      })
      toast.success("Session created")
      setForm({ name: "", startDate: "", endDate: "", isActive: false })
      setIsDialogOpen(false)
      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create session.")
    }
  }

  const handleDelete = async (row: Session) => {
    try {
      await sessionsApi.delete(row.id)
      toast.success("Session deleted")
      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete session.")
    }
  }

  return (
    <EntityPage
      title="Sessions"
      description="Manage academic sessions used by fee structures"
      addLabel="Add Session"
      dialogTitle="Add Session"
      dialogDescription="Create an academic year or term."
      isDialogOpen={isDialogOpen}
      setIsDialogOpen={setIsDialogOpen}
      isLoading={isLoading}
      error={error}
      rows={rows}
      columns={["ID", "Name", "Start", "End", "Active"]}
      getRowKey={(row) => row.id}
      renderRow={(row) => [row.id, row.name, new Date(row.startDate).toLocaleDateString("en-IN"), new Date(row.endDate).toLocaleDateString("en-IN"), row.isActive ? "Yes" : "No"]}
      onDelete={handleDelete}
      onSubmit={handleSubmit}
      renderForm={
        <>
          <div className="grid gap-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))} required /></div>
            <div className="grid gap-2"><Label>End Date</Label><Input type="date" value={form.endDate} onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))} required /></div>
          </div>
          <div className="flex items-center justify-between"><Label>Active Session</Label><Switch checked={form.isActive} onCheckedChange={(value) => setForm((prev) => ({ ...prev, isActive: value }))} /></div>
        </>
      }
    />
  )
}
