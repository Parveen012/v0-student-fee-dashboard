// Dummy data for Student Fee Management System

export type FeeStatus = "paid" | "pending" | "overdue"

export interface Student {
  id: string
  name: string
  class: string
  rollNo: string
  email: string
  phone: string
  feeStatus: FeeStatus
  totalFee: number
  paidAmount: number
  dueAmount: number
  installments: Installment[]
  discounts: Discount[]
}

export interface Installment {
  id: string
  name: string
  amount: number
  dueDate: string
  status: FeeStatus
  paidDate?: string
}

export interface Discount {
  id: string
  type: "sibling" | "manual" | "scholarship" | "early_payment"
  name: string
  amount: number
  percentage?: number
}

export interface Payment {
  id: string
  studentId: string
  studentName: string
  class: string
  amount: number
  date: string
  mode: "upi" | "cash" | "card" | "bank_transfer"
  status: "completed" | "pending" | "failed"
  installmentId?: string
  discountApplied?: number
  fineApplied?: number
}

export interface FeeStructure {
  id: string
  class: string
  tuitionFee: number
  transportFee: number
  labFee: number
  libraryFee: number
  sportsFee: number
  totalFee: number
}

export interface MonthlyCollection {
  month: string
  collected: number
  pending: number
}

// Students Data
export const students: Student[] = [
  {
    id: "STU001",
    name: "Aarav Sharma",
    class: "10-A",
    rollNo: "01",
    email: "aarav.sharma@school.edu",
    phone: "+91 98765 43210",
    feeStatus: "paid",
    totalFee: 85000,
    paidAmount: 85000,
    dueAmount: 0,
    installments: [
      { id: "INS001", name: "Q1 Fee", amount: 21250, dueDate: "2024-04-15", status: "paid", paidDate: "2024-04-10" },
      { id: "INS002", name: "Q2 Fee", amount: 21250, dueDate: "2024-07-15", status: "paid", paidDate: "2024-07-12" },
      { id: "INS003", name: "Q3 Fee", amount: 21250, dueDate: "2024-10-15", status: "paid", paidDate: "2024-10-08" },
      { id: "INS004", name: "Q4 Fee", amount: 21250, dueDate: "2025-01-15", status: "paid", paidDate: "2025-01-10" },
    ],
    discounts: [{ id: "DIS001", type: "early_payment", name: "Early Payment Discount", amount: 2500, percentage: 3 }],
  },
  {
    id: "STU002",
    name: "Priya Patel",
    class: "10-A",
    rollNo: "02",
    email: "priya.patel@school.edu",
    phone: "+91 98765 43211",
    feeStatus: "pending",
    totalFee: 85000,
    paidAmount: 63750,
    dueAmount: 21250,
    installments: [
      { id: "INS005", name: "Q1 Fee", amount: 21250, dueDate: "2024-04-15", status: "paid", paidDate: "2024-04-14" },
      { id: "INS006", name: "Q2 Fee", amount: 21250, dueDate: "2024-07-15", status: "paid", paidDate: "2024-07-15" },
      { id: "INS007", name: "Q3 Fee", amount: 21250, dueDate: "2024-10-15", status: "paid", paidDate: "2024-10-14" },
      { id: "INS008", name: "Q4 Fee", amount: 21250, dueDate: "2025-01-15", status: "pending" },
    ],
    discounts: [],
  },
  {
    id: "STU003",
    name: "Rohit Kumar",
    class: "9-B",
    rollNo: "15",
    email: "rohit.kumar@school.edu",
    phone: "+91 98765 43212",
    feeStatus: "overdue",
    totalFee: 75000,
    paidAmount: 37500,
    dueAmount: 37500,
    installments: [
      { id: "INS009", name: "Q1 Fee", amount: 18750, dueDate: "2024-04-15", status: "paid", paidDate: "2024-04-20" },
      { id: "INS010", name: "Q2 Fee", amount: 18750, dueDate: "2024-07-15", status: "paid", paidDate: "2024-07-25" },
      { id: "INS011", name: "Q3 Fee", amount: 18750, dueDate: "2024-10-15", status: "overdue" },
      { id: "INS012", name: "Q4 Fee", amount: 18750, dueDate: "2025-01-15", status: "pending" },
    ],
    discounts: [],
  },
  {
    id: "STU004",
    name: "Sneha Gupta",
    class: "8-C",
    rollNo: "08",
    email: "sneha.gupta@school.edu",
    phone: "+91 98765 43213",
    feeStatus: "paid",
    totalFee: 70000,
    paidAmount: 70000,
    dueAmount: 0,
    installments: [
      { id: "INS013", name: "Q1 Fee", amount: 17500, dueDate: "2024-04-15", status: "paid", paidDate: "2024-04-08" },
      { id: "INS014", name: "Q2 Fee", amount: 17500, dueDate: "2024-07-15", status: "paid", paidDate: "2024-07-10" },
      { id: "INS015", name: "Q3 Fee", amount: 17500, dueDate: "2024-10-15", status: "paid", paidDate: "2024-10-05" },
      { id: "INS016", name: "Q4 Fee", amount: 17500, dueDate: "2025-01-15", status: "paid", paidDate: "2025-01-05" },
    ],
    discounts: [{ id: "DIS002", type: "sibling", name: "Sibling Discount", amount: 3500, percentage: 5 }],
  },
  {
    id: "STU005",
    name: "Arjun Singh",
    class: "7-A",
    rollNo: "22",
    email: "arjun.singh@school.edu",
    phone: "+91 98765 43214",
    feeStatus: "pending",
    totalFee: 65000,
    paidAmount: 48750,
    dueAmount: 16250,
    installments: [
      { id: "INS017", name: "Q1 Fee", amount: 16250, dueDate: "2024-04-15", status: "paid", paidDate: "2024-04-15" },
      { id: "INS018", name: "Q2 Fee", amount: 16250, dueDate: "2024-07-15", status: "paid", paidDate: "2024-07-14" },
      { id: "INS019", name: "Q3 Fee", amount: 16250, dueDate: "2024-10-15", status: "paid", paidDate: "2024-10-12" },
      { id: "INS020", name: "Q4 Fee", amount: 16250, dueDate: "2025-01-15", status: "pending" },
    ],
    discounts: [],
  },
  {
    id: "STU006",
    name: "Kavya Reddy",
    class: "10-B",
    rollNo: "05",
    email: "kavya.reddy@school.edu",
    phone: "+91 98765 43215",
    feeStatus: "paid",
    totalFee: 85000,
    paidAmount: 85000,
    dueAmount: 0,
    installments: [
      { id: "INS021", name: "Q1 Fee", amount: 21250, dueDate: "2024-04-15", status: "paid", paidDate: "2024-04-05" },
      { id: "INS022", name: "Q2 Fee", amount: 21250, dueDate: "2024-07-15", status: "paid", paidDate: "2024-07-08" },
      { id: "INS023", name: "Q3 Fee", amount: 21250, dueDate: "2024-10-15", status: "paid", paidDate: "2024-10-02" },
      { id: "INS024", name: "Q4 Fee", amount: 21250, dueDate: "2025-01-15", status: "paid", paidDate: "2025-01-08" },
    ],
    discounts: [{ id: "DIS003", type: "scholarship", name: "Merit Scholarship", amount: 8500, percentage: 10 }],
  },
  {
    id: "STU007",
    name: "Vikram Nair",
    class: "9-A",
    rollNo: "11",
    email: "vikram.nair@school.edu",
    phone: "+91 98765 43216",
    feeStatus: "overdue",
    totalFee: 75000,
    paidAmount: 18750,
    dueAmount: 56250,
    installments: [
      { id: "INS025", name: "Q1 Fee", amount: 18750, dueDate: "2024-04-15", status: "paid", paidDate: "2024-05-01" },
      { id: "INS026", name: "Q2 Fee", amount: 18750, dueDate: "2024-07-15", status: "overdue" },
      { id: "INS027", name: "Q3 Fee", amount: 18750, dueDate: "2024-10-15", status: "overdue" },
      { id: "INS028", name: "Q4 Fee", amount: 18750, dueDate: "2025-01-15", status: "pending" },
    ],
    discounts: [],
  },
  {
    id: "STU008",
    name: "Ananya Iyer",
    class: "8-A",
    rollNo: "03",
    email: "ananya.iyer@school.edu",
    phone: "+91 98765 43217",
    feeStatus: "paid",
    totalFee: 70000,
    paidAmount: 70000,
    dueAmount: 0,
    installments: [
      { id: "INS029", name: "Q1 Fee", amount: 17500, dueDate: "2024-04-15", status: "paid", paidDate: "2024-04-12" },
      { id: "INS030", name: "Q2 Fee", amount: 17500, dueDate: "2024-07-15", status: "paid", paidDate: "2024-07-13" },
      { id: "INS031", name: "Q3 Fee", amount: 17500, dueDate: "2024-10-15", status: "paid", paidDate: "2024-10-14" },
      { id: "INS032", name: "Q4 Fee", amount: 17500, dueDate: "2025-01-15", status: "paid", paidDate: "2025-01-14" },
    ],
    discounts: [],
  },
  {
    id: "STU009",
    name: "Ravi Menon",
    class: "7-B",
    rollNo: "19",
    email: "ravi.menon@school.edu",
    phone: "+91 98765 43218",
    feeStatus: "pending",
    totalFee: 65000,
    paidAmount: 32500,
    dueAmount: 32500,
    installments: [
      { id: "INS033", name: "Q1 Fee", amount: 16250, dueDate: "2024-04-15", status: "paid", paidDate: "2024-04-18" },
      { id: "INS034", name: "Q2 Fee", amount: 16250, dueDate: "2024-07-15", status: "paid", paidDate: "2024-07-20" },
      { id: "INS035", name: "Q3 Fee", amount: 16250, dueDate: "2024-10-15", status: "pending" },
      { id: "INS036", name: "Q4 Fee", amount: 16250, dueDate: "2025-01-15", status: "pending" },
    ],
    discounts: [{ id: "DIS004", type: "manual", name: "Financial Aid", amount: 5000 }],
  },
  {
    id: "STU010",
    name: "Meera Joshi",
    class: "6-A",
    rollNo: "07",
    email: "meera.joshi@school.edu",
    phone: "+91 98765 43219",
    feeStatus: "paid",
    totalFee: 60000,
    paidAmount: 60000,
    dueAmount: 0,
    installments: [
      { id: "INS037", name: "Q1 Fee", amount: 15000, dueDate: "2024-04-15", status: "paid", paidDate: "2024-04-10" },
      { id: "INS038", name: "Q2 Fee", amount: 15000, dueDate: "2024-07-15", status: "paid", paidDate: "2024-07-10" },
      { id: "INS039", name: "Q3 Fee", amount: 15000, dueDate: "2024-10-15", status: "paid", paidDate: "2024-10-10" },
      { id: "INS040", name: "Q4 Fee", amount: 15000, dueDate: "2025-01-15", status: "paid", paidDate: "2025-01-10" },
    ],
    discounts: [{ id: "DIS005", type: "sibling", name: "Sibling Discount", amount: 3000, percentage: 5 }],
  },
]

// Fee Structure Data
export const feeStructures: FeeStructure[] = [
  { id: "FS001", class: "6th Grade", tuitionFee: 40000, transportFee: 12000, labFee: 3000, libraryFee: 2000, sportsFee: 3000, totalFee: 60000 },
  { id: "FS002", class: "7th Grade", tuitionFee: 43000, transportFee: 12000, labFee: 4000, libraryFee: 2000, sportsFee: 4000, totalFee: 65000 },
  { id: "FS003", class: "8th Grade", tuitionFee: 46000, transportFee: 12000, labFee: 5000, libraryFee: 3000, sportsFee: 4000, totalFee: 70000 },
  { id: "FS004", class: "9th Grade", tuitionFee: 50000, transportFee: 12000, labFee: 6000, libraryFee: 3000, sportsFee: 4000, totalFee: 75000 },
  { id: "FS005", class: "10th Grade", tuitionFee: 55000, transportFee: 15000, labFee: 7000, libraryFee: 3000, sportsFee: 5000, totalFee: 85000 },
]

// Payments Data
export const payments: Payment[] = [
  { id: "PAY001", studentId: "STU001", studentName: "Aarav Sharma", class: "10-A", amount: 21250, date: "2025-01-10", mode: "upi", status: "completed", installmentId: "INS004" },
  { id: "PAY002", studentId: "STU006", studentName: "Kavya Reddy", class: "10-B", amount: 21250, date: "2025-01-08", mode: "bank_transfer", status: "completed", installmentId: "INS024", discountApplied: 2125 },
  { id: "PAY003", studentId: "STU004", studentName: "Sneha Gupta", class: "8-C", amount: 17500, date: "2025-01-05", mode: "card", status: "completed", installmentId: "INS016" },
  { id: "PAY004", studentId: "STU008", studentName: "Ananya Iyer", class: "8-A", amount: 17500, date: "2025-01-14", mode: "upi", status: "completed", installmentId: "INS032" },
  { id: "PAY005", studentId: "STU010", studentName: "Meera Joshi", class: "6-A", amount: 15000, date: "2025-01-10", mode: "cash", status: "completed", installmentId: "INS040" },
  { id: "PAY006", studentId: "STU002", studentName: "Priya Patel", class: "10-A", amount: 10000, date: "2025-01-12", mode: "upi", status: "pending" },
  { id: "PAY007", studentId: "STU003", studentName: "Rohit Kumar", class: "9-B", amount: 18750, date: "2024-12-28", mode: "bank_transfer", status: "failed", fineApplied: 500 },
  { id: "PAY008", studentId: "STU001", studentName: "Aarav Sharma", class: "10-A", amount: 21250, date: "2024-10-08", mode: "upi", status: "completed", installmentId: "INS003" },
  { id: "PAY009", studentId: "STU006", studentName: "Kavya Reddy", class: "10-B", amount: 21250, date: "2024-10-02", mode: "card", status: "completed", installmentId: "INS023" },
  { id: "PAY010", studentId: "STU005", studentName: "Arjun Singh", class: "7-A", amount: 16250, date: "2024-10-12", mode: "upi", status: "completed", installmentId: "INS019" },
]

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

// Dashboard Stats
export const dashboardStats = {
  totalStudents: students.length,
  totalFees: students.reduce((acc, s) => acc + s.totalFee, 0),
  collectedFees: students.reduce((acc, s) => acc + s.paidAmount, 0),
  pendingFees: students.reduce((acc, s) => acc + s.dueAmount, 0),
  paidStudents: students.filter((s) => s.feeStatus === "paid").length,
  pendingStudents: students.filter((s) => s.feeStatus === "pending").length,
  overdueStudents: students.filter((s) => s.feeStatus === "overdue").length,
}

// Classes for filtering
export const classes = ["6-A", "6-B", "7-A", "7-B", "8-A", "8-B", "8-C", "9-A", "9-B", "10-A", "10-B"]
