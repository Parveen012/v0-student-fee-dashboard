"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { EntityPage } from "@/components/entity-page"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { classesApi } from "@/lib/api"
import type { Class } from "@/lib/types"

export default function ClassesPage() {
  const [rows, setRows] = useState<Class[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ sessionId: 1, name: "", section: "" })

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setRows(await classesApi.getAll())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load classes.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      await classesApi.create(form)
      toast.success("Class created")
      setForm({ sessionId: 1, name: "", section: "" })
      setIsDialogOpen(false)
      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create class.")
    }
  }

  const handleDelete = async (row: Class) => {
    try {
      await classesApi.delete(row.id)
      toast.success("Class deleted")
      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete class.")
    }
  }

  return (
    <EntityPage
      title="Classes"
      description="Create and manage class and section records"
      addLabel="Add Class"
      dialogTitle="Add Class"
      dialogDescription="Create a class-section record used by students and fee structures."
      isDialogOpen={isDialogOpen}
      setIsDialogOpen={setIsDialogOpen}
      isLoading={isLoading}
      error={error}
      rows={rows}
      columns={["ID", "Class", "Section"]}
      getRowKey={(row) => row.id}
      renderRow={(row) => [row.id, row.name, row.section]}
      onDelete={handleDelete}
      onSubmit={handleSubmit}
      renderForm={
        <>
          <div className="grid gap-2"><Label>Class Name</Label><Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required /></div>
          <div className="grid gap-2"><Label>Section</Label><Input value={form.section} onChange={(e) => setForm((prev) => ({ ...prev, section: e.target.value }))} required /></div>
        </>
      }
    />
  )
}
