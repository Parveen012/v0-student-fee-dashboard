"use client"

import { useCallback, useEffect, useState } from "react"
import { Save } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { transportPoliciesApi } from "@/lib/api"
import type { CreateTransportPolicyCommand, TransportPolicy } from "@/lib/types"

const chargeTypes = ["Monthly", "TermWise", "Quarterly", "Yearly", "Custom"]

const emptyForm: CreateTransportPolicyCommand = {
  chargeType: "Monthly",
  chargeMonths: "",
  ignoreVacation: true,
  midMonthCalculation: true,
}

export default function TransportPolicyPage() {
  const [policy, setPolicy] = useState<TransportPolicy | null>(null)
  const [form, setForm] = useState<CreateTransportPolicyCommand>(emptyForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const policies = await transportPoliciesApi.getAll()
      const currentPolicy = policies[0] || null
      setPolicy(currentPolicy)
      if (currentPolicy) {
        setForm({
          chargeType: currentPolicy.chargeType || "Monthly",
          chargeMonths: currentPolicy.chargeMonths || "",
          ignoreVacation: Boolean(currentPolicy.ignoreVacation),
          midMonthCalculation: Boolean(currentPolicy.midMonthCalculation),
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load transport policy.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.chargeType.trim()) {
      toast.error("Charge type is required.")
      return
    }

    if (!form.chargeMonths.trim()) {
      toast.error("Charge months are required.")
      return
    }

    setIsSaving(true)
    try {
      if (policy) {
        await transportPoliciesApi.update(policy.id, form)
        toast.success("Transport policy updated")
      } else {
        const createdPolicy = await transportPoliciesApi.create(form)
        setPolicy(createdPolicy)
        toast.success("Transport policy created")
      }
      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save transport policy.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Transport Policy</h1>
        <p className="text-sm text-muted-foreground">Configure how transport fees are charged during fee generation.</p>
      </div>

      {error && <Alert variant="destructive"><AlertTitle>Transport policy unavailable</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      {isLoading && !error && <div className="text-sm text-muted-foreground">Loading transport policy...</div>}

      <Card className="max-w-3xl border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Policy Settings</CardTitle>
          <CardDescription>{policy ? "Update the active transport policy." : "Create the active transport policy."}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-5">
            <div className="grid gap-2">
              <Label>Charge Type</Label>
              <Select value={form.chargeType} onValueChange={(value) => setForm((prev) => ({ ...prev, chargeType: value }))}>
                <SelectTrigger><SelectValue placeholder="Select charge type" /></SelectTrigger>
                <SelectContent>
                  {chargeTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Charge Months</Label>
              <Input
                value={form.chargeMonths}
                onChange={(event) => setForm((prev) => ({ ...prev, chargeMonths: event.target.value }))}
                placeholder="Example: Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec,Jan,Feb,Mar"
                required
              />
            </div>

            <div className="grid gap-4 rounded-lg border border-border p-4">
              <label className="flex items-start gap-3">
                <Checkbox
                  checked={form.ignoreVacation}
                  onCheckedChange={(checked) => setForm((prev) => ({ ...prev, ignoreVacation: checked === true }))}
                />
                <span className="grid gap-1">
                  <span className="text-sm font-medium">Ignore Vacation</span>
                  <span className="text-sm text-muted-foreground">Do not charge transport fees during configured vacation months.</span>
                </span>
              </label>

              <label className="flex items-start gap-3">
                <Checkbox
                  checked={form.midMonthCalculation}
                  onCheckedChange={(checked) => setForm((prev) => ({ ...prev, midMonthCalculation: checked === true }))}
                />
                <span className="grid gap-1">
                  <span className="text-sm font-medium">Mid-month Calculation</span>
                  <span className="text-sm text-muted-foreground">Enable partial transport fee calculation for students joining mid-month.</span>
                </span>
              </label>
            </div>

            <div>
              <Button type="submit" disabled={isSaving}>
                <Save className="mr-2 size-4" />
                Save Policy
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
