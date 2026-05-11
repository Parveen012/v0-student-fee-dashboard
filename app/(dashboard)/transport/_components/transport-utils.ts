import type { RouteStop, Student, TransportRoute } from "@/lib/types"

export function formatCurrency(amount?: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

export function formatDate(value?: string) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function toDateInputValue(value?: string) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toISOString().slice(0, 10)
}

export function fromDateInputValue(value: string) {
  return new Date(`${value}T00:00:00.000Z`).toISOString()
}

export function getStudentName(student?: Student) {
  if (!student) return "Student N/A"
  return `${student.firstName} ${student.lastName}`.trim() || `Student ${student.id}`
}

export function getRouteName(route?: TransportRoute) {
  return route?.routeName || "Route N/A"
}

export function getStopName(stop?: RouteStop) {
  return stop?.stopName || "Stop N/A"
}

export function validatePositiveNumber(value: number, label: string, allowZero = false) {
  if (!Number.isFinite(value) || (allowZero ? value < 0 : value <= 0)) {
    return `${label} must be ${allowZero ? "zero or greater" : "greater than zero"}.`
  }

  return null
}
