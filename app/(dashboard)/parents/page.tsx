"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { EntityPage } from "@/components/entity-page"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { parentsApi } from "@/lib/api"
import type { Parent } from "@/lib/types"

export default function ParentsPage() {
  const [rows, setRows] = useState<Parent[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    alternateMobile: "",
    occupation: "",
    address: "",
    email: "",
  })

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setRows(await parentsApi.getAll())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load parents.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      await parentsApi.create(form)
      toast.success("Parent created")
      setForm({ name: "", mobile: "", alternateMobile: "", occupation: "", address: "", email: "" })
      setIsDialogOpen(false)
      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create parent.")
    }
  }

  const getPrimaryMobile = (row: Parent) => row.mobile || row.phone || "-"

  return (
    <EntityPage
      title="Parents"
      description="Create parent contacts used on student profiles"
      addLabel="Add Parent"
      dialogTitle="Add Parent"
      dialogDescription="Create a parent contact record."
      isDialogOpen={isDialogOpen}
      setIsDialogOpen={setIsDialogOpen}
      isLoading={isLoading}
      error={error}
      rows={rows}
      columns={["ID", "Name", "Mobile", "Alt Mobile", "Occupation", "Email", "Address"]}
      getRowKey={(row) => row.id}
      renderRow={(row) => [
        row.id,
        row.name,
        getPrimaryMobile(row),
        row.alternateMobile || "-",
        row.occupation || "-",
        row.email,
        row.address || "-",
      ]}
      onSubmit={handleSubmit}
      renderForm={
        <>
          <div className="grid gap-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required /></div>
          <div className="grid gap-2"><Label>Mobile</Label><Input value={form.mobile} onChange={(e) => setForm((prev) => ({ ...prev, mobile: e.target.value }))} required /></div>
          <div className="grid gap-2"><Label>Alternate Mobile</Label><Input value={form.alternateMobile} onChange={(e) => setForm((prev) => ({ ...prev, alternateMobile: e.target.value }))} required /></div>
          <div className="grid gap-2"><Label>Occupation</Label><Input value={form.occupation} onChange={(e) => setForm((prev) => ({ ...prev, occupation: e.target.value }))} required /></div>
          <div className="grid gap-2"><Label>Address</Label><Textarea value={form.address} onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))} required /></div>
          <div className="grid gap-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} required /></div>
        </>
      }
    />
  )
}
