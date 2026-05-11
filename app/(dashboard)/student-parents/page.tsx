"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Link2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { parentsApi, studentParentsApi, studentsApi } from "@/lib/api"
import type { Parent, Student, StudentParent, StudentParentRelation } from "@/lib/types"

const relationOptions: StudentParentRelation[] = ["Father", "Mother", "Guardian"]

function getStudentName(student?: Student) {
  if (!student) return "Student N/A"
  return `${student.firstName} ${student.lastName}`
}

function getRelation(item: StudentParent) {
  return item.relationType || item.relation || item.relationship || "Guardian"
}

export default function StudentParentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [allParents, setAllParents] = useState<Parent[]>([])
  const [parents, setParents] = useState<StudentParent[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState("")
  const [selectedParentId, setSelectedParentId] = useState("")
  const [relation, setRelation] = useState<StudentParentRelation>("Father")
  const [isLoading, setIsLoading] = useState(true)
  const [isRelationLoading, setIsRelationLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [relationError, setRelationError] = useState<string | null>(null)

  const loadOptions = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [studentsData, parentsData] = await Promise.all([
        studentsApi.getAll(),
        parentsApi.getAll(),
      ])
      setStudents(studentsData)
      setAllParents(parentsData)
      if (!selectedStudentId && studentsData[0]) {
        setSelectedStudentId(studentsData[0].id.toString())
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load students and parents.")
    } finally {
      setIsLoading(false)
    }
  }, [selectedStudentId])

  const loadStudentParents = useCallback(async (studentId: string) => {
    if (!studentId) {
      setParents([])
      return
    }

    setIsRelationLoading(true)
    setRelationError(null)
    try {
      const data = await studentParentsApi.getByStudentId(Number(studentId))
      setParents(data)
    } catch (err) {
      setParents([])
      setRelationError(err instanceof Error ? err.message : "Failed to load linked parents.")
    } finally {
      setIsRelationLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOptions()
  }, [loadOptions])

  useEffect(() => {
    loadStudentParents(selectedStudentId)
  }, [loadStudentParents, selectedStudentId])

  const parentMap = useMemo(
    () => new Map(allParents.map((parent) => [parent.id, parent])),
    [allParents]
  )

  const selectedStudent = students.find((student) => student.id.toString() === selectedStudentId)

  const rows = parents.map((item) => ({
    ...item,
    parent: item.parent || parentMap.get(item.parentId),
  }))

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedStudentId || !selectedParentId || !relation) {
      toast.error("Please select student, parent, and relation.")
      return
    }

    setIsSubmitting(true)
    try {
      await studentParentsApi.create({
        studentId: Number(selectedStudentId),
        parentId: Number(selectedParentId),
        relationType: relation,
      })
      toast.success("Parent linked to student")
      setSelectedParentId("")
      setRelation("Father")
      await loadStudentParents(selectedStudentId)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to link parent.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (item: StudentParent) => {
    try {
      await studentParentsApi.delete(item.id)
      toast.success("Parent relation deleted")
      await loadStudentParents(selectedStudentId)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete parent relation.")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Student Parent Relations
        </h1>
        <p className="text-sm text-muted-foreground">
          Link students with parents and relationship type.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Options unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {relationError && (
        <Alert variant="destructive">
          <AlertTitle>Linked parents unavailable</AlertTitle>
          <AlertDescription>{relationError}</AlertDescription>
        </Alert>
      )}
      {isLoading && !error && (
        <div className="text-sm text-muted-foreground">Loading students and parents...</div>
      )}

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Link2 className="size-5 text-primary" />
            Create Relation
          </CardTitle>
          <CardDescription>POST /api/StudentParents</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-[1fr_1fr_220px_auto] lg:items-end">
            <div className="grid gap-2">
              <Label>Student</Label>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id.toString()}>
                      {getStudentName(student)} - STU{String(student.id).padStart(3, "0")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Parent</Label>
              <Select value={selectedParentId} onValueChange={setSelectedParentId}>
                <SelectTrigger><SelectValue placeholder="Select parent" /></SelectTrigger>
                <SelectContent>
                  {allParents.map((parent) => (
                    <SelectItem key={parent.id} value={parent.id.toString()}>
                      {parent.name} - {parent.mobile || parent.phone || "-"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Relationship</Label>
              <Select value={relation} onValueChange={(value) => setRelation(value as StudentParentRelation)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {relationOptions.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={isSubmitting}>
              <Plus className="mr-2 size-4" />
              Link
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Linked Parents</CardTitle>
          <CardDescription>
            {selectedStudent
              ? `GET /api/StudentParents/${selectedStudent.id} for ${getStudentName(selectedStudent)}`
              : "Select a student to view linked parents"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isRelationLoading ? (
            <div className="text-sm text-muted-foreground">Loading linked parents...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parent</TableHead>
                    <TableHead>Relationship</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                        No linked parents found for the selected student.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.parent?.name || `Parent ${item.parentId}`}
                        </TableCell>
                        <TableCell>{getRelation(item)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {item.parent?.mobile || item.parent?.phone || "-"}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(item)}>
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
