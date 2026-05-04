"use client"

import { Mail, MessageCircle, Phone } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SupportPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Help & Support</h1>
        <p className="text-sm text-muted-foreground">Quick support contacts for the fee management dashboard</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50 shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Mail className="size-5 text-primary" />Email</CardTitle><CardDescription>admin@school.edu</CardDescription></CardHeader><CardContent className="text-sm text-muted-foreground">Use this for billing, reports, or student fee corrections.</CardContent></Card>
        <Card className="border-border/50 shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Phone className="size-5 text-primary" />Phone</CardTitle><CardDescription>+91 22 1234 5678</CardDescription></CardHeader><CardContent className="text-sm text-muted-foreground">Use this for urgent payment or receipt questions.</CardContent></Card>
        <Card className="border-border/50 shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><MessageCircle className="size-5 text-primary" />Workflow</CardTitle><CardDescription>Student, fee, payment, report</CardDescription></CardHeader><CardContent className="text-sm text-muted-foreground">Most fee tasks start from Students or Payments, then reconcile in Reports.</CardContent></Card>
      </div>
    </div>
  )
}
