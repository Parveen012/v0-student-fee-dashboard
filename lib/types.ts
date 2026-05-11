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
  mobile: string
  alternateMobile?: string
  occupation?: string
  address?: string
  phone?: string
  email: string
}

export interface Student {
  id: number
  tenantId: number
  sessionId?: number
  sessionName?: string
  admissionNo?: string
  rollNo?: string
  firstName: string
  lastName: string
  dob: string | null
  gender: string
  classId: number | null
  className?: string
  classSection?: string
  admissionDate: string
  address?: string
  mobile?: string
  email?: string
  isTransportOpted?: boolean
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
  relationType?: StudentParentRelation | string
  relation: StudentParentRelation | string
  relationship?: StudentParentRelation | string
  isFeePayer?: boolean
  IsFeePayer?: boolean
  student?: Student
  parent?: Parent
}

export interface FeeComponent {
  id: number
  tenantId?: number
  name: string
  type?: string
  amount?: number
  code?: string
  frequency?: Frequency | string
  isOptional?: boolean
  isTransportRelated?: boolean
  description?: string
}

export type Frequency = "Monthly" | "Quarterly" | "HalfYearly" | "Yearly" | "OneTime"

export interface FeeStructure {
  id: number
  tenantId: number
  classId: number
  sessionId: number
  name: string
  effectiveFrom: string
  effectiveTo: string
  class?: Class
  session?: Session
  feeStructureComponents?: FeeStructureComponent[]
  classFeeStructureComponents?: FeeStructureComponent[]
}

export interface FeeStructureComponent {
  id: number
  feeStructureId?: number
  classFeeStructureId?: number
  feeComponentId: number
  amount: number
  gstPercent?: number
  dueDay?: number
  finePolicyId?: number
  feeComponent?: FeeComponent
  finePolicy?: FinePolicy
}

export type StudentFeeStatus = "unpaid" | "partial" | "paid" | "overpaid" | "overdue"

export interface StudentFee {
  id: number
  tenantId?: number
  studentId: number
  student?: Student
  sessionId?: number
  sessionName?: string
  classFeeStructureId: number
  classFeeStructureName: string
  totalAmount: number
  discountAmount: number
  fineAmount: number
  netAmount: number
  paidAmount: number
  dueAmount: number
  balance: number
  status: StudentFeeStatus
  billPeriodYear?: number
  billPeriodMonth?: number
  generatedDate?: string
  feeStructureId?: number
  feeStructure?: string
  remainingAmount?: number
  installments?: Installment[]
  payments?: Payment[]
  details?: StudentFeeDetail[]
}

export interface StudentFeeDetail {
  id: number
  studentFeeId: number
  feeComponentId: number
  feeComponentName: string
  feeComponentCode?: string
  isTransportRelated?: boolean
  frequency?: string
  amount: number
  discountAmount: number
  fineAmount: number
  paidAmount: number
  netAmount: number
  status: StudentFeeStatus
}

export type FeeComponentDetail = StudentFeeDetail

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

export interface DiscountType {
  id: number
  tenantId: number
  name: string
  isAutoApply: boolean
  description?: string
  discountPolicies?: DiscountPolicy[]
}

export interface DiscountPolicy {
  id: number
  tenantId: number
  discountTypeId: number
  amount?: number
  percentage?: number
  isPercentage: boolean
  startDate: string
  endDate: string
  discountType?: DiscountType
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
  discountPolicyId: number
  approvedBy?: number
  reason?: string
  appliedDate?: string
  student?: Student
  discountPolicy?: DiscountPolicy
}

export interface Fine {
  id: number
  tenantId: number
  name: string
  amount: number
  gracePeriodDays: number
}

export interface FinePolicy {
  id: number
  tenantId: number
  name: string
  fineType: string
  amount?: number
  isPercentage?: boolean
  graceDays?: number
  maxFineAmount?: number
  percentage?: number
  description?: string
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

export interface CreateDiscountTypeCommand {
  tenantId?: number
  name: string
  isAutoApply: boolean
  description?: string
}

export interface CreateDiscountPolicyCommand {
  tenantId?: number
  discountTypeId: number
  amount?: number
  percentage?: number
  isPercentage: boolean
  startDate: string
  endDate: string
}

export interface CreateStudentDiscountCommand {
  tenantId?: number
  studentId: number
  discountPolicyId: number
  approvedBy?: number
  reason?: string
}

export interface CreateFeeComponentCommand {
  tenantId?: number
  name: string
  code?: string
  type?: string
  amount?: number
  frequency: Frequency | string
  isOptional?: boolean
  isTransportRelated?: boolean
  description?: string
}

export interface FeeComponentDto {
  id: number
  name: string
  amount: number
  frequency: Frequency
}

export interface GenerateFeeRequest {
  tenantId?: number
  studentId: number
  installmentCount: number
  components: Array<{
    componentId: number
  }>
}

export interface FeeGenerationInstallmentDto {
  installmentNo: number
  amount: number
  dueDate?: string
  remainingBalance?: number
}

export interface FeeGenerationResponse {
  totalAmount: number
  yearlyAmount?: number
  remainingBalance?: number
  installments: FeeGenerationInstallmentDto[]
}

export interface FeeGenerationFailedRecord {
  studentId: number
  classId: number
  reason: string
}

export interface FeeGenerationValidationResponse {
  successCount: number
  skippedCount: number
  failedRecords: FeeGenerationFailedRecord[]
  message: string
  isSuccess: boolean
}

export type FeeStructuresGenerateResponse = FeeGenerationResponse | FeeGenerationValidationResponse

export interface CreateFeeStructureCommand {
  tenantId?: number
  classId: number
  sessionId: number
  name: string
  effectiveFrom: string
  effectiveTo: string
}

export interface GenerateFeeStructureCommand {
  tenantId?: number
  sessionId: number
  installmentCount?: number
  classes: Array<{
    classId: number
    studentIds: number[]
    components: Array<{
      componentId: number
      amount?: number
    }>
    installments?: Array<{
      name: string
      dueDate: string
      amount: number
    }>
  }>
}

export interface GenerateStudentFeeCommand {
  tenantId?: number
  sessionId: number
  studentId: number
  billingDate: string
  includeTransportFee: boolean
  applyFine: boolean
  fineAssessmentDate: string
}

export interface GenerateClassFeeCommand {
  tenantId?: number
  sessionId: number
  classId: number
  billingDate: string
  includeTransportFee: boolean
  applyFine: boolean
  fineAssessmentDate: string
}

export interface CreateFineCommand {
  tenantId?: number
  name: string
  amount: number
  gracePeriodDays: number
}

export interface CreateClassFeeStructureComponentCommand {
  tenantId?: number
  classFeeStructureId: number
  feeComponentId: number
  amount: number
  gstPercent?: number
  dueDay?: number
  finePolicyId?: number
}

export interface CreateParentCommand {
  tenantId?: number
  name: string
  mobile: string
  alternateMobile: string
  occupation: string
  address: string
  email: string
}

export interface CreateStudentParentCommand {
  tenantId?: number
  studentId: number
  parentId: number
  relationType: StudentParentRelation
}

export interface ManualAllocationLineDto {
  studentFeeDetailId: number
  amount: number
}

export interface AllocatePaymentCommand {
  studentId: number
  sessionId: number
  amount: number
  paymentDate: string
  paymentMode: number
  referenceNo?: string
  notes?: string
  parentId?: number
  allowManualOverride: boolean
  addOverpaymentToWallet: boolean
  walletAdjustmentAmount: number
  manualAllocations: ManualAllocationLineDto[]
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
  sessionId: number
  admissionNo: string
  rollNo: string
  firstName: string
  lastName: string
  dob: string | null
  gender: string
  classId: number | null
  address: string
  mobile: string
  email: string
  isTransportOpted: boolean
  admissionDate: string
  status: Student["status"]
}

export interface UpdateStudentCommand extends Partial<CreateStudentCommand> {}

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
