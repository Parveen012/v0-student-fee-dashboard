export type FeeStatus = "unpaid" | "partial" | "paid" | "overpaid" | "overdue"
export type PaymentStatus = "completed" | "pending" | "failed" | "refunded"

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
  className?: string
  classSection?: string
  admissionDate: string
  status: "active" | "inactive" | "graduated" | "transferred"
  class?: Class
  parent?: Parent
  studentParents?: StudentParent[]
  studentFees?: StudentFee[]
  studentDiscounts?: StudentDiscount[]
  studentFines?: StudentFine[]
}

export type StudentParentRelation = "Father" | "Mother" | "Guardian"

export interface StudentParent {
  id: number
  tenantId?: number
  studentId: number
  parentId: number
  relation: StudentParentRelation | string
  relationship?: StudentParentRelation | string
  isFeePayer?: boolean
  IsFeePayer?: boolean
  student?: Student
  parent?: Parent
}

export interface FeeComponent {
  id: number
  tenantId: number
  name: string
  type: string
}

export interface FeeStructure {
  id: number
  tenantId: number
  classId: number
  sessionId: number
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
  remainingAmount?: number
  balance: number
  status: "unpaid" | "partial" | "paid" | "overpaid"
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
  paymentType?: "full" | "installment"
  mode: "cash" | "upi" | "card" | "bank_transfer" | "cheque" | "online"
  transactionId: string | null
  status?: PaymentStatus
  studentName?: string
  className?: string
  sessionName?: string
  student?: Student
  installment?: Installment
}

export interface Discount {
  id: number
  tenantId: number
  name: string
  amountOrPercentage: number
  isPercentage: boolean
  discountType?: DiscountCategory | string
}

export type DiscountCategory = "sibling" | "manual" | "scholarship" | "early_payment"

// Allow discount records to optionally include a category/type
export interface DiscountWithType extends Discount {
  discountType?: DiscountCategory | string
}

export interface StudentDiscount {
  id: number
  studentId: number
  discountId: number
  reason: string
  appliedAmount?: number
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
  student?: Student
  fine?: Fine
  installment?: Installment
}

export interface Invoice {
  id: number
  tenantId?: number
  studentId?: number
  invoiceNumber?: string
  invoiceDate?: string
  totalAmount?: number
  status?: string
  student?: Student
}

export interface InvoiceDetail {
  id: number
  invoiceId: number
  description?: string
  feeComponentName?: string
  amount?: number
  quantity?: number
  invoice?: Invoice
}

export interface DashboardStats {
  totalStudents: number
  totalFees: number
  collectedFees: number
  pendingFees: number
  overdueAmount: number
  paidStudents: number
  pendingStudents: number
  overdueStudents: number
  totalCollected?: number
  pendingAmount?: number
  collectionRate?: number
}

export interface MonthlyCollection {
  month: string
  collected: number
  pending: number
}

export interface CreateClassCommand {
  tenantId?: number
  name: string
  section: string
}

export interface CreateDiscountCommand {
  tenantId?: number
  name: string
  amountOrPercentage: number
  isPercentage: boolean
  discountType?: DiscountCategory | string
}


export interface CreateFeeComponentCommand {
  tenantId?: number
  name: string
  type: string
}

export interface CreateFeeStructureCommand {
  tenantId?: number
  classId: number
  sessionId: number
}

export interface GenerateFeeStructureCommand {
  tenantId?: number
  sessionId: number
  classes: Array<{
    classId: number
    studentIds: number[]
    components: Array<{
      componentId: number
      amount: number
    }>
    installments: Array<{
      name: string
      dueDate: string
      amount: number
    }>
  }>
}

export interface CreateFineCommand {
  tenantId?: number
  name: string
  amount: number
  gracePeriodDays: number
}

export interface CreateParentCommand {
  tenantId?: number
  name: string
  phone: string
  email: string
}

export interface CreateStudentParentCommand {
  tenantId?: number
  studentId: number
  parentId: number
  relation: StudentParentRelation
  relationship?: StudentParentRelation
  isFeePayer: boolean
}

export interface CreatePaymentCommand {
  studentFeeId: number
  installmentId?: number | null
  amountPaid: number
  paymentDate?: string
  paymentType?: "full" | "installment"
  mode?: string
  transactionId?: string | null
  studentId: number
  tenantId?: number
  installments?: number[]
}

export interface CreateGroupPaymentCommand {
  tenantId?: number
  amountPaid: number
  studentIds: number[]
  payments?: Array<{
    studentId: number
    studentFeeId: number
    amountPaid?: number
    installments?: number[]
  }>
}

export interface CreateSessionCommand {
  tenantId?: number
  name: string
  startDate: string
  endDate: string
  isActive?: boolean
}

export interface CreateStudentCommand {
  tenantId?: number
  firstName: string
  lastName: string
  dob: string | null
  gender: string
  classId: number | null
  admissionDate: string
  status: Student["status"]
}

export interface UpdateStudentCommand extends Partial<CreateStudentCommand> {}

export interface CreateStudentDiscountCommand {
  tenantId?: number
  studentId: number
  discountId: number
  reason: string
}

export interface CreateStudentFineCommand {
  tenantId?: number
  studentId: number
  fineId: number
  installmentId: number | null
  isPaid?: boolean
}

export interface UpdateStudentFineCommand {
  tenantId?: number
  studentId?: number
  fineId?: number
  installmentId?: number | null
  isPaid?: boolean
}
