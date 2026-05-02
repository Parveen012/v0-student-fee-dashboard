// API Types matching the OpenAPI schema

// Base types
export interface Tenant {
  id: number
  name: string
  domain: string
}

export interface Session {
  id: number
  tenantId: number
  name: string
  startDate: string
  endDate: string
  isActive?: boolean
}

export interface Class {
  id: number
  tenantId: number
  name: string
  section: string
}

export interface Parent {
  id: number
  tenantId: number
  name: string
  phone: string
  email: string
}

export interface Student {
  id: number
  tenantId: number
  firstName: string
  lastName: string
  dob: string | null
  gender: string
  classId: number | null
  admissionDate: string
  status: "active" | "inactive" | "graduated" | "transferred"
  // Computed/joined fields
  class?: Class
  parent?: Parent
  studentFees?: StudentFee[]
  studentDiscounts?: StudentDiscount[]
  studentFines?: StudentFine[]
}

export interface FeeComponent {
  id: number
  tenantId: number
  name: string
  type: "tuition" | "transport" | "lab" | "library" | "sports" | "exam" | "other"
}

export interface FeeStructure {
  id: number
  tenantId: number
  classId: number
  sessionId: number
  // Joined fields
  class?: Class
  session?: Session
  feeStructureComponents?: FeeStructureComponent[]
}

export interface FeeStructureComponent {
  id: number
  feeStructureId: number
  feeComponentId: number
  amount: number
  feeComponent?: FeeComponent
}

export interface StudentFee {
  id: number
  studentId: number
  feeStructureId: number
  totalAmount: number
  discountAmount: number
  fineAmount: number
  netAmount: number
  paidAmount: number
  balance: number
  status: "unpaid" | "partial" | "paid" | "overpaid"
  // Joined fields
  student?: Student
  feeStructure?: FeeStructure
  installments?: Installment[]
  payments?: Payment[]
}

export interface Installment {
  id: number
  studentFeeId: number
  name: string
  amount: number
  dueDate: string
  paidAmount: number
  balance: number
  status: "unpaid" | "partial" | "paid" | "overdue"
  paidDate?: string
}

export interface Payment {
  id: number
  studentFeeId: number
  installmentId: number | null
  studentId: number
  tenantId: number
  amountPaid: number
  paymentDate: string
  mode: "cash" | "upi" | "card" | "bank_transfer" | "cheque" | "online"
  transactionId: string | null
  status?: "completed" | "pending" | "failed" | "refunded"
  // Joined fields
  student?: Student
  installment?: Installment
}

export interface Discount {
  id: number
  tenantId: number
  name: string
  amountOrPercentage: number
  isPercentage: boolean
}

export interface StudentDiscount {
  id: number
  studentId: number
  discountId: number
  reason: string
  appliedAmount?: number
  // Joined fields
  student?: Student
  discount?: Discount
}

export interface Fine {
  id: number
  tenantId: number
  name: string
  amount: number
  gracePeriodDays: number
}

export interface StudentFine {
  id: number
  studentId: number
  fineId: number
  installmentId: number | null
  isPaid: boolean
  appliedDate?: string
  // Joined fields
  student?: Student
  fine?: Fine
  installment?: Installment
}

// Command types for API requests
export interface CreateClassCommand {
  tenantId: number
  name: string
  section: string
}

export interface CreateDiscountCommand {
  tenantId: number
  name: string
  amountOrPercentage: number
  isPercentage: boolean
}

export interface CreateFeeComponentCommand {
  tenantId: number
  name: string
  type: string
}

export interface CreateFeeStructureCommand {
  tenantId: number
  classId: number
  sessionId: number
}

export interface CreateFineCommand {
  tenantId: number
  name: string
  amount: number
  gracePeriodDays: number
}

export interface CreateParentCommand {
  tenantId: number
  name: string
  phone: string
  email: string
}

export interface CreatePaymentCommand {
  studentFeeId: number
  installmentId: number | null
  amountPaid: number
  paymentDate: string
  mode: string
  transactionId: string | null
  studentId: number
  tenantId: number
}

export interface CreateSessionCommand {
  tenantId: number
  name: string
  startDate: string
  endDate: string
}

export interface CreateStudentCommand {
  tenantId: number
  firstName: string
  lastName: string
  dob: string | null
  gender: string
  classId: number | null
  admissionDate: string
  status: string
}

export interface UpdateStudentCommand extends CreateStudentCommand {
  id: number
}

export interface CreateStudentDiscountCommand {
  studentId: number
  discountId: number
  reason: string
}

export interface CreateStudentFineCommand {
  studentId: number
  fineId: number
  installmentId: number | null
  isPaid: boolean
}

export interface UpdateStudentFineCommand extends CreateStudentFineCommand {
  id: number
}

export interface CreateTenantCommand {
  name: string
  domain: string
}

// Utility types for UI
export type PaymentStatus = "completed" | "pending" | "failed" | "refunded"
export type FeeStatus = "unpaid" | "partial" | "paid" | "overpaid" | "overdue"
export type InstallmentStatus = "unpaid" | "partial" | "paid" | "overdue"

// Dashboard statistics
export interface DashboardStats {
  totalStudents: number
  totalFees: number
  collectedFees: number
  pendingFees: number
  overdueAmount: number
  paidStudents: number
  pendingStudents: number
  overdueStudents: number
}

// Monthly collection for charts
export interface MonthlyCollection {
  month: string
  collected: number
  pending: number
}

// Class-wise collection for reports
export interface ClassWiseCollection {
  className: string
  totalFee: number
  collected: number
  pending: number
  collectionRate: number
}

// Fee generation request
export interface GenerateFeeRequest {
  sessionId: number
  classIds: number[]
  installmentCount: number
  installmentNames: string[]
  dueDates: string[]
}
