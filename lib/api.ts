// API Client for Fee Management System
// Maps to the backend API endpoints

import type {
  Student,
  Class,
  Session,
  FeeStructure,
  FeeComponent,
  Payment,
  Discount,
  Fine,
  StudentDiscount,
  StudentFine,
  StudentFee,
  Installment,
  CreateStudentCommand,
  UpdateStudentCommand,
  CreateClassCommand,
  CreateSessionCommand,
  CreateFeeStructureCommand,
  CreateFeeComponentCommand,
  CreatePaymentCommand,
  CreateDiscountCommand,
  CreateFineCommand,
  CreateStudentDiscountCommand,
  CreateStudentFineCommand,
  UpdateStudentFineCommand,
  Parent,
  CreateParentCommand,
  StudentParent,
  CreateStudentParentCommand,
  CreateGroupPaymentCommand,
  Invoice,
  InvoiceDetail,
} from "./types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api"
const API_KEY = process.env.NEXT_PUBLIC_API_KEY
const API_KEY_HEADER = process.env.NEXT_PUBLIC_API_KEY_HEADER || "X-API-KEY"
const DEFAULT_TENANT_ID =
  process.env.NEXT_PUBLIC_TENANT_ID &&
  !Number.isNaN(Number(process.env.NEXT_PUBLIC_TENANT_ID))
    ? Number(process.env.NEXT_PUBLIC_TENANT_ID)
    : 1

function withTenantId<T extends { tenantId?: number }>(data: T): T & { tenantId: number } {
  if (typeof data.tenantId === "number") return data as T & { tenantId: number }
  return { ...data, tenantId: DEFAULT_TENANT_ID }
}

// Generic fetch wrapper with error handling
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(API_KEY ? { [API_KEY_HEADER]: API_KEY } : {}),
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || `API Error: ${response.status}`)
  }

  // Handle empty responses
  const text = await response.text()
  if (!text) return {} as T
  return JSON.parse(text)
}

// ============ Classes API ============
export const classesApi = {
  getAll: () => fetchApi<Class[]>("/Classes"),
  getById: (id: number) => fetchApi<Class>(`/Classes/${id}`),
  create: (data: CreateClassCommand) =>
    fetchApi<Class>("/Classes", {
      method: "POST",
      body: JSON.stringify(withTenantId(data)),
    }),
  delete: (id: number) =>
    fetchApi<void>(`/Classes/${id}`, { method: "DELETE" }),
}

// ============ Sessions API ============
export const sessionsApi = {
  getAll: () => fetchApi<Session[]>("/Sessions"),
  getById: (id: number) => fetchApi<Session>(`/Sessions/${id}`),
  create: (data: CreateSessionCommand) =>
    fetchApi<Session>("/Sessions", {
      method: "POST",
      body: JSON.stringify(withTenantId(data)),
    }),
  delete: (id: number) =>
    fetchApi<void>(`/Sessions/${id}`, { method: "DELETE" }),
}

// ============ Students API ============
export const studentsApi = {
  getAll: () => fetchApi<Student[]>("/Students"),
  getById: (id: number) => fetchApi<Student>(`/Students/${id}`),
  create: (data: CreateStudentCommand) =>
    fetchApi<Student>("/Students", {
      method: "POST",
      body: JSON.stringify(withTenantId(data)),
    }),
  update: (id: number, data: UpdateStudentCommand) =>
    fetchApi<Student>(`/Students/${id}`, {
      method: "PUT",
      body: JSON.stringify(withTenantId(data)),
    }),
  delete: (id: number) =>
    fetchApi<void>(`/Students/${id}`, { method: "DELETE" }),
}

// ============ Parents API ============
export const parentsApi = {
  getAll: () => fetchApi<Parent[]>("/Parents"),
  create: (data: CreateParentCommand) =>
    fetchApi<Parent>("/Parents", {
      method: "POST",
      body: JSON.stringify(withTenantId(data)),
    }),
}

// ============ Student Parents API ============
export const studentParentsApi = {
  getByStudentId: async (studentId: number) => {
    try {
      return await fetchApi<StudentParent[]>(`/StudentParents/${studentId}`)
    } catch {
      // Some backends expose student-parent lookup as /StudentParents/s{studentId}
      return fetchApi<StudentParent[]>(`/StudentParents/s${studentId}`)
    }
  },
  create: (data: CreateStudentParentCommand) =>
    fetchApi<StudentParent>("/StudentParents", {
      method: "POST",
      body: JSON.stringify(withTenantId(data)),
    }),
  delete: (id: number) =>
    fetchApi<void>(`/StudentParents/${id}`, { method: "DELETE" }),
}

// ============ Fee Components API ============
export const feeComponentsApi = {
  getAll: () => fetchApi<FeeComponent[]>("/FeeComponents"),
  getById: (id: number) => fetchApi<FeeComponent>(`/FeeComponents/${id}`),
  create: (data: CreateFeeComponentCommand) =>
    fetchApi<FeeComponent>("/FeeComponents", {
      method: "POST",
      body: JSON.stringify(withTenantId(data)),
    }),
  delete: (id: number) =>
    fetchApi<void>(`/FeeComponents/${id}`, { method: "DELETE" }),
}

// ============ Fee Structures API ============
export const feeStructuresApi = {
  getAll: () => fetchApi<FeeStructure[]>("/FeeStructures"),
  getById: (id: number) => fetchApi<FeeStructure>(`/FeeStructures/${id}`),
  create: (data: CreateFeeStructureCommand) =>
    fetchApi<FeeStructure>("/FeeStructures", {
      method: "POST",
      body: JSON.stringify(withTenantId(data)),
    }),
  delete: (id: number) =>
    fetchApi<void>(`/FeeStructures/${id}`, { method: "DELETE" }),
}

// ============ Student Fees API ============
export const studentFeesApi = {
  getByStudentId: (studentId: number) => fetchApi<StudentFee>(`/StudentFees/${studentId}`),
}

// ============ Payments API ============
export const paymentsApi = {
  getAll: () => fetchApi<Payment[]>("/Payments"),
  create: (data: CreatePaymentCommand) =>
    fetchApi<Payment>("/Payments", {
      method: "POST",
      body: JSON.stringify(withTenantId(data)),
    }),
}

// ============ Group Payments API ============
export const groupPaymentsApi = {
  create: (data: CreateGroupPaymentCommand) =>
    fetchApi<void>("/GroupPayments", {
      method: "POST",
      body: JSON.stringify(withTenantId(data)),
    }),
}

// ============ Invoices API ============
export const invoicesApi = {
  getAll: () => fetchApi<Invoice[]>("/Invoices"),
}

// ============ Invoice Details API ============
export const invoiceDetailsApi = {
  getAll: () => fetchApi<InvoiceDetail[]>("/InvoiceDetails"),
}

// ============ Discounts API ============
export const discountsApi = {
  getAll: () => fetchApi<Discount[]>("/Discounts"),
  getById: (id: number) => fetchApi<Discount>(`/Discounts/${id}`),
  create: (data: CreateDiscountCommand) =>
    fetchApi<Discount>("/Discounts", {
      method: "POST",
      body: JSON.stringify(withTenantId(data)),
    }),
  delete: (id: number) =>
    fetchApi<void>(`/Discounts/${id}`, { method: "DELETE" }),
}

// ============ Student Discounts API ============
export const studentDiscountsApi = {
  getAll: () => fetchApi<StudentDiscount[]>("/StudentDiscounts"),
  getById: (id: number) => fetchApi<StudentDiscount>(`/StudentDiscounts/${id}`),
  create: (data: CreateStudentDiscountCommand) =>
    fetchApi<StudentDiscount>("/StudentDiscounts", {
      method: "POST",
      body: JSON.stringify(withTenantId(data)),
    }),
  delete: (id: number) =>
    fetchApi<void>(`/StudentDiscounts/${id}`, { method: "DELETE" }),
}

// ============ Fines API ============
export const finesApi = {
  getAll: () => fetchApi<Fine[]>("/Fines"),
  getById: (id: number) => fetchApi<Fine>(`/Fines/${id}`),
  create: (data: CreateFineCommand) =>
    fetchApi<Fine>("/Fines", {
      method: "POST",
      body: JSON.stringify(withTenantId(data)),
    }),
  delete: (id: number) =>
    fetchApi<void>(`/Fines/${id}`, { method: "DELETE" }),
}

// ============ Student Fines API ============
export const studentFinesApi = {
  getAll: () => fetchApi<StudentFine[]>("/StudentFines"),
  getById: (id: number) => fetchApi<StudentFine>(`/StudentFines/${id}`),
  create: (data: CreateStudentFineCommand) =>
    fetchApi<StudentFine>("/StudentFines", {
      method: "POST",
      body: JSON.stringify(withTenantId(data)),
    }),
  update: (id: number, data: UpdateStudentFineCommand) =>
    fetchApi<StudentFine>(`/StudentFines/${id}`, {
      method: "PUT",
      body: JSON.stringify(withTenantId(data)),
    }),
  delete: (id: number) =>
    fetchApi<void>(`/StudentFines/${id}`, { method: "DELETE" }),
}

// ============ Helper Functions for Payment Logic ============

/**
 * Calculate payment breakdown with partial payment, overpayment logic
 */
export function calculatePaymentBreakdown(
  totalAmount: number,
  discountAmount: number,
  fineAmount: number,
  paidAmount: number
): {
  netAmount: number
  balance: number
  status: "unpaid" | "partial" | "paid" | "overpaid"
  overpayment: number
} {
  const netAmount = totalAmount - discountAmount + fineAmount
  const balance = netAmount - paidAmount
  const overpayment = balance < 0 ? Math.abs(balance) : 0

  let status: "unpaid" | "partial" | "paid" | "overpaid"
  if (paidAmount === 0) {
    status = "unpaid"
  } else if (paidAmount < netAmount) {
    status = "partial"
  } else if (paidAmount === netAmount) {
    status = "paid"
  } else {
    status = "overpaid"
  }

  return {
    netAmount,
    balance: Math.max(0, balance),
    status,
    overpayment,
  }
}

/**
 * Calculate installment status based on due date and payment
 */
export function calculateInstallmentStatus(
  installment: Installment
): InstallmentStatus {
  const today = new Date()
  const dueDate = new Date(installment.dueDate)

  if (installment.paidAmount >= installment.amount) {
    return "paid"
  }
  if (installment.paidAmount > 0) {
    return "partial"
  }
  if (today > dueDate) {
    return "overdue"
  }
  return "unpaid"
}

type InstallmentStatus = "unpaid" | "partial" | "paid" | "overdue"

/**
 * Calculate discount amount based on discount type
 */
export function calculateDiscountAmount(
  discount: Discount,
  baseAmount: number
): number {
  if (discount.isPercentage) {
    return (baseAmount * discount.amountOrPercentage) / 100
  }
  return discount.amountOrPercentage
}

/**
 * Check if late fee should be applied based on grace period
 */
export function shouldApplyLateFee(
  dueDate: string,
  gracePeriodDays: number
): boolean {
  const today = new Date()
  const due = new Date(dueDate)
  const graceEndDate = new Date(due)
  graceEndDate.setDate(graceEndDate.getDate() + gracePeriodDays)
  return today > graceEndDate
}

// ============ Aggregation helpers for dashboard ============

export function aggregateStudentFeeData(studentFees: StudentFee[]) {
  return studentFees.reduce(
    (acc, sf) => {
      acc.totalFees += sf.totalAmount
      acc.collectedFees += sf.paidAmount
      acc.pendingFees += sf.balance
      acc.discountAmount += sf.discountAmount
      acc.fineAmount += sf.fineAmount

      if (sf.status === "paid") acc.paidCount++
      else if (sf.status === "partial") acc.partialCount++
      else if (sf.status === "overpaid") acc.overpaidCount++
      else acc.unpaidCount++

      return acc
    },
    {
      totalFees: 0,
      collectedFees: 0,
      pendingFees: 0,
      discountAmount: 0,
      fineAmount: 0,
      paidCount: 0,
      partialCount: 0,
      unpaidCount: 0,
      overpaidCount: 0,
    }
  )
}
