"use client"

import { useState } from "react"
import { Pencil, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { feeStructures, type FeeStructure } from "@/lib/data"
import { toast } from "sonner"

export default function FeeStructurePage() {
  const [structures, setStructures] = useState<FeeStructure[]>(feeStructures)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Partial<FeeStructure>>({})

  const handleEdit = (structure: FeeStructure) => {
    setEditingId(structure.id)
    setEditValues({ ...structure })
  }

  const handleSave = () => {
    if (!editingId || !editValues) return

    setStructures((prev) =>
      prev.map((s) => {
        if (s.id === editingId) {
          const updated = {
            ...s,
            ...editValues,
            totalFee:
              (editValues.tuitionFee || 0) +
              (editValues.transportFee || 0) +
              (editValues.labFee || 0) +
              (editValues.libraryFee || 0) +
              (editValues.sportsFee || 0),
          }
          return updated
        }
        return s
      })
    )

    setEditingId(null)
    setEditValues({})
    toast.success("Fee structure updated", {
      description: "The fee structure has been saved successfully.",
    })
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditValues({})
  }

  const handleInputChange = (field: keyof FeeStructure, value: string) => {
    const numValue = parseInt(value) || 0
    setEditValues((prev) => ({ ...prev, [field]: numValue }))
  }

  const calculateTotal = () => {
    return (
      (editValues.tuitionFee || 0) +
      (editValues.transportFee || 0) +
      (editValues.labFee || 0) +
      (editValues.libraryFee || 0) +
      (editValues.sportsFee || 0)
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Fee Structure</h1>
        <p className="text-sm text-muted-foreground">
          Manage fee breakdowns for each class
        </p>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Class-wise Fee Structure</CardTitle>
          <CardDescription>
            Click the edit button to modify fee components for each class
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-medium text-muted-foreground">Class</TableHead>
                  <TableHead className="text-right text-xs font-medium text-muted-foreground">
                    Tuition Fee
                  </TableHead>
                  <TableHead className="text-right text-xs font-medium text-muted-foreground">
                    Transport Fee
                  </TableHead>
                  <TableHead className="text-right text-xs font-medium text-muted-foreground">
                    Lab Fee
                  </TableHead>
                  <TableHead className="text-right text-xs font-medium text-muted-foreground">
                    Library Fee
                  </TableHead>
                  <TableHead className="text-right text-xs font-medium text-muted-foreground">
                    Sports Fee
                  </TableHead>
                  <TableHead className="text-right text-xs font-medium text-muted-foreground">
                    Total Fee
                  </TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {structures.map((structure) => (
                  <TableRow key={structure.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{structure.class}</TableCell>
                    {editingId === structure.id ? (
                      <>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={editValues.tuitionFee || ""}
                            onChange={(e) => handleInputChange("tuitionFee", e.target.value)}
                            className="h-8 w-24 text-right ml-auto"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={editValues.transportFee || ""}
                            onChange={(e) => handleInputChange("transportFee", e.target.value)}
                            className="h-8 w-24 text-right ml-auto"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={editValues.labFee || ""}
                            onChange={(e) => handleInputChange("labFee", e.target.value)}
                            className="h-8 w-24 text-right ml-auto"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={editValues.libraryFee || ""}
                            onChange={(e) => handleInputChange("libraryFee", e.target.value)}
                            className="h-8 w-24 text-right ml-auto"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={editValues.sportsFee || ""}
                            onChange={(e) => handleInputChange("sportsFee", e.target.value)}
                            className="h-8 w-24 text-right ml-auto"
                          />
                        </TableCell>
                        <TableCell className="text-right font-semibold text-primary">
                          ₹{calculateTotal().toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="size-8" onClick={handleSave}>
                              <Save className="size-4 text-success" />
                            </Button>
                            <Button variant="ghost" size="icon" className="size-8" onClick={handleCancel}>
                              <X className="size-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="text-right text-muted-foreground">
                          ₹{structure.tuitionFee.toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          ₹{structure.transportFee.toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          ₹{structure.labFee.toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          ₹{structure.libraryFee.toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          ₹{structure.sportsFee.toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ₹{structure.totalFee.toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => handleEdit(structure)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Average Fee</p>
            <p className="text-xl font-semibold">
              ₹{Math.round(structures.reduce((a, s) => a + s.totalFee, 0) / structures.length).toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Highest Fee</p>
            <p className="text-xl font-semibold">
              ₹{Math.max(...structures.map((s) => s.totalFee)).toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Lowest Fee</p>
            <p className="text-xl font-semibold">
              ₹{Math.min(...structures.map((s) => s.totalFee)).toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Classes</p>
            <p className="text-xl font-semibold">{structures.length}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
