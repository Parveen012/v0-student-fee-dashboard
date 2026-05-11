// API Client for Fee Management System
// Maps to the backend API endpoints

import type {
  Student,
  Class,
  Session,
  FeeStructure,
  FeeComponent,
  FeeComponentDto,
  StudentFeeDetail,
  FeeStructuresGenerateResponse,
  Payment,
  Discount,
  DiscountType,
  DiscountPolicy,
  Fine,
  FinePolicy,
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
  AllocatePaymentCommand,
  ManualAllocationLineDto,
  CreateDiscountCommand,
  CreateDiscountTypeCommand,
  CreateDiscountPolicyCommand,
  CreateFineCommand,
  CreateStudentDiscountCommand,
  CreateStudentFineCommand,
  UpdateStudentFineCommand,
  Parent,
  CreateParentCommand,
  StudentParent,
  CreateStudentParentCommand,
  CreateGroupPaymentCommand,
  CreateClassFeeStructureComponentCommand,
  Invoice,
  InvoiceDetail,
  GenerateFeeStructureCommand,
  GenerateStudentFeeCommand,
  GenerateClassFeeCommand,
} from "./types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api"
const API_KEY = process.env.NEXT_PUBLIC_API_KEY
const API_KEY_HEADER = process.env.NEXT_PUBLIC_API_KEY_HEADER || "X-API-KEY"
const DEFAULT_TENANT_ID =
  process.env.NEXT_PUBLIC_TENANT_ID &&
  !Number.isNaN(Number(process.env.NEXT_PUBLIC_TENANT_ID))
    ? Number(process.env.NEXT_PUBLIC_TENANT_ID)
    : 1

type GenerateFeeStructureClass = GenerateFeeStructureCommand["classes"][number]

type PaymentSubmissionInput = {
  studentId: number
  sessionId?: number
  amount?: number
  paymentDate?: string
  paymentMode?: number | string
  paymentMethod?: number | string
  referenceNo?: string
  notes?: string
  remark?: string
  parentId?: number
  allowManualOverride?: boolean
  addOverpaymentToWallet?: boolean
  walletAdjustmentAmount?: number
  manualAllocations?: ManualAllocationLineDto[]
  allocations?: ManualAllocationLineDto[]
  mode?: string
  transactionId?: string | null
  studentFeeId?: number
  amountPaid?: number
  paymentType?: "full" | "installment"
  installmentId?: number | null
  installments?: number[]
  tenantId?: number
}

type PaymentFeeLookup = {
  sessionId?: number
  studentId?: number
}

function normalizePaymentMode(value: number | string | undefined): AllocatePaymentCommand["paymentMode"] {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value as AllocatePaymentCommand["paymentMode"]
  }

  switch (String(value || "upi").toLowerCase()) {
    case "cash":
      return 2
    case "card":
      return 3
    case "bank_transfer":
    case "bank transfer":
      return 4
    case "cheque":
      return 5
    case "online":
      return 6
    case "upi":
    default:
      return 1
  }
}

function buildAllocatePaymentCommand(data: PaymentSubmissionInput): AllocatePaymentCommand {
  return {
    studentId: data.studentId,
    sessionId: data.sessionId ?? 0,
    amount: Number(data.amount ?? data.amountPaid ?? 0),
    paymentDate: data.paymentDate ? new Date(data.paymentDate).toISOString() : new Date().toISOString(),
    paymentMode: normalizePaymentMode(data.paymentMode ?? data.paymentMethod ?? data.mode),
    referenceNo: data.referenceNo ?? data.transactionId ?? undefined,
    notes: data.notes ?? data.remark ?? undefined,
    parentId: data.parentId,
    allowManualOverride: data.allowManualOverride ?? false,
    addOverpaymentToWallet: data.addOverpaymentToWallet ?? false,
    walletAdjustmentAmount: Number(data.walletAdjustmentAmount ?? 0),
    manualAllocations: data.manualAllocations ?? data.allocations ?? [],
  }
}

async function resolvePaymentSessionId(data: PaymentSubmissionInput): Promise<number> {
  if (typeof data.sessionId === "number" && data.sessionId > 0) {
    return data.sessionId
  }

  if (typeof data.studentFeeId === "number" && data.studentFeeId > 0) {
    try {
      const fee = await studentFeesApi.getById(data.studentFeeId)
      if (typeof fee.sessionId === "number" && fee.sessionId > 0) {
        return fee.sessionId
      }
    } catch {
      // Fall through to student-based lookup.
    }
  }

  if (typeof data.studentId === "number" && data.studentId > 0) {
    try {
      const fee = await studentFeesApi.getByStudentId(data.studentId)
      if (typeof fee.sessionId === "number" && fee.sessionId > 0) {
        return fee.sessionId
      }
    } catch {
      // Keep the safe fallback below.
    }
  }

  return 0
}

function withTenantId<T extends { tenantId?: number }>(data: T): T & { tenantId: number } {
  if (typeof data.tenantId === "number") return data as T & { tenantId: number }
  return { ...data, tenantId: DEFAULT_TENANT_ID }
}

type ApiEnvelope<T> = {
  data?: T
  isSuccess?: boolean
  messages?: string[]
  exception?: string | null
  statusCode?: number
}

function isApiEnvelope<T>(value: unknown): value is ApiEnvelope<T> {
  if (!value || typeof value !== "object") return false
  const record = value as Record<string, unknown>
  return "data" in record || "isSuccess" in record || "statusCode" in record
}

function buildDefaultInstallments(
  installmentCount: number,
  components: GenerateFeeStructureClass["components"]
): NonNullable<GenerateFeeStructureClass["installments"]> {
  const totalAmount = components.reduce((sum, component) => sum + Number(component.amount || 0), 0)
  const baseAmount = Math.floor(totalAmount / installmentCount)
  const now = new Date()

  return Array.from({ length: installmentCount }, (_, index) => {
    const installmentNo = index + 1
    const dueDate = new Date(now)
    dueDate.setMonth(dueDate.getMonth() + index)

    return {
      name: installmentCount === 1 ? "Full Payment" : `Installment ${installmentNo}`,
      dueDate: dueDate.toISOString(),
      amount:
        installmentNo === installmentCount
          ? totalAmount - baseAmount * (installmentCount - 1)
          : baseAmount,
    }
  })
}

function normalizeGenerateFeeStructureCommand(
  data: GenerateFeeStructureCommand
): GenerateFeeStructureCommand {
  const installmentCount = Number(data.installmentCount || 0)

  return {
    ...data,
    classes: data.classes.map((classItem) => ({
      ...classItem,
      installments:
        classItem.installments?.length
          ? classItem.installments
          : installmentCount > 0
          ? buildDefaultInstallments(installmentCount, classItem.components)
          : [],
    })),
  }
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
    const errorText = await response.text()
    let message = errorText || `API Error: ${response.status}`

    if (errorText) {
      try {
        const parsed = JSON.parse(errorText)
        message = parsed.message || parsed.title || parsed.error || message
      } catch {
        // Keep raw text when the server does not return JSON.
      }
    }

    throw new Error(message)
  }

  // Handle empty responses
  const text = await response.text()
  if (!text) return {} as T
  const parsed = JSON.parse(text) as unknown
  if (isApiEnvelope<T>(parsed)) {
    if (parsed.isSuccess === false) {
      const message = parsed.exception || parsed.messages?.[0]
      throw new Error(message || `API Error: ${response.status}`)
    }
    return (parsed.data ?? {}) as T
  }

  return parsed as T
}

// ============ Classes API ============
export const classesApi = {
  getAll: () => fetchApi<Class[]>("/Class"),
  getById: (id: number) => fetchApi<Class>(`/Class/${id}`),
  create: (data: CreateClassCommand) =>
    fetchApi<Class>("/Class", {
      method: "POST",
      body: JSON.stringify(withTenantId(data)),
    }),
  delete: (id: number) =>
    fetchApi<void>(`/Class/${id}`, { method: "DELETE" }),
}

// ============ Sessions API ============
export const sessionsApi = {
  getAll: () => fetchApi<Session[]>("/Session"),
  getById: (id: number) => fetchApi<Session>(`/Session/${id}`),
  create: (data: CreateSessionCommand) =>
    fetchApi<Session>("/Session", {
      method: "POST",
      body: JSON.stringify(withTenantId(data)),
    }),
  delete: (id: number) =>
    fetchApi<void>(`/Session/${id}`, { method: "DELETE" }),
}

// ============ Students API ============
export const studentsApi = {
  getAll: () => fetchApi<Student[]>("/Student"),
  getById: (id: number) => fetchApi<Student>(`/Student/${id}`),
  create: (data: CreateStudentCommand) =>
    fetchApi<Student>("/Student", {
      method: "POST",
      body: JSON.stringify(withTenantId(data)),
    }),
  update: (id: number, data: UpdateStudentCommand) =>
    fetchApi<Student>(`/Student/${id}`, {
      method: "PUT",
      body: JSON.stringify(withTenantId(data)),
    }),
  delete: (id: number) =>
    fetchApi<void>(`/Student/${id}`, { method: "DELETE" }),
}

// ============ Parents API ============
export const parentsApi = {
  getAll: () => fetchApi<Parent[]>("/Parent"),
  create: (data: CreateParentCommand) =>
    fetchApi<Parent>("/Parent", {
      method: "POST",
      body: JSON.stringify(withTenantId(data)),
    }),
}

// ============ Student Parents API ============
export const studentParentsApi = {
  getByStudentId: async (studentId: number) => {
    return fetchApi<StudentParent[]>(`/StudentParent/paged?StudentId=${studentId}`)
  },
  create: (data: CreateStudentParentCommand) =>
    fetchApi<StudentParent>("/StudentParent", {
      method: "POST",
      body: JSON.stringify(withTenantId(data)),
    }),
  delete: (id: number) =>
    fetchApi<void>(`/StudentParent/${id}`, { method: "DELETE" }),
}

// ============ Fee Components API ============
export const feeComponentsApi = {
  getAll: () => fetchApi<FeeComponent[]>("/FeeComponent"),
  getById: (id: number) => fetchApi<FeeComponent>(`/FeeComponent/${id}`),
  create: (data: CreateFeeComponentCommand) =>
    fetchApi<FeeComponent>("/FeeComponent", {
      method: "POST",
      body: JSON.stringify(withTenantId(data)),
    }),
  update: (id: number, data: CreateFeeComponentCommand) =>
    fetchApi<FeeComponent>(`/FeeComponent/${id}`, {
      method: "PUT",
      body: JSON.stringify(withTenantId(data)),
    }),
  delete: (id: number) =>
    fetchApi<void>(`/FeeComponent/${id}`, { method: "DELETE" }),
}

// ============ Fee Structures API ============
export const feeStructuresApi = {
  getAll: () => fetchApi<FeeStructure[]>("/ClassFeeStructure"),
  getById: (id: number) => fetchApi<FeeStructure>(`/ClassFeeStructure/${id}`),
  create: (data: CreateFeeStructureCommand) =>
    fetchApi<FeeStructure>("/ClassFeeStructure", {
      method: "POST",
      body: JSON.stringify(withTenantId(data)),
    }),
  generate: (data: GenerateFeeStructureCommand) =>
    fetchApi<FeeStructuresGenerateResponse>("/FeeGeneration/generate-class", {
      method: "POST",
      body: JSON.stringify(withTenantId(normalizeGenerateFeeStructureCommand(data))),
    }),
  delete: (id: number) =>
    fetchApi<void>(`/ClassFeeStructure/${id}`, { method: "DELETE" }),
}

export const feeGenerationApi = {
  generateStudent: (data: GenerateStudentFeeCommand) =>
    fetchApi<unknown>("/FeeGeneration/generate-student", {
      method: "POST",
      body: JSON.stringify(withTenantId(data)),
    }),
  generateClass: (data: GenerateClassFeeCommand) =>
    fetchApi<unknown>("/FeeGeneration/generate-class", {
      method: "POST",
      body: JSON.stringify(withTenantId(data)),
    }),
}

// ============ Fee Structure Components API ============
export const feeStructureComponentsApi = {
  create: (data: CreateClassFeeStructureComponentCommand) =>
    fetchApi<void>("/ClassFeeStructure/components", {
      method: "POST",
      body: JSON.stringify(withTenantId(data)),
    }),
  update: (id: number, data: Partial<CreateClassFeeStructureComponentCommand>) =>
    fetchApi<void>(`/ClassFeeStructure/components/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    fetchApi<void>(`/ClassFeeStructure/components/${id}`, { method: "DELETE" }),
}

// ============ Student Fees API ============
type StudentFeeApiDetail = {
  id?: number
  studentFeeId?: number
  feeComponentId?: number
  feeComponentName?: string
  feeComponentCode?: string
  isTransportRelated?: boolean
  frequency?: string
  amount?: number
  discountAmount?: number
  fineAmount?: number
  paidAmount?: number
  netAmount?: number
  status?: number | string
}

type StudentFeeApiResponse = {
  id?: number
  tenantId?: number
  studentId?: number
  student?: Student
  sessionId?: number
  sessionName?: string
  classFeeStructureId?: number
  classFeeStructureName?: string
  totalAmount?: number
  discountAmount?: number
  fineAmount?: number
  paidAmount?: number
  dueAmount?: number
  status?: number | string
  billPeriodYear?: number
  billPeriodMonth?: number
  generatedDate?: string
  details?: StudentFeeApiDetail[]
  feeStructureId?: number
  feeStructure?: string
  remainingAmount?: number
  installments?: Installment[]
  payments?: Payment[]
}

export const studentFeesApi = {
  getAll: async () => {
    const data = await fetchApi<StudentFeeApiResponse[]>("/StudentFee")
    return data.map(normalizeStudentFee)
  },
  getById: async (id: number) => {
    const data = await fetchApi<StudentFeeApiResponse>(`/StudentFee/${id}`)
    return normalizeStudentFee(data)
  },
  getByStudentId: async (studentId: number) => {
    let lastError: unknown = null

    try {
      const data = await fetchApi<
        StudentFeeApiResponse | StudentFeeApiResponse[]
      >(`/StudentFees/${studentId}`)
      // Handle both single object and array responses
      const fee = Array.isArray(data) ? data[0] : data
      if (fee) return await enrichStudentFeeWithStudentFallback(studentId, normalizeStudentFee(fee))
    } catch (err) {
      lastError = err
    }

    try {
      const fees = await fetchApi<StudentFeeApiResponse[]>("/StudentFee")
      const match = fees.find((fee) => fee.studentId === studentId)
      if (match) return await enrichStudentFeeWithStudentFallback(studentId, normalizeStudentFee(match))
    } catch (err) {
      lastError = err
    }

    if (lastError instanceof Error) throw lastError
    throw new Error("Failed to load student fee.")
  },
}

async function enrichStudentFeeWithStudentFallback(
  studentId: number,
  fee: StudentFee
): Promise<StudentFee> {
  if (fee.installments?.length) return fee

  try {
    const student = await studentsApi.getById(studentId)
    const fallbackFee =
      student.studentFees?.find((item) => item.id === fee.id) ||
      student.studentFees?.find((item) => item.studentId === studentId) ||
      student.studentFees?.[0]

    if (fallbackFee?.installments?.length) {
      return {
        ...fee,
        installments: fallbackFee.installments,
      }
    }
  } catch {
    // Keep the direct fee payload when the student lookup is unavailable.
  }

  return fee
}

function normalizeStudentFee(raw: StudentFeeApiResponse): StudentFee {
  const totalAmount = Number(raw.totalAmount ?? 0)
  const discountAmount = Number(raw.discountAmount ?? 0)
  const fineAmount = Number(raw.fineAmount ?? 0)
  const paidAmount = Number(raw.paidAmount ?? 0)
  const netAmount = Number(raw.totalAmount ?? 0) - Number(raw.discountAmount ?? 0) + Number(raw.fineAmount ?? 0)
  const dueAmount =
    typeof raw.dueAmount === "number"
      ? raw.dueAmount
      : typeof raw.remainingAmount === "number"
      ? raw.remainingAmount
      : Math.max(0, netAmount - paidAmount)
  const balance = dueAmount
  const details = (raw.details || []).map((detail) => normalizeStudentFeeDetail(detail))
  const legacyInstallments =
    raw.installments?.length
      ? raw.installments
      : details.map((detail) => mapStudentFeeDetailToInstallment(detail, raw))

  return {
    id: raw.id ?? 0,
    tenantId: raw.tenantId,
    studentId: raw.studentId ?? 0,
    student: raw.student,
    sessionId: raw.sessionId,
    sessionName: raw.sessionName,
    classFeeStructureId: raw.classFeeStructureId ?? raw.feeStructureId ?? 0,
    classFeeStructureName: raw.classFeeStructureName ?? raw.feeStructure ?? "",
    totalAmount,
    discountAmount,
    fineAmount,
    netAmount,
    paidAmount,
    dueAmount,
    balance,
    status: normalizeStudentFeeStatus(raw.status, paidAmount, dueAmount),
    billPeriodYear: raw.billPeriodYear,
    billPeriodMonth: raw.billPeriodMonth,
    generatedDate: raw.generatedDate,
    feeStructureId: raw.feeStructureId ?? raw.classFeeStructureId,
    feeStructure: raw.feeStructure ?? raw.classFeeStructureName,
    remainingAmount: dueAmount,
    installments: legacyInstallments,
    payments: raw.payments ?? [],
    details,
  }
}

function normalizeStudentFeeDetail(raw: StudentFeeApiDetail): StudentFeeDetail {
  return {
    id: raw.id ?? 0,
    studentFeeId: raw.studentFeeId ?? 0,
    feeComponentId: raw.feeComponentId ?? 0,
    feeComponentName: raw.feeComponentName ?? "Fee Component",
    feeComponentCode: raw.feeComponentCode,
    isTransportRelated: raw.isTransportRelated,
    frequency: raw.frequency,
    amount: Number(raw.amount ?? 0),
    discountAmount: Number(raw.discountAmount ?? 0),
    fineAmount: Number(raw.fineAmount ?? 0),
    paidAmount: Number(raw.paidAmount ?? 0),
    netAmount: Number(raw.netAmount ?? Number(raw.amount ?? 0) - Number(raw.discountAmount ?? 0) + Number(raw.fineAmount ?? 0)),
    status: normalizeStudentFeeDetailStatus(raw.status),
  }
}

function mapStudentFeeDetailToInstallment(detail: StudentFeeDetail, fee: StudentFeeApiResponse): Installment {
  const dueDate = buildLegacyInstallmentDueDate(fee.billPeriodYear, fee.billPeriodMonth, fee.generatedDate)
  return {
    id: detail.id,
    studentFeeId: detail.studentFeeId,
    name: detail.feeComponentName,
    amount: detail.amount,
    dueDate,
    paidAmount: detail.paidAmount,
    balance: Math.max(0, detail.netAmount - detail.paidAmount),
    status: normalizeInstallmentStatus(detail.status),
    paidDate: detail.status === "paid" ? fee.generatedDate : undefined,
  }
}

function buildLegacyInstallmentDueDate(
  billPeriodYear?: number,
  billPeriodMonth?: number,
  fallbackDate?: string
): string {
  if (typeof billPeriodYear === "number" && typeof billPeriodMonth === "number") {
    return new Date(billPeriodYear, billPeriodMonth - 1, 1).toISOString()
  }

  return fallbackDate || new Date().toISOString()
}

function normalizeStudentFeeStatus(
  status: number | string | undefined,
  paidAmount: number,
  dueAmount: number
): StudentFee["status"] {
  if (typeof status === "number") {
    if (status === 0) return "unpaid"
    if (status === 1) return "partial"
    if (status === 2) return "paid"
    if (status === 3) return "overdue"
  }

  if (typeof status === "string") {
    const normalized = status.toLowerCase()
    if (normalized === "0") return "unpaid"
    if (normalized === "1") return "partial"
    if (normalized === "2") return "paid"
    if (normalized === "3") return "overdue"
    if (normalized === "paid") return "paid"
    if (normalized === "partial") return "partial"
    if (normalized === "overpaid") return "overpaid"
    if (normalized === "overdue") return "overdue"
    if (normalized === "unpaid" || normalized === "pending") return "unpaid"
  }

  if (dueAmount <= 0) return paidAmount > 0 ? "paid" : "unpaid"
  if (paidAmount > 0) return "partial"
  return "unpaid"
}

function normalizeStudentFeeDetailStatus(status: number | string | undefined): StudentFee["status"] {
  if (typeof status === "number") {
    if (status === 0) return "unpaid"
    if (status === 1) return "partial"
    if (status === 2) return "paid"
    if (status === 3) return "overdue"
  }

  if (typeof status === "string") {
    const normalized = status.toLowerCase()
    if (normalized === "0" || normalized === "unpaid" || normalized === "pending") return "unpaid"
    if (normalized === "1" || normalized === "partial") return "partial"
    if (normalized === "2" || normalized === "paid") return "paid"
    if (normalized === "3" || normalized === "overdue") return "overdue"
    if (normalized === "overpaid") return "overpaid"
  }

  return "unpaid"
}

function normalizeInstallmentStatus(status: StudentFee["status"]): Installment["status"] {
  if (status === "paid") return "paid"
  if (status === "partial") return "partial"
  if (status === "overdue") return "overdue"
  return "unpaid"
}

// ============ Payments API ============
export const paymentsApi = {
  getAll: () => fetchApi<Payment[]>("/Payment"),
  create: async (data: PaymentSubmissionInput) =>
    fetchApi<void>("/PaymentAllocation/allocate", {
      method: "POST",
      body: JSON.stringify(buildAllocatePaymentCommand({
        ...data,
        sessionId: await resolvePaymentSessionId(data),
      })),
    }),
}

// ============ Group Payments API ============
export const groupPaymentsApi = {
  create: (data: CreateGroupPaymentCommand) =>
    fetchApi<void>("/Payment", {
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
// ============ Discount Types API ============
export const discountTypesApi = {
  getAll: () => fetchApi<DiscountType[]>("/DiscountType"),
  getById: (id: number) => fetchApi<DiscountType>(`/DiscountType/${id}`),
  create: (data: CreateDiscountTypeCommand) =>
    fetchApi<DiscountType>("/DiscountType", {
      method: "POST",
      body: JSON.stringify(withTenantId(data)),
    }),
  delete: (id: number) =>
    fetchApi<void>(`/DiscountType/${id}`, { method: "DELETE" }),
}

// ============ Discount Policies API ============
export const discountPoliciesApi = {
  getAll: () => fetchApi<DiscountPolicy[]>("/DiscountPolicy"),
  getById: (id: number) => fetchApi<DiscountPolicy>(`/DiscountPolicy/${id}`),
  create: (data: CreateDiscountPolicyCommand) =>
    fetchApi<DiscountPolicy>("/DiscountPolicy", {
      method: "POST",
      body: JSON.stringify(withTenantId(data)),
    }),
  delete: (id: number) =>
    fetchApi<void>(`/DiscountPolicy/${id}`, { method: "DELETE" }),
}

// ============ Discounts API (backward compat - alias) ============
export const discountsApi = discountPoliciesApi

// ============ Student Discounts API ============
export const studentDiscountsApi = {
  getAll: () => fetchApi<StudentDiscount[]>("/StudentDiscount"),
  getById: (id: number) => fetchApi<StudentDiscount>(`/StudentDiscount/${id}`),
  create: (data: CreateStudentDiscountCommand) =>
    fetchApi<StudentDiscount>("/StudentDiscount", {
      method: "POST",
      body: JSON.stringify(withTenantId(data)),
    }),
  delete: (id: number) =>
    fetchApi<void>(`/StudentDiscount/${id}`, { method: "DELETE" }),
}

// ============ Fines API ============
export const finesApi = {
  getAll: () => fetchApi<Fine[]>("/FinePolicy"),
  getById: (id: number) => fetchApi<Fine>(`/FinePolicy/${id}`),
  create: (data: CreateFineCommand) =>
    fetchApi<Fine>("/FinePolicy", {
      method: "POST",
      body: JSON.stringify(withTenantId(data)),
    }),
  delete: (id: number) =>
    fetchApi<void>(`/FinePolicy/${id}`, { method: "DELETE" }),
}

// ============ Fine Policies API ============
export const finePoliciesApi = {
  getAll: () => fetchApi<FinePolicy[]>("/FinePolicy"),
  getById: (id: number) => fetchApi<FinePolicy>(`/FinePolicy/${id}`),
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
