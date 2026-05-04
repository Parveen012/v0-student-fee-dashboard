"use client"

import { Save, Shield, User } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Profile</h1>
        <p className="text-sm text-muted-foreground">Manage the local admin profile shown in the dashboard header</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><User className="size-5 text-primary" />Personal Details</CardTitle>
            <CardDescription>Update account display information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2"><Label>Name</Label><Input defaultValue="Admin User" /></div>
            <div className="grid gap-2"><Label>Email</Label><Input type="email" defaultValue="admin@school.edu" /></div>
            <div className="grid gap-2"><Label>Role</Label><Input defaultValue="Administrator" /></div>
            <Button onClick={() => toast.success("Profile saved")}><Save className="mr-2 size-4" />Save Profile</Button>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Shield className="size-5 text-primary" />Security</CardTitle>
            <CardDescription>Change local account password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2"><Label>Current Password</Label><Input type="password" /></div>
            <div className="grid gap-2"><Label>New Password</Label><Input type="password" /></div>
            <div className="grid gap-2"><Label>Confirm Password</Label><Input type="password" /></div>
            <Button variant="outline" onClick={() => toast.success("Password updated")}>Change Password</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
