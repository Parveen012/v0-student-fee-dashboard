// Mock data simulating API responses
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
  Parent,
  DashboardStats,
  MonthlyCollection,
  ClassWiseCollection,
} from "./types"

// Tenant ID (simulating single-tenant for demo)
export const TENANT_ID = 1

// Sessions
export const sessions: Session[] = [
  { id: 1, tenantId: 1, name: "2024-25", startDate: "2024-04-01", endDate: "2025-03-31", isActive: true },
  { id: 2, tenantId: 1, name: "2023-24", startDate: "2023-04-01", endDate: "2024-03-31", isActive: false },
]

// Classes
export const classes: Class[] = [
  { id: 1, tenantId: 1, name: "6th Grade", section: "A" },
  { id: 2, tenantId: 1, name: "6th Grade", section: "B" },
  { id: 3, tenantId: 1, name: "7th Grade", section: "A" },
  { id: 4, tenantId: 1, name: "7th Grade", section: "B" },
  { id: 5, tenantId: 1, name: "8th Grade", section: "A" },
  { id: 6, tenantId: 1, name: "8th Grade", section: "B" },
  { id: 7, tenantId: 1, name: "8th Grade", section: "C" },
  { id: 8, tenantId: 1, name: "9th Grade", section: "A" },
  { id: 9, tenantId: 1, name: "9th Grade", section: "B" },
  { id: 10, tenantId: 1, name: "10th Grade", section: "A" },
  { id: 11, tenantId: 1, name: "10th Grade", section: "B" },
]

// Parents
export const parents: Parent[] = [
  { id: 1, tenantId: 1, name: "Rajesh Sharma", phone: "+91 98765 43210", email: "rajesh.sharma@email.com" },
  { id: 2, tenantId: 1, name: "Sunita Patel", phone: "+91 98765 43211", email: "sunita.patel@email.com" },
  { id: 3, tenantId: 1, name: "Vijay Kumar", phone: "+91 98765 43212", email: "vijay.kumar@email.com" },
  { id: 4, tenantId: 1, name: "Priya Gupta", phone: "+91 98765 43213", email: "priya.gupta@email.com" },
  { id: 5, tenantId: 1, name: "Anil Singh", phone: "+91 98765 43214", email: "anil.singh@email.com" },
]

// Fee Components
export const feeComponents: FeeComponent[] = [
  { id: 1, tenantId: 1, name: "Tuition Fee", type: "tuition" },
  { id: 2, tenantId: 1, name: "Transport Fee", type: "transport" },
  { id: 3, tenantId: 1, name: "Lab Fee", type: "lab" },
  { id: 4, tenantId: 1, name: "Library Fee", type: "library" },
  { id: 5, tenantId: 1, name: "Sports Fee", type: "sports" },
  { id: 6, tenantId: 1, name: "Exam Fee", type: "exam" },
]

// Fee Structures (per class per session)
export const feeStructures: FeeStructure[] = [
  { id: 1, tenantId: 1, classId: 1, sessionId: 1, class: classes[0], session: sessions[0] },
  { id: 2, tenantId: 1, classId: 3, sessionId: 1, class: classes[2], session: sessions[0] },
  { id: 3, tenantId: 1, classId: 5, sessionId: 1, class: classes[4], session: sessions[0] },
  { id: 4, tenantId: 1, classId: 8, sessionId: 1, class: classes[7], session: sessions[0] },
  { id: 5, tenantId: 1, classId: 10, sessionId: 1, class: classes[9], session: sessions[0] },
]

// Discounts
export const discounts: Discount[] = [
  { id: 1, tenantId: 1, name: "Sibling Discount", amountOrPercentage: 10, isPercentage: true },
  { id: 2, tenantId: 1, name: "Merit Scholarship", amountOrPercentage: 15, isPercentage: true },
  { id: 3, tenantId: 1, name: "Early Payment Discount", amountOrPercentage: 5, isPercentage: true },
  { id: 4, tenantId: 1, name: "Staff Ward Discount", amountOrPercentage: 25, isPercentage: true },
  { id: 5, tenantId: 1, name: "Financial Aid", amountOrPercentage: 5000, isPercentage: false },
]

// Fines
export const fines: Fine[] = [
  { id: 1, tenantId: 1, name: "Late Payment Fine", amount: 500, gracePeriodDays: 7 },
  { id: 2, tenantId: 1, name: "Cheque Bounce Fine", amount: 1000, gracePeriodDays: 0 },
  { id: 3, tenantId: 1, name: "Document Late Fee", amount: 200, gracePeriodDays: 15 },
]

// Students with detailed data
export const students: Student[] = [
  {
    id: 1,
    tenantId: 1,
    firstName: "Aarav",
    lastName: "Sharma",
    dob: "2010-05-15",
    gender: "Male",
    classId: 10,
    admissionDate: "2020-04-01",
    status: "active",
    class: classes[9],
    parent: parents[0],
  },
  {
    id: 2,
    tenantId: 1,
    firstName: "Priya",
    lastName: "Patel",
    dob: "2010-08-22",
    gender: "Female",
    classId: 10,
    admissionDate: "2020-04-01",
    status: "active",
    class: classes[9],
    parent: parents[1],
  },
  {
    id: 3,
    tenantId: 1,
    firstName: "Rohit",
    lastName: "Kumar",
    dob: "2011-02-10",
    gender: "Male",
    classId: 8,
    admissionDate: "2021-04-01",
    status: "active",
    class: classes[7],
    parent: parents[2],
  },
  {
    id: 4,
    tenantId: 1,
    firstName: "Sneha",
    lastName: "Gupta",
    dob: "2012-11-05",
    gender: "Female",
    classId: 5,
    admissionDate: "2022-04-01",
    status: "active",
    class: classes[4],
    parent: parents[3],
  },
  {
    id: 5,
    tenantId: 1,
    firstName: "Arjun",
    lastName: "Singh",
    dob: "2013-07-18",
    gender: "Male",
    classId: 3,
    admissionDate: "2023-04-01",
    status: "active",
    class: classes[2],
    parent: parents[4],
  },
  {
    id: 6,
    tenantId: 1,
    firstName: "Kavya",
    lastName: "Reddy",
    dob: "2010-03-25",
    gender: "Female",
    classId: 11,
    admissionDate: "2020-04-01",
    status: "active",
    class: classes[10],
    parent: parents[0],
  },
  {
    id: 7,
    tenantId: 1,
    firstName: "Vikram",
    lastName: "Nair",
    dob: "2011-09-12",
    gender: "Male",
    classId: 8,
    admissionDate: "2021-04-01",
    status: "active",
    class: classes[7],
    parent: parents[1],
  },
  {
    id: 8,
    tenantId: 1,
    firstName: "Ananya",
    lastName: "Iyer",
    dob: "2012-06-30",
    gender: "Female",
    classId: 5,
    admissionDate: "2022-04-01",
    status: "active",
    class: classes[4],
    parent: parents[2],
  },
  {
    id: 9,
    tenantId: 1,
    firstName: "Ravi",
    lastName: "Menon",
    dob: "2013-01-08",
    gender: "Male",
    classId: 4,
    admissionDate: "2023-04-01",
    status: "active",
    class: classes[3],
    parent: parents[3],
  },
  {
    id: 10,
    tenantId: 1,
    firstName: "Meera",
    lastName: "Joshi",
    dob: "2014-04-20",
    gender: "Female",
    classId: 1,
    admissionDate: "2024-04-01",
    status: "active",
    class: classes[0],
    parent: parents[4],
  },
]

// Installments for each student fee
const createInstallments = (studentFeeId: number, totalAmount: number, studentId: number): Installment[] => {
  const quarterAmount = totalAmount / 4
  const baseYear = 2024
  
  // Different payment scenarios based on studentId
  const scenarios: Record<number, { paidQuarters: number; partialPayment?: number; hasOverdue?: boolean }> = {
    1: { paidQuarters: 4 }, // Fully paid
    2: { paidQuarters: 3, partialPayment: quarterAmount * 0.5 }, // 3 paid + partial
    3: { paidQuarters: 2, hasOverdue: true }, // 2 paid, overdue
    4: { paidQuarters: 4 }, // Fully paid
    5: { paidQuarters: 3 }, // 3 paid
    6: { paidQuarters: 4 }, // Fully paid with scholarship
    7: { paidQuarters: 1, hasOverdue: true }, // 1 paid, multiple overdue
    8: { paidQuarters: 4 }, // Fully paid
    9: { paidQuarters: 2, partialPayment: quarterAmount * 0.3 }, // 2 paid + partial
    10: { paidQuarters: 4 }, // Fully paid
  }
  
  const scenario = scenarios[studentId] || { paidQuarters: 0 }
  
  return [
    {
      id: studentFeeId * 10 + 1,
      studentFeeId,
      name: "Q1 (Apr-Jun)",
      amount: quarterAmount,
      dueDate: `${baseYear}-04-15`,
      paidAmount: scenario.paidQuarters >= 1 ? quarterAmount : 0,
      balance: scenario.paidQuarters >= 1 ? 0 : quarterAmount,
      status: scenario.paidQuarters >= 1 ? "paid" : (scenario.hasOverdue ? "overdue" : "unpaid"),
      paidDate: scenario.paidQuarters >= 1 ? `${baseYear}-04-10` : undefined,
    },
    {
      id: studentFeeId * 10 + 2,
      studentFeeId,
      name: "Q2 (Jul-Sep)",
      amount: quarterAmount,
      dueDate: `${baseYear}-07-15`,
      paidAmount: scenario.paidQuarters >= 2 ? quarterAmount : 0,
      balance: scenario.paidQuarters >= 2 ? 0 : quarterAmount,
      status: scenario.paidQuarters >= 2 ? "paid" : (scenario.hasOverdue ? "overdue" : "unpaid"),
      paidDate: scenario.paidQuarters >= 2 ? `${baseYear}-07-12` : undefined,
    },
    {
      id: studentFeeId * 10 + 3,
      studentFeeId,
      name: "Q3 (Oct-Dec)",
      amount: quarterAmount,
      dueDate: `${baseYear}-10-15`,
      paidAmount: scenario.paidQuarters >= 3 ? quarterAmount : (scenario.partialPayment && scenario.paidQuarters === 2 ? scenario.partialPayment : 0),
      balance: scenario.paidQuarters >= 3 ? 0 : (scenario.partialPayment && scenario.paidQuarters === 2 ? quarterAmount - scenario.partialPayment : quarterAmount),
      status: scenario.paidQuarters >= 3 ? "paid" : (scenario.partialPayment && scenario.paidQuarters === 2 ? "partial" : (scenario.hasOverdue ? "overdue" : "unpaid")),
      paidDate: scenario.paidQuarters >= 3 ? `${baseYear}-10-08` : undefined,
    },
    {
      id: studentFeeId * 10 + 4,
      studentFeeId,
      name: "Q4 (Jan-Mar)",
      amount: quarterAmount,
      dueDate: `${baseYear + 1}-01-15`,
      paidAmount: scenario.paidQuarters >= 4 ? quarterAmount : (scenario.partialPayment && scenario.paidQuarters === 3 ? scenario.partialPayment : 0),
      balance: scenario.paidQuarters >= 4 ? 0 : (scenario.partialPayment && scenario.paidQuarters === 3 ? quarterAmount - scenario.partialPayment : quarterAmount),
      status: scenario.paidQuarters >= 4 ? "paid" : (scenario.partialPayment && scenario.paidQuarters === 3 ? "partial" : "unpaid"),
      paidDate: scenario.paidQuarters >= 4 ? `${baseYear + 1}-01-10` : undefined,
    },
  ]
}

// Fee amounts by class
const feeByClass: Record<number, number> = {
  1: 60000, 2: 60000, // 6th
  3: 65000, 4: 65000, // 7th
  5: 70000, 6: 70000, 7: 70000, // 8th
  8: 75000, 9: 75000, // 9th
  10: 85000, 11: 85000, // 10th
}

// Student Fees with computed values
export const studentFees: StudentFee[] = students.map((student, index) => {
  const totalAmount = feeByClass[student.classId || 1] || 70000
  const installments = createInstallments(index + 1, totalAmount, student.id)
  const paidAmount = installments.reduce((sum, i) => sum + i.paidAmount, 0)
  
  // Apply discounts for specific students
  let discountAmount = 0
  if (student.id === 1) discountAmount = totalAmount * 0.05 // Early payment
  if (student.id === 6) discountAmount = totalAmount * 0.15 // Merit scholarship
  if (student.id === 4 || student.id === 10) discountAmount = totalAmount * 0.1 // Sibling
  
  // Apply fines for overdue
  let fineAmount = 0
  if (student.id === 3 || student.id === 7) fineAmount = 500 // Late payment fine
  
  const netAmount = totalAmount - discountAmount + fineAmount
  const balance = Math.max(0, netAmount - paidAmount)
  
  let status: "unpaid" | "partial" | "paid" | "overpaid" = "unpaid"
  if (paidAmount === 0) status = "unpaid"
  else if (paidAmount < netAmount) status = "partial"
  else if (paidAmount >= netAmount) status = paidAmount > netAmount ? "overpaid" : "paid"
  
  return {
    id: index + 1,
    studentId: student.id,
    feeStructureId: Math.ceil(student.classId! / 2),
    totalAmount,
    discountAmount,
    fineAmount,
    netAmount,
    paidAmount,
    balance,
    status,
    student,
    installments,
  }
})

// Student Discounts
export const studentDiscounts: StudentDiscount[] = [
  { id: 1, studentId: 1, discountId: 3, reason: "Paid full year in advance", appliedAmount: 4250, discount: discounts[2] },
  { id: 2, studentId: 4, discountId: 1, reason: "Sibling studying in same school", appliedAmount: 7000, discount: discounts[0] },
  { id: 3, studentId: 6, discountId: 2, reason: "Top 5 in class ranking", appliedAmount: 12750, discount: discounts[1] },
  { id: 4, studentId: 10, discountId: 1, reason: "Sibling studying in same school", appliedAmount: 6000, discount: discounts[0] },
  { id: 5, studentId: 9, discountId: 5, reason: "Applied for financial assistance", appliedAmount: 5000, discount: discounts[4] },
]

// Student Fines
export const studentFines: StudentFine[] = [
  { id: 1, studentId: 3, fineId: 1, installmentId: 33, isPaid: false, appliedDate: "2024-10-22", fine: fines[0] },
  { id: 2, studentId: 7, fineId: 1, installmentId: 72, isPaid: false, appliedDate: "2024-07-22", fine: fines[0] },
  { id: 3, studentId: 7, fineId: 1, installmentId: 73, isPaid: false, appliedDate: "2024-10-22", fine: fines[0] },
]

// Payments
export const payments: Payment[] = [
  { id: 1, studentFeeId: 1, installmentId: 11, studentId: 1, tenantId: 1, amountPaid: 21250, paymentDate: "2024-04-10", mode: "upi", transactionId: "UPI001", status: "completed" },
  { id: 2, studentFeeId: 1, installmentId: 12, studentId: 1, tenantId: 1, amountPaid: 21250, paymentDate: "2024-07-12", mode: "upi", transactionId: "UPI002", status: "completed" },
  { id: 3, studentFeeId: 1, installmentId: 13, studentId: 1, tenantId: 1, amountPaid: 21250, paymentDate: "2024-10-08", mode: "card", transactionId: "CARD001", status: "completed" },
  { id: 4, studentFeeId: 1, installmentId: 14, studentId: 1, tenantId: 1, amountPaid: 21250, paymentDate: "2025-01-10", mode: "bank_transfer", transactionId: "NEFT001", status: "completed" },
  { id: 5, studentFeeId: 2, installmentId: 21, studentId: 2, tenantId: 1, amountPaid: 21250, paymentDate: "2024-04-14", mode: "upi", transactionId: "UPI003", status: "completed" },
  { id: 6, studentFeeId: 2, installmentId: 22, studentId: 2, tenantId: 1, amountPaid: 21250, paymentDate: "2024-07-15", mode: "cash", transactionId: null, status: "completed" },
  { id: 7, studentFeeId: 2, installmentId: 23, studentId: 2, tenantId: 1, amountPaid: 21250, paymentDate: "2024-10-14", mode: "upi", transactionId: "UPI004", status: "completed" },
  { id: 8, studentFeeId: 2, installmentId: 24, studentId: 2, tenantId: 1, amountPaid: 10625, paymentDate: "2025-01-20", mode: "upi", transactionId: "UPI005", status: "completed" },
  { id: 9, studentFeeId: 3, installmentId: 31, studentId: 3, tenantId: 1, amountPaid: 18750, paymentDate: "2024-04-20", mode: "cash", transactionId: null, status: "completed" },
  { id: 10, studentFeeId: 3, installmentId: 32, studentId: 3, tenantId: 1, amountPaid: 18750, paymentDate: "2024-07-25", mode: "cheque", transactionId: "CHQ001", status: "completed" },
  { id: 11, studentFeeId: 4, installmentId: 41, studentId: 4, tenantId: 1, amountPaid: 17500, paymentDate: "2024-04-08", mode: "upi", transactionId: "UPI006", status: "completed" },
  { id: 12, studentFeeId: 4, installmentId: 42, studentId: 4, tenantId: 1, amountPaid: 17500, paymentDate: "2024-07-10", mode: "upi", transactionId: "UPI007", status: "completed" },
  { id: 13, studentFeeId: 4, installmentId: 43, studentId: 4, tenantId: 1, amountPaid: 17500, paymentDate: "2024-10-05", mode: "card", transactionId: "CARD002", status: "completed" },
  { id: 14, studentFeeId: 4, installmentId: 44, studentId: 4, tenantId: 1, amountPaid: 17500, paymentDate: "2025-01-05", mode: "upi", transactionId: "UPI008", status: "completed" },
  { id: 15, studentFeeId: 6, installmentId: 61, studentId: 6, tenantId: 1, amountPaid: 21250, paymentDate: "2024-04-05", mode: "bank_transfer", transactionId: "NEFT002", status: "completed" },
  { id: 16, studentFeeId: 6, installmentId: 62, studentId: 6, tenantId: 1, amountPaid: 21250, paymentDate: "2024-07-08", mode: "bank_transfer", transactionId: "NEFT003", status: "completed" },
  { id: 17, studentFeeId: 6, installmentId: 63, studentId: 6, tenantId: 1, amountPaid: 21250, paymentDate: "2024-10-02", mode: "card", transactionId: "CARD003", status: "completed" },
  { id: 18, studentFeeId: 6, installmentId: 64, studentId: 6, tenantId: 1, amountPaid: 21250, paymentDate: "2025-01-08", mode: "upi", transactionId: "UPI009", status: "completed" },
]

// Dashboard Statistics
export const getDashboardStats = (): DashboardStats => {
  const totalStudents = students.length
  const totalFees = studentFees.reduce((sum, sf) => sum + sf.totalAmount, 0)
  const collectedFees = studentFees.reduce((sum, sf) => sum + sf.paidAmount, 0)
  const pendingFees = studentFees.reduce((sum, sf) => sum + sf.balance, 0)
  
  // Calculate overdue amount
  const overdueAmount = studentFees.reduce((sum, sf) => {
    const overdueInstallments = sf.installments?.filter(i => i.status === "overdue") || []
    return sum + overdueInstallments.reduce((s, i) => s + i.balance, 0)
  }, 0)
  
  const paidStudents = studentFees.filter(sf => sf.status === "paid" || sf.status === "overpaid").length
  const pendingStudents = studentFees.filter(sf => sf.status === "partial").length
  const overdueStudents = studentFees.filter(sf => 
    sf.installments?.some(i => i.status === "overdue")
  ).length
  
  return {
    totalStudents,
    totalFees,
    collectedFees,
    pendingFees,
    overdueAmount,
    paidStudents,
    pendingStudents,
    overdueStudents,
  }
}

// Monthly Collection Data
export const monthlyCollections: MonthlyCollection[] = [
  { month: "Apr", collected: 425000, pending: 75000 },
  { month: "May", collected: 125000, pending: 25000 },
  { month: "Jun", collected: 95000, pending: 15000 },
  { month: "Jul", collected: 410000, pending: 90000 },
  { month: "Aug", collected: 145000, pending: 35000 },
  { month: "Sep", collected: 85000, pending: 20000 },
  { month: "Oct", collected: 395000, pending: 105000 },
  { month: "Nov", collected: 110000, pending: 25000 },
  { month: "Dec", collected: 75000, pending: 15000 },
  { month: "Jan", collected: 385000, pending: 115000 },
]

// Class-wise Collection
export const getClassWiseCollection = (): ClassWiseCollection[] => {
  const classMap = new Map<string, { totalFee: number; collected: number; pending: number }>()
  
  studentFees.forEach(sf => {
    const className = sf.student?.class ? `${sf.student.class.name}-${sf.student.class.section}` : "Unknown"
    const existing = classMap.get(className) || { totalFee: 0, collected: 0, pending: 0 }
    classMap.set(className, {
      totalFee: existing.totalFee + sf.totalAmount,
      collected: existing.collected + sf.paidAmount,
      pending: existing.pending + sf.balance,
    })
  })
  
  return Array.from(classMap.entries()).map(([className, data]) => ({
    className,
    ...data,
    collectionRate: data.totalFee > 0 ? (data.collected / data.totalFee) * 100 : 0,
  }))
}

// Helper to get student with all related data
export const getStudentWithDetails = (studentId: number) => {
  const student = students.find(s => s.id === studentId)
  if (!student) return null
  
  const studentFee = studentFees.find(sf => sf.studentId === studentId)
  const discountsList = studentDiscounts.filter(sd => sd.studentId === studentId)
  const finesList = studentFines.filter(sf => sf.studentId === studentId)
  const paymentsList = payments.filter(p => p.studentId === studentId)
  
  return {
    ...student,
    studentFee,
    discounts: discountsList,
    fines: finesList,
    payments: paymentsList,
  }
}

// Get fee breakdown for a student
export const getStudentFeeBreakdown = (studentId: number) => {
  const sf = studentFees.find(f => f.studentId === studentId)
  if (!sf) return null
  
  const classId = students.find(s => s.id === studentId)?.classId
  const baseFee = feeByClass[classId || 1] || 70000
  
  // Simulated component breakdown
  const breakdown = [
    { component: "Tuition Fee", amount: baseFee * 0.65 },
    { component: "Transport Fee", amount: baseFee * 0.15 },
    { component: "Lab Fee", amount: baseFee * 0.08 },
    { component: "Library Fee", amount: baseFee * 0.04 },
    { component: "Sports Fee", amount: baseFee * 0.05 },
    { component: "Exam Fee", amount: baseFee * 0.03 },
  ]
  
  return {
    breakdown,
    totalFee: sf.totalAmount,
    discountAmount: sf.discountAmount,
    fineAmount: sf.fineAmount,
    netAmount: sf.netAmount,
    paidAmount: sf.paidAmount,
    balance: sf.balance,
  }
}
