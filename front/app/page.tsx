"use client";
import { Dispatch, FormEvent, SetStateAction, useEffect, useRef, useState } from "react";
import { type Room } from "../lib/room-data";
import {
  completeSignIn,
  installAuthenticatedFetch,
  signOut,
  startSignIn,
  type AppRole,
  type AuthenticatedUser,
} from "../lib/auth";
type Student = {
  id: number;
  registrationNo: string;
  firstName: string;
  middleNames: string;
  lastName: string;
  dateOfBirth: string;
  idNo: string;
  mobile: string;
  whatsapp: string;
  email: string;
  university: string;
  currentYear: string;
  address: string;
  hasMedicalCondition?: boolean;
  medicalConditionDetails?: string;
  emergency1Name: string;
  emergency1Contact: string;
  emergency1Relationship: string;
  emergency1Address: string;
  emergency2Name: string;
  emergency2Contact: string;
  emergency2Relationship: string;
  emergency2Address: string;
  registeredDate: string;
  startDate: string;
  noticeToVacateDate?: string;
  intendedVacateDate?: string;
  noticeAmendedDate?: string;
  noticeApprovalStatus?: "Pending" | "Approved" | "Rejected";
  noticeReviewNote?: string;
  noticeReviewedBy?: string;
  noticeReviewedAt?: string;
  vacatedDate?: string;
  allSettled?: boolean;
  contractAgreementStatus?: "Signed" | "Awaiting signature" | "Draft" | "Not signed";
  agreementDataJson?: string;
  agreementPreparedAt?: string;
  agreementSentAt?: string;
  agreementSignedName?: string;
  agreementSignedAt?: string;
  roomNo: string;
  monthlyRent: number;
  depositPayable: number;
  originalDepositPayable?: number;
  revisedDepositPayable?: number;
  photoKey?: string;
  photoName?: string;
  status: "Active" | "Inactive";
};
type RoomTransferRequest = {
  id: number;
  requestNo: string;
  registrationNo: string;
  studentName: string;
  currentRoomNo: string;
  requestedRoomNo: string;
  requestedDate: string;
  intendedStartDate: string;
  availabilityPreference: "Vacant Now" | "Earliest Available";
  roomAvailabilityStatus: "Vacant" | "Occupied" | "Available From";
  earliestAvailableDate: string;
  availabilityNotifiedAt: string;
  studentResponseStatus:
    | "Awaiting Availability"
    | "Awaiting Confirmation"
    | "Confirmed"
    | "Alternative Proposed";
  proposedStartDate: string;
  studentRespondedAt: string;
  reason: string;
  status: "Pending" | "Approved" | "Completed" | "Rejected";
  transferDate: string;
  revisedMonthlyRent: number;
  originalDepositAmount: number;
  revisedDepositAmount: number;
  depositDifference: number;
  rentCreditApplied: number;
  reviewNote: string;
  reviewedBy: string;
  reviewedAt: string;
  createdAt: string;
};
type StudentProfileRequest = {
  id: number;
  registrationNo: string;
  requestedByEmail: string;
  originalValuesJson: string;
  proposedChangesJson: string;
  status: "Pending" | "Approved" | "Rejected";
  adminNote: string;
  reviewedBy: string;
  reviewedAt: string;
  emailStatus: string;
  createdAt: string;
};
type StudentInvoice = {
  id: number;
  invoiceNo: string;
  registrationNo: string;
  studentName: string;
  roomNo: string;
  invoiceType: "Deposit" | "Rent" | "Shop Electricity" | "Shop Water";
  month: string;
  baseAmount?: number;
  amount: number;
  issueDate: string;
  dueDate: string;
  paidAmount?: number;
  status: "Issued" | "Partially Paid" | "Paid" | "Cancelled";
  version: number;
  revisionNumber?: number;
  remarks: string;
  emailStatus: string;
  reissuedAt: string;
  sourceUtilityBillId?: number | null;
  totalUnits?: number;
  shopUnits?: number;
  otherShopUnits?: number;
  unitRate?: number;
  createdAt: string;
  adjustments?: Array<{ type: string; effect: "Reduce" | "Increase"; amount: number; note: string }>;
  transactionIds?: string[];
};
type StudentPaymentEvidence = {
  id: number;
  submissionId: string;
  invoiceId: number;
  invoiceNo: string;
  registrationNo: string;
  studentName: string;
  roomNo: string;
  month: string;
  amount: number;
  submittedDate: string;
  evidenceName: string;
  remarks: string;
  status: "Pending" | "Approved" | "Rejected";
  reviewNote: string;
  reviewedBy: string;
  reviewedAt: string;
  linkedPaymentId?: number | null;
  createdAt: string;
};
type Staff = {
  id: number;
  staffNo: string;
  firstName: string;
  lastName: string;
  idNo: string;
  mobile: string;
  whatsapp: string;
  email: string;
  address: string;
  designation: string;
  monthlySalary: number;
  accountHolderName: string;
  accountNo: string;
  bank: string;
  bankBranch: string;
  emergency1Name: string;
  emergency1Contact: string;
  emergency1Relationship: string;
  emergency1Address: string;
  emergency2Name: string;
  emergency2Contact: string;
  emergency2Relationship: string;
  emergency2Address: string;
  registeredDate: string;
  startDate: string;
  finishDate?: string;
  photoKey?: string;
  photoName?: string;
  status: "Active" | "Inactive";
};
type StaffPayroll = {
  id: number;
  staffNo: string;
  month: string;
  basicSalary: number;
  allowances: number;
  overtime: number;
  bonus: number;
  amountPayable: number;
  salaryAdvance: number;
  noPayDeduction: number;
  otherDeductions: number;
  employeeEpf: number;
  employerEpf: number;
  employerEtf: number;
  totalPaid: number;
  paymentDate: string;
  paymentMethod: string;
  notes: string;
  paymentStatus: "Prepared" | "Submitted" | "Paid";
  linkedExpenseId?: number | null;
  paidAt: string;
};
type StaffDesignation = {
  id: number;
  name: string;
  active: boolean;
};
type ExpenseCategory = {
  id: number;
  code?: string;
  mainCategory: string;
  name: string;
  active: boolean;
};
type Expense = {
  id: number;
  transactionId: string;
  categoryId: number;
  categoryName: string;
  amount: number;
  transactionDate: string;
  personPaidStaffNo: string;
  personPaidName: string;
  settlingMethod: "Bank Transfer" | "Petty Cash";
  evidenceName: string;
  payrollId?: number | null;
  remarks: string;
  approvalStatus:
    | "Pending"
    | "More Details Requested"
    | "Approved"
    | "Disapproved";
  approvalNote: string;
  approvedAt: string;
  createdAt: string;
};
type PayrollExpensePrefill = {
  payroll: StaffPayroll;
  member: Staff;
};
type PettyCashDeposit = {
  id: number;
  transactionId: string;
  transactionDate: string;
  amount: number;
  category: "Petty Cash Deposit";
  evidenceName: string;
  approvalStatus: "Pending" | "Approved" | "Disapproved";
  approvalNote: string;
  approvedAt: string;
  createdAt: string;
};
type Shop = {
  id: number;
  shopNo: string;
  standardRent: number;
  active: boolean;
};
type ShopTenant = {
  id: number;
  registrationNo: string;
  shopNo: string;
  businessName: string;
  firstName: string;
  lastName: string;
  idNo: string;
  mobile: string;
  whatsapp: string;
  email: string;
  address: string;
  registeredDate: string;
  startDate: string;
  endDate: string;
  emergency1Name: string;
  emergency1Contact: string;
  emergency1Relationship: string;
  emergency1Address: string;
  emergency2Name: string;
  emergency2Contact: string;
  emergency2Relationship: string;
  emergency2Address: string;
  monthlyRent: number;
  depositPayable: number;
  status: "Active" | "Inactive";
};
type ShopUtilityBill = {
  id: number;
  utilityType: "Electricity" | "Water";
  month: string;
  totalAmount: number;
  totalUnits: number;
  shop1Units: number;
  shop2Units: number;
  shop3Units: number;
  evidenceKey: string;
  evidenceName: string;
  createdAt?: string;
};
type BankTransaction = {
  id: number;
  bankTransactionId: string;
  transactionDate: string;
  remarks: string;
  chequeNo: string;
  branchCode: string;
  branchName: string;
  currency: string;
  amount: number;
  drCr: string;
  accountBalance: number;
  importedAt: string;
};
type BankLink = {
  id: number;
  bankTransactionId: string;
  sourceType: "Payment" | "Expense" | "Petty Cash Deposit";
  sourceRecordId: number;
  sourceTransactionId: string;
  reconciledAmount: number;
  createdAt: string;
};
type BankSource = {
  sourceType: BankLink["sourceType"];
  recordId: number;
  transactionId: string;
  date: string;
  description: string;
  amount: number;
  bankTransactionId: string;
  reconciledAmount: number;
  actionDate?: string;
};
type Payment = {
  id: number;
  transactionId?: string;
  invoiceNo?: string;
  registrationNo: string;
  studentName: string;
  roomNo: string;
  month: string;
  type:
    | "Deposit"
    | "Rent"
    | "Advance Payment"
    | "Monthly Payment"
    | "Damages"
    | "Shop Rent"
    | "Shop Electricity"
    | "Shop Water"
    | "Other Income";
  payableAmount: number;
  vacationDiscount: number;
  paidAmount: number;
  paidDate: string;
  settlementMethod?: "Bank Transfer" | "Cash" | "Cash/Bank";
  cashVerified?: boolean;
  cashVerifiedAt?: string;
  evidenceName: string;
  receiptEmailStatus?: string;
  receiptEmailedAt?: string;
  incomeCategory?: string;
  incomeAccountType?: "PH Account" | "Other Account" | "Cash";
  incomeApprovalStatus?: "Pending" | "Approved";
  bankTransactionId?: string;
};
type MonthlyAdjustment = {
  id: number;
  registrationNo: string;
  month: string;
  type:
    | "Late Start Adjustment"
    | "Early Vacate Adjustment"
    | "Vacation Discount"
    | "Other Adjustment";
  amount: number;
  note: string;
};
type Page =
  | "Overview"
  | "Residents"
  | "Payments"
  | "Hostel Rooms"
  | "Staff"
  | "Expenses"
  | "Other Income"
  | "Bank Reconciliation"
  | "Financial Accounts"
  | "Agreements & Settlements"
  | "Action List"
  | "Admin Controls";
type StaffPermissionKey =
  | "ownProfile"
  | "enterPayments"
  | "viewPaymentsOwn"
  | "viewPaymentsAll"
  | "roomPaymentSummary"
  | "shopPaymentSummary"
  | "enterExpenses"
  | "viewExpensesOwn"
  | "pettyCash";
type StaffPermissionMatrix = Record<string, Partial<Record<StaffPermissionKey, boolean>>>;
const cash = new Intl.NumberFormat("en-LK", {
  style: "currency",
  currency: "LKR",
  maximumFractionDigits: 0,
});
const amountOnly = new Intl.NumberFormat("en-LK", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
type ApiContact = { order: number; name: string; phone: string; relationship: string; address?: string };
type ApiPage<T> = { items: T[] };
const uiStatus = (status: string): "Active" | "Inactive" =>
  status === "ACTIVE" ? "Active" : "Inactive";
const contactFields = (contacts: ApiContact[] = []) => ({
  emergency1Name: contacts[0]?.name || "",
  emergency1Contact: contacts[0]?.phone || "",
  emergency1Relationship: contacts[0]?.relationship || "",
  emergency1Address: contacts[0]?.address || "",
  emergency2Name: contacts[1]?.name || "",
  emergency2Contact: contacts[1]?.phone || "",
  emergency2Relationship: contacts[1]?.relationship || "",
  emergency2Address: contacts[1]?.address || "",
});
const studentFromApi = (value: Record<string, unknown>): Student => ({
  ...(value as unknown as Student),
  middleNames: String(value.middleNames || ""),
  dateOfBirth: String(value.dateOfBirth || ""),
  whatsapp: String(value.whatsapp || ""),
  university: String(value.university || ""),
  currentYear: String(value.currentYear || ""),
  roomNo: String(value.roomNo || ""),
  hasMedicalCondition: Boolean(value.hasMedicalCondition),
  medicalConditionDetails: String(value.medicalConditionDetails || ""),
  photoKey: value.photoName ? String(value.photoName) : undefined,
  status: uiStatus(String(value.status || "INACTIVE")),
  ...contactFields((value.emergencyContacts || []) as ApiContact[]),
});
const staffFromApi = (value: Record<string, unknown>): Staff => ({
  ...(value as unknown as Staff),
  whatsapp: String(value.whatsapp || ""),
  designation: String(value.designation || ""),
  accountHolderName: String(value.accountHolderName || ""),
  accountNo: String(value.accountNo || ""),
  bank: String(value.bank || ""),
  bankBranch: String(value.bankBranch || ""),
  status: uiStatus(String(value.status || "INACTIVE")),
  ...contactFields((value.emergencyContacts || []) as ApiContact[]),
});
const tenantFromApi = (value: Record<string, unknown>): ShopTenant => ({
  ...(value as unknown as ShopTenant),
  whatsapp: String(value.whatsapp || ""),
  endDate: String(value.endDate || ""),
  status: uiStatus(String(value.status || "INACTIVE")),
  ...contactFields((value.emergencyContacts || []) as ApiContact[]),
});
const tenantRequest = (tenant: ShopTenant) => ({
  registrationNo: tenant.registrationNo,
  shopNo: tenant.shopNo,
  businessName: tenant.businessName,
  firstName: tenant.firstName,
  lastName: tenant.lastName,
  idNo: tenant.idNo,
  mobile: tenant.mobile,
  whatsapp: tenant.whatsapp,
  email: tenant.email,
  address: tenant.address,
  registeredDate: tenant.registeredDate,
  startDate: tenant.startDate,
  endDate: tenant.endDate || null,
  monthlyRent: tenant.monthlyRent,
  depositPayable: tenant.depositPayable,
  status: tenant.status.toUpperCase(),
  emergencyContacts: [
    { name: tenant.emergency1Name, phone: tenant.emergency1Contact, relationship: tenant.emergency1Relationship, address: tenant.emergency1Address },
    { name: tenant.emergency2Name, phone: tenant.emergency2Contact, relationship: tenant.emergency2Relationship, address: tenant.emergency2Address },
  ].filter((contact) => contact.name),
});
const fmtMonth = (m: string) =>
    m
      ? new Date(`${m}-02`).toLocaleDateString("en-LK", {
          month: "short",
          year: "numeric",
        })
      : "Deposit",
  fmtDate = (d: string) =>
    d
      ? new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).replaceAll(" ", "-")
      : "—",
  fmtDateTime = (value: string) =>
    value
      ? new Date(value).toLocaleString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).replace(/^([0-9]{2}) ([A-Za-z]{3}) ([0-9]{4}),/, "$1-$2-$3")
      : "—",
  fmtCompactDate = (value: string) => {
    const [year, month, day] = value.slice(0, 10).split("-");
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return year && month && day
      ? `${day.padStart(2, "0")}-${months[Number(month) - 1]}-${year}`
      : value || "—";
  };
const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
};
const netPayable = (payment: Payment) =>
  Math.max(0, payment.payableAmount - (payment.vacationDiscount || 0));
const canonicalPaymentType = (type: Payment["type"]) =>
  type === "Advance Payment"
    ? "Deposit"
    : type === "Monthly Payment"
      ? "Rent"
      : type;
const transactionIdFor = (payment: Payment) =>
  payment.transactionId ||
  `T-${
    canonicalPaymentType(payment.type) === "Deposit"
      ? payment.paidDate.slice(0, 4)
      : payment.month.slice(0, 4)
  }-${String(payment.id || 0).padStart(4, "0")}`;
const addMonths = (month: string, amount: number) => {
  const date = new Date(`${month}-01T00:00:00`);
  date.setMonth(date.getMonth() + amount);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};
const adjustmentTotal = (
  adjustments: MonthlyAdjustment[],
  registrationNo: string,
  month: string,
) =>
  adjustments
    .filter(
      (item) => item.registrationNo === registrationNo && item.month === month,
    )
    .reduce((sum, item) => sum + item.amount, 0);
const rentPayable = (
  student: Student,
  month: string,
  adjustments: MonthlyAdjustment[],
) =>
  month < student.startDate.slice(0, 7)
    ? 0
    : Math.max(
        0,
        student.monthlyRent -
          adjustmentTotal(adjustments, student.registrationNo, month),
      );
const rentPaid = (payments: Payment[], registrationNo: string, month: string) =>
  payments
    .filter(
      (payment) =>
        payment.registrationNo === registrationNo &&
        payment.month === month &&
        canonicalPaymentType(payment.type) === "Rent",
    )
    .reduce((sum, payment) => sum + payment.paidAmount, 0);
const shopRentPayable = (
  tenant: ShopTenant,
  month: string,
  adjustments: MonthlyAdjustment[] = [],
) =>
  month < tenant.startDate.slice(0, 7) ||
  Boolean(tenant.endDate && month > tenant.endDate.slice(0, 7))
    ? 0
    : Math.max(
        0,
        tenant.monthlyRent -
          adjustmentTotal(adjustments, tenant.registrationNo, month),
      );
const shopUtilityRate = (bill?: ShopUtilityBill) =>
  bill && bill.totalUnits > 0 ? bill.totalAmount / bill.totalUnits : 0;
const shopUnitsForBill = (bill: ShopUtilityBill, shopNo: string) =>
  shopNo === "Shop 1"
    ? bill.shop1Units
    : shopNo === "Shop 2"
      ? bill.shop2Units
      : bill.shop3Units;
const shopUtilityAmount = (
  bills: ShopUtilityBill[],
  utilityType: "Electricity" | "Water",
  month: string,
  shopNo: string,
) => {
  const bill = bills.find(
    (item) => item.utilityType === utilityType && item.month === month,
  );
  return bill ? shopUnitsForBill(bill, shopNo) * shopUtilityRate(bill) : 0;
};
const shopPaymentPaid = (
  payments: Payment[],
  tenant: ShopTenant,
  month: string,
) =>
  payments
    .filter(
      (payment) =>
        payment.registrationNo === tenant.registrationNo &&
        payment.month === month &&
        ["Shop Rent", "Shop Electricity", "Shop Water"].includes(payment.type),
    )
    .reduce((sum, payment) => sum + payment.paidAmount, 0);
const studentStatusTone = (student: Student) =>
  student.status === "Inactive"
    ? "inactive"
    : student.noticeToVacateDate
      ? "notice"
      : "active";

function consolidatePayments(payments: Payment[]) {
  const consolidated = new Map<string, Payment>();
  payments.forEach((payment) => {
    const key = `${payment.registrationNo}-${payment.month}-${payment.type}`;
    const current = consolidated.get(key);
    if (current) {
      current.paidAmount += payment.paidAmount;
      current.vacationDiscount = Math.max(
        current.vacationDiscount || 0,
        payment.vacationDiscount || 0,
      );
      if (payment.paidDate > current.paidDate)
        current.paidDate = payment.paidDate;
      current.evidenceName = [current.evidenceName, payment.evidenceName]
        .filter(Boolean)
        .join(", ");
    } else consolidated.set(key, { ...payment });
  });
  return [...consolidated.values()];
}

function monthRange(from: string, to: string) {
  if (!from || !to || from > to) return [];
  const result: string[] = [];
  const cursor = new Date(`${from}-01T00:00:00`);
  const end = new Date(`${to}-01T00:00:00`);
  while (cursor <= end && result.length < 120) {
    result.push(
      `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`,
    );
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return result;
}

const shortCash = (amount: number) =>
  amount
    ? `Rs ${new Intl.NumberFormat("en-LK", { maximumFractionDigits: 0 }).format(amount)}`
    : "—";
const expenseMainCategories = [
  "Staff Expenses",
  "Administration",
  "Utilities",
  "Owner Expenses",
  "Maintenance & Repairs",
  "Housekeeping & Cleaning",
  "Kitchen & Supplies",
  "Security",
  "Transport",
  "Waste Management",
  "Bank Expenses",
  "Other",
];
const expenseMainCategoryCodes: Record<string, string> = {
  "Staff Expenses": "EC-010-00",
  Administration: "EC-020-00",
  Utilities: "EC-030-00",
  "Owner Expenses": "EC-040-00",
  "Maintenance & Repairs": "EC-050-00",
  "Housekeeping & Cleaning": "EC-060-00",
  "Kitchen & Supplies": "EC-070-00",
  Security: "EC-080-00",
  Transport: "EC-090-00",
  "Waste Management": "EC-100-00",
  "Bank Expenses": "EC-110-00",
  Other: "EC-990-00",
};

export default function Home() {
  const [page, setPage] = useState<Page>("Overview"),
    [students, setStudents] = useState<Student[]>([]),
    [staffMembers, setStaffMembers] = useState<Staff[]>([]),
    [staffPayroll, setStaffPayroll] = useState<StaffPayroll[]>([]),
    [staffDesignations, setStaffDesignations] = useState<StaffDesignation[]>(
      [],
    ),
    [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]),
    [expenses, setExpenses] = useState<Expense[]>([]),
    [payments, setPayments] = useState<Payment[]>([]),
    [adjustments, setAdjustments] = useState<MonthlyAdjustment[]>([]),
    [rooms, setRooms] = useState<Room[]>([]),
    [shops, setShops] = useState<Shop[]>([]),
    [shopTenants, setShopTenants] = useState<ShopTenant[]>([]),
    [shopUtilityBills, setShopUtilityBills] = useState<ShopUtilityBill[]>([]),
    [profileRequests, setProfileRequests] = useState<StudentProfileRequest[]>(
      [],
    ),
    [roomTransferRequests, setRoomTransferRequests] = useState<
      RoomTransferRequest[]
    >([]),
    [studentInvoices, setStudentInvoices] = useState<StudentInvoice[]>([]),
    [paymentEvidence, setPaymentEvidence] = useState<StudentPaymentEvidence[]>(
      [],
    ),
    [search, setSearch] = useState(""),
    [studentForm, setStudentForm] = useState(false),
    [staffForm, setStaffForm] = useState(false),
    [paymentForm, setPaymentForm] = useState(false),
    [profile, setProfile] = useState<Student | null>(null),
    [staffProfile, setStaffProfile] = useState<Staff | null>(null),
    [profileTab, setProfileTab] = useState("Personal details"),
    [staffProfileTab, setStaffProfileTab] = useState("Personal details"),
    [from, setFrom] = useState("2026-01"),
    [to, setTo] = useState("2026-12"),
    [paymentSection, setPaymentSection] = useState<
      | "ledger"
      | "rooms"
      | "shops"
      | "utilities"
      | "deposits"
      | "evidence"
      | "invoices"
    >("ledger"),
    [toast, setToast] = useState(""),
    [currentUser, setAuthenticatedUser] = useState<AuthenticatedUser | null | undefined>(undefined),
    [authError, setAuthError] = useState(""),
    [staffPermissions, setStaffPermissions] = useState<StaffPermissionMatrix>({});
  useEffect(() => {
    const restoreFetch = installAuthenticatedFetch();
    completeSignIn()
      .then(setAuthenticatedUser)
      .catch((reason) => {
        setAuthError(reason instanceof Error ? reason.message : "Sign-in failed.");
        setAuthenticatedUser(null);
      });
    return restoreFetch;
  }, []);
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === "Student") {
      void fetch("/api/v1/students/me").then(async (response) => {
        if (!response.ok) throw new Error("No resident profile is linked to this email address");
        return studentFromApi(await response.json());
      }).then(async (student) => {
        setStudents([student]);
        const response = await fetch(`/api/v1/invoices?registrationNo=${encodeURIComponent(student.registrationNo)}&size=100`);
        if (response.ok) setStudentInvoices(((await response.json()) as ApiPage<StudentInvoice>).items);
      }).catch((reason) => setToast(reason instanceof Error ? reason.message : "Unable to load resident profile"));
      return;
    }
    const page = <T,>(path: string) =>
      fetch(`${path}${path.includes("?") ? "&" : "?"}size=100`).then(async (response) => {
        if (!response.ok) throw new Error(`Unable to load ${path}`);
        return (await response.json()) as ApiPage<T>;
      });
    void Promise.all([
      page<Record<string, unknown>>("/api/v1/students").then((result) => setStudents(result.items.map(studentFromApi))),
      page<Room>("/api/v1/rooms").then((result) => setRooms(result.items)),
      page<Record<string, unknown>>("/api/v1/staff").then((result) => setStaffMembers(result.items.map(staffFromApi))),
      page<StaffDesignation>("/api/v1/staff-designations").then((result) => setStaffDesignations(result.items)),
      page<Shop>("/api/v1/shops").then((result) => setShops(result.items)),
      page<Record<string, unknown>>("/api/v1/shop-tenants").then((result) => setShopTenants(result.items.map(tenantFromApi))),
      page<StudentInvoice>("/api/v1/invoices").then((result) => setStudentInvoices(result.items)),
      fetch("/api/v1/payments").then(async (response) => { if (!response.ok) throw new Error("Unable to load payments"); setPayments(await response.json()); }),
    ]).catch((reason) => setToast(reason instanceof Error ? reason.message : "Unable to load registers"));
  }, [currentUser]);
  useEffect(() => {
    if (!currentUser || !["Admin", "Chairman", "Managing Director", "Hostel Warden"].includes(currentUser.role)) return;
    const reload = () => void fetch("/api/v1/invoices?size=100")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Unable to reload invoices")))
      .then((result: ApiPage<StudentInvoice>) => setStudentInvoices(result.items))
      .catch((reason) => setToast(reason instanceof Error ? reason.message : "Unable to reload invoices"));
    window.addEventListener("invoices-changed", reload);
    return () => window.removeEventListener("invoices-changed", reload);
  }, [currentUser]);
  useEffect(() => {
    if (currentUser?.role !== "Admin" || !staffMembers.length) return;
    void Promise.all(
      staffMembers.map(async (member) => {
        const response = await fetch(`/api/v1/admin/staff/${encodeURIComponent(member.staffNo)}/permissions`);
        if (!response.ok) throw new Error("Unable to load staff permissions");
        const values = (await response.json()) as Array<{ permissionKey: StaffPermissionKey; enabled: boolean }>;
        return [member.staffNo, Object.fromEntries(values.map((value) => [value.permissionKey, value.enabled]))] as const;
      }),
    )
      .then((entries) => setStaffPermissions(Object.fromEntries(entries)))
      .catch((reason) => setToast(reason instanceof Error ? reason.message : "Unable to load staff permissions"));
  }, [currentUser, staffMembers]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);
  const active = students.filter((s) => s.status === "Active"),
    currentResidents = active.filter((student) => !student.vacatedDate),
    allPayments = consolidatePayments(payments),
    due = allPayments.reduce(
      (n, p) => n + Math.max(0, netPayable(p) - p.paidAmount),
      0,
    ),
    beds = rooms.reduce((n, r) => n + r.beds, 0);
  const navigate = (destination: Page) => {
    setProfile(null);
    setStaffProfile(null);
    setPage(destination);
  };
  if (currentUser === undefined) return <ProductionLogin loading />;
  if (!currentUser) return <ProductionLogin error={authError} />;
  if (!["Admin", "Chairman", "Managing Director"].includes(currentUser.role))
    return (
      <LimitedPortal
        user={currentUser}
        students={students}
        studentUpdated={(updated) =>
          setStudents((current) =>
            current.map((student) =>
              student.registrationNo === updated.registrationNo
                ? updated
                : student,
            ),
          )
        }
        staff={staffMembers}
        staffPayroll={staffPayroll}
        staffDesignations={staffDesignations}
        staffUpdated={(updated) =>
          setStaffMembers((current) =>
            current.map((member) =>
              member.staffNo === updated.staffNo ? updated : member,
            ),
          )
        }
        activeStudents={active}
        shopTenants={shopTenants}
        shopUtilityBills={shopUtilityBills}
        payments={payments}
        adjustments={adjustments}
        categories={expenseCategories}
        rooms={rooms}
        profileRequests={profileRequests}
        roomTransferRequests={roomTransferRequests}
        requestAdded={(request) =>
          setProfileRequests((current) => [request, ...current])
        }
        roomTransferRequestAdded={(request) =>
          setRoomTransferRequests((current) => [request, ...current])
        }
        roomTransferRequestUpdated={(request) =>
          setRoomTransferRequests((current) =>
            current.map((item) => (item.id === request.id ? request : item)),
          )
        }
        invoices={studentInvoices}
        paymentEvidence={paymentEvidence}
        evidenceAdded={(entry) =>
          setPaymentEvidence((current) => [entry, ...current])
        }
        staffPermissions={staffPermissions}
        onLogout={signOut}
      />
    );
  return (
    <main>
      <aside>
        <button
          className="brand"
          onClick={() => navigate("Overview")}
          aria-label="The Perk Haven home"
        >
          <span className="brand-logo" aria-hidden="true" />
        </button>
        <nav>
          {(
            [
              "Overview",
              "Action List",
              "Residents",
              "Hostel Rooms",
              "Payments",
              "Expenses",
              "Staff",
              "Other Income",
              "Bank Reconciliation",
              "Financial Accounts",
              "Agreements & Settlements",
              "Admin Controls",
            ].filter((item) => item !== "Admin Controls" || currentUser.role === "Admin") as Page[]
          ).map((x, i) => (
            <button
              key={x}
              className={page === x ? "active" : ""}
              onClick={() => navigate(x)}
            >
              <i>{["⌂", "✓", "♙", "▦", "▤", "◈", "♧", "＋", "⇄", "Σ", "▣", "⚙"][i]}</i>
              <span>
                {x === "Residents"
                  ? "Registers"
                  : x === "Hostel Rooms"
                    ? "Occupancy"
                    : x === "Staff"
                      ? "Staff Payroll"
                      : x === "Financial Accounts"
                        ? "Financial Summary"
                        : x}
              </span>
              {x === "Payments" && (
                <em>
                  {
                    allPayments.filter((p) => p.paidAmount < netPayable(p))
                      .length
                  }
                </em>
              )}
              {x === "Action List" && (
                <em>
                  {paymentEvidence.filter((entry) => entry.status === "Pending")
                    .length +
                    profileRequests.filter(
                      (request) => request.status === "Pending",
                    ).length +
                    expenses.filter(
                      (expense) =>
                        expense.approvalStatus === "Pending" ||
                        expense.approvalStatus === "More Details Requested",
                    ).length +
                    students.filter(
                      (student) =>
                        student.noticeToVacateDate &&
                        (student.noticeApprovalStatus || "Pending") ===
                          "Pending",
                    ).length +
                    roomTransferRequests.filter(
                      (request) => request.status === "Pending",
                    ).length}
                </em>
              )}
            </button>
          ))}
        </nav>
        <div className="admin">
          <i>
            {currentUser.name
              .split(" ")
              .map((word) => word[0])
              .join("")
              .slice(0, 2)}
          </i>
          <span>
            <b>{currentUser.name}</b>
            <small>{currentUser.role}</small>
          </span>
          <button className="signout" onClick={signOut}>
            Sign out
          </button>
        </div>
      </aside>
      <section className="workspace">
        <header className={page === "Payments" ? "payment-ledger-header" : ""}>
          <div>
            <p>
              PERKHAVEN /{" "}
              {(page === "Residents"
                ? "Registers"
                : page === "Hostel Rooms"
                  ? "Occupancy"
                  : page === "Staff"
                    ? "Staff Payroll"
                    : page === "Financial Accounts"
                      ? "Financial Summary"
                      : page === "Payments"
                        ? "Payment Ledger"
                      : page === "Bank Reconciliation"
                        ? "Bank Reconciliation Register"
                      : page
              ).toUpperCase()}
            </p>
            <h1>
              {page === "Overview"
                ? "Good morning, Admin"
                : page === "Residents"
                  ? "Registers"
                  : page === "Hostel Rooms"
                    ? "Occupancy"
                    : page === "Staff"
                      ? "Staff Payroll"
                      : page === "Financial Accounts"
                        ? "Financial Summary"
                        : page === "Payments"
                          ? "Payment Ledger"
                        : page === "Bank Reconciliation"
                          ? "Bank Reconciliation Register"
                        : page}
            </h1>
            {page === "Bank Reconciliation" && (
              <button
                type="button"
                className="secondary bank-reconciliation-back"
                onClick={() => setPage("Action List")}
              >
                ← Go Back
              </button>
            )}
          </div>
          {page === "Bank Reconciliation" && <BankReconciliationHeaderSummary />}
        </header>
        {page === "Overview" && (
          <Overview
            students={students}
            payments={allPayments}
            invoices={studentInvoices}
            expenses={expenses}
            active={active.length}
            occupancy={currentResidents.length}
            beds={beds}
            due={due}
            currentMonthOutstanding={studentInvoices
              .filter(
                (invoice) =>
                  invoice.month === new Date().toISOString().slice(0, 7) &&
                  invoice.status !== "Cancelled",
              )
              .reduce(
                (total, invoice) =>
                  total + Math.max(0, invoice.amount - Number(invoice.paidAmount || 0)),
                0,
              )}
            staffCount={staffMembers.filter((member) => member.status === "Active").length}
            totalStaffCount={staffMembers.length}
            shopCount={shopTenants.filter((tenant) => tenant.status === "Active").length}
            totalShopCount={shops.filter((shop) => shop.active).length}
            expenseCount={expenses.length}
            approvedExpenseTotal={expenses
              .filter((expense) => expense.approvalStatus === "Approved")
              .reduce((total, expense) => total + expense.amount, 0)}
            currentMonthExpenseTotal={expenses
              .filter(
                (expense) =>
                  expense.approvalStatus === "Approved" &&
                  expense.transactionDate.startsWith(
                    new Date().toISOString().slice(0, 7),
                  ),
              )
              .reduce((total, expense) => total + expense.amount, 0)}
            pendingExpenseCount={expenses.filter((expense) =>
              expense.approvalStatus === "Pending" ||
              expense.approvalStatus === "More Details Requested",
            ).length}
            payrollCount={staffPayroll.filter((entry) =>
              entry.paymentStatus === "Submitted",
            ).length}
            pendingActionCount={
              paymentEvidence.filter((entry) => entry.status === "Pending").length +
              profileRequests.filter((request) => request.status === "Pending").length +
              expenses.filter((expense) =>
                expense.approvalStatus === "Pending" ||
                expense.approvalStatus === "More Details Requested",
              ).length +
              students.filter((student) =>
                student.noticeToVacateDate &&
                (student.noticeApprovalStatus || "Pending") === "Pending",
              ).length +
              roomTransferRequests.filter((request) => request.status === "Pending").length
            }
            unsignedAgreementCount={students.filter(
              (student) =>
                student.status === "Active" &&
                (student.contractAgreementStatus || "Not signed") !== "Signed",
            ).length}
            pendingSettlementCount={students.filter(
              (student) => Boolean(student.noticeToVacateDate) && !student.allSettled,
            ).length}
            go={setPage}
            open={setProfile}
            addPay={() => setPaymentForm(true)}
          />
        )}{" "}
        {page === "Admin Controls" && currentUser.role === "Admin" && (
          <AdminControls
            staff={staffMembers}
            permissions={staffPermissions}
            updatePermissions={setStaffPermissions}
          />
        )}{" "}
        {page === "Residents" && (
          <RegistersView
            students={students}
            staff={staffMembers}
            tenants={shopTenants}
            shops={shops}
            rooms={rooms}
            payments={payments}
            adjustments={adjustments}
            search={search}
            openStudent={setProfile}
            openStaff={setStaffProfile}
            addStudent={() => setStudentForm(true)}
            addStaff={() => setStaffForm(true)}
            tenantAdded={(tenant) => {
              setShopTenants((current) => [...current, tenant]);
              setToast(`${tenant.registrationNo} registered`);
            }}
            tenantUpdated={(tenant) =>
              setShopTenants((current) =>
                current.map((item) => (item.id === tenant.id ? tenant : item)),
              )
            }
            tenantDeleted={(id) =>
              setShopTenants((current) =>
                current.filter((item) => item.id !== id),
              )
            }
            studentUpdated={(student) =>
              setStudents((current) =>
                current.map((item) =>
                  item.id === student.id ? student : item,
                ),
              )
            }
            studentDeleted={(registrationNo) =>
              setStudents((current) =>
                current.filter(
                  (item) => item.registrationNo !== registrationNo,
                ),
              )
            }
            staffUpdated={(member) =>
              setStaffMembers((current) =>
                current.map((item) => (item.id === member.id ? member : item)),
              )
            }
            staffDeleted={(staffNo) =>
              setStaffMembers((current) =>
                current.filter((item) => item.staffNo !== staffNo),
              )
            }
            designations={staffDesignations}
            designationAdded={(designation) =>
              setStaffDesignations((current) =>
                [...current, designation].sort((a, b) =>
                  a.name.localeCompare(b.name),
                ),
              )
            }
            designationUpdated={(designation) =>
              setStaffDesignations((current) =>
                current.map((item) =>
                  item.id === designation.id ? designation : item,
                ),
              )
            }
            designationDeleted={(id) =>
              setStaffDesignations((current) =>
                current.filter((item) => item.id !== id),
              )
            }
          />
        )}{" "}
        {page === "Payments" && (
          <PaymentView
            payments={payments}
            students={students}
            shopTenants={shopTenants}
            shopUtilityBills={shopUtilityBills}
            adjustments={adjustments}
            openStudent={(student) => {
              setProfileTab("Payment details");
              setProfile(student);
            }}
            from={from}
            to={to}
            setFrom={setFrom}
            setTo={setTo}
            section={paymentSection}
            setSection={setPaymentSection}
            adjustmentAdded={(adjustment) =>
              setAdjustments((current) => [...current, adjustment])
            }
            adjustmentUpdated={(adjustment) =>
              setAdjustments((current) =>
                current.map((item) =>
                  item.id === adjustment.id ? adjustment : item,
                ),
              )
            }
            adjustmentDeleted={(id) =>
              setAdjustments((current) =>
                current.filter((item) => item.id !== id),
              )
            }
            utilityAdded={(bill) =>
              setShopUtilityBills((current) => [bill, ...current])
            }
            utilityUpdated={(bill) =>
              setShopUtilityBills((current) =>
                current.map((item) => (item.id === bill.id ? bill : item)),
              )
            }
            utilityDeleted={(id) =>
              setShopUtilityBills((current) =>
                current.filter((item) => item.id !== id),
              )
            }
            paymentUpdated={(payment) =>
              setPayments((current) =>
                current.map((item) =>
                  item.id === payment.id ? payment : item,
                ),
              )
            }
            paymentDeleted={(id) =>
              setPayments((current) => current.filter((item) => item.id !== id))
            }
            invoices={studentInvoices}
            paymentEvidence={paymentEvidence}
            invoicesUpdated={setStudentInvoices}
            invoiceUpdated={(invoice) =>
              setStudentInvoices((current) =>
                current.map((item) =>
                  item.id === invoice.id ? invoice : item,
                ),
              )
            }
            evidenceReviewed={(entry, payment) => {
              setPaymentEvidence((current) =>
                current.map((item) => (item.id === entry.id ? entry : item)),
              );
              if (payment) setPayments((current) => [payment, ...current]);
            }}
            reviewer={currentUser.name}
            canExportLedger={currentUser.role === "Admin"}
            addPayment={() => setPaymentForm(true)}
          />
        )}{" "}
        {page === "Hostel Rooms" && (
          <RoomView
            canManage={currentUser.role === "Admin"}
            students={currentResidents}
            rooms={rooms}
            shops={shops}
            tenants={shopTenants}
            openStudent={setProfile}
            saveRoom={(room) => {
              setRooms((current) =>
                current.map((item) =>
                  item.roomNo === room.roomNo ? room : item,
                ),
              );
              setToast(`hostel room ${room.roomNo} price updated`);
            }}
            roomAdded={(room) => setRooms((current) => [...current, room].sort((a, b) => a.roomNo.localeCompare(b.roomNo)))}
            roomRemoved={(roomNo) => setRooms((current) => current.filter((room) => room.roomNo !== roomNo))}
            shopUpdated={(shop) => {
              setShops((current) =>
                current.map((item) => (item.id === shop.id ? shop : item)),
              );
              setToast(`${shop.shopNo} monthly accommodation fee updated`);
            }}
            shopAdded={(shop) => setShops((current) => [...current, shop].sort((a, b) => a.shopNo.localeCompare(b.shopNo)))}
            shopRemoved={(shopNo) => setShops((current) => current.filter((shop) => shop.shopNo !== shopNo))}
          />
        )}{" "}
        {page === "Staff" && (
          <StaffView
            rows={staffMembers.filter((member) =>
              `${member.staffNo} ${member.firstName} ${member.lastName} ${member.designation}`
                .toLowerCase()
                .includes(search.toLowerCase()),
            )}
            open={setStaffProfile}
            payroll={staffPayroll}
            payrollAdded={(entry) => {
              setStaffPayroll((current) => [entry, ...current]);
              setToast(`Payslip prepared for ${fmtMonth(entry.month)}`);
            }}
            payrollUpdated={(entry) => {
              setStaffPayroll((current) =>
                current.map((item) => (item.id === entry.id ? entry : item)),
              );
              setToast(
                entry.paymentStatus === "Paid"
                  ? `Salary paid for ${fmtMonth(entry.month)}`
                  : entry.paymentStatus === "Submitted"
                    ? `Payslip submitted for ${fmtMonth(entry.month)}`
                  : `Payslip updated for ${fmtMonth(entry.month)}`,
              );
            }}
            payrollDeleted={(id, linkedExpenseId) => {
              setStaffPayroll((current) =>
                current.filter((item) => item.id !== id),
              );
              if (linkedExpenseId)
                setExpenses((current) =>
                  current.filter((item) => item.id !== linkedExpenseId),
                );
              setToast("Payroll entry deleted");
            }}
            expenseCategories={expenseCategories}
            expenseAdded={(expense) =>
              setExpenses((current) => [expense, ...current])
            }
          />
        )}
        {page === "Expenses" && (
          <ExpensesView
            categories={expenseCategories}
            expenses={expenses}
            staff={staffMembers}
            search={search}
            categoryAdded={(category) =>
              setExpenseCategories((current) =>
                [...current, category].sort((a, b) =>
                  a.name.localeCompare(b.name),
                ),
              )
            }
            categoryUpdated={(category) =>
              setExpenseCategories((current) =>
                current.map((item) =>
                  item.id === category.id ? category : item,
                ),
              )
            }
            categoryDeleted={(id) =>
              setExpenseCategories((current) =>
                current.filter((item) => item.id !== id),
              )
            }
            expenseAdded={(expense) => {
              setExpenses((current) => [expense, ...current]);
              setToast(`${expense.transactionId} recorded`);
            }}
            expenseUpdated={(expense) => {
              setExpenses((current) =>
                current.map((item) =>
                  item.id === expense.id ? expense : item,
                ),
              );
              setToast(`${expense.transactionId} approval updated`);
            }}
            expenseDeleted={(id, payrollId) => {
              setExpenses((current) =>
                current.filter((item) => item.id !== id),
              );
              if (payrollId)
                setStaffPayroll((current) =>
                  current.map((item) =>
                    item.id === payrollId
                      ? {
                          ...item,
                          paymentStatus: "Prepared",
                          linkedExpenseId: null,
                        }
                      : item,
                  ),
                );
              setToast("Expense deleted");
            }}
          />
        )}
        {page === "Financial Accounts" && (
          <FinancialAccounts
            payments={payments}
            expenses={expenses}
            categories={expenseCategories}
          />
        )}
        {page === "Agreements & Settlements" && (
          <AgreementSettlementView students={students} staff={staffMembers} payments={payments} invoices={studentInvoices} studentUpdated={(updated) => setStudents((current) => current.map((item) => item.registrationNo === updated.registrationNo ? updated : item))} />
        )}
        {page === "Other Income" && (
          <OtherIncomeView
            payments={payments}
            added={(payment) =>
              setPayments((current) => [payment, ...current])
            }
            updated={(payment) =>
              setPayments((current) =>
                current.map((item) =>
                  item.id === payment.id ? payment : item,
                ),
              )
            }
            removed={(id) =>
              setPayments((current) => current.filter((item) => item.id !== id))
            }
          />
        )}
        {page === "Bank Reconciliation" && <BankReconciliation />}
        {page === "Action List" && (
          <ActionList
            paymentEvidence={paymentEvidence}
            payments={payments}
            expenses={expenses}
            profileRequests={profileRequests}
            roomTransferRequests={roomTransferRequests}
            students={students}
            reviewer={currentUser.name}
            reviewerRole={currentUser.role}
            evidenceReviewed={(entry, payment) => {
              setPaymentEvidence((current) =>
                current.map((item) => (item.id === entry.id ? entry : item)),
              );
              if (payment) setPayments((current) => [payment, ...current]);
            }}
            expenseUpdated={(expense) =>
              setExpenses((current) =>
                current.map((item) =>
                  item.id === expense.id ? expense : item,
                ),
              )
            }
            profileReviewed={(request, student) => {
              setProfileRequests((current) =>
                current.map((item) =>
                  item.id === request.id ? request : item,
                ),
              );
              if (student)
                setStudents((current) =>
                  current.map((item) =>
                    item.registrationNo === student.registrationNo
                      ? student
                      : item,
                  ),
                );
            }}
            studentUpdated={(student) =>
              setStudents((current) =>
                current.map((item) =>
                  item.registrationNo === student.registrationNo
                    ? student
                    : item,
                ),
              )
            }
            roomTransferReviewed={(request, student) => {
              setRoomTransferRequests((current) =>
                current.map((item) =>
                  item.id === request.id ? request : item,
                ),
              );
              if (student)
                setStudents((current) =>
                  current.map((item) =>
                    item.registrationNo === student.registrationNo
                      ? student
                      : item,
                  ),
                );
            }}
            go={setPage}
          />
        )}
      </section>
      {studentForm && (
        <Register
          students={students}
          rooms={rooms}
          creatorRole={currentUser.role}
          close={() => setStudentForm(false)}
          save={(s) => {
            setStudents((v) => [...v, s]);
            setStudentForm(false);
            setToast(`${s.registrationNo} registered`);
          }}
        />
      )}
      {paymentForm && (
        <AddPayment
          students={active}
          shopTenants={shopTenants.filter(
            (tenant) => tenant.status === "Active",
          )}
          shopUtilityBills={shopUtilityBills}
          payments={payments}
          adjustments={adjustments}
          close={() => setPaymentForm(false)}
          done={() => {
            setPaymentForm(false);
            setProfile(null);
            setPage("Payments");
            setToast("Payment recorded Successfully");
          }}
          save={(p) => {
            setPayments((v) => [...v, p]);
          }}
        />
      )}
      {staffForm && (
        <AddStaff
          staff={staffMembers}
          creatorRole={currentUser.role}
          designations={staffDesignations.filter(
            (designation) => designation.active,
          )}
          close={() => setStaffForm(false)}
          save={(member) => {
            setStaffMembers((current) => [member, ...current]);
            setStaffForm(false);
            setToast(`${member.staffNo} added`);
          }}
        />
      )}
      {profile && (
        <Profile
          student={profile}
          payments={payments.filter(
            (p) => p.registrationNo === profile.registrationNo,
          )}
          adjustments={adjustments.filter(
            (adjustment) =>
              adjustment.registrationNo === profile.registrationNo,
          )}
          profileRequests={profileRequests.filter(
            (request) => request.registrationNo === profile.registrationNo,
          )}
          roomTransferRequests={roomTransferRequests.filter(
            (request) => request.registrationNo === profile.registrationNo,
          )}
          tab={profileTab}
          setTab={setProfileTab}
          close={() => setProfile(null)}
          studentUpdated={(updated) => {
            setStudents((current) =>
              current.map((student) =>
                student.registrationNo === updated.registrationNo
                  ? updated
                  : student,
              ),
            );
            setProfile(updated);
            setToast("Resident profile updated");
          }}
        />
      )}
      {staffProfile && (
        <StaffProfile
          member={staffProfile}
          designations={staffDesignations.filter(
            (designation) =>
              designation.active ||
              designation.name === staffProfile.designation,
          )}
          payroll={staffPayroll.filter(
            (entry) => entry.staffNo === staffProfile.staffNo,
          )}
          tab={staffProfileTab}
          setTab={setStaffProfileTab}
          close={() => setStaffProfile(null)}
          staffUpdated={(updated) => {
            setStaffMembers((current) =>
              current.map((member) =>
                member.staffNo === updated.staffNo ? updated : member,
              ),
            );
            setStaffProfile(updated);
            setToast("Staff profile updated");
          }}
        />
      )}
      {toast && <div className="toast">✓ {toast}</div>}
    </main>
  );
}
function ProductionLogin({ loading = false, error = "" }: { loading?: boolean; error?: string }) {
  const [starting, setStarting] = useState(false);
  return (
    <main className="production-login-page">
      <section className="production-login-card">
        <div className="production-login-brand">
          <span className="brand-logo" />
          <p className="tag">THE PERK HAVEN HOSTEL</p>
          <h1>Sign in to Perkhaven</h1>
          <p>Continue to the secure account sign-in service.</p>
        </div>
        {error && <p className="form-error">⚠ {error}</p>}
        <button
          className="primary production-signin"
          disabled={loading || starting}
          onClick={async () => {
            setStarting(true);
            try {
              await startSignIn();
            } catch {
              setStarting(false);
            }
          }}
        >
          {loading ? "Checking session…" : starting ? "Opening secure sign-in…" : "Continue to sign in"}
        </button>
      </section>
    </main>
  );
}

function LimitedPortal({
  user,
  students,
  studentUpdated,
  staff,
  staffPayroll,
  staffDesignations,
  staffUpdated,
  activeStudents,
  shopTenants,
  shopUtilityBills,
  payments,
  adjustments,
  categories,
  rooms,
  profileRequests,
  roomTransferRequests,
  requestAdded,
  roomTransferRequestAdded,
  roomTransferRequestUpdated,
  invoices,
  paymentEvidence,
  evidenceAdded,
  staffPermissions,
  onLogout,
}: {
  user: AuthenticatedUser;
  students: Student[];
  studentUpdated: (student: Student) => void;
  staff: Staff[];
  staffPayroll: StaffPayroll[];
  staffDesignations: StaffDesignation[];
  staffUpdated: (member: Staff) => void;
  activeStudents: Student[];
  shopTenants: ShopTenant[];
  shopUtilityBills: ShopUtilityBill[];
  payments: Payment[];
  invoices: StudentInvoice[];
  adjustments: MonthlyAdjustment[];
  categories: ExpenseCategory[];
  rooms: Room[];
  profileRequests: StudentProfileRequest[];
  roomTransferRequests: RoomTransferRequest[];
  requestAdded: (request: StudentProfileRequest) => void;
  roomTransferRequestAdded: (request: RoomTransferRequest) => void;
  roomTransferRequestUpdated: (request: RoomTransferRequest) => void;
  paymentEvidence: StudentPaymentEvidence[];
  evidenceAdded: (entry: StudentPaymentEvidence) => void;
  staffPermissions: StaffPermissionMatrix;
  onLogout: () => void;
}) {
  const [paymentForm, setPaymentForm] = useState(false),
    [expenseForm, setExpenseForm] = useState(false),
    [editingStaffProfile, setEditingStaffProfile] = useState(false),
    [submittedPayments, setSubmittedPayments] = useState<Payment[]>([]),
    [submittedExpenses, setSubmittedExpenses] = useState<Expense[]>([]);
  const isWarden = user.role === "Hostel Warden";
  const student = students[0],
    member = isWarden
      ? staff.find((item) => item.designation === "Hostel Warden") || staff[0]
      : staff.find((item) => item.designation !== "Hostel Warden") || staff[0],
    permissions = member ? staffPermissions[member.staffNo] || {} : {},
    hasAnyPermission = Object.values(permissions).some(Boolean);
  if (user.role === "Student")
    return (
      <StudentSelfService
        user={user}
        student={student}
        studentUpdated={studentUpdated}
        payments={payments.filter(
          (payment) => payment.registrationNo === student?.registrationNo,
        )}
        adjustments={adjustments.filter(
          (adjustment) => adjustment.registrationNo === student?.registrationNo,
        )}
        requests={profileRequests.filter(
          (request) => request.registrationNo === student?.registrationNo,
        )}
        requestAdded={requestAdded}
        rooms={rooms}
        residents={students}
        roomTransferRequests={roomTransferRequests.filter(
          (request) => request.registrationNo === student?.registrationNo,
        )}
        roomTransferRequestAdded={roomTransferRequestAdded}
        roomTransferRequestUpdated={roomTransferRequestUpdated}
        invoices={invoices.filter(
          (invoice) => invoice.registrationNo === student?.registrationNo,
        )}
        paymentEvidence={paymentEvidence.filter(
          (entry) => entry.registrationNo === student?.registrationNo,
        )}
        evidenceAdded={evidenceAdded}
        onLogout={onLogout}
      />
    );
  if (!hasAnyPermission)
    return <StaffAccessLocked user={user} onLogout={onLogout} />;
  if (hasAnyPermission)
    return (
      <WardenPortal
        user={user}
        activeStudents={activeStudents}
        shopTenants={shopTenants}
        shopUtilityBills={shopUtilityBills}
        payments={payments}
        adjustments={adjustments}
        categories={categories}
        staff={staff}
        member={member}
        payroll={staffPayroll.filter((entry) => entry.staffNo === member?.staffNo)}
        designations={staffDesignations}
        staffUpdated={staffUpdated}
        permissions={permissions}
        onLogout={onLogout}
      />
    );
  return (
    <main className="limited-portal">
      <header className="limited-topbar">
        <div>
          <span className="brand-logo" />
          <span>
            <b>THE PERK HAVEN</b>
            <small>SECURE ACCESS</small>
          </span>
        </div>
        <div>
          <b>{user.name}</b>
          <span>{user.role}</span>
          <button onClick={onLogout}>Sign out</button>
        </div>
      </header>
      <section className="limited-content">
        <div className="limited-welcome">
          <p className="tag">MY WORKSPACE</p>
          <h1>Welcome, {user.name}</h1>
          <p>
            Your account displays only the information and actions assigned to
            your role.
          </p>
        </div>
        {isWarden ? (
          <>
            <div className="warden-action-grid">
              <button className="panel" onClick={() => setPaymentForm(true)}>
                <i>＋</i>
                <b>Enter a payment</b>
                <span>Submit a new payment entry for approval</span>
              </button>
              <button className="panel" onClick={() => setExpenseForm(true)}>
                <i>＋</i>
                <b>Enter an expense</b>
                <span>Submit a new expense entry for approval</span>
              </button>
            </div>
            <section className="panel limited-submissions">
              <p className="tag">MY SUBMISSIONS</p>
              <h2>Entries submitted in this session</h2>
              <table>
                <thead>
                  <tr>
                    <th>TYPE</th>
                    <th>REFERENCE</th>
                    <th>DATE</th>
                    <th>AMOUNT<small>(LKR)</small></th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {submittedPayments.map((row) => (
                    <tr key={`p-${row.id}`}>
                      <td>Payment</td>
                      <td>{transactionIdFor(row)}</td>
                      <td>{fmtDate(row.paidDate)}</td>
                      <td>{amountOnly.format(row.paidAmount)}</td>
                      <td>
                        <span className="approval-status pending">
                          Pending approval
                        </span>
                      </td>
                    </tr>
                  ))}
                  {submittedExpenses.map((row) => (
                    <tr key={`e-${row.id}`}>
                      <td>Expense</td>
                      <td>{row.transactionId}</td>
                      <td>{fmtDate(row.transactionDate)}</td>
                      <td>{amountOnly.format(row.amount)}</td>
                      <td>
                        <span
                          className={`approval-status ${row.approvalStatus.toLowerCase()}`}
                        >
                          {row.approvalStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {!submittedPayments.length && !submittedExpenses.length && (
                    <tr>
                      <td colSpan={5}>
                        No entries submitted during this session.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
          </>
        ) : (
          <section className="panel own-profile-card">
            <p className="tag">MY PROFILE</p>
            <h2>
              {(user.role as AppRole) === "Student"
                ? student
                  ? `${student.firstName} ${student.lastName}`
                  : user.name
                : member
                  ? `${member.firstName} ${member.lastName}`
                  : user.name}
            </h2>
            {(user.role as AppRole) === "Student" && student ? (
              <div className="profile-summary-grid">
                <span>
                  <small>Registration no.</small>
                  <b>{student.registrationNo}</b>
                </span>
                <span>
                  <small>Email</small>
                  <b>{student.email || user.email}</b>
                </span>
                <span>
                  <small>Hostel Room</small>
                  <b>{student.roomNo}</b>
                </span>
                <span>
                  <small>Status</small>
                  <b>{student.status}</b>
                </span>
              </div>
            ) : member ? (
              <>
                <div className="profile-summary-grid">
                  <span>
                    <small>Staff no.</small>
                    <b>{member.staffNo}</b>
                  </span>
                  <span>
                    <small>Email</small>
                    <b>{member.email || user.email}</b>
                  </span>
                  <span>
                    <small>Designation</small>
                    <b>{member.designation}</b>
                  </span>
                  <span>
                    <small>Status</small>
                    <b>{member.status}</b>
                  </span>
                </div>
                <button
                  className="primary profile-completion-button"
                  onClick={() => setEditingStaffProfile(true)}
                >
                  Complete or update my profile
                </button>
              </>
            ) : (
              <p>
                A profile will appear here when a matching record is
                available.
              </p>
            )}
            <div className="restricted-note">
              <b>Restricted account</b>
              <span>
                No other registers, financial tabs, or user profiles are
                available to this account.
              </span>
            </div>
          </section>
        )}
      </section>
      {editingStaffProfile && member && (
        <EditStaff
          member={member}
          selfService
          designations={staffDesignations.filter(
            (designation) =>
              designation.active || designation.name === member.designation,
          )}
          close={() => setEditingStaffProfile(false)}
          save={(updated) => {
            staffUpdated(updated);
            setEditingStaffProfile(false);
          }}
        />
      )}
      {paymentForm && (
        <AddPayment
          students={activeStudents}
          shopTenants={shopTenants.filter(
            (tenant) => tenant.status === "Active",
          )}
          shopUtilityBills={shopUtilityBills}
          payments={payments}
          adjustments={adjustments}
          close={() => setPaymentForm(false)}
          done={() => setPaymentForm(false)}
          save={(payment) =>
            setSubmittedPayments((current) => [payment, ...current])
          }
        />
      )}
      {expenseForm && (
        <AddExpense
          categories={categories.filter((category) => category.active)}
          staff={staff.filter((item) => item.status === "Active")}
          close={() => setExpenseForm(false)}
          save={(expense) => {
            setSubmittedExpenses((current) => [expense, ...current]);
            setExpenseForm(false);
          }}
        />
      )}
    </main>
  );
}

function StaffAccessLocked({
  user,
  onLogout,
}: {
  user: AuthenticatedUser;
  onLogout: () => void;
}) {
  return (
    <main className="limited-portal staff-access-locked">
      <header className="limited-topbar">
        <div>
          <span className="brand-logo" />
          <span><b>THE PERK HAVEN</b><small>STAFF ACCESS</small></span>
        </div>
        <div>
          <b>{user.name}</b><span>{user.role}</span>
          <button onClick={onLogout}>Sign out</button>
        </div>
      </header>
      <section className="staff-locked-content">
        <div className="panel staff-locked-card">
          <span className="staff-lock-icon" aria-hidden="true">⌾</span>
          <p className="tag">ACCESS NOT ASSIGNED</p>
          <h1>No system access is currently available</h1>
          <p>
            Your account is active, but no permissions have been assigned. An
            administrator can grant access through the Admin Controls matrix.
          </p>
        </div>
      </section>
    </main>
  );
}

function WardenPortal({
  user,
  activeStudents,
  shopTenants,
  shopUtilityBills,
  payments,
  adjustments,
  categories,
  staff,
  member,
  payroll,
  designations,
  staffUpdated,
  permissions,
  onLogout,
}: {
  user: AuthenticatedUser;
  activeStudents: Student[];
  shopTenants: ShopTenant[];
  shopUtilityBills: ShopUtilityBill[];
  payments: Payment[];
  adjustments: MonthlyAdjustment[];
  categories: ExpenseCategory[];
  staff: Staff[];
  member?: Staff;
  payroll: StaffPayroll[];
  designations: StaffDesignation[];
  staffUpdated: (member: Staff) => void;
  permissions: Partial<Record<StaffPermissionKey, boolean>>;
  onLogout: () => void;
}) {
  type StaffTab = "My Profile" | "Enter Payment" | "View Payments" | "Hostel Room Payment Summary" | "Shop Payment Summary" | "Enter Expense" | "View Expenses" | "Petty Cash";
  const availableTabs = [
      permissions.ownProfile && "My Profile",
      permissions.enterPayments && "Enter Payment",
      (permissions.viewPaymentsOwn || permissions.viewPaymentsAll) && "View Payments",
      permissions.roomPaymentSummary && "Hostel Room Payment Summary",
      permissions.shopPaymentSummary && "Shop Payment Summary",
      permissions.enterExpenses && "Enter Expense",
      permissions.viewExpensesOwn && "View Expenses",
      permissions.pettyCash && "Petty Cash",
    ].filter(Boolean) as StaffTab[];
  const [tab, setTab] = useState<StaffTab>(
      availableTabs[0] || "My Profile",
    ),
    [profileTab, setProfileTab] = useState("Personal details"),
    [paymentForm, setPaymentForm] = useState(false),
    [expenseForm, setExpenseForm] = useState(false),
    [addingPettyDeposit, setAddingPettyDeposit] = useState(false),
    [submittedPayments, setSubmittedPayments] = useState<Payment[]>([]),
    [submittedExpenses, setSubmittedExpenses] = useState<Expense[]>([]),
    [pettyDeposits, setPettyDeposits] = useState<PettyCashDeposit[]>([]),
    [approvedPettyExpenses, setApprovedPettyExpenses] = useState<Expense[]>([]);
  useEffect(() => {
    fetch("/api/v1/petty-cash")
      .then((response) => response.json())
      .then((result) => result.deposits && setPettyDeposits(result.deposits))
      .catch(() => {});
    fetch("/api/v1/expenses")
      .then((response) => response.json())
      .then(
        (result) =>
          result.expenses &&
          setApprovedPettyExpenses(
            result.expenses.filter(
              (expense: Expense) =>
                expense.settlingMethod === "Petty Cash" &&
                expense.approvalStatus === "Approved",
            ),
          ),
      )
      .catch(() => {});
  }, []);
  const approvedDeposits = pettyDeposits.filter(
      (deposit) => deposit.approvalStatus === "Approved",
    ),
    balance =
      approvedDeposits.reduce((sum, deposit) => sum + deposit.amount, 0) -
      approvedPettyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const pettyRows = [
    ...pettyDeposits.map((deposit) => ({
      id: `d-${deposit.id}`,
      transactionId: deposit.transactionId,
      date: deposit.transactionDate,
      category: deposit.category,
      amount: deposit.amount,
      person: "N/A",
      evidence: deposit.evidenceName,
      href: `/api/v1/petty-cash/evidence?transactionId=${encodeURIComponent(deposit.transactionId)}`,
      kind: "Deposit",
      status: deposit.approvalStatus,
    })),
    ...approvedPettyExpenses.map((expense) => ({
      id: `e-${expense.id}`,
      transactionId: expense.transactionId,
      date: expense.transactionDate,
      category: expense.categoryName,
      amount: -expense.amount,
      person: expense.personPaidName,
      evidence: expense.evidenceName,
      href: `/api/v1/expenses/evidence?transactionId=${encodeURIComponent(expense.transactionId)}`,
      kind: "Expense",
      status:
        expense.approvalStatus === "Approved"
          ? "Approved"
          : "Unapproved Transaction",
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));
  const roomSummary = activeStudents.map((student) => {
    const studentPayments = payments.filter((payment) => payment.registrationNo === student.registrationNo && canonicalPaymentType(payment.type) === "Rent");
    const paid = studentPayments.reduce((sum, payment) => sum + payment.paidAmount, 0);
    const payable = studentPayments.reduce((sum, payment) => sum + payment.payableAmount, 0);
    return { reference: student.registrationNo, name: `${student.firstName} ${student.lastName}`, room: student.roomNo, payable, paid, outstanding: Math.max(0, payable - paid) };
  });
  const shopSummary = shopTenants.filter((tenant) => tenant.status === "Active").map((tenant) => {
    const tenantPayments = payments.filter((payment) => payment.registrationNo === tenant.registrationNo && payment.type === "Shop Rent");
    const paid = tenantPayments.reduce((sum, payment) => sum + payment.paidAmount, 0);
    const payable = tenantPayments.reduce((sum, payment) => sum + payment.payableAmount, 0);
    return { reference: tenant.registrationNo, name: tenant.businessName, room: tenant.shopNo, payable, paid, outstanding: Math.max(0, payable - paid) };
  });
  return (
    <main className="limited-portal">
      <header className="limited-topbar">
        <div>
          <span className="brand-logo" />
          <span>
            <b>THE PERK HAVEN</b>
          <small>DELEGATED STAFF ACCESS</small>
          </span>
        </div>
        <div>
          <b>{user.name}</b>
          <span>{user.role}</span>
          <button onClick={onLogout}>Sign out</button>
        </div>
      </header>
      <section className="limited-content">
        <div className="limited-welcome">
          <p className="tag">MY WORKSPACE</p>
          <h1>Assigned staff workspace</h1>
          <p>
            You can enter records and view your submissions. Submitted entries
            cannot be edited, deleted or approved from this account.
          </p>
        </div>
        {(tab === "Enter Payment" || tab === "Enter Expense" || tab === "Petty Cash") && <div className="warden-action-grid">
          <button onClick={() => tab === "Enter Payment" ? setPaymentForm(true) : tab === "Enter Expense" ? setExpenseForm(true) : setAddingPettyDeposit(true)}>
            <i>＋</i>
            <b>
              {tab === "Enter Payment"
                ? "Enter payment"
                : tab === "Enter Expense"
                  ? "Enter expense"
                  : "Add petty cash deposit"}
            </b>
            <span>New entry</span>
          </button>
        </div>}
        <div className="warden-tabs" role="tablist" aria-label="Warden records">
          {availableTabs.map((item) => (
            <button
              key={item}
              className={tab === item ? "active" : ""}
              onClick={() => setTab(item)}
            >
              {item}
            </button>
          ))}
        </div>
        {tab === "My Profile" && member && (
          <StaffProfile
            member={member}
            designations={designations.filter((designation) => designation.active || designation.name === member.designation)}
            payroll={payroll}
            tab={profileTab}
            setTab={setProfileTab}
            close={() => undefined}
            staffUpdated={staffUpdated}
            readOnly
          />
        )}
        {tab === "View Payments" && <WardenPaymentsTable rows={permissions.viewPaymentsAll ? payments : submittedPayments} all={Boolean(permissions.viewPaymentsAll)} />}
        {tab === "Hostel Room Payment Summary" && <StaffPaymentSummary title="Hostel Room payment summary" rows={roomSummary} />}
        {tab === "Shop Payment Summary" && <StaffPaymentSummary title="Shop payment summary" rows={shopSummary} />}
        {tab === "View Expenses" && <WardenExpensesTable rows={submittedExpenses} />}
        {tab === "Petty Cash" && (
          <WardenPettyCashTable rows={pettyRows} balance={balance} />
        )}
      </section>
      {paymentForm && (
        <AddPayment
          students={activeStudents}
          shopTenants={shopTenants.filter(
            (tenant) => tenant.status === "Active",
          )}
          shopUtilityBills={shopUtilityBills}
          payments={payments}
          adjustments={adjustments}
          close={() => setPaymentForm(false)}
          done={() => setPaymentForm(false)}
          save={(payment) =>
            setSubmittedPayments((current) => [payment, ...current])
          }
        />
      )}
      {expenseForm && (
        <AddExpense
          categories={categories.filter((category) => category.active)}
          staff={staff.filter((item) => item.status === "Active")}
          close={() => setExpenseForm(false)}
          save={(expense) => {
            setSubmittedExpenses((current) => [expense, ...current]);
            setExpenseForm(false);
          }}
        />
      )}
      {addingPettyDeposit && (
        <PettyCashDepositModal
          close={() => setAddingPettyDeposit(false)}
          save={(deposit) => {
            setPettyDeposits((current) => [deposit, ...current]);
            setAddingPettyDeposit(false);
          }}
        />
      )}
    </main>
  );
}

function StaffPaymentSummary({ title, rows }: { title: string; rows: Array<{ reference: string; name: string; room: string; payable: number; paid: number; outstanding: number }> }) {
  return <section className="panel limited-submissions"><p className="tag">VIEW ONLY</p><h2>{title}</h2><div className="tablewrap"><table><thead><tr><th>REFERENCE</th><th>NAME</th><th>HOSTEL ROOM / SHOP</th><th>PAYABLE<small>(LKR)</small></th><th>PAID<small>(LKR)</small></th><th>OUTSTANDING<small>(LKR)</small></th></tr></thead><tbody>{rows.map((row) => <tr key={row.reference}><td>{row.reference}</td><td>{row.name}</td><td>{row.room}</td><td>{amountOnly.format(row.payable)}</td><td>{amountOnly.format(row.paid)}</td><td>{amountOnly.format(row.outstanding)}</td></tr>)}{!rows.length && <tr><td colSpan={6}>No records available.</td></tr>}</tbody></table></div></section>;
}

function WardenPaymentsTable({ rows, all = false }: { rows: Payment[]; all?: boolean }) {
  return (
    <section className="panel limited-submissions">
      <p className="tag">{all ? "ALL PAYMENTS" : "MY PAYMENT SUBMISSIONS"}</p>
      <h2>{all ? "Payment ledger (view only)" : "Payments entered by me"}</h2>
      <div className="tablewrap">
        <table className="ledger-table">
          <colgroup>
            <col className="col-ledger-transaction" />
            <col className="col-ledger-invoice" />
            <col className="col-ledger-date" />
            <col className="col-ledger-type" />
            <col className="col-ledger-registration" />
            <col className="col-ledger-name" />
            <col className="col-ledger-room" />
            <col className="col-ledger-month" />
            <col className="col-ledger-amount" />
            <col className="col-ledger-verification" />
            <col className="col-ledger-bank-id" />
            <col className="col-ledger-evidence" />
            <col className="col-ledger-actions" />
          </colgroup>
          <thead>
            <tr>
              <th>TRANSACTION ID</th>
              <th>DATE</th>
              <th>TYPE</th>
              <th>REGISTRATION</th>
              <th>NAME</th>
              <th>HOSTEL ROOM</th>
              <th>MONTH</th>
              <th>PAYABLE<small>(LKR)</small></th>
              <th>PAID<small>(LKR)</small></th>
              <th>EVIDENCE</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <b className="transaction-id">{transactionIdFor(row)}</b>
                </td>
                <td>{fmtDate(row.paidDate)}</td>
                <td>{canonicalPaymentType(row.type)}</td>
                <td>{row.registrationNo}</td>
                <td>{row.studentName}</td>
                <td>{row.roomNo}</td>
                <td>{row.month ? fmtMonth(row.month) : "—"}</td>
                <td>{amountOnly.format(row.payableAmount)}</td>
                <td>
                  <b>{amountOnly.format(row.paidAmount)}</b>
                </td>
                <td>{row.evidenceName}</td>
                <td>
                  <span className="approval-status pending">
                    Pending approval
                  </span>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={11}>No payments submitted during this session.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function WardenExpensesTable({ rows }: { rows: Expense[] }) {
  return (
    <section className="panel limited-submissions">
      <p className="tag">MY EXPENSE SUBMISSIONS</p>
      <h2>Expenses entered by me</h2>
      <div className="tablewrap">
        <table className="ledger-table">
          <thead>
            <tr>
              <th>TRANSACTION ID</th>
              <th>DATE</th>
              <th>CATEGORY</th>
              <th>AMOUNT<small>(LKR)</small></th>
              <th>PERSON PAID</th>
              <th>SETTLING METHOD</th>
              <th>EVIDENCE</th>
              <th>REMARKS</th>
              <th>STATUS</th>
              <th>APPROVAL NOTE</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <b className="transaction-id">{row.transactionId}</b>
                </td>
                <td>{fmtDate(row.transactionDate)}</td>
                <td>{row.categoryName}</td>
                <td>
                  <b>{amountOnly.format(row.amount)}</b>
                </td>
                <td>{row.personPaidName}</td>
                <td>{row.settlingMethod}</td>
                <td>{row.evidenceName}</td>
                <td>{row.remarks || "—"}</td>
                <td>
                  <span
                    className={`approval-status ${row.approvalStatus.toLowerCase()}`}
                  >
                    {row.approvalStatus}
                  </span>
                </td>
                <td>{row.approvalNote || "—"}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={10}>No expenses submitted during this session.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function WardenPettyCashTable({
  rows,
  balance,
}: {
  rows: Array<{
    id: string;
    transactionId: string;
    date: string;
    category: string;
    amount: number;
    person: string;
    evidence: string;
    href: string;
    kind: string;
    status: string;
  }>;
  balance: number;
}) {
  return (
    <section className="panel warden-petty-log">
      <div className="section-action">
        <div>
          <p className="tag">PETTY CASH LOG</p>
          <h2>Petty cash transactions</h2>
          <p>

            You may add security deposits and view the log. Editing, deleting and
            approval are restricted.
          </p>
        </div>
        <div className="petty-balance-mini">
          <small>CURRENT APPROVED BALANCE</small>
          <b className={balance < 0 ? "red" : "green"}>
            {cash.format(balance)}
          </b>
        </div>
      </div>
      <div className="tablewrap">
        <table className="ledger-table">
          <thead>
            <tr>
              <th>TRANSACTION ID</th>
              <th>DATE</th>
              <th>TYPE</th>
              <th>CATEGORY</th>
              <th>PERSON PAID</th>
              <th>AMOUNT<small>(LKR)</small></th>
              <th>EVIDENCE</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <b className="transaction-id">{row.transactionId}</b>
                </td>
                <td>{fmtDate(row.date)}</td>
                <td>{row.kind}</td>
                <td>{row.category}</td>
                <td>{row.person}</td>
                <td className={row.amount < 0 ? "red" : "green"}>
                  <b>{amountOnly.format(row.amount)}</b>
                </td>
                <td>
                  <a
                    className="evidence-link"
                    href={row.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {row.evidence}
                  </a>
                </td>
                <td>
                  <span
                    className={`approval-status ${row.status.toLowerCase()}`}
                  >
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={8}>No petty cash transactions.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const studentEditableFields: Array<{ key: keyof Student; label: string }> = [
  { key: "firstName", label: "First name" },
  { key: "middleNames", label: "Middle name(s)" },
  { key: "lastName", label: "Last name" },
  { key: "dateOfBirth", label: "Date of birth" },
  { key: "idNo", label: "National ID" },
  { key: "mobile", label: "Mobile" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "email", label: "Email" },
  { key: "address", label: "Address" },
  { key: "university", label: "University" },
  { key: "currentYear", label: "Current year" },
  { key: "emergency1Name", label: "Primary contact name" },
  { key: "emergency1Contact", label: "Primary contact phone" },
  { key: "emergency1Relationship", label: "Primary contact relationship" },
  { key: "emergency1Address", label: "Primary contact address" },
  { key: "emergency2Name", label: "Secondary contact name" },
  { key: "emergency2Contact", label: "Secondary contact phone" },
  { key: "emergency2Relationship", label: "Secondary contact relationship" },
  { key: "emergency2Address", label: "Secondary contact address" },
];
const studentFieldLabel = (key: string) =>
  key === "profilePicture"
    ? "Profile picture"
    : studentEditableFields.find((field) => field.key === key)?.label || key;

function StudentSelfService({
  user,
  student,
  studentUpdated,
  payments,
  adjustments,
  requests,
  requestAdded,
  rooms,
  residents,
  roomTransferRequests,
  roomTransferRequestAdded,
  roomTransferRequestUpdated,
  invoices,
  paymentEvidence,
  evidenceAdded,
  onLogout,
}: {
  user: AuthenticatedUser;
  student?: Student;
  studentUpdated: (student: Student) => void;
  payments: Payment[];
  adjustments: MonthlyAdjustment[];
  requests: StudentProfileRequest[];
  requestAdded: (request: StudentProfileRequest) => void;
  rooms: Room[];
  residents: Student[];
  roomTransferRequests: RoomTransferRequest[];
  roomTransferRequestAdded: (request: RoomTransferRequest) => void;
  roomTransferRequestUpdated: (request: RoomTransferRequest) => void;
  invoices: StudentInvoice[];
  paymentEvidence: StudentPaymentEvidence[];
  evidenceAdded: (entry: StudentPaymentEvidence) => void;
  onLogout: () => void;
}) {
  const [tab, setTab] = useState("Personal details"),
    [editing, setEditing] = useState(false),
    [submittingEdit, setSubmittingEdit] = useState(false),
    [makingPayment, setMakingPayment] = useState(false),
    [previewingStudentInvoice, setPreviewingStudentInvoice] = useState<StudentInvoice | null>(null),
    [givingNotice, setGivingNotice] = useState(false),
    [requestingRoom, setRequestingRoom] = useState(false),
    [viewingAgreement, setViewingAgreement] = useState(false),
    [agreementSignedName, setAgreementSignedName] = useState(""),
    [agreementConsent, setAgreementConsent] = useState(false),
    [signingAgreement, setSigningAgreement] = useState(false),
    [studentAgreement, setStudentAgreement] = useState<AgreementRecord | null>(null),
    [respondingRoom, setRespondingRoom] = useState<RoomTransferRequest | null>(
      null,
    ),
    [message, setMessage] = useState("");
  useEffect(() => {
    if (!student) return;
    fetch("/api/v1/agreements").then((response) => response.json()).then((result) => {
      const latest = (result.agreements || []).find((entry: AgreementRecord) => entry.registrationNo === student.registrationNo);
      setStudentAgreement(latest || null);
    }).catch(() => {});
  }, [student?.registrationNo]);
  const editSubmitLock = useRef(false);
  useEffect(() => {
    if (!student) return;
    const photo = document.querySelector<HTMLElement>(
      ".student-portal-hero .profile-photo",
    );
    if (!photo) return;
    photo.setAttribute("role", "button");
    photo.setAttribute("tabindex", "0");
    photo.setAttribute("title", "Request a profile picture change");
    const choosePhoto = () => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        setMessage("Uploading your profile picture request…");
        const form = new FormData();
        form.set("registrationNo", student.registrationNo);
        form.set("requestedByEmail", user.email);
        form.set("photo", file);
        const response = await fetch("/api/student-profile-requests", {
          method: "POST",
          body: form,
        });
        const result = await response.json();
        if (!response.ok)
          return setMessage(
            result.error || "Unable to submit profile picture request.",
          );
        requestAdded(result.request);
        setTab("Edit history");
        setMessage(
          "Profile picture change submitted for administrator approval.",
        );
      };
      input.click();
    };
    const keyHandler = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        choosePhoto();
      }
    };
    photo.addEventListener("click", choosePhoto);
    photo.addEventListener("keydown", keyHandler);
    return () => {
      photo.removeEventListener("click", choosePhoto);
      photo.removeEventListener("keydown", keyHandler);
    };
  }, [student, user.email, requestAdded]);
  if (!student)
    return (
      <main className="limited-portal">
        <header className="limited-topbar">
          <b>THE PERK HAVEN</b>
          <button onClick={onLogout}>Sign out</button>
        </header>
        <section className="limited-content">
          <section className="panel">
            <h2>Resident profile unavailable</h2>
            <p>

              Your login has not yet been linked to a resident registration
              record.
            </p>
          </section>
        </section>
      </main>
    );
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (editSubmitLock.current || submittingEdit) return;
    editSubmitLock.current = true;
    setSubmittingEdit(true);
    setEditing(false);
    setMessage("Submitting your amendment request…");
    const data = new FormData(event.currentTarget),
      changes: Record<string, string> = {};
    studentEditableFields.forEach(({ key }) => {
      const phoneKeys = [
        "mobile",
        "whatsapp",
        "emergency1Contact",
        "emergency2Contact",
      ];
      changes[key] = phoneKeys.includes(String(key))
        ? combinePhone(
            String(data.get(`${String(key)}CountryCode`) || "+94"),
            String(data.get(`${String(key)}Number`) || ""),
          )
        : String(data.get(String(key)) || "");
    });
    try {
      const response = await fetch("/api/student-profile-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          registrationNo: student.registrationNo,
          requestedByEmail: user.email,
          changes,
        }),
      });
      const result = await response.json();
      if (!response.ok)
        return setMessage(result.error || "Unable to submit request.");
      if (!result.duplicate) requestAdded(result.request);
      setTab("Edit history");
      setMessage(
        result.duplicate
          ? "This amendment request is already awaiting approval."
          : "Request submitted for administrator approval.",
      );
    } finally {
      setSubmittingEdit(false);
      editSubmitLock.current = false;
    }
  };
  const rentPayments = [...payments]
    .filter(
      (payment) =>
        canonicalPaymentType(payment.type) === "Rent" && payment.paidAmount > 0,
    )
    .sort((a, b) => b.paidDate.localeCompare(a.paidDate));
  const lastPayment = rentPayments[0];
  const overdueInvoices = invoices
    .filter(
      (invoice) =>
        invoice.status !== "Paid" &&
        invoice.status !== "Cancelled" &&
        invoice.dueDate < new Date().toISOString().slice(0, 10),
    )
    .sort((a, b) => a.month.localeCompare(b.month));
  const tabs = [
    "Personal details",
    "Emergency contacts",
    "Medical condition",
    "Hostel details",
    "Payment details",
    "Invoices",
    "Agreement",
    "Edit history",
  ];
  let preparedAgreement: AgreementData | null = null;
  if (studentAgreement?.agreementDataJson) { try { preparedAgreement = JSON.parse(studentAgreement.agreementDataJson) as AgreementData; } catch { preparedAgreement = null; } }
  return (
    <main className="limited-portal student-self-service">
      <header className="limited-topbar">
        <div>
          <span className="brand-logo" />
          <span>
            <b>THE PERK HAVEN</b>
            <small>RESIDENT PORTAL</small>
          </span>
        </div>
        <div>
          <b>
            {student.firstName} {student.lastName}
          </b>
          <span>{student.registrationNo}</span>
          <button onClick={onLogout}>Sign out</button>
        </div>
      </header>
      <section className="limited-content">
        <section className="student-portal-hero">
          <div
            className={`profile-photo ${student.photoKey ? "has-photo" : ""}`}
            style={
              student.photoKey
                ? {
                    backgroundImage: `url("/api/v1/students/${encodeURIComponent(student.registrationNo)}/photo?v=${encodeURIComponent(student.photoName || "photo")}")`,
                  }
                : undefined
            }
          >
            {!student.photoKey &&
              `${student.firstName[0]}${student.lastName[0]}`}
          </div>
          <div className="student-hero-identity">
            <h1>
              {student.firstName} {student.lastName}
            </h1>
            <div className="student-hero-facts">
              <span>
                <small>HOSTEL ROOM</small>
                <b>{student.roomNo}</b>
              </span>
              <span>
                <small>MONTHLY ACCOMMODATION FEE</small>
                <b>{cash.format(student.monthlyRent)}</b>
              </span>
            </div>
            <span className={`status ${studentStatusTone(student)}`}>
              ● {student.status}
            </span>
          </div>
          <div className="student-hero-actions">
            <button onClick={() => setMakingPayment(true)}>
              Make Payment
              {paymentEvidence.some((entry) => entry.status === "Pending")
                ? " •"
                : ""}
            </button>
            <button onClick={() => setGivingNotice(true)}>

              Submit/Amend Check-Out Notice
            </button>
            <button onClick={() => setRequestingRoom(true)}>

              Request Hostel Room Change
              {roomTransferRequests.some((entry) => entry.status === "Pending")
                ? " •"
                : ""}
            </button>
          </div>
        </section>
        <nav className="student-portal-tabs">
          {tabs.map((item) => (
            <button
              key={item}
              className={tab === item ? "active" : ""}
              onClick={() => setTab(item)}
            >
              {item}
            </button>
          ))}
        </nav>
        {message && <p className="portal-message">{message}</p>}
        <section className="panel student-portal-panel">
          {tab === "Personal details" && (
            <>
              <div className="section-action">
                <div>
                  <p className="tag">PERSONNEL DETAILS</p>
                  <h2>Your registered information</h2>
                </div>
                <button className="primary" onClick={() => setEditing(true)}>
                  Request an edit
                </button>
              </div>
              <div className="detailgrid">
                <Detail
                  title="IDENTIFICATION"
                  rows={[
                    ["Registration no.", student.registrationNo],
                    ["Full name", [student.firstName, student.middleNames, student.lastName].filter(Boolean).join(" ")],
                    ["Date of birth", student.dateOfBirth ? fmtDate(student.dateOfBirth) : "—"],
                    ["National ID", student.idNo],
                  ]}
                />
                <Detail
                  title="CONTACT"
                  rows={[
                    ["Mobile", student.mobile],
                    ["WhatsApp", student.whatsapp || "—"],
                    ["Email", student.email || "—"],
                    ["Address", student.address || "—"],
                  ]}
                />
                <Detail
                  title="EDUCATION"
                  rows={[
                    ["University", student.university || "—"],
                    ["Current year", student.currentYear || "—"],
                  ]}
                />
              </div>
            </>
          )}
          {tab === "Emergency contacts" && (
            <>
              <div className="section-action">
                <div>
                  <p className="tag">EMERGENCY CONTACT DETAILS</p>
                  <h2>Your registered emergency contacts</h2>
                </div>
                <button className="primary" onClick={() => setEditing(true)}>
                  Request an edit
                </button>
              </div>
              <div className="detailgrid">
                <Detail
                  title="PRIMARY CONTACT"
                  rows={[
                    ["Name", student.emergency1Name || "—"],
                    ["Phone", student.emergency1Contact || "—"],
                    ["Relationship", student.emergency1Relationship || "—"],
                    ["Address", student.emergency1Address || "—"],
                  ]}
                />
                <Detail
                  title="SECONDARY CONTACT"
                  rows={[
                    ["Name", student.emergency2Name || "—"],
                    ["Phone", student.emergency2Contact || "—"],
                    ["Relationship", student.emergency2Relationship || "—"],
                    ["Address", student.emergency2Address || "—"],
                  ]}
                />
              </div>
            </>
          )}
          {tab === "Medical condition" && (
            <div className="detailgrid">
              <Detail title="MEDICAL CONDITION" rows={[
                ["Special medical condition", student.hasMedicalCondition ? "Yes" : "No"],
                ["Details", student.hasMedicalCondition ? student.medicalConditionDetails || "Not provided" : "Not applicable"],
              ]} />
            </div>
          )}
          {tab === "Hostel details" && (
            <>
              <div className="detailgrid">
                <Detail
                  title="RESIDENCY"
                  rows={[
                    ["Registration date", fmtDate(student.registeredDate)],
                    ["Accommodation start date", fmtDate(student.startDate)],
                    [
                      "Notice submitted",
                      student.noticeToVacateDate
                        ? fmtDate(student.noticeToVacateDate)
                        : "Not provided",
                    ],
                    [
                      "Intended check-out date",
                      student.intendedVacateDate
                        ? fmtDate(student.intendedVacateDate)
                        : "Not provided",
                    ],
                    [
                      "Vacated date",
                      student.vacatedDate
                        ? fmtDate(student.vacatedDate)
                        : "Not provided",
                    ],
                    ["Status", student.status],
                    ["All settled", student.allSettled ? "Yes" : "No"],
                    [
                      "Contract agreement",
                      student.contractAgreementStatus || "Not signed",
                    ],
                  ]}
                />
                <Detail
                  title="HOSTEL ROOM & CHARGES"
                  rows={[
                    ["Hostel Room", student.roomNo],
                    ["Monthly accommodation fee", cash.format(student.monthlyRent)],
                    [
                      "Original security deposit amount",
                      cash.format(
                        student.originalDepositPayable ||
                          student.depositPayable,
                      ),
                    ],
                    [
                      "Revised security deposit amount",
                      cash.format(
                        student.revisedDepositPayable || student.depositPayable,
                      ),
                    ],
                    [
                      "Current security deposit payable",
                      cash.format(student.depositPayable),
                    ],
                  ]}
                />
              </div>
              <div className="tablewrap room-transfer-history">
                <table>
                  <thead>
                    <tr>
                      <th>HOSTEL ROOM CHANGE REQUEST</th>
                      <th>FROM</th>
                      <th>TO</th>
                      <th>REQUESTED</th>
                      <th>TRANSFER DATE</th>
                      <th>AVAILABILITY</th>
                      <th>STATUS</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roomTransferRequests.map((request) => (
                      <tr key={request.id}>
                        <td>
                          <b>{request.requestNo}</b>
                        </td>
                        <td>{request.currentRoomNo}</td>
                        <td>{request.requestedRoomNo}</td>
                        <td>{fmtDate(request.requestedDate)}</td>
                        <td>
                          {request.transferDate
                            ? fmtDate(request.transferDate)
                            : "Awaiting approval"}
                        </td>
                        <td>
                          {request.earliestAvailableDate
                            ? `Available ${fmtDate(request.earliestAvailableDate)}`
                            : request.roomAvailabilityStatus}
                        </td>
                        <td>
                          <span
                            className={`status ${request.status === "Rejected" ? "inactive" : request.status === "Pending" ? "notice" : "active"}`}
                          >
                            ● {request.status}
                          </span>
                        </td>
                        <td>
                          {request.status === "Pending" &&
                          request.studentResponseStatus ===
                            "Awaiting Confirmation" ? (
                            <button
                              className="secondary"
                              onClick={() => setRespondingRoom(request)}
                            >
                              Confirm date
                            </button>
                          ) : (
                            <small>
                              {request.studentResponseStatus || "—"}
                            </small>
                          )}
                        </td>
                      </tr>
                    ))}
                    {!roomTransferRequests.length && (
                      <tr>
                        <td colSpan={8}>

                          No hostel room-change requests have been submitted.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {tab === "Payment details" && (
            <>
              <div className="student-payment-highlight">
                <span>
                  <small>LAST PAYMENT</small>
                  <b>
                    {lastPayment
                      ? cash.format(lastPayment.paidAmount)
                      : "No payment"}
                  </b>
                  <em>
                    {lastPayment
                      ? `${fmtDate(lastPayment.paidDate)} · ${fmtMonth(lastPayment.month)}`
                      : "—"}
                  </em>
                </span>
                <span className={overdueInvoices.length ? "overdue" : "clear"}>
                  <small>OVERDUE PAYMENTS</small>
                  <b>
                    {overdueInvoices.length
                      ? cash.format(
                          overdueInvoices.reduce(
                            (sum, invoice) => sum + invoice.amount,
                            0,
                          ),
                        )
                      : "None"}
                  </b>
                  <em>
                    {overdueInvoices.length
                      ? overdueInvoices
                          .map((invoice) => fmtMonth(invoice.month))
                          .join(", ")
                      : "All issued invoices are up to date"}
                  </em>
                </span>
              </div>
              <StudentPaymentProfile
                student={student}
                payments={payments}
                adjustments={adjustments}
              />
            </>
          )}
          {tab === "Invoices" && (
            <StudentInvoiceList
              invoices={invoices}
              student={student}
              onView={setPreviewingStudentInvoice}
              onPay={(invoice) => {
                setMakingPayment(true);
                setMessage(`Upload evidence for ${invoice.invoiceNo}.`);
              }}
            />
          )}
          {tab === "Agreement" && <section className="student-agreement-card"><div><p className="tag">CONTRACT AGREEMENT</p><h2>Your hostel agreement</h2><p>The agreement prepared by management will appear here for your review and electronic signature.</p></div><div className="agreement-status-row"><span className={`approval-status ${(studentAgreement?.status || "Not signed").toLowerCase().replaceAll(" ", "-")}`}>{studentAgreement?.status || "Not signed"}</span>{studentAgreement?.issuedAt && <small>Sent {fmtDateTime(studentAgreement.issuedAt)}</small>}{studentAgreement?.signedAt && <small>Signed {fmtDateTime(studentAgreement.signedAt)}</small>}</div>{preparedAgreement ? <button className="primary" onClick={() => { setAgreementSignedName(`${student.firstName} ${student.lastName}`); setAgreementConsent(false); setViewingAgreement(true); }}>{studentAgreement?.status === "Signed" ? "View signed agreement" : "Review and sign"}</button> : <p className="empty-state">Management has not sent an agreement yet.</p>}</section>}
          {tab === "Edit history" && (
            <ProfileRequestHistory requests={requests} />
          )}
        </section>
      </section>
      {previewingStudentInvoice && (
        <InvoicePreviewModal
          invoice={previewingStudentInvoice}
          student={student}
          close={() => setPreviewingStudentInvoice(null)}
        />
      )}
      {viewingAgreement && preparedAgreement && studentAgreement && <div className="backdrop"><section className="modal agreement-workspace-modal student-agreement-modal"><ModalHead tag="CONTRACT AGREEMENT" title={`${studentAgreement.agreementNo} · ${studentAgreement.revisionLabel}`} text={studentAgreement.status === "Signed" ? "This agreement has been electronically signed." : "Read the complete agreement before signing."} close={() => setViewingAgreement(false)} /><div className="agreement-workspace"><AgreementDocumentPreview data={preparedAgreement} signature={studentAgreement.signedName && studentAgreement.signedAt ? { name: studentAgreement.signedName, date: studentAgreement.signedAt } : undefined} /><aside className="agreement-sign-panel"><h3>Electronic signature</h3>{studentAgreement.status === "Signed" ? <><div className="success-banner">Signed electronically</div><dl><dt>Signed by</dt><dd>{studentAgreement.signedName}</dd><dt>Date and time</dt><dd>{studentAgreement.signedAt ? fmtDateTime(studentAgreement.signedAt) : "—"}</dd></dl></> : <><p>By signing, you confirm that you have read, understood and agree to this hostel accommodation agreement.</p><label>Full legal name<input value={agreementSignedName} onChange={(event) => setAgreementSignedName(event.target.value)} /></label><label className="agreement-consent"><input type="checkbox" checked={agreementConsent} onChange={(event) => setAgreementConsent(event.target.checked)} /><span>I consent to use this electronic signature and agree to be bound by the contract.</span></label><button className="primary" disabled={!agreementConsent || signingAgreement} onClick={async () => { setSigningAgreement(true); try { const response = await fetch(`/api/v1/agreements/${studentAgreement.id}/sign`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ signedName: agreementSignedName, consent: agreementConsent }) }); const result = await response.json(); if (!response.ok) throw new Error(result.detail || "Unable to sign agreement."); setStudentAgreement(result.agreement); setMessage("Agreement signed successfully."); setViewingAgreement(false); } catch (reason) { setMessage(reason instanceof Error ? reason.message : "Unable to sign agreement."); } finally { setSigningAgreement(false); } }}>Sign Agreement</button></>}</aside></div><div className="modalactions"><button className="secondary" onClick={() => downloadAgreementPdf(preparedAgreement!, `${studentAgreement.agreementNo}-${studentAgreement.revisionLabel}.pdf`, studentAgreement.signedName && studentAgreement.signedAt ? { name: studentAgreement.signedName, date: studentAgreement.signedAt } : undefined)}>Download PDF</button></div></section></div>}
      {makingPayment && (
        <div className="backdrop">
          <section className="modal student-action-modal">
            <ModalHead
              tag="RESIDENT PAYMENTS"
              title="Make a payment"
              text="Upload your payment slip for management verification."
              close={() => setMakingPayment(false)}
            />
            <div className="student-action-modal-body">
              <StudentEvidencePanel
                student={student}
                invoices={invoices}
                evidence={paymentEvidence}
                evidenceAdded={(entry) => {
                  evidenceAdded(entry);
                  setMessage(
                    `${entry.submissionId} submitted for verification.`,
                  );
                  setMakingPayment(false);
                }}
              />
            </div>
          </section>
        </div>
      )}
      {givingNotice && (
        <StudentVacatingNotice
          student={student}
          close={() => setGivingNotice(false)}
          saved={(updated) => {
            studentUpdated(updated);
            setGivingNotice(false);
            setMessage(
              `Notice received. Your intended check-out date is ${fmtDate(updated.intendedVacateDate || "")}.`,
            );
          }}
        />
      )}
      {requestingRoom && (
        <StudentRoomTransferRequest
          student={student}
          rooms={rooms}
          residents={residents}
          pending={roomTransferRequests.some(
            (entry) => entry.status === "Pending",
          )}
          close={() => setRequestingRoom(false)}
          saved={(request) => {
            roomTransferRequestAdded(request);
            setRequestingRoom(false);
            setMessage(
              `${request.requestNo} submitted for management approval.`,
            );
          }}
        />
      )}
      {respondingRoom && (
        <StudentRoomAvailabilityResponse
          request={respondingRoom}
          close={() => setRespondingRoom(null)}
          saved={(request) => {
            roomTransferRequestUpdated(request);
            setRespondingRoom(null);
            setMessage(`${request.requestNo} availability response submitted.`);
          }}
        />
      )}
      {editing && (
        <div className="backdrop">
          <form onSubmit={submit} className="profile-request-form">
            <header>
              <div>
                <p className="tag">RESIDENT PROFILE</p>
                <h2>Request personnel detail changes</h2>
                <p>
                  Your current profile remains unchanged until an authorised
                  management user approves this request.
                </p>
              </div>
              <button type="button" onClick={() => setEditing(false)}>
                ×
              </button>
            </header>
            <div className="formgrid">
              {studentEditableFields.map(({ key, label }) => {
                if (
                  [
                    "mobile",
                    "whatsapp",
                    "emergency1Contact",
                    "emergency2Contact",
                  ].includes(String(key))
                )
                  return (
                    <PhoneField
                      key={key}
                      prefix={String(key)}
                      label={label}
                      defaultValue={String(student[key] ?? "")}
                    />
                  );
                return (
                  <label
                    key={key}
                    className={
                      [
                        "address",
                        "emergency1Address",
                        "emergency2Address",
                      ].includes(String(key))
                        ? "wide"
                        : ""
                    }
                  >
                    {label}
                    <input
                      name={String(key)}
                      type={key === "dateOfBirth" ? "date" : "text"}
                      defaultValue={String(student[key] ?? "")}
                    />
                  </label>
                );
              })}
            </div>
            <footer>
              <button type="button" onClick={() => setEditing(false)}>
                Cancel
              </button>
              <button className="primary">Submit for approval</button>
            </footer>
          </form>
        </div>
      )}
    </main>
  );
}

function StudentRoomTransferRequest({
  student,
  rooms,
  residents,
  pending,
  close,
  saved,
}: {
  student: Student;
  rooms: Room[];
  residents: Student[];
  pending: boolean;
  close: () => void;
  saved: (request: RoomTransferRequest) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [roomNo, setRoomNo] = useState(""),
    [intendedStartDate, setIntendedStartDate] = useState(today),
    [availabilityPreference, setAvailabilityPreference] = useState<
      "Vacant Now" | "Earliest Available"
    >("Vacant Now"),
    [reason, setReason] = useState(""),
    [saving, setSaving] = useState(false),
    [error, setError] = useState("");
  const roomAvailability = (room: Room) => {
    const occupants = residents.filter(
      (entry) =>
        entry.registrationNo !== student.registrationNo &&
        entry.status === "Active" &&
        entry.roomNo === room.roomNo &&
        (!entry.vacatedDate || entry.vacatedDate >= today),
    );
    const vacant = occupants.length < room.beds;
    const datedVacancies = occupants
      .map((entry) => entry.vacatedDate || "")
      .filter(Boolean)
      .sort();
    const lastVacate = datedVacancies.at(-1) || "";
    const earliest = lastVacate
      ? (() => {
          const date = new Date(`${lastVacate}T00:00:00Z`);
          date.setUTCDate(date.getUTCDate() + 1);
          return date.toISOString().slice(0, 10);
        })()
      : "";
    return { vacant, earliest, occupants: occupants.length };
  };
  const available = rooms.filter((room) => room.roomNo !== student.roomNo);
  const selected = rooms.find((room) => room.roomNo === roomNo);
  const selectedAvailability = selected ? roomAvailability(selected) : null;
  const revisedDeposit = selected ? selected.price * 3 : 0;
  const depositBalance = Math.max(0, revisedDeposit - student.depositPayable);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setSaving(true);
    setError("");
    const response = await fetch("/api/room-transfer-requests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        registrationNo: student.registrationNo,
        requestedRoomNo: roomNo,
        intendedStartDate,
        availabilityPreference,
        reason,
      }),
    });
    const result = await response.json();
    setSaving(false);
    if (!response.ok)
      return setError(result.error || "Unable to submit hostel room-change request.");
    saved(result.request);
  };
  return (
    <div className="backdrop">
      <form
        className="modal paymentmodal room-transfer-modal"
        onSubmit={submit}
      >
        <ModalHead
          tag="RESIDENT PORTAL"
          title="Request Hostel Room Change"
          text={`${student.registrationNo} · Current hostel room ${student.roomNo}`}
          close={close}
        />
        <div className="vacating-notice-body">
          {pending ? (
            <div className="notice-rule">
              <b>Request awaiting approval</b>
              <p>

                You already have a hostel room-change request pending with management.
              </p>
            </div>
          ) : (
            <>
              <div className="notice-rule">
                <b>Management approval is required</b>
                <p>

                  Your hostel room and security deposit will not change until management
                  approves the request and confirms the effective transfer date.
                </p>
              </div>
              <label>

                Requested hostel room
                <select
                  value={roomNo}
                  onChange={(event) => setRoomNo(event.target.value)}
                  required
                >
                  <option value="">Select a hostel room</option>
                  {available.map((room) => {
                    const availability = roomAvailability(room);
                    return (
                      <option key={room.roomNo} value={room.roomNo}>
                        {room.roomNo} · {room.type} · {cash.format(room.price)}{" "}
                        per month ·{" "}
                        {availability.vacant
                          ? "Vacant"
                          : availability.earliest
                            ? `Available ${fmtDate(availability.earliest)}`
                            : "Occupied — date not yet known"}
                      </option>
                    );
                  })}
                </select>
              </label>
              {selected && (
                <>
                  <div className="notice-date-summary room-change-summary">
                    <span>
                      <small>HOSTEL ROOM STATUS</small>
                      <b>
                        {selectedAvailability?.vacant
                          ? "Vacant"
                          : selectedAvailability?.earliest
                            ? `Available ${fmtDate(selectedAvailability.earliest)}`
                            : "Occupied"}
                      </b>
                    </span>
                    <span>
                      <small>INTENDED ACCOMMODATION START DATE</small>
                      <b>{fmtDate(intendedStartDate)}</b>
                    </span>
                    <span>
                      <small>CURRENT SECURITY DEPOSIT</small>
                      <b>{cash.format(student.depositPayable)}</b>
                    </span>
                    <span>
                      <small>BALANCE PAYMENT</small>
                      <b>{cash.format(depositBalance)}</b>
                    </span>
                    <span>
                      <small>ESTIMATED MONTHLY ACCOMMODATION FEE</small>
                      <b>{cash.format(selected.price)}</b>
                    </span>
                    <span>
                      <small>STANDARD SECURITY DEPOSIT</small>
                      <b>{cash.format(selected.price * 3)}</b>
                    </span>
                  </div>
                  <label>

                    Intended accommodation start date
                    <input
                      type="date"
                      min={today}
                      value={intendedStartDate}
                      onChange={(event) =>
                        setIntendedStartDate(event.target.value)
                      }
                      required
                    />
                  </label>
                  {!selectedAvailability?.vacant && (
                    <div className="notice-rule">
                      <b>This hostel room is currently occupied</b>
                      <p>
                        {selectedAvailability?.earliest
                          ? `It is expected to be available from ${fmtDate(selectedAvailability.earliest)}.`
                          : "An availability date has not yet been recorded."}{" "}

                        You may request the earliest available date and the
                        system will notify you when a confirmed check-out date is
                        recorded.
                      </p>
                      <label className="choice-line">
                        <input
                          type="checkbox"
                          checked={
                            availabilityPreference === "Earliest Available"
                          }
                          onChange={(event) =>
                            setAvailabilityPreference(
                              event.target.checked
                                ? "Earliest Available"
                                : "Vacant Now",
                            )
                          }
                        />{" "}

                        Request this hostel room from its earliest available date
                      </label>
                    </div>
                  )}
                </>
              )}
              <label>

                Reason for requesting a hostel room change
                <textarea
                  rows={4}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Briefly explain the request"
                />
              </label>
            </>
          )}
          {error && <p className="form-error">⚠ {error}</p>}
        </div>
        <footer className="student-modal-actions">
          <button type="button" onClick={close}>
            Cancel
          </button>
          {!pending && (
            <button
              className="primary"
              disabled={
                saving ||
                !roomNo ||
                !intendedStartDate ||
                (!selectedAvailability?.vacant &&
                  availabilityPreference !== "Earliest Available")
              }
            >
              {saving ? "Submitting…" : "Submit request"}
            </button>
          )}
        </footer>
      </form>
    </div>
  );
}

function StudentRoomAvailabilityResponse({
  request,
  close,
  saved,
}: {
  request: RoomTransferRequest;
  close: () => void;
  saved: (request: RoomTransferRequest) => void;
}) {
  const minimum = request.earliestAvailableDate;
  const [date, setDate] = useState(minimum);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const response = await fetch("/api/room-transfer-requests", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: request.id,
        action: "studentResponse",
        proposedStartDate: date,
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error || "Unable to save your response.");
      setBusy(false);
      return;
    }
    saved(result.request);
  };
  return (
    <div className="backdrop">
      <form className="modal paymentmodal" onSubmit={submit}>
        <ModalHead
          tag="HOSTEL ROOM AVAILABILITY"
          title={`${request.requestedRoomNo} is becoming available`}
          text={`${request.requestNo} · Confirm or propose a later transfer date`}
          close={close}
        />
        <div className="vacating-notice-body">
          <div className="notice-rule">
            <b>Confirmed availability</b>
            <p>

              The hostel room will be available from {fmtDate(minimum)}. Select that
              date to confirm, or choose a later date.
            </p>
          </div>
          <label>
            Preferred transfer date
            <input
              type="date"
              min={minimum}
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </label>
          {error && <p className="form-error">⚠ {error}</p>}
        </div>
        <footer className="student-modal-actions">
          <button type="button" onClick={close}>
            Cancel
          </button>
          <button className="primary" disabled={busy || !date}>
            {busy
              ? "Submitting…"
              : date === minimum
                ? "Confirm date"
                : "Propose later date"}
          </button>
        </footer>
      </form>
    </div>
  );
}

function StudentVacatingNotice({
  student,
  close,
  saved,
}: {
  student: Student;
  close: () => void;
  saved: (student: Student) => void;
}) {
  const noticeDate = new Date().toISOString().slice(0, 10);
  const isAmendment = Boolean(student.noticeToVacateDate);
  const originalNoticeDate = student.noticeToVacateDate || noticeDate;
  const earliestAllowedDate = (() => {
    const date = new Date(`${originalNoticeDate}T00:00:00Z`),
      day = date.getUTCDate();
    date.setUTCDate(1);
    date.setUTCMonth(date.getUTCMonth() + 1);
    const lastDay = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
    ).getUTCDate();
    date.setUTCDate(Math.min(day, lastDay));
    return date.toISOString().slice(0, 10);
  })();
  const [intendedDate, setIntendedDate] = useState(
      isAmendment
        ? student.intendedVacateDate || earliestAllowedDate
        : earliestAllowedDate,
    ),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const response = await fetch("/api/students", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        kind: "noticeToVacate",
        registrationNo: student.registrationNo,
        intendedVacateDate: intendedDate,
      }),
    });
    const result = await response.json();
    setSaving(false);
    if (!response.ok)
      return setError(result.error || "Unable to submit notice.");
    saved(result.student);
  };
  return (
    <div className="backdrop">
      <form
        className="modal paymentmodal vacating-notice-modal"
        onSubmit={submit}
      >
        <ModalHead
          tag="RESIDENT PORTAL"
          title={isAmendment ? "Amend Check-Out Notice" : "Notice to Vacate"}
          text={`${student.registrationNo} · ${student.firstName} ${student.lastName}`}
          close={close}
        />
        <div className="vacating-notice-body">
          <div className="notice-rule">
            <b>Minimum one month notice is required</b>
            <p>
              {isAmendment
                ? "You may move the intended check-out date earlier or later. It must remain at least one full calendar month after the original notice date."
                : "Your intended check-out date must be at least one full month after the date this notice is submitted."}
            </p>
          </div>
          <div className="notice-date-summary">
            <span>
              <small>
                {isAmendment ? "ORIGINAL NOTICE DATE" : "NOTICE DATE"}
              </small>
              <b>{fmtDate(originalNoticeDate)}</b>
            </span>
            <span>
              <small>EARLIEST ALLOWED DATE</small>
              <b>{fmtDate(earliestAllowedDate)}</b>
            </span>
          </div>
          {isAmendment && (
            <div className="existing-notice">
              <b>Current intended check-out date</b>
              <p>{fmtDate(student.intendedVacateDate || "")}</p>
              {student.noticeAmendedDate && (
                <p>Last amended: {fmtDate(student.noticeAmendedDate)}</p>
              )}
            </div>
          )}
          <label>
            {isAmendment
              ? "Amend intended check-out date to"
              : "Intended date to vacate"}
            <input
              type="date"
              min={earliestAllowedDate}
              value={intendedDate}
              onChange={(event) => setIntendedDate(event.target.value)}
              required
            />
          </label>
          {error && <p className="form-error">⚠ {error}</p>}
        </div>
        <footer className="student-modal-actions">
          <button type="button" onClick={close}>
            Cancel
          </button>
          <button
            className="primary"
            disabled={saving || intendedDate < earliestAllowedDate}
          >
            {saving
              ? "Submitting…"
              : isAmendment
                ? "Submit amendment"
                : "Submit notice"}
          </button>
        </footer>
      </form>
    </div>
  );
}

async function buildInvoicePdf(invoice: StudentInvoice, student?: Student) {
  const { jsPDF } = await import("jspdf"),
    pdf = new jsPDF();
  let invoiceAdjustments: MonthlyAdjustment[] = [];
  if (invoice.invoiceType === "Rent") {
    try {
      const result = await fetch("/api/adjustments").then((response) => response.json());
      invoiceAdjustments = (result.adjustments || []).filter(
        (row: MonthlyAdjustment) =>
          row.registrationNo === invoice.registrationNo && row.month === invoice.month,
      );
    } catch {
      invoiceAdjustments = [];
    }
  }
  try {
    const response = await fetch("/perkhaven-logo.png");
    if (response.ok)
      pdf.addImage(
        new Uint8Array(await response.arrayBuffer()),
        "PNG",
        20,
        10,
        25,
        24,
      );
  } catch {
    /* The invoice remains available if the logo asset cannot be loaded. */
  }
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(19);
  pdf.text("THE PERK HAVEN HOSTEL", 52, 22);
  pdf.setFontSize(10);
  const utilityInvoice = invoice.invoiceType === "Shop Electricity" || invoice.invoiceType === "Shop Water";
  pdf.text(
    invoice.invoiceType === "Deposit"
      ? "HOSTEL SECURITY DEPOSIT INVOICE"
      : utilityInvoice
        ? `${invoice.invoiceType.toUpperCase()} INVOICE`
        : "MONTHLY HOSTEL INVOICE",
    52,
    31,
  );
  pdf.setDrawColor(30, 86, 135);
  pdf.line(20, 36, 190, 36);
  pdf.setFont("helvetica", "normal");
  pdf.text(
    `Invoice: ${invoice.invoiceNo}  |  Rev.${invoiceRevision(invoice)}`,
    20,
    47,
  );
  pdf.text(
    `Issue date: ${fmtDate(invoice.issueDate)}  |  Due date: ${fmtDate(invoice.dueDate)}`,
    20,
    55,
  );
  pdf.text(`${utilityInvoice ? "Tenant / business" : "Resident"}: ${student ? `${student.firstName} ${student.lastName}` : invoice.studentName}`, 20, 70);
  pdf.text(
    `Registration: ${student?.registrationNo || invoice.registrationNo}  |  ${utilityInvoice ? "Shop" : "Hostel Room"}: ${student?.roomNo || invoice.roomNo}`,
    20,
    78,
  );
  pdf.text(
    invoice.invoiceType === "Deposit"
      ? "Payment category: Security Deposit"
      : `Corresponding month: ${fmtMonth(invoice.month)}`,
    20,
    94,
  );
  const adjustmentHeight = utilityInvoice ? 62 : invoiceAdjustments.length
    ? 17 + invoiceAdjustments.length * 7 + 12
    : 24;
  pdf.setFillColor(241, 246, 251);
  pdf.rect(20, 104, 170, adjustmentHeight, "F");
  if (utilityInvoice) {
    const unitLabel = invoice.invoiceType === "Shop Electricity" ? "kWh" : "m³";
    const utilityLines = [
      [`Utility type`, invoice.invoiceType.replace("Shop ", "")],
      [`Total utility units`, `${amountOnly.format(invoice.totalUnits || 0)} ${unitLabel}`],
      [`Units used by this shop`, `${amountOnly.format(invoice.shopUnits || 0)} ${unitLabel}`],
      [`Units used by other shops`, `${amountOnly.format(invoice.otherShopUnits || 0)} ${unitLabel}`],
      [`Rate per ${unitLabel}`, `LKR ${amountOnly.format(invoice.unitRate || 0)}`],
    ];
    utilityLines.forEach(([label, value], index) => {
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(9); pdf.text(label, 25, 113 + index * 8);
      pdf.setFont("helvetica", "bold"); pdf.text(value, 105, 113 + index * 8);
    });
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(14);
    pdf.text(`Amount payable: LKR ${amountOnly.format(invoice.amount)}`, 25, 157);
  } else if (invoiceAdjustments.length) {
    const baseAmount =
      invoice.amount +
      invoiceAdjustments.reduce((sum, row) => sum + row.amount, 0);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text(`Standard monthly accommodation fee: LKR ${amountOnly.format(baseAmount)}`, 25, 113);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    invoiceAdjustments.forEach((row, index) =>
      pdf.text(
        `${row.type}: ${row.amount >= 0 ? "-" : "+"} LKR ${amountOnly.format(Math.abs(row.amount))}${row.note ? ` (${row.note})` : ""}`,
        25,
        121 + index * 7,
        { maxWidth: 160 },
      ),
    );
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.text(
      `Amount payable: LKR ${amountOnly.format(invoice.amount)}`,
      25,
      121 + invoiceAdjustments.length * 7 + 5,
    );
  } else {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(15);
    pdf.text(`Amount payable: LKR ${amountOnly.format(invoice.amount)}`, 25, 119);
  }
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.text(
    `Please settle this invoice on or before ${fmtDate(invoice.dueDate)}.`,
    20,
    104 + adjustmentHeight + 16,
  );
  if (invoice.remarks)
    pdf.text(`Remarks: ${invoice.remarks}`, 20, 104 + adjustmentHeight + 26, {
      maxWidth: 170,
    });
  pdf.text(
    "This is a system-generated invoice from The Perk Haven Hostel.",
    20,
    280,
  );
  return pdf;
}
const downloadInvoicePdf = (invoice: StudentInvoice, student?: Student) => {
  void buildInvoicePdf(invoice, student).then((pdf) =>
    downloadBlob(
      pdf.output("blob"),
      `${invoice.invoiceNo}-Rev.${invoiceRevision(invoice)}.pdf`,
    ),
  );
};

function InvoicePreviewModal({
  invoice,
  student,
  close,
}: {
  invoice: StudentInvoice;
  student?: Student;
  close: () => void;
}) {
  const [source, setSource] = useState("");
  useEffect(() => {
    let active = true, objectUrl = "";
    void fetch(`/api/v1/invoices/${invoice.id}/pdf`).then(async (response) => {
      if (!response.ok) throw new Error("Unable to prepare invoice PDF");
      objectUrl = URL.createObjectURL(await response.blob());
      if (active) setSource(objectUrl);
    });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [invoice]);
  const download = async () => {
    const response = await fetch(`/api/v1/invoices/${invoice.id}/pdf?download=true`);
    if (response.ok) downloadBlob(await response.blob(), `${invoice.invoiceNo}-Rev.${String(invoice.revisionNumber ?? Math.max(0, invoice.version - 1)).padStart(2, "0")}.pdf`);
  };
  return (
    <div className="backdrop">
      <section className="modal invoice-preview-modal">
        <ModalHead
          tag="RESIDENT INVOICE"
          title={invoice.invoiceNo}
          text={`${fmtMonth(invoice.month)} · Due ${fmtDate(invoice.dueDate)}`}
          close={close}
        />
        {source ? (
          <iframe title={`Invoice ${invoice.invoiceNo}`} src={source} />
        ) : (
          <div className="invoice-loading">Preparing invoice…</div>
        )}
        <footer>
          <button type="button" onClick={close}>
            Close
          </button>
          <button
            className="primary"
            onClick={() => void download()}
          >
            Download PDF
          </button>
        </footer>
      </section>
    </div>
  );
}

function PdfDocumentPreviewModal({
  title,
  source,
  downloadSource,
  close,
}: {
  title: string;
  source: string;
  downloadSource: string;
  close: () => void;
}) {
  return (
    <div className="backdrop">
      <section className="modal invoice-preview-modal">
        <ModalHead
          tag="PDF DOCUMENT"
          title={title}
          text="Preview this document without leaving the current page."
          close={close}
        />
        <iframe title={title} src={source} />
        <footer>
          <button type="button" onClick={close}>Close</button>
          <a className="primary document-download-button" href={downloadSource} download>
            Download PDF
          </a>
        </footer>
      </section>
    </div>
  );
}

function StudentInvoiceList({
  invoices,
  student,
  onView,
  onPay,
}: {
  invoices: StudentInvoice[];
  student: Student;
  onView: (invoice: StudentInvoice) => void;
  onPay: (invoice: StudentInvoice) => void;
}) {
  return (
    <div>
      <div className="section-action">
        <div>
          <p className="tag">INVOICE LEDGER</p>
          <h2>Your invoices</h2>
          <p>

            The Security Deposit invoice is issued first. Accommodation Fee invoices are issued seven
            days before month-end and are due on the last day of the month.
          </p>
        </div>
      </div>
      <div className="tablewrap">
        <table className="invoice-table">
          <thead>
            <tr>
              <th>INVOICE</th>
              <th>CATEGORY / MONTH</th>
              <th>ISSUED</th>
              <th>DUE</th>
              <th>AMOUNT<small>(LKR)</small></th>
              <th>STATUS</th>
              <th>COPY</th>
              <th>PAY</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td>
                  <button
                    type="button"
                    className="invoice-number-button"
                    onClick={() => onView(invoice)}
                  >
                    {invoice.invoiceNo}
                  </button>
                  <small>Rev.{invoiceRevision(invoice)}</small>
                </td>
                <td>{studentInvoiceLabel(invoice)}</td>
                <td>{fmtDate(invoice.issueDate)}</td>
                <td>{fmtDate(invoice.dueDate)}</td>
                <td>
                  <b>{amountOnly.format(invoice.amount)}</b>
                </td>
                <td>
                  <span
                    className={`invoice-status ${invoice.status.toLowerCase().replace(" ", "-")}`}
                  >
                    {invoice.status}
                  </span>
                </td>
                <td>
                  <div className="invoice-copy-actions">
                    <button type="button" className="review-button" onClick={() => onView(invoice)}>View PDF</button>
                    <button type="button" className="review-button" onClick={() => onView(invoice)}>Download PDF</button>
                  </div>
                </td>
                <td>
                  {invoice.status !== "Paid" &&
                  invoice.status !== "Cancelled" ? (
                    <button
                      className="primary compact"
                      onClick={() => onPay(invoice)}
                    >
                      Pay
                    </button>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
            {!invoices.length && (
              <tr>
                <td colSpan={8}>No invoices have been issued yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const studentInvoiceLabel = (invoice: StudentInvoice) =>
  invoice.invoiceType === "Deposit"
    ? "Deposit"
    : invoice.invoiceType === "Shop Electricity" || invoice.invoiceType === "Shop Water"
      ? `${invoice.invoiceType} · ${fmtMonth(invoice.month)}`
      : fmtMonth(invoice.month);
const invoiceRevision = (invoice: StudentInvoice) =>
  String(invoice.revisionNumber ?? Math.max(0, invoice.version - 1)).padStart(2, "0");
const adjustmentApiType = (type: MonthlyAdjustment["type"]) => ({
  "Late Start Adjustment": "LATE_START",
  "Early Vacate Adjustment": "EARLY_VACATE",
  "Vacation Discount": "VACATION_DISCOUNT",
  "Other Adjustment": "OTHER",
}[type]);
const adjustmentUiType = (type: string): MonthlyAdjustment["type"] => ({
  LATE_START: "Late Start Adjustment",
  EARLY_VACATE: "Early Vacate Adjustment",
  VACATION_DISCOUNT: "Vacation Discount",
  OTHER: "Other Adjustment",
}[type] as MonthlyAdjustment["type"] || "Other Adjustment");

function StudentEvidencePanel({
  student,
  invoices,
  evidence,
  evidenceAdded,
}: {
  student: Student;
  invoices: StudentInvoice[];
  evidence: StudentPaymentEvidence[];
  evidenceAdded: (entry: StudentPaymentEvidence) => void;
}) {
  void StudentEvidencePanelPaymentModeLegacy;
  const depositInvoice = invoices.find(
    (invoice) => invoice.invoiceType === "Deposit",
  );
  const depositUnsettled = Boolean(
    depositInvoice &&
      depositInvoice.status !== "Paid" &&
      depositInvoice.status !== "Cancelled",
  );
  const depositPending = Boolean(
    depositInvoice &&
      evidence.some(
        (entry) =>
          entry.invoiceId === depositInvoice.id && entry.status === "Pending",
      ),
  );
  const nextInvoice = depositUnsettled
    ? depositPending
      ? undefined
      : depositInvoice
    : [...invoices]
        .filter(
          (invoice) =>
            invoice.invoiceType !== "Deposit" &&
            invoice.status !== "Paid" &&
            invoice.status !== "Cancelled" &&
            !evidence.some(
              (entry) =>
                entry.invoiceId === invoice.id && entry.status === "Pending",
            ),
        )
        .sort((a, b) => a.month.localeCompare(b.month))[0];
  const fullAmount = nextInvoice
    ? Math.max(0, nextInvoice.amount - (nextInvoice.paidAmount || 0))
    : 0;
  const [paymentMode, setPaymentMode] = useState<"Full" | "Partial">("Full"),
    [partialAmount, setPartialAmount] = useState(""),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false);
  const amount = paymentMode === "Full" ? String(fullAmount) : partialAmount;
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!nextInvoice || saving) return;
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    form.set("invoiceId", String(nextInvoice.id));
    form.set("registrationNo", student.registrationNo);
    form.set("amount", amount);
    const response = await fetch("/api/payment-evidence", {
      method: "POST",
      body: form,
    });
    const result = await response.json();
    setSaving(false);
    if (!response.ok)
      return setError(result.error || "Unable to submit evidence");
    evidenceAdded(result.evidence);
    event.currentTarget.reset();
    setPartialAmount("");
    setPaymentMode("Full");
  };
  return (
    <div>
      <div className="section-action">
        <div>
          <p className="tag">PAYMENT EVIDENCE</p>
          <h2>Upload your payment slip</h2>
          <p>

            Select Full payment to use the complete outstanding balance, or
            Partial payment to enter the actual amount on a slip. Larger monthly accommodation fee
            receipts are allocated to the oldest balances first.
          </p>
        </div>
      </div>
      {nextInvoice ? (
        <form className="evidence-upload-card" onSubmit={submit}>
          <div>
            <small>NEXT REQUIRED PAYMENT</small>
            <b>{studentInvoiceLabel(nextInvoice)}</b>
            <span>
              {nextInvoice.invoiceNo} · Due {fmtDate(nextInvoice.dueDate)}
            </span>
          </div>
          <div>
            <small>OUTSTANDING AMOUNT</small>
            <b>{cash.format(fullAmount)}</b>
            <span>
              Invoice {cash.format(nextInvoice.amount)} · Paid{" "}
              {cash.format(nextInvoice.paidAmount || 0)}
            </span>
          </div>
          <fieldset className="payment-mode-choice">
            <legend>Payment option</legend>
            <label>
              <input
                type="radio"
                name="paymentMode"
                value="Full"
                checked={paymentMode === "Full"}
                onChange={() => {
                  setPaymentMode("Full");
                  setPartialAmount("");
                  setError("");
                }}
              />{" "}
              Full payment
            </label>
            <label>
              <input
                type="radio"
                name="paymentMode"
                value="Partial"
                checked={paymentMode === "Partial"}
                onChange={() => {
                  setPaymentMode("Partial");
                  setError("");
                }}
              />{" "}
              Partial payment
            </label>
          </fieldset>
          <label>
            Payment amount (LKR)
            <input
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              readOnly={paymentMode === "Full"}
              onChange={(event) => setPartialAmount(event.target.value)}
              required
            />
            {paymentMode === "Full" && (
              <small>Automatically set to the full outstanding amount.</small>
            )}
            {paymentMode === "Partial" && (
              <small>Enter the total amount shown on the uploaded slip.</small>
            )}
          </label>
          <label className="file">
            Payment slip (PDF or photo)
            <input
              name="evidence"
              type="file"
              accept="application/pdf,image/*"
              required
            />
            <span>↑ Choose payment evidence</span>
          </label>
          <label>
            Remarks (optional)
            <textarea
              name="remarks"
              rows={3}
              placeholder="Add a short comment for the reviewer"
            />
          </label>
          {error && <p className="form-error">⚠ {error}</p>}
          <button className="primary" disabled={saving || Number(amount) <= 0}>
            {saving ? "Submitting…" : "Submit for verification"}
          </button>
        </form>
      ) : (
        <div className="empty-state">
          {depositPending
            ? "Your security deposit payment evidence is awaiting verification. Monthly Accommodation Fee payment evidence can be submitted after the security deposit is fully approved."
            : "There is no unpaid invoice available for a new submission."}
        </div>
      )}
      <h3 className="evidence-history-title">Submission history</h3>
      <div className="tablewrap">
        <table className="invoice-table">
          <thead>
            <tr>
              <th>SUBMISSION</th>
              <th>INVOICE</th>
              <th>CATEGORY / MONTH</th>
              <th>AMOUNT<small>(LKR)</small></th>
              <th>DATE</th>
              <th>FILE</th>
              <th>STATUS</th>
              <th>REVIEW NOTE</th>
            </tr>
          </thead>
          <tbody>
            {evidence.map((entry) => {
              const invoice = invoices.find(
                (item) => item.id === entry.invoiceId,
              );
              return (
                <tr key={entry.id}>
                  <td>
                    <b>{entry.submissionId}</b>
                  </td>
                  <td>{entry.invoiceNo}</td>
                  <td>
                    {invoice
                      ? studentInvoiceLabel(invoice)
                      : entry.month
                        ? fmtMonth(entry.month)
                        : "Deposit"}
                  </td>
                  <td>
                    <b>{amountOnly.format(entry.amount)}</b>
                  </td>
                  <td>{fmtDate(entry.submittedDate)}</td>
                  <td>
                    <a
                      className="evidence-link"
                      href={`/api/payment-evidence/file?id=${entry.id}&download=1`}
                      download
                    >
                      ⬇ {entry.evidenceName}
                    </a>
                  </td>
                  <td>
                    <span
                      className={`approval-status ${entry.status.toLowerCase()}`}
                    >
                      {entry.status}
                    </span>
                  </td>
                  <td>{entry.reviewNote || "—"}</td>
                </tr>
              );
            })}
            {!evidence.length && (
              <tr>
                <td colSpan={8}>No payment evidence has been submitted.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StudentEvidencePanelPaymentModeLegacy({
  student,
  invoices,
  evidence,
  evidenceAdded,
}: {
  student: Student;
  invoices: StudentInvoice[];
  evidence: StudentPaymentEvidence[];
  evidenceAdded: (entry: StudentPaymentEvidence) => void;
}) {
  void StudentEvidencePanelLegacy;
  const depositInvoice = invoices.find(
    (invoice) => invoice.invoiceType === "Deposit",
  );
  const depositUnsettled = Boolean(
    depositInvoice &&
      depositInvoice.status !== "Paid" &&
      depositInvoice.status !== "Cancelled",
  );
  const depositPending = Boolean(
    depositInvoice &&
      evidence.some(
        (entry) =>
          entry.invoiceId === depositInvoice.id && entry.status === "Pending",
      ),
  );
  const nextInvoice = depositUnsettled
    ? depositPending
      ? undefined
      : depositInvoice
    : [...invoices]
        .filter(
          (invoice) =>
            invoice.invoiceType !== "Deposit" &&
            invoice.status !== "Paid" &&
            invoice.status !== "Cancelled" &&
            !evidence.some(
              (entry) =>
                entry.invoiceId === invoice.id && entry.status === "Pending",
            ),
        )
        .sort((a, b) => a.month.localeCompare(b.month))[0];
  const [amount, setAmount] = useState(""),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!nextInvoice) return;
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    form.set("invoiceId", String(nextInvoice.id));
    form.set("registrationNo", student.registrationNo);
    form.set("amount", amount);
    const response = await fetch("/api/payment-evidence", {
      method: "POST",
      body: form,
    });
    const result = await response.json();
    setSaving(false);
    if (!response.ok)
      return setError(result.error || "Unable to submit evidence");
    evidenceAdded(result.evidence);
    event.currentTarget.reset();
    setAmount("");
  };
  return (
    <div>
      <div className="section-action">
        <div>
          <p className="tag">PAYMENT EVIDENCE</p>
          <h2>Upload your payment slip</h2>
          <p>

            The system selects the Security Deposit first, then the earliest unpaid monthly accommodation fee
            invoice. Partial and combined accommodation fee payments are allocated
            automatically after approval.
          </p>
        </div>
      </div>
      {nextInvoice ? (
        <form className="evidence-upload-card" onSubmit={submit}>
          <div>
            <small>NEXT REQUIRED PAYMENT</small>
            <b>{studentInvoiceLabel(nextInvoice)}</b>
            <span>
              {nextInvoice.invoiceNo} · Due {fmtDate(nextInvoice.dueDate)}
            </span>
          </div>
          <div>
            <small>INVOICE TOTAL</small>
            <b>{cash.format(nextInvoice.amount)}</b>
            <span>Hostel Room {student.roomNo}</span>
          </div>
          <label>
            Amount paid (LKR)
            <input
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              required
            />
          </label>
          <label className="file">
            Payment slip (PDF or photo)
            <input
              name="evidence"
              type="file"
              accept="application/pdf,image/*"
              required
            />
            <span>↑ Choose payment evidence</span>
          </label>
          <label>
            Remarks (optional)
            <textarea
              name="remarks"
              rows={3}
              placeholder="Add a short comment for the reviewer"
            />
          </label>
          {error && <p className="form-error">⚠ {error}</p>}
          <button className="primary" disabled={saving || Number(amount) <= 0}>
            {saving ? "Submitting…" : "Submit for verification"}
          </button>
        </form>
      ) : (
        <div className="empty-state">
          There is no unpaid invoice available for a new submission.
        </div>
      )}
      <h3 className="evidence-history-title">Submission history</h3>
      <div className="tablewrap">
        <table className="invoice-table">
          <thead>
            <tr>
              <th>SUBMISSION</th>
              <th>INVOICE</th>
              <th>CATEGORY / MONTH</th>
              <th>AMOUNT<small>(LKR)</small></th>
              <th>DATE</th>
              <th>FILE</th>
              <th>STATUS</th>
              <th>REVIEW NOTE</th>
            </tr>
          </thead>
          <tbody>
            {evidence.map((entry) => {
              const invoice = invoices.find(
                (item) => item.id === entry.invoiceId,
              );
              return (
                <tr key={entry.id}>
                  <td>
                    <b>{entry.submissionId}</b>
                  </td>
                  <td>{entry.invoiceNo}</td>
                  <td>
                    {invoice
                      ? studentInvoiceLabel(invoice)
                      : entry.month
                        ? fmtMonth(entry.month)
                        : "Deposit"}
                  </td>
                  <td>
                    <b>{amountOnly.format(entry.amount)}</b>
                  </td>
                  <td>{fmtDate(entry.submittedDate)}</td>
                  <td>
                    <a
                      className="evidence-link"
                      href={`/api/payment-evidence/file?id=${entry.id}&download=1`}
                      download
                    >
                      ⬇ {entry.evidenceName}
                    </a>
                  </td>
                  <td>
                    <span
                      className={`approval-status ${entry.status.toLowerCase()}`}
                    >
                      {entry.status}
                    </span>
                  </td>
                  <td>{entry.reviewNote || "—"}</td>
                </tr>
              );
            })}
            {!evidence.length && (
              <tr>
                <td colSpan={8}>No payment evidence has been submitted.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StudentEvidencePanelLegacy({
  student,
  invoices,
  evidence,
  evidenceAdded,
}: {
  student: Student;
  invoices: StudentInvoice[];
  evidence: StudentPaymentEvidence[];
  evidenceAdded: (entry: StudentPaymentEvidence) => void;
}) {
  const nextInvoice = [...invoices]
    .filter(
      (invoice) =>
        invoice.status !== "Paid" &&
        invoice.status !== "Cancelled" &&
        !evidence.some(
          (entry) =>
            entry.invoiceId === invoice.id && entry.status === "Pending",
        ),
    )
    .sort((a, b) => a.month.localeCompare(b.month))[0];
  const [error, setError] = useState(""),
    [saving, setSaving] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!nextInvoice) return;
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    form.set("invoiceId", String(nextInvoice.id));
    form.set("registrationNo", student.registrationNo);
    const response = await fetch("/api/payment-evidence", {
      method: "POST",
      body: form,
    });
    const result = await response.json();
    setSaving(false);
    if (!response.ok)
      return setError(result.error || "Unable to submit evidence");
    evidenceAdded(result.evidence);
    event.currentTarget.reset();
  };
  return (
    <div>
      <div className="section-action">
        <div>
          <p className="tag">PAYMENT EVIDENCE</p>
          <h2>Upload your payment slip</h2>
          <p>
            The system selects your earliest unpaid invoice. A verified
            submission transfers automatically to the Payment Ledger.
          </p>
        </div>
      </div>
      {nextInvoice ? (
        <form className="evidence-upload-card" onSubmit={submit}>
          <div>
            <small>NEXT DUE PAYMENT</small>
            <b>{fmtMonth(nextInvoice.month)}</b>
            <span>
              {nextInvoice.invoiceNo} · Due {fmtDate(nextInvoice.dueDate)}
            </span>
          </div>
          <div>
            <small>AMOUNT</small>
            <b>{cash.format(nextInvoice.amount)}</b>
            <span>Hostel Room {student.roomNo}</span>
          </div>
          <label className="file">
            Payment slip (PDF or photo)
            <input
              name="evidence"
              type="file"
              accept="application/pdf,image/*"
              required
            />
            <span>↑ Choose payment evidence</span>
          </label>
          <label>
            Remarks (optional)
            <textarea
              name="remarks"
              rows={3}
              placeholder="Add a short comment for the reviewer"
            />
          </label>
          {error && <p className="form-error">⚠ {error}</p>}
          <button className="primary" disabled={saving}>
            {saving ? "Submitting…" : "Submit for verification"}
          </button>
        </form>
      ) : (
        <div className="empty-state">
          There is no unpaid invoice available for a new submission.
        </div>
      )}
      <h3 className="evidence-history-title">Submission history</h3>
      <div className="tablewrap">
        <table className="invoice-table">
          <thead>
            <tr>
              <th>SUBMISSION</th>
              <th>INVOICE</th>
              <th>MONTH</th>
              <th>DATE</th>
              <th>FILE</th>
              <th>STATUS</th>
              <th>REVIEW NOTE</th>
            </tr>
          </thead>
          <tbody>
            {evidence.map((entry) => (
              <tr key={entry.id}>
                <td>
                  <b>{entry.submissionId}</b>
                </td>
                <td>{entry.invoiceNo}</td>
                <td>{fmtMonth(entry.month)}</td>
                <td>{fmtDate(entry.submittedDate)}</td>
                <td>{entry.evidenceName}</td>
                <td>
                  <span
                    className={`approval-status ${entry.status.toLowerCase()}`}
                  >
                    {entry.status}
                  </span>
                </td>
                <td>{entry.reviewNote || "—"}</td>
              </tr>
            ))}
            {!evidence.length && (
              <tr>
                <td colSpan={7}>No payment evidence has been submitted.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProfileRequestHistory({
  requests,
}: {
  requests: StudentProfileRequest[];
}) {
  const [selected, setSelected] = useState<StudentProfileRequest | null>(null);
  const selectedChanges = selected
    ? (JSON.parse(selected.proposedChangesJson) as Record<string, string>)
    : {};
  const selectedOriginals = selected
    ? (JSON.parse(selected.originalValuesJson) as Record<string, string>)
    : {};
  return (
    <div>
      <p className="tag">AUDIT HISTORY</p>
      <h2>Profile amendment requests</h2>
      <div className="request-history">
        {requests.map((request) => {
          const changes = JSON.parse(request.proposedChangesJson) as Record<
            string,
            string
          >;
          return (
            <article key={request.id}>
              <div>
                <button
                  className="request-number"
                  onClick={() => setSelected(request)}
                >
                  Request #{String(request.id).padStart(4, "0")}
                </button>
                <span
                  className={`approval-status ${request.status.toLowerCase()}`}
                >
                  {request.status}
                </span>
              </div>
              <small>
                {fmtDate(request.createdAt.slice(0, 10))} ·{" "}
                {Object.keys(changes).map(studentFieldLabel).join(", ")}
              </small>
              {request.adminNote && (
                <p>
                  <b>Administrator note:</b> {request.adminNote}
                </p>
              )}
            </article>
          );
        })}
        {!requests.length && (
          <div className="empty-state">
            No amendment requests have been submitted.
          </div>
        )}
      </div>
      {selected && (
        <div className="backdrop">
          <section className="modal request-detail-modal">
            <ModalHead
              tag="EDIT HISTORY"
              title={`Request #${String(selected.id).padStart(4, "0")}`}
              text={`${fmtDate(selected.createdAt.slice(0, 10))} · ${selected.status}`}
              close={() => setSelected(null)}
            />
            <div className="request-change-list">
              <div className="request-change-head">
                <span>DETAIL</span>
                <span>BEFORE</span>
                <span>REQUESTED CHANGE</span>
              </div>
              {Object.keys(selectedChanges).map((key) => (
                <div className="request-change-row" key={key}>
                  <b>{studentFieldLabel(key)}</b>
                  <span>{selectedOriginals[key] || "—"}</span>
                  <span>{selectedChanges[key] || "—"}</span>
                </div>
              ))}
            </div>
            {selected.adminNote && (
              <p className="request-admin-note">
                <b>Administrator note:</b> {selected.adminNote}
              </p>
            )}
            <footer className="student-modal-actions">
              <button className="primary" onClick={() => setSelected(null)}>
                Close
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}

function ProfileRequestAdmin({
  requests,
  students,
  reviewer,
  reviewerRole,
  reviewed,
}: {
  requests: StudentProfileRequest[];
  students: Student[];
  reviewer: string;
  reviewerRole: AuthenticatedUser["role"];
  reviewed: (request: StudentProfileRequest, student?: Student) => void;
}) {
  const [notes, setNotes] = useState<Record<number, string>>({}),
    [busy, setBusy] = useState(0),
    [error, setError] = useState("");
  const canReview = ["Admin", "Chairman", "Managing Director"].includes(
    reviewerRole,
  );
  const decide = async (id: number, decision: "Approved" | "Rejected") => {
    if (!canReview)
      return setError(
        "Only an authorised management account can review resident profile changes.",
      );
    setBusy(id);
    setError("");
    const response = await fetch("/api/student-profile-requests", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id,
        decision,
        adminNote: notes[id] || "",
        reviewedBy: reviewer,
        reviewerRole,
      }),
    });
    const result = await response.json();
    setBusy(0);
    if (!response.ok)
      return setError(result.error || "Unable to review request.");
    reviewed(result.request, result.student);
  };
  return (
    <div className="content">
      <section className="panel request-admin">
        <div className="section-action">
          <div>
            <p className="tag">RESIDENT DATABASE</p>
            <h2>Profile amendment requests</h2>
            <p>

              Review proposed values before changing the official resident
              record.
            </p>
          </div>
          <span className="request-count">
            {requests.filter((request) => request.status === "Pending").length}{" "}
            pending
          </span>
        </div>
        {error && <p className="form-error">⚠ {error}</p>}
        {!canReview && (
          <p className="review-access-note">
            Approval is restricted to the Chairman or Managing Director. You may
            view the request and its status.
          </p>
        )}
        <div className="request-admin-list">
          {requests.map((request) => {
            const student = students.find(
              (item) => item.registrationNo === request.registrationNo,
            );
            const before = JSON.parse(request.originalValuesJson) as Record<
              string,
              string
            >;
            const after = JSON.parse(request.proposedChangesJson) as Record<
              string,
              string
            >;
            return (
              <article
                key={request.id}
                className={request.status.toLowerCase()}
              >
                <header>
                  <div>
                    <b>
                      {student
                        ? `${student.firstName} ${student.lastName}`
                        : request.registrationNo}
                    </b>
                    <small>
                      {request.registrationNo} · Submitted{" "}
                      {fmtDate(request.createdAt.slice(0, 10))}
                    </small>
                  </div>
                  <span
                    className={`approval-status ${request.status.toLowerCase()}`}
                  >
                    {request.status}
                  </span>
                </header>
                <table>
                  <thead>
                    <tr>
                      <th>FIELD</th>
                      <th>CURRENT VALUE</th>
                      <th>REQUESTED VALUE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(after).map((field) => (
                      <tr key={field}>
                        <td>{studentFieldLabel(field)}</td>
                        <td>{before[field] || "—"}</td>
                        <td>
                          <b>{after[field] || "—"}</b>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="request-meta">
                  <span>
                    Admin email: <b>{request.emailStatus}</b>
                  </span>
                  {request.reviewedAt && (
                    <span>
                      Reviewed by {request.reviewedBy} on{" "}
                      {fmtDate(request.reviewedAt.slice(0, 10))}
                    </span>
                  )}
                </div>
                {request.status === "Pending" && canReview && (
                  <footer>
                    <input
                      value={notes[request.id] || ""}
                      onChange={(event) =>
                        setNotes((current) => ({
                          ...current,
                          [request.id]: event.target.value,
                        }))
                      }
                      placeholder="Decision note (optional)"
                    />
                    <button
                      disabled={busy === request.id}
                      className="reject-button"
                      onClick={() => decide(request.id, "Rejected")}
                    >
                      Reject
                    </button>
                    <button
                      disabled={busy === request.id}
                      className="primary"
                      onClick={() => decide(request.id, "Approved")}
                    >
                      Approve changes
                    </button>
                  </footer>
                )}
                {request.adminNote && request.status !== "Pending" && (
                  <p className="admin-decision-note">
                    <b>Decision note:</b> {request.adminNote}
                  </p>
                )}
              </article>
            );
          })}
          {!requests.length && (
            <div className="empty-state">

              No resident profile amendment requests.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

const staffPermissionColumns: { key: StaffPermissionKey; label: string; note: string }[] = [
  { key: "ownProfile", label: "Own profile", note: "Read-only access to their own staff profile" },
  { key: "enterPayments", label: "Payment entry", note: "Add payment entries; no edit, delete or approval" },
  { key: "roomPaymentSummary", label: "Hostel Room payment summary", note: "View-only hostel room payment summary" },
  { key: "shopPaymentSummary", label: "Shop payment summary", note: "View-only shop payment summary" },
  { key: "enterExpenses", label: "Expense entry", note: "Add expense entries; no edit, delete or approval" },
  { key: "viewExpensesOwn", label: "View expenses", note: "View only expenses entered by this employee" },
  { key: "pettyCash", label: "Petty cash", note: "View the petty-cash log and add security deposits" },
];

function AdminControls({
  staff,
  permissions,
  updatePermissions,
}: {
  staff: Staff[];
  permissions: StaffPermissionMatrix;
  updatePermissions: Dispatch<SetStateAction<StaffPermissionMatrix>>;
}) {
  const setPermission = async (staffNo: string, key: StaffPermissionKey, enabled: boolean) => {
    const response = await fetch(`/api/v1/admin/staff/${encodeURIComponent(staffNo)}/permissions/${encodeURIComponent(key)}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    if (!response.ok) return window.alert("Unable to update this permission.");
    updatePermissions((current) => ({
      ...current,
      [staffNo]: { ...current[staffNo], [key]: enabled },
    }));
  };
  const setPaymentScope = async (staffNo: string, scope: string) => {
    await Promise.all([
      setPermission(staffNo, "viewPaymentsOwn", scope === "own"),
      setPermission(staffNo, "viewPaymentsAll", scope === "all"),
    ]);
  };
  const clearStaff = async (staffNo: string) => {
    const keys = Object.keys(permissions[staffNo] || {}) as StaffPermissionKey[];
    const responses = await Promise.all(keys.map((key) => fetch(`/api/v1/admin/staff/${encodeURIComponent(staffNo)}/permissions/${encodeURIComponent(key)}`, { method: "DELETE" })));
    if (responses.some((response) => !response.ok)) return window.alert("Unable to remove all permissions.");
    updatePermissions((current) => ({ ...current, [staffNo]: {} }));
  };
  const totalGranted = Object.values(permissions).reduce(
    (sum, row) => sum + Object.values(row).filter(Boolean).length,
    0,
  );
  return (
    <section className="admin-controls-page">
      <div className="panel admin-controls-summary">
        <div><p className="tag">STAFF ACCESS CONTROL</p><h2>Permission matrix</h2></div>
        <div className="admin-control-stat"><b>{staff.length}</b><span>Staff accounts</span></div>
        <div className="admin-control-stat"><b>{totalGranted}</b><span>Permissions granted</span></div>
      </div>
      <div className="panel admin-permission-panel">
        <div className="admin-permission-note">
          <b>Default access: none</b>
          <span>Staff cannot see any system information until an administrator enables a permission below. Resident access is not affected.</span>
        </div>
        <div className="tablewrap">
          <table className="admin-permission-table">
            <thead><tr><th>STAFF NO.</th><th>STAFF MEMBER</th><th>DESIGNATION</th>{staffPermissionColumns.slice(0, 2).map((column) => <th key={column.key}>{column.label.toUpperCase()}</th>)}<th>VIEW PAYMENTS</th>{staffPermissionColumns.slice(2).map((column) => <th key={column.key}>{column.label.toUpperCase()}</th>)}<th>ACTION</th></tr></thead>
            <tbody>
              {staff.map((member) => (
                <tr key={member.staffNo}>
                  <td>{member.staffNo}</td>
                  <td><b>{member.firstName} {member.lastName}</b><small>{member.email || "No email"}</small></td>
                  <td>{member.designation}</td>
                  {staffPermissionColumns.slice(0, 2).map((column) => (
                    <td key={column.key}>
                      <label className="permission-toggle" title={column.note}>
                        <input type="checkbox" checked={Boolean(permissions[member.staffNo]?.[column.key])} onChange={(event) => void setPermission(member.staffNo, column.key, event.target.checked)} />
                        <span aria-hidden="true" />
                        <em>{permissions[member.staffNo]?.[column.key] ? "Allowed" : "No access"}</em>
                      </label>
                    </td>
                  ))}
                  <td><select className="permission-scope-select" aria-label={`Payment view access for ${member.firstName}`} value={permissions[member.staffNo]?.viewPaymentsAll ? "all" : permissions[member.staffNo]?.viewPaymentsOwn ? "own" : "none"} onChange={(event) => void setPaymentScope(member.staffNo, event.target.value)}><option value="none">No access</option><option value="own">Own entries only</option><option value="all">All payments</option></select></td>
                  {staffPermissionColumns.slice(2).map((column) => (
                    <td key={column.key}>
                      <label className="permission-toggle" title={column.note}>
                        <input type="checkbox" checked={Boolean(permissions[member.staffNo]?.[column.key])} onChange={(event) => void setPermission(member.staffNo, column.key, event.target.checked)} />
                        <span aria-hidden="true" /><em>{permissions[member.staffNo]?.[column.key] ? "Allowed" : "No access"}</em>
                      </label>
                    </td>
                  ))}
                  <td><button className="secondary" onClick={() => void clearStaff(member.staffNo)}>Remove all</button></td>
                </tr>
              ))}
              {!staff.length && <tr><td colSpan={8}>No staff accounts are available.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

type AgreementData = { studentName: string; studentId: string; wardenName: string; wardenId: string; startDate: string; roomNo: string; monthlyRent: string; monthlyRentWords: string; depositAmount: string; depositAmountWords: string; occupancyBasis: string; agreementDate: string; rentalDuration: string; hostelEmail: string; hostelTelephone: string; };
type HostelProfile = { telephone: string; email: string };
type AgreementRecord = { id: number; agreementNo: string; revision: number; revisionLabel: string; registrationNo: string; studentName: string; roomNo: string; startDate: string; agreementDataJson: string; status: "Pending" | "Signed"; issuedAt: string; signedName?: string; signedAt?: string; };
type SettlementData = { printDate: string; accountNumber: string; accountHolderName: string; bankName: string; branchName: string; };
type SettlementRecord = { id: number; settlementNo: string; registrationNo: string; residentName: string; roomNo: string; checkoutDate?: string; settlementDataJson: string; issuedAt: string };
const blobBase64 = (blob: Blob) => new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onerror = () => reject(reader.error); reader.onload = () => resolve(String(reader.result).split(",")[1] || ""); reader.readAsDataURL(blob); });
const localSystemDate = () => { const now = new Date(); const offset = now.getTimezoneOffset() * 60_000; return new Date(now.getTime() - offset).toISOString().slice(0, 10); };
const numberInWords = (raw: number) => {
  const value = Math.max(0, Math.round(raw)); if (!value) return "Zero Rupees Only";
  const small = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"], tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const under = (n: number) => `${n >= 100 ? `${small[Math.floor(n / 100)]} Hundred ` : ""}${n % 100 < 20 ? small[n % 100] : `${tens[Math.floor((n % 100) / 10)]}${n % 10 ? ` ${small[n % 10]}` : ""}`}`.trim();
  const parts: string[] = []; let n = value; ([[1_000_000, "Million"], [1_000, "Thousand"]] as Array<[number, string]>).forEach(([unit, label]) => { const count = Math.floor(n / unit); if (count) { parts.push(`${under(count)} ${label}`); n %= unit; } }); if (n) parts.push(under(n)); return `${parts.join(" ")} Rupees Only`;
};
const agreementValuesFor = (student: Student, profile: HostelProfile, warden?: Staff): AgreementData => ({ studentName: [student.firstName, student.middleNames, student.lastName].filter(Boolean).join(" "), studentId: student.idNo || "", wardenName: warden ? `${warden.firstName} ${warden.lastName}`.trim() : "Hostel Warden", wardenId: warden?.idNo || "", startDate: student.startDate || "", roomNo: student.roomNo || "", monthlyRent: amountOnly.format(student.monthlyRent || 0), monthlyRentWords: numberInWords(student.monthlyRent || 0), depositAmount: amountOnly.format(student.depositPayable || 0), depositAmountWords: numberInWords(student.depositPayable || 0), occupancyBasis: "As assigned in the hostel room register", agreementDate: student.startDate || new Date().toISOString().slice(0, 10), rentalDuration: "Six months", hostelEmail: profile.email, hostelTelephone: profile.telephone });
type AgreementSignature = { name: string; date: string };
const agreementTemplateData = (data: AgreementData, signature?: AgreementSignature) => ({ "Full Name of the Student": data.studentName, "ID Card No of the Student": data.studentId, "Name of the Warden": data.wardenName, "ID Card of the Warden": data.wardenId, "Start Date of the Student": data.startDate ? fmtDate(data.startDate) : "", "Room No": data.roomNo, "Monthly Rent": data.monthlyRent, "Monthly Rent in words": data.monthlyRentWords, "Deposit Amount": data.depositAmount, "Deposit Amount in Words": data.depositAmountWords, "Hostel Telephone": data.hostelTelephone, "Hostel Email": data.hostelEmail, "Name of the Student": data.studentName, "Student Signature": signature ? `${signature.name} — ${fmtDate(signature.date)}\nSignature of the Resident` : "Signature of the Resident" });
function normalizeAgreementXml(xml: string, path: string, data: AgreementData) {
  const parsed = new DOMParser().parseFromString(xml, "application/xml");
  const textNodes = Array.from(parsed.getElementsByTagNameNS("http://schemas.openxmlformats.org/wordprocessingml/2006/main", "t"));
  if (path === "word/document.xml") {
    const single = data.occupancyBasis.startsWith("Single");
    const values = textNodes.map((node) => node.textContent || "");
    const clauseIndex = values.findIndex((value, index) => value === "Clause" && values.slice(index + 1, index + 5).includes("0"));
    if (clauseIndex >= 0) { const zero = textNodes.slice(clauseIndex + 1, clauseIndex + 5).find((node) => node.textContent === "0"); if (zero) zero.textContent = "1.0"; }
    textNodes.forEach((node, index) => {
      if (node.textContent === "Monthly Rent in words") node.textContent = "[Monthly Rent in words]";
      if (node.textContent === "Deposit Amount in Words") node.textContent = "[Deposit Amount in Words";
      if (node.textContent === "Signature of the Resident") node.textContent = "[Student Signature]";
      if (textNodes[index - 1]?.textContent !== "[" && (node.textContent || "").trim().toLowerCase().startsWith("id ") && textNodes.slice(index, index + 6).map((item) => item.textContent || "").join("").toLowerCase().includes("id card no of the student")) {
        node.textContent = "[ID Card No of the Student]";
        textNodes.slice(index + 1, index + 6).forEach((item) => { if ((item.textContent || "").toLowerCase().includes("card") || ["No", " of the Student"].includes(item.textContent || "")) item.textContent = ""; });
      }
    });
    Array.from(parsed.getElementsByTagNameNS("http://schemas.openxmlformats.org/wordprocessingml/2006/main", "highlight")).forEach((node) => node.parentNode?.removeChild(node));
    const normalized = new XMLSerializer().serializeToString(parsed).replace(">single/<", single ? ">single<" : "><").replace(">sharing<", single ? "><" : ">sharing<").replace("haring basis shall be SLRS", single ? "ingle basis shall be SLRS" : "haring basis shall be SLRS");
    return normalized;
  }
  if (path.startsWith("word/footer")) {
    const footerText = textNodes.map((node) => node.textContent || "");
    footerText.forEach((value, index) => { if (value.startsWith("Variable 11")) textNodes[index].textContent = data.hostelTelephone; if (value.startsWith("Variable 12")) textNodes[index].textContent = data.hostelEmail; if (value === "Page " && footerText.slice(index, index + 4).join("") === "Page 2 of 2") textNodes.slice(index, index + 4).forEach((node) => { node.textContent = ""; }); });
    return new XMLSerializer().serializeToString(parsed);
  }
  return xml;
}
async function buildAgreementBlob(data: AgreementData, signature?: AgreementSignature) { const [{ default: PizZip }, { default: Docxtemplater }] = await Promise.all([import("pizzip"), import("docxtemplater")]); const template = await fetch("/Agreement-Template.docx").then((response) => response.arrayBuffer()); const zip = new PizZip(template); ["word/document.xml", "word/footer1.xml", "word/footer2.xml"].forEach((path) => { const file = zip.file(path); if (file) zip.file(path, normalizeAgreementXml(file.asText(), path, data)); }); const document = new Docxtemplater(zip, { delimiters: { start: "[", end: "]" }, paragraphLoop: true, linebreaks: true }); document.render(agreementTemplateData(data, signature)); return document.getZip().generate({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }); }
async function downloadAgreementPdf(data: AgreementData, filename: string, signature?: AgreementSignature) { const blob = await buildAgreementBlob(data, signature); const host = document.createElement("div"); host.style.cssText = "position:fixed;left:-10000px;top:0;width:850px;background:white;z-index:-1"; document.body.appendChild(host); try { const [{ renderAsync }, { default: html2canvas }, { jsPDF }] = await Promise.all([import("docx-preview"), import("html2canvas"), import("jspdf")]); await renderAsync(blob, host, undefined, { inWrapper: true, breakPages: true, ignoreWidth: false, ignoreHeight: false }); const pages = Array.from(host.querySelectorAll<HTMLElement>("section.docx")); const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" }); for (let index = 0; index < pages.length; index += 1) { const canvas = await html2canvas(pages[index], { scale: 1.7, backgroundColor: "#ffffff", useCORS: true }); const ratio = Math.min(210 / canvas.width, 297 / canvas.height); const width = canvas.width * ratio, height = canvas.height * ratio; if (index) pdf.addPage(); pdf.addImage(canvas.toDataURL("image/jpeg", .92), "JPEG", (210 - width) / 2, 0, width, height); } pdf.save(filename); } finally { host.remove(); } }
function AgreementDocumentPreview({ data, signature }: { data: AgreementData; signature?: AgreementSignature }) { const target = useRef<HTMLDivElement>(null); const [error, setError] = useState(""); useEffect(() => { let active = true; buildAgreementBlob(data, signature).then(async (blob) => { if (!active || !target.current) return; target.current.innerHTML = ""; const { renderAsync } = await import("docx-preview"); await renderAsync(blob, target.current, undefined, { inWrapper: true, breakPages: true, ignoreWidth: false, ignoreHeight: false }); if (active) setError(""); }).catch((reason) => active && setError(reason instanceof Error ? reason.message : "Unable to preview agreement.")); return () => { active = false; }; }, [data, signature?.name, signature?.date]); return <div className="agreement-preview-shell">{error && <div className="error-banner">{error}</div>}<div ref={target} className="agreement-docx-preview" /></div>; }

function AgreementSettlementView({ students, staff, payments, invoices, studentUpdated }: { students: Student[]; staff: Staff[]; payments: Payment[]; invoices: StudentInvoice[]; studentUpdated: (student: Student) => void }) {
  const [section, setSection] = useState<"Agreement Template" | "Agreement Log" | "Check-Out Settlement Template" | "Check-Out Settlement Log">("Agreement Template");
  const [registrationNo, setRegistrationNo] = useState("");
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null);
  const [agreementOpen, setAgreementOpen] = useState(false);
  const [agreementData, setAgreementData] = useState<AgreementData | null>(null);
  const [agreementMessage, setAgreementMessage] = useState("");
  const [sendingAgreement, setSendingAgreement] = useState(false);
  const [agreements, setAgreements] = useState<AgreementRecord[]>([]);
  const [settlements, setSettlements] = useState<SettlementRecord[]>([]);
  const [settlementOpen, setSettlementOpen] = useState(false);
  const [issuingSettlement, setIssuingSettlement] = useState(false);
  const [settlementData, setSettlementData] = useState<SettlementData | null>(null);
  const [settlementPreviewUrl, setSettlementPreviewUrl] = useState<string | null>(null);
  const [hostelProfile, setHostelProfile] = useState<HostelProfile | null>(null);
  const settlementPreviewRequest = useRef(0);
  const student = students.find((item) => item.registrationNo === registrationNo);
  useEffect(() => { fetch("/api/v1/agreements").then((response) => response.json()).then((result) => setAgreements(result.agreements || [])).catch(() => {}); }, []);
  useEffect(() => { fetch("/api/v1/checkout-settlements").then((response) => response.json()).then((result) => setSettlements(result.settlements || [])).catch(() => {}); }, []);
  useEffect(() => { fetch("/api/v1/hostel-profile").then((response) => response.ok ? response.json() : Promise.reject(new Error("Unable to load hostel contact details"))).then(setHostelProfile).catch((reason) => setAgreementMessage(reason instanceof Error ? reason.message : "Unable to load hostel contact details")); }, []);
  const openSettlementVariables = () => {
    if (!student) return;
    setSettlementData({ printDate: localSystemDate(), accountNumber: "", accountHolderName: `${student.firstName} ${student.lastName}`.trim(), bankName: "", branchName: "" });
    setSettlementOpen(true);
  };
  const issueSettlement = async () => {
    if (!student || !settlementData) return;
    setIssuingSettlement(true);
    try {
      const pdfBlob = await createDocument(false, settlementData, false, undefined, true);
      if (!(pdfBlob instanceof Blob)) throw new Error("Unable to generate the check-out settlement PDF.");
      const response = await fetch("/api/v1/checkout-settlements", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ registrationNo: student.registrationNo, checkoutDate: student.intendedVacateDate || student.vacatedDate || null, settlementData, pdfBase64: await blobBase64(pdfBlob) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || result.error || "Unable to issue check-out settlement.");
      setSettlements((current) => [result.settlement, ...current]);
      downloadBlob(pdfBlob, `${result.settlement.settlementNo}.pdf`);
    } catch (reason) {
      setAgreementMessage(reason instanceof Error ? reason.message : "Unable to issue check-out settlement.");
    } finally {
      setIssuingSettlement(false);
    }
  };
  const createDocument = async (download = false, providedSettlementData?: SettlementData, inlinePreview = false, previewRequest?: number, returnBlob = false): Promise<Blob | void> => {
    if (!student) return;
    // Keep the preview generation side-effect free. Writing this derived date
    // back to settlementData here would retrigger the preview effect forever.
    // The current system date is still applied to every generated preview and
    // every downloaded PDF.
    const activeSettlementData = section === "Check-Out Settlement Template" || section === "Check-Out Settlement Log" ? { ...(providedSettlementData || settlementData || { accountNumber: "", accountHolderName: `${student.firstName} ${student.lastName}`.trim(), bankName: "", branchName: "" }), printDate: localSystemDate() } : null;
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const fullName = `${student.firstName} ${student.lastName}`;
    const title = section.startsWith("Agreement") ? "HOSTEL ACCOMMODATION AGREEMENT" : "CHECK-OUT SETTLEMENT";
    const vacatingDate = student.intendedVacateDate || student.vacatedDate || "";
    const inSettlementPeriod = (date: string) => (!student.startDate || date >= student.startDate.slice(0, 7)) && (!vacatingDate || date <= vacatingDate.slice(0, 7));
    const rentInvoices = invoices.filter((invoice) => invoice.registrationNo === student.registrationNo && invoice.invoiceType === "Rent" && inSettlementPeriod(invoice.month));
    const rentPayments = payments.filter((payment) => payment.registrationNo === student.registrationNo && canonicalPaymentType(payment.type) === "Rent" && payment.paidAmount > 0 && (!student.startDate || payment.paidDate >= student.startDate) && (!vacatingDate || payment.paidDate <= vacatingDate));
    const totalRentPayable = rentInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
    const totalRentPaid = rentPayments.reduce((sum, payment) => sum + payment.paidAmount, 0);
    const invoiceOutstanding = rentInvoices.reduce((sum, invoice) => sum + Math.max(0, invoice.amount - Number(invoice.paidAmount || 0)), 0);
    const paymentOutstanding = Math.max(0, totalRentPayable - totalRentPaid);
    const outstanding = rentInvoices.length ? invoiceOutstanding : paymentOutstanding;
    const depositPaid = payments.filter((payment) => payment.registrationNo === student.registrationNo && canonicalPaymentType(payment.type) === "Deposit").reduce((sum, payment) => sum + payment.paidAmount, 0);
    const deposit = depositPaid || student.revisedDepositPayable || student.depositPayable || 0;
    const balancePayment = deposit - outstanding;
    const recentPayments = [...rentPayments].sort((a, b) => b.paidDate.localeCompare(a.paidDate)).slice(0, 3);
    const lastPaymentDate = recentPayments[0]?.paidDate || "";
    doc.setFillColor(16, 48, 76); doc.rect(0, 0, 210, 32, "F");
    try { const logo = await fetch("/perkhaven-logo.png"); if (logo.ok) doc.addImage(new Uint8Array(await logo.arrayBuffer()), "PNG", 14, 5, 24, 22); } catch { /* Keep the settlement available if the logo cannot load. */ }
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(19); doc.text("THE PERK HAVEN HOSTEL", 46, 15); doc.setFontSize(9); doc.text(title, 46, 24);
    doc.setTextColor(18, 42, 66); doc.setFontSize(11); doc.setFont("helvetica", "normal");
    const rows: Array<[string, string]> = [
      ["Resident name", fullName], ["Resident registration no.", student.registrationNo], ["Hostel Room", student.roomNo || "Not assigned"],
      ["Monthly accommodation fee (LKR)", amountOnly.format(student.monthlyRent || 0)], ["Accommodation start date", student.startDate ? fmtDate(student.startDate) : "Not provided"], ["Check-out date", vacatingDate ? fmtDate(vacatingDate) : "Not provided"], ["Last payment date", lastPaymentDate ? fmtDate(lastPaymentDate) : "No accommodation fee payment recorded"],
    ];
    if (activeSettlementData) rows.push(["Settlement agreement date", fmtDate(activeSettlementData.printDate)]);
    if (section.startsWith("Agreement")) rows.push(["Agreement status", student.contractAgreementStatus || "Not signed"]);
    rows.forEach(([label, value], index) => { const y = 44 + index * 9; doc.setFont("helvetica", "bold"); doc.text(label, 18, y); doc.setFont("helvetica", "normal"); doc.text(value, 72, y); });
    if (section.startsWith("Check-Out Settlement")) {
      let y = 44 + rows.length * 9 + 6;
      doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.text("Last three accommodation fee payments", 18, y); y += 6;
      const columns = [18, 62, 99, 142, 192];
      doc.setFillColor(237, 243, 249); doc.rect(18, y, 174, 8, "F"); doc.setFontSize(8); ["Invoice no.", "Amount (LKR)", "Corresponding month", "Payment date"].forEach((heading, index) => doc.text(heading, columns[index] + 2, y + 5));
      y += 8; doc.setFont("helvetica", "normal");
      if (recentPayments.length) recentPayments.forEach((payment, index) => { if (index % 2) { doc.setFillColor(248, 250, 252); doc.rect(18, y, 174, 8, "F"); } doc.text(payment.invoiceNo || "—", columns[0] + 2, y + 5); doc.text(amountOnly.format(payment.paidAmount), columns[1] + 2, y + 5); doc.text(payment.month ? fmtMonth(payment.month) : "—", columns[2] + 2, y + 5); doc.text(fmtDate(payment.paidDate), columns[3] + 2, y + 5); y += 8; });
      else { doc.text("No accommodation fee payments recorded for the settlement period.", 20, y + 5); y += 8; }
      y += 7; doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.text("Outstanding payment (LKR)", 18, y); doc.text(amountOnly.format(outstanding), 192, y, { align: "right" });
      y += 10; doc.setFontSize(12); doc.text("Settlement Amount", 18, y); y += 5;
      const settlementRows: Array<[string, number]> = [["Security Deposit", deposit], ["Outstanding payment", outstanding], ["Balance payment", balancePayment]];
      settlementRows.forEach(([label, amount], index) => { if (index === 2) { doc.setFillColor(balancePayment >= 0 ? 226 : 254, balancePayment >= 0 ? 244 : 232, balancePayment >= 0 ? 235 : 232); doc.rect(18, y, 174, 9, "F"); } doc.setFont("helvetica", index === 2 ? "bold" : "normal"); doc.setFontSize(9); doc.text(label, 20, y + 6); doc.text(`${amount < 0 ? "-" : ""}${amountOnly.format(Math.abs(amount))}`, 190, y + 6, { align: "right" }); y += 9; });
      y += 7; doc.setFont("helvetica", "normal"); doc.setFontSize(9);
      const settlementStatement = balancePayment >= 0 ? `The Perk Haven will pay the balance payment of ${amountOnly.format(balancePayment)} to the following account provided by ${fullName}.` : `${fullName} shall pay the outstanding settlement amount of ${amountOnly.format(Math.abs(balancePayment))} to The Perk Haven.`;
      doc.text(doc.splitTextToSize(settlementStatement, 174), 18, y); y += 14;
      doc.setFont("helvetica", "bold"); doc.text("Bank account details", 18, y); y += 7; doc.setFont("helvetica", "normal");
      [["Bank account number", activeSettlementData?.accountNumber || "Not provided"], ["Account holder's name", activeSettlementData?.accountHolderName || "Not provided"], ["Bank", activeSettlementData?.bankName || "Not provided"], ["Branch", activeSettlementData?.branchName || "Not provided"]].forEach(([label, value]) => { doc.text(label, 18, y); doc.text(value, 70, y); y += 7; });
      y += 8; doc.line(18, y, 85, y); doc.text("Resident signature", 18, y + 6); doc.line(125, y, 192, y); doc.text("Date", 125, y + 6);
    }
    const body = "This agreement records the accommodation terms accepted between The Perk Haven Hostel and the resident named above. The completed agreement must be reviewed and signed by the relevant parties.";
    if (section.startsWith("Agreement")) { doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.text(doc.splitTextToSize(body, 170), 20, 145); doc.line(20, 245, 85, 245); doc.line(125, 245, 190, 245); doc.text("Resident signature", 20, 252); doc.text("For The Perk Haven", 125, 252); }
    const name = `${section.replaceAll(" ", "-")}-${student.registrationNo}.pdf`;
    const pdfBlob = doc.output("blob");
    if (returnBlob) return pdfBlob;
    if (download) { downloadBlob(pdfBlob, name); return; }
    if (inlinePreview) {
      if (previewRequest !== settlementPreviewRequest.current) return;
      setSettlementPreviewUrl((current) => { if (current) URL.revokeObjectURL(current); return URL.createObjectURL(pdfBlob); });
      return;
    }
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview({ url: URL.createObjectURL(pdfBlob), name });
  };
  useEffect(() => {
    if (!settlementOpen || !student || !settlementData) return;
    const timer = window.setTimeout(() => void createDocument(false, settlementData, true, ++settlementPreviewRequest.current), 120);
    return () => window.clearTimeout(timer);
  }, [settlementOpen, settlementData, registrationNo]);
  return <section className="documents-admin-page">
    <div className="section-tabs document-tabs" role="tablist">{(["Agreement Template", "Agreement Log", "Check-Out Settlement Template", "Check-Out Settlement Log"] as const).map((item) => <button key={item} className={section === item ? "active" : ""} onClick={() => setSection(item)}>{item}</button>)}</div>
    {(section === "Agreement Template" || section === "Check-Out Settlement Template") && <div className="panel documents-generator"><div><p className="tag">DOCUMENT PREPARATION</p><h2>{section}</h2><p>{section === "Agreement Template" ? "Select a resident, review the completed contract and send it for electronic signature." : "Select a resident, confirm the bank account variables and issue the check-out settlement."}</p></div><label>Resident<select value={registrationNo} onChange={(event) => setRegistrationNo(event.target.value)}><option value="">Select resident</option>{students.map((item) => <option key={item.registrationNo} value={item.registrationNo}>{item.registrationNo} · {item.firstName} {item.lastName}</option>)}</select></label><div className="document-actions">{section === "Agreement Template" ? <button className="primary" disabled={!student || !hostelProfile} onClick={() => { if (!student || !hostelProfile) return; let saved: AgreementData | null = null; try { saved = student.agreementDataJson ? JSON.parse(student.agreementDataJson) : null; } catch {} const warden = staff.find((member) => member.status === "Active" && member.designation.toLowerCase().includes("warden")); setAgreementData(saved || agreementValuesFor(student, hostelProfile, warden)); setAgreementMessage(""); setAgreementOpen(true); }}>Prepare / View Agreement</button> : <button className="primary" disabled={!student} onClick={openSettlementVariables}>Prepare / View Settlement</button>}</div></div>}
    {section === "Agreement Log" && <AgreementLog agreements={agreements} onView={(entry, data) => { setRegistrationNo(entry.registrationNo); setAgreementData(data); setAgreementMessage(""); setAgreementOpen(true); }} />}
    {section === "Check-Out Settlement Log" && <CheckoutSettlementLog settlements={settlements} onView={(entry) => setPreview({ url: `/api/v1/checkout-settlements/${entry.id}/pdf`, name: `${entry.settlementNo}.pdf` })} />}
    {agreementOpen && student && agreementData && <div className="backdrop"><section className="modal agreement-workspace-modal"><ModalHead tag="CONTRACT AGREEMENT" title={`${student.registrationNo} · ${agreementData.studentName}`} text="Review the agreement and confirm the variables before sending it to the resident." close={() => setAgreementOpen(false)} /><div className="agreement-workspace"><AgreementDocumentPreview data={agreementData} /><aside className="agreement-variables"><h3>Agreement variables</h3><p>Profile values are pre-filled and can be amended for this contract.</p>{([["studentName", "Resident full name", "text"], ["studentId", "Resident NIC / ID", "text"], ["wardenName", "Warden full name", "text"], ["wardenId", "Warden NIC / ID", "text"], ["agreementDate", "Agreement date", "date"], ["startDate", "Rental accommodation start date", "date"], ["roomNo", "Hostel Room number", "text"], ["occupancyBasis", "Occupancy basis", "text"], ["rentalDuration", "Rental duration", "text"], ["monthlyRent", "Monthly accommodation fee", "text"], ["monthlyRentWords", "Monthly accommodation fee in words", "text"], ["depositAmount", "Security Deposit amount", "text"], ["depositAmountWords", "Security Deposit amount in words", "text"]] as Array<[keyof AgreementData, string, string]>).map(([key, label, type]) => <label key={key}>{label}<input type={type} value={agreementData[key]} readOnly={key === "occupancyBasis"} onChange={(event) => setAgreementData({ ...agreementData, [key]: event.target.value })} /></label>)}{agreementMessage && <div className="success-banner">{agreementMessage}</div>}</aside></div><div className="modalactions"><button className="secondary" onClick={() => downloadAgreementPdf(agreementData, `Agreement-${student.registrationNo}.pdf`)}>Save PDF</button><button className="primary" disabled={sendingAgreement} onClick={async () => { setSendingAgreement(true); try { const response = await fetch("/api/v1/agreements", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ registrationNo: student.registrationNo, agreementData }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error || "Unable to send agreement."); setAgreements((current) => [result.agreement, ...current]); setAgreementMessage(`${result.agreement.agreementNo} ${result.agreement.revisionLabel} was saved and sent to the resident for electronic signature.`); } catch (reason) { setAgreementMessage(reason instanceof Error ? reason.message : "Unable to send agreement."); } finally { setSendingAgreement(false); } }}>Save & Send to Resident</button></div></section></div>}
    {settlementOpen && student && settlementData && <div className="backdrop"><section className="modal settlement-variables-modal"><ModalHead tag="CHECK-OUT SETTLEMENT" title={`${student.registrationNo} · ${student.firstName} ${student.lastName}`} text="Update the bank details and review the settlement before issuing it." close={() => { settlementPreviewRequest.current += 1; setSettlementPreviewUrl((current) => { if (current) URL.revokeObjectURL(current); return null; }); setSettlementOpen(false); }} /><div className="settlement-variables-body"><aside className="agreement-variables settlement-variables"><h3>Check-Out Settlement variables</h3><p>Enter the resident’s bank account details for the balance payment.</p>{([["accountHolderName", "Account holder's name", "text"], ["accountNumber", "Bank account number", "text"], ["bankName", "Bank name", "text"], ["branchName", "Bank branch", "text"], ["printDate", "Settlement Agreement date", "date"]] as Array<[keyof SettlementData, string, string]>).map(([key, label, type]) => <label key={key}>{label}<input type={type} value={settlementData[key]} readOnly={key === "printDate"} onChange={(event) => setSettlementData({ ...settlementData, [key]: event.target.value })} /></label>)}</aside><div className="settlement-pdf-preview">{settlementPreviewUrl ? <iframe src={settlementPreviewUrl} title="Check-Out Settlement preview" /> : <div className="preview-loading">Preparing settlement preview…</div>}</div></div>{agreementMessage && <div className="error-banner">{agreementMessage}</div>}<div className="modalactions"><button className="secondary" onClick={() => void createDocument(true, settlementData)}>Download PDF</button>{section === "Check-Out Settlement Template" && <button className="primary" disabled={issuingSettlement} onClick={() => void issueSettlement()}>{issuingSettlement ? "Issuing…" : "Issue & Save PDF"}</button>}</div></section></div>}
    {preview && <div className="backdrop"><div className="modal document-preview-modal"><ModalHead tag="DOCUMENT PREVIEW" title={preview.name} text="Review the completed document before downloading." close={() => { URL.revokeObjectURL(preview.url); setPreview(null); }} /><iframe src={preview.url} title={preview.name} /><div className="modalactions"><a className="button secondary" href={preview.url} download={preview.name}>Download PDF</a></div></div></div>}
  </section>;
}

function AgreementLog({ agreements, onView }: { agreements: AgreementRecord[]; onView: (entry: AgreementRecord, data: AgreementData) => void }) {
  return <div className="panel tablewrap"><div className="table-title"><div><p className="tag">AGREEMENT LOG</p><h3>Issued agreements</h3></div></div><table><thead><tr><th>REFERENCE</th><th>REVISION</th><th>REGISTRATION</th><th>RESIDENT</th><th>HOSTEL ROOM</th><th>ACCOMMODATION START DATE</th><th>ISSUED</th><th>SIGNED</th><th>STATUS</th><th>COPY</th></tr></thead><tbody>{agreements.map((entry) => { let data: AgreementData | null = null; try { data = JSON.parse(entry.agreementDataJson); } catch {} return <tr key={entry.id}><td>{entry.agreementNo}</td><td>{entry.revisionLabel}</td><td>{entry.registrationNo}</td><td>{entry.studentName}</td><td>{entry.roomNo || "—"}</td><td>{fmtDate(entry.startDate)}</td><td>{fmtDateTime(entry.issuedAt)}</td><td>{entry.signedAt ? fmtDateTime(entry.signedAt) : "—"}</td><td><span className={`approval-status ${entry.status.toLowerCase()}`}>{entry.status}</span></td><td>{data && <div className="inline-actions"><button className="secondary" onClick={() => onView(entry, data!)}>View PDF</button><button className="secondary" onClick={() => downloadAgreementPdf(data!, `${entry.agreementNo}-${entry.revisionLabel}.pdf`, entry.signedName && entry.signedAt ? { name: entry.signedName, date: entry.signedAt } : undefined)}>Download PDF</button></div>}</td></tr>; })}{!agreements.length && <tr><td colSpan={10} className="empty-state">No agreements have been issued.</td></tr>}</tbody></table></div>;
}

function CheckoutSettlementLog({ settlements, onView }: { settlements: SettlementRecord[]; onView: (entry: SettlementRecord) => void }) {
  return <div className="panel tablewrap"><div className="table-title"><div><p className="tag">CHECK-OUT SETTLEMENT LOG</p><h3>Issued check-out settlements</h3></div></div><table><thead><tr><th>REFERENCE</th><th>REGISTRATION</th><th>RESIDENT</th><th>HOSTEL ROOM</th><th>CHECK-OUT DATE</th><th>ISSUED</th><th>COPY</th></tr></thead><tbody>{settlements.map((entry) => <tr key={entry.id}><td>{entry.settlementNo}</td><td>{entry.registrationNo}</td><td>{entry.residentName}</td><td>{entry.roomNo || "—"}</td><td>{entry.checkoutDate ? fmtDate(entry.checkoutDate) : "—"}</td><td>{fmtDateTime(entry.issuedAt)}</td><td><div className="inline-actions"><button className="secondary" onClick={() => onView(entry)}>View PDF</button><a className="button secondary" href={`/api/v1/checkout-settlements/${entry.id}/pdf`} download={`${entry.settlementNo}.pdf`}>Download PDF</a></div></td></tr>)}{!settlements.length && <tr><td colSpan={7} className="empty-state">No check-out settlements have been issued.</td></tr>}</tbody></table></div>;
}

function Overview({
  students,
  payments,
  invoices,
  expenses,
  active,
  occupancy,
  beds,
  due,
  currentMonthOutstanding,
  staffCount,
  totalStaffCount,
  shopCount,
  totalShopCount,
  expenseCount,
  approvedExpenseTotal,
  currentMonthExpenseTotal,
  pendingExpenseCount,
  payrollCount,
  pendingActionCount,
  unsignedAgreementCount,
  pendingSettlementCount,
  go,
  open,
  addPay,
}: {
  students: Student[];
  payments: Payment[];
  invoices: StudentInvoice[];
  expenses: Expense[];
  active: number;
  occupancy: number;
  beds: number;
  due: number;
  currentMonthOutstanding: number;
  staffCount: number;
  totalStaffCount: number;
  shopCount: number;
  totalShopCount: number;
  expenseCount: number;
  approvedExpenseTotal: number;
  currentMonthExpenseTotal: number;
  pendingExpenseCount: number;
  payrollCount: number;
  pendingActionCount: number;
  unsignedAgreementCount: number;
  pendingSettlementCount: number;
  go: (p: Page) => void;
  open: (s: Student) => void;
  addPay: () => void;
}) {
  const [bankSummary, setBankSummary] = useState({ total: 0, outstanding: 0 });
  useEffect(() => {
    const loadBankSummary = () =>
      fetch("/api/v1/bank-reconciliation")
        .then((response) => response.json())
        .then((result) => {
          const bankRows = (result.bankTransactions || []) as BankTransaction[];
          const links = (result.links || []) as BankLink[];
          const reconciledFor = (bankTransactionId: string) =>
            links
              .filter((link) => link.bankTransactionId === bankTransactionId)
              .reduce((total, link) => total + link.reconciledAmount, 0);
          setBankSummary({
            total: bankRows.length,
            outstanding: bankRows.filter(
              (row) =>
                Math.abs(reconciledFor(row.bankTransactionId) - Math.abs(row.amount)) >=
                0.01,
            ).length,
          });
        })
        .catch(() => {});
    loadBankSummary();
    window.addEventListener("bank-reconciliation-updated", loadBankSummary);
    return () =>
      window.removeEventListener("bank-reconciliation-updated", loadBankSummary);
  }, []);
  const today = new Date();
  const nextCycleDate = (kind: "invoice" | "payroll") => {
    let year = today.getFullYear();
    let month = today.getMonth();
    const calculate = () => {
      const monthEnd = new Date(year, month + 1, 0);
      if (kind === "payroll") return monthEnd;
      return new Date(year, month, monthEnd.getDate() - 7);
    };
    let result = calculate();
    if (result < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
      month += 1;
      if (month > 11) {
        month = 0;
        year += 1;
      }
      result = calculate();
    }
    return result.toISOString().slice(0, 10);
  };
  const late = payments
      .filter((p) => p.paidAmount < netPayable(p))
      .sort((a, b) => a.roomNo.localeCompare(b.roomNo)),
    recent = payments
      .filter((p) => p.paidAmount)
      .sort((a, b) => b.paidDate.localeCompare(a.paidDate))
      .slice(0, 3),
    collected = payments.reduce((n, p) => n + p.paidAmount, 0),
    collectedThisMonth = payments
      .filter((payment) =>
        payment.paidDate.startsWith(new Date().toISOString().slice(0, 7)),
      )
      .reduce((total, payment) => total + payment.paidAmount, 0),
    currentMonth = new Date().toISOString().slice(0, 7),
    operatingIncomeRows = payments.filter((payment) =>
      ["Room Rent", "Shop Rent", "Other Income"].includes(payment.type) &&
      (payment.type !== "Other Income" ||
        (payment.incomeApprovalStatus || "Pending") === "Approved"),
    ),
    operatingIncomeTotal = operatingIncomeRows.reduce(
      (total, payment) => total + payment.paidAmount,
      0,
    ),
    operatingIncomeThisMonth = operatingIncomeRows
      .filter((payment) => payment.paidDate.startsWith(currentMonth))
      .reduce((total, payment) => total + payment.paidAmount, 0),
    otherIncomeRows = payments.filter(
      (payment) =>
        payment.type === "Other Income" &&
        (payment.incomeApprovalStatus || "Pending") === "Approved",
    ),
    totalOtherIncome = otherIncomeRows.reduce(
      (total, payment) => total + payment.paidAmount,
      0,
    ),
    thisMonthOtherIncome = otherIncomeRows
      .filter((payment) =>
        payment.paidDate.startsWith(new Date().toISOString().slice(0, 7)),
      )
      .reduce((total, payment) => total + payment.paidAmount, 0),
    upcoming = [...invoices]
      .filter(
        (invoice) =>
          invoice.status !== "Paid" &&
          invoice.status !== "Cancelled" &&
          invoice.amount > Number(invoice.paidAmount || 0),
      )
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 8),
    oldestOutstandingMonth = [...upcoming]
      .filter((invoice) => Boolean(invoice.month))
      .sort((a, b) => a.month.localeCompare(b.month))[0]?.month;
  const chartMonths = Array.from({ length: 18 }, (_, index) => {
      const date = new Date(today.getFullYear(), today.getMonth() - 17 + index, 1);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    }),
    chartLabel = (month: string) => {
      const [year, value] = month.split("-").map(Number);
      return new Date(year, value - 1, 1).toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
    },
    invoiceMonth = (invoice: StudentInvoice) => invoice.month || invoice.issueDate.slice(0, 7),
    paymentMonth = (payment: Payment) => payment.month || payment.paidDate.slice(0, 7),
    studentPayable = chartMonths.map((month) => invoices
      .filter((invoice) => invoice.registrationNo.startsWith("PH-") && invoice.status !== "Cancelled" && invoiceMonth(invoice) === month)
      .reduce((sum, invoice) => sum + invoice.amount, 0)),
    studentPaid = chartMonths.map((month) => payments
      .filter((payment) => payment.registrationNo.startsWith("PH-") && ["Deposit", "Room Rent"].includes(payment.type) && paymentMonth(payment) === month)
      .reduce((sum, payment) => sum + payment.paidAmount, 0)),
    shopPayable = chartMonths.map((month) => invoices
      .filter((invoice) => invoice.registrationNo.startsWith("SH-") && invoice.status !== "Cancelled" && invoiceMonth(invoice) === month)
      .reduce((sum, invoice) => sum + invoice.amount, 0)),
    shopPaid = chartMonths.map((month) => payments
      .filter((payment) => payment.registrationNo.startsWith("SH-") && paymentMonth(payment) === month)
      .reduce((sum, payment) => sum + payment.paidAmount, 0)),
    monthlyExpenses = chartMonths.map((month) => expenses
      .filter((expense) => expense.approvalStatus === "Approved" && expense.transactionDate.startsWith(month))
      .reduce((sum, expense) => sum + expense.amount, 0)),
    monthlyIncome = chartMonths.map((month) => operatingIncomeRows
      .filter((payment) => payment.paidDate.startsWith(month))
      .reduce((sum, payment) => sum + payment.paidAmount, 0)),
    expenseBreakdown = Object.entries(
      expenses
        .filter((expense) => expense.approvalStatus === "Approved")
        .reduce<Record<string, number>>((groups, expense) => {
          const category = expense.categoryName || "Other";
          groups[category] = (groups[category] || 0) + expense.amount;
          return groups;
        }, {}),
    )
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  return (
    <div className="content">
      <section className="stats dashboard-kpi-grid">
        <Stat
          tone="blue"
          icon="♙"
          label="Active residents"
          value={`${active}`}
          note="Registered residents"
        />
        <Stat
          tone="violet"
          icon="▦"
          label="Bed occupancy"
          value={`${occupancy} / ${beds}`}
          note={`${beds - occupancy} spaces available`}
        />
        <Stat
          tone="violet"
          icon="▤"
          label="Active tenants"
          value={`${shopCount} / ${totalShopCount}`}
          note={`${Math.max(0, totalShopCount - shopCount)} shops available`}
        />
        <Stat
          tone="blue"
          icon="♟"
          label="Active staff"
          value={`${staffCount} / ${totalStaffCount}`}
          note={`${payrollCount} submitted payroll entries`}
        />
        <Stat
          tone="violet"
          icon="✎"
          label="Contract agreements"
          value={`${unsignedAgreementCount} unsigned`}
          note="Active residents requiring signed agreements"
        />
        <Stat
          tone="amber"
          icon="⌂"
          label="Vacating settlements"
          value={`${pendingSettlementCount} pending`}
          note="Notices awaiting final settlement"
        />
        <Stat
          tone="amber"
          icon="✓"
          label="Outstanding actions"
          value={`${pendingActionCount}`}
          note="Management approvals requiring attention"
        />
        <Stat
          tone="amber"
          icon="⇄"
          label="Outstanding reconciliations"
          value={`${bankSummary.outstanding}`}
          note={`${bankSummary.total} total bank transactions`}
        />
        <Stat
          tone="green"
          icon="="
          label="Net financial position"
          value={cash.format(operatingIncomeTotal - approvedExpenseTotal)}
          note={`This month ${cash.format(operatingIncomeThisMonth - currentMonthExpenseTotal)}`}
        />
        <Stat
          tone="green"
          icon="₨"
          label="Total payments recorded"
          value={cash.format(collected)}
          note={`This month ${cash.format(collectedThisMonth)} · ${payments.length} transactions`}
        />
        <Stat
          tone="amber"
          icon="↗"
          label="Total expenses recorded"
          value={cash.format(approvedExpenseTotal)}
          note={`This month ${cash.format(currentMonthExpenseTotal)} · ${expenseCount} entries`}
        />
      </section>
      <section className="dashboard-chart-grid">
        <DashboardColumnChart title="Income and expenses" subtitle="Operating income vs approved expenses · last 18 months" labels={chartMonths.map(chartLabel)} series={[{ label: "Income", values: monthlyIncome, color: "blue" }, { label: "Expenses", values: monthlyExpenses, color: "red" }]} />
        <DashboardColumnChart title="Payments from residents" subtitle="Monthly payable vs paid · last 18 months" labels={chartMonths.map(chartLabel)} series={[{ label: "Payable", values: studentPayable, color: "blue" }, { label: "Paid", values: studentPaid, color: "green" }]} />
        <DashboardColumnChart title="Payments from shops" subtitle="Monthly payable vs paid · last 18 months" labels={chartMonths.map(chartLabel)} series={[{ label: "Payable", values: shopPayable, color: "violet" }, { label: "Paid", values: shopPaid, color: "green" }]} />
        <DashboardColumnChart title="Expenses" subtitle="Approved monthly expenses · last 18 months" labels={chartMonths.map(chartLabel)} series={[{ label: "Expenses", values: monthlyExpenses, color: "amber" }]} />
        <DashboardExpenseDonut rows={expenseBreakdown} />
      </section>
      <section className="panel overview-upcoming">
        <PanelHead
          tag="UPCOMING PAYMENTS"
          title="Invoices requiring payment"
          action="View invoice ledger →"
          click={() => go("Payments")}
        />
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>INVOICE</th>
                <th>RESIDENT</th>
                <th>HOSTEL ROOM</th>
                <th>TYPE</th>
                <th>MONTH</th>
                <th>DUE DATE</th>
                <th>OUTSTANDING<small>(LKR)</small></th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map((invoice) => (
                <tr key={invoice.id}>
                  <td><b>{invoice.invoiceNo}</b></td>
                  <td>
                    <b>{invoice.studentName}</b>
                    <small>{invoice.registrationNo}</small>
                  </td>
                  <td>{invoice.roomNo || "—"}</td>
                  <td>{invoice.invoiceType}</td>
                  <td>{invoice.month ? fmtMonth(invoice.month) : "—"}</td>
                  <td>{fmtDate(invoice.dueDate)}</td>
                  <td className="red">
                    {amountOnly.format(invoice.amount - Number(invoice.paidAmount || 0))}
                  </td>
                  <td>
                    <span className={`status ${invoice.status === "Partially Paid" ? "notice" : "inactive"}`}>
                      {invoice.status}
                    </span>
                  </td>
                </tr>
              ))}
              {!upcoming.length && (
                <tr>
                  <td colSpan={8} className="green">No upcoming payments.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

type DashboardChartSeries = {
  label: string;
  values: number[];
  color: "blue" | "green" | "violet" | "amber" | "red";
};
function DashboardColumnChart({
  title,
  subtitle,
  labels,
  series,
}: {
  title: string;
  subtitle: string;
  labels: string[];
  series: DashboardChartSeries[];
}) {
  const maximum = Math.max(1, ...series.flatMap((item) => item.values));
  return (
    <article className="panel dashboard-chart-card">
      <div className="dashboard-chart-head">
        <div><p className="tag">18-MONTH TREND</p><h2>{title}</h2><span>{subtitle}</span></div>
        <div className="dashboard-chart-legend">
          {series.map((item) => <span key={item.label}><i className={item.color} />{item.label}</span>)}
        </div>
      </div>
      <div className="dashboard-chart-scroll">
        <div className="dashboard-column-chart">
          {labels.map((label, index) => (
            <div className="dashboard-chart-month" key={`${label}-${index}`}>
              <div className="dashboard-bars">
                {series.map((item) => {
                  const value = item.values[index] || 0;
                  return <i key={item.label} className={item.color} style={{ height: `${Math.max(value ? 4 : 0, (value / maximum) * 100)}%` }} title={`${item.label}: ${cash.format(value)}`} />;
                })}
              </div>
              <small>{label}</small>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

const donutColors = ["#1766ad", "#27a477", "#8a62c3", "#e6a638", "#d7655d", "#5f86a6", "#a4b84a", "#c27caa"];
function DashboardExpenseDonut({ rows }: { rows: { label: string; value: number }[] }) {
  const visible = rows.slice(0, 7);
  if (rows.length > 7) visible.push({ label: "Other categories", value: rows.slice(7).reduce((sum, row) => sum + row.value, 0) });
  const total = visible.reduce((sum, row) => sum + row.value, 0);
  let cursor = 0;
  const gradient = total
    ? visible.map((row, index) => {
        const start = cursor;
        cursor += (row.value / total) * 100;
        return `${donutColors[index]} ${start}% ${cursor}%`;
      }).join(", ")
    : "#dfe6ed 0 100%";
  return (
    <article className="panel dashboard-chart-card dashboard-donut-card">
      <div className="dashboard-chart-head"><div><p className="tag">EXPENSE MIX</p><h2>Expenses by category</h2><span>Approved expenses split by category</span></div></div>
      <div className="dashboard-donut-body">
        <div className="dashboard-donut" style={{ background: `conic-gradient(${gradient})` }}>
          <span><b>{cash.format(total)}</b><small>Total expenses</small></span>
        </div>
        <div className="dashboard-donut-legend">
          {visible.map((row, index) => (
            <div key={row.label}><i style={{ background: donutColors[index] }} /><span>{row.label}</span><b>{total ? `${Math.round((row.value / total) * 100)}%` : "0%"}</b><small>{cash.format(row.value)}</small></div>
          ))}
          {!visible.length && <p>No approved expenses recorded.</p>}
        </div>
      </div>
    </article>
  );
}

function Stat(p: {
  tone: string;
  icon: string;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <article className={`stat ${p.tone}`}>
      <i>{p.icon}</i>
      <div>
        <span>{p.label}</span>
        <b>{p.value}</b>
        <small>{p.note}</small>
      </div>
    </article>
  );
}
function PanelHead({
  tag,
  title,
  action,
  click,
}: {
  tag: string;
  title: string;
  action: string;
  click: () => void;
}) {
  return (
    <div className="panelhead">
      <div>
        <p className="tag">{tag}</p>
        <h2>{title}</h2>
      </div>
      <button onClick={click}>{action}</button>
    </div>
  );
}
function Title({
  tag,
  title,
  text,
  action,
  click,
}: {
  tag: string;
  title: string;
  text: string;
  action?: string;
  click?: () => void;
}) {
  return (
    <div className="title">
      <div>
        <p className="tag">{tag}</p>
        <h2>{title}</h2>
        <span>{text}</span>
      </div>
      {action && (
        <button className="primary" onClick={click}>
          {action}
        </button>
      )}
    </div>
  );
}
function RegistersView({
  students,
  staff,
  tenants,
  shops,
  rooms,
  payments,
  adjustments,
  search,
  openStudent,
  openStaff,
  addStudent,
  addStaff,
  tenantAdded,
  tenantUpdated,
  tenantDeleted,
  studentUpdated,
  studentDeleted,
  staffUpdated,
  staffDeleted,
  designations,
  designationAdded,
  designationUpdated,
  designationDeleted,
}: {
  students: Student[];
  staff: Staff[];
  tenants: ShopTenant[];
  shops: Shop[];
  rooms: Room[];
  payments: Payment[];
  adjustments: MonthlyAdjustment[];
  search: string;
  openStudent: (student: Student) => void;
  openStaff: (member: Staff) => void;
  addStudent: () => void;
  addStaff: () => void;
  tenantAdded: (tenant: ShopTenant) => void;
  tenantUpdated: (tenant: ShopTenant) => void;
  tenantDeleted: (id: number) => void;
  studentUpdated: (student: Student) => void;
  studentDeleted: (registrationNo: string) => void;
  staffUpdated: (member: Staff) => void;
  staffDeleted: (staffNo: string) => void;
  designations: StaffDesignation[];
  designationAdded: (designation: StaffDesignation) => void;
  designationUpdated: (designation: StaffDesignation) => void;
  designationDeleted: (id: number) => void;
}) {
  const [tab, setTab] = useState<
    "students" | "staff" | "designations" | "shops"
  >("students");
  const [registeringShop, setRegisteringShop] = useState(false);
  const query = search.toLowerCase();
  return (
    <div className="content register-hub">
      <div className="register-tabs-row">
      <div
        className="payment-tabs register-tabs"
        role="tablist"
        aria-label="Registers"
      >
        <button
          className={tab === "students" ? "active" : ""}
          onClick={() => setTab("students")}
        >

          Resident Register
        </button>
        <button
          className={tab === "shops" ? "active" : ""}
          onClick={() => setTab("shops")}
        >
          Shop Register
        </button>
        <button
          className={tab === "staff" ? "active" : ""}
          onClick={() => setTab("staff")}
        >
          Staff Register
        </button>
        <button
          className={tab === "designations" ? "active" : ""}
          onClick={() => setTab("designations")}
        >
          Staff Designations
        </button>
      </div>
      {tab === "students" && <button className="primary" onClick={addStudent}>＋ Add Resident</button>}
      {tab === "staff" && <button className="primary" onClick={addStaff}>＋ Add staff</button>}
      {tab === "designations" && <button className="primary" onClick={()=>window.dispatchEvent(new Event("add-staff-designation"))}>＋ Add designation</button>}
      {tab === "shops" && <button className="primary" onClick={()=>setRegisteringShop(true)}>＋ Register shop tenant</button>}
      </div>
      {tab === "students" && (
        <StudentView
          rows={students.filter((student) =>
            `${student.registrationNo} ${student.firstName} ${student.lastName}`
              .toLowerCase()
              .includes(query),
          )}
          rooms={rooms}
          payments={payments}
          adjustments={adjustments}
          open={openStudent}
          add={addStudent}
          update={studentUpdated}
          remove={studentDeleted}
        />
      )}
      {tab === "staff" && (
        <StaffRegisterOnly
          rows={staff.filter((member) =>
            `${member.staffNo} ${member.firstName} ${member.lastName} ${member.designation}`
              .toLowerCase()
              .includes(query),
          )}
          designations={designations}
          open={openStaff}
          add={addStaff}
          update={staffUpdated}
          remove={staffDeleted}
        />
      )}
      {tab === "designations" && (
        <StaffDesignationsRegister
          designations={designations.filter((designation) =>
            designation.name.toLowerCase().includes(query),
          )}
          added={designationAdded}
          updated={designationUpdated}
          removed={designationDeleted}
        />
      )}
      {tab === "shops" && (
        <ShopRegister
          tenants={tenants.filter((tenant) =>
            `${tenant.registrationNo} ${tenant.shopNo} ${tenant.businessName} ${tenant.firstName} ${tenant.lastName} ${tenant.emergency1Name || ""} ${tenant.emergency2Name || ""}`
              .toLowerCase()
              .includes(query),
          )}
          shops={shops}
          registering={() => setRegisteringShop(true)}
          update={tenantUpdated}
          remove={tenantDeleted}
        />
      )}
      {registeringShop && (
        <ShopTenantModal
          shops={shops}
          close={() => setRegisteringShop(false)}
          save={(tenant) => {
            tenantAdded(tenant);
            setRegisteringShop(false);
          }}
        />
      )}
    </div>
  );
}

function StaffDesignationsRegister({
  designations,
  added,
  updated,
  removed,
}: {
  designations: StaffDesignation[];
  added: (designation: StaffDesignation) => void;
  updated: (designation: StaffDesignation) => void;
  removed: (id: number) => void;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [filters, setFilters] = useState({ name: "", status: "All" });
  useEffect(()=>{const open=()=>setShowAdd(true);window.addEventListener("add-staff-designation",open);return()=>window.removeEventListener("add-staff-designation",open);},[]);
  const visibleDesignations = designations.filter((designation)=>designation.name.toLowerCase().includes(filters.name.toLowerCase()) && (filters.status === "All" || (designation.active ? "Active" : "Inactive") === filters.status));
  const add = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/v1/staff-designations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, active: true }),
    });
    const result = await response.json();
    if (!response.ok)
      return setError(result.detail || "Unable to add designation");
    added(result);
    setName("");
    setShowAdd(false);
  };
  const toggle = async (designation: StaffDesignation) => {
    const response = await fetch(`/api/v1/staff-designations/${designation.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: designation.name, active: !designation.active }),
    });
    const result = await response.json();
    if (response.ok) updated(result);
  };
  const edit = async (designation: StaffDesignation) => {
    const name = window.prompt("Edit designation", designation.name)?.trim();
    if (!name || name === designation.name) return;
    const response = await fetch(`/api/v1/staff-designations/${designation.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, active: designation.active }),
    });
    const result = await response.json();
    if (!response.ok)
      return window.alert(result.detail || "Unable to edit designation");
    updated(result);
  };
  const remove = async (designation: StaffDesignation) => {
    if (!window.confirm(`Delete the ${designation.name} designation?`)) return;
    const response = await fetch(`/api/v1/staff-designations/${designation.id}`, { method: "DELETE" });
    if (!response.ok)
      return window.alert("Unable to delete designation. It may still be assigned to a staff member.");
    removed(designation.id);
  };
  return (
    <section className="register-section">
      {showAdd && <form className="category-add" onSubmit={add}>
        <label>
          Add another designation
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Enter designation"
            required
          />
        </label>
        <button className="primary">＋ Add designation</button>
        <button type="button" className="secondary" onClick={()=>setShowAdd(false)}>Cancel</button>
        {error && <p className="form-error">⚠ {error}</p>}
      </form>}
      <div className="student-register-toolbar"><div className="student-register-filters designation-register-filters">
        <input value={filters.name} onChange={(e)=>setFilters(c=>({...c,name:e.target.value}))} placeholder="Designation" />
        <select value={filters.status} onChange={(e)=>setFilters(c=>({...c,status:e.target.value}))}><option>All</option><option>Active</option><option>Inactive</option></select>
        <button className="secondary" onClick={()=>setFilters({name:"",status:"All"})}>Clear filters</button>
      </div></div>
      <div className="panel tablewrap">
        <table className="designation-table">
          <thead>
            <tr>
              <th>DESIGNATION</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {visibleDesignations.map((designation) => (
              <tr key={designation.id}>
                <td>
                  <b>{designation.name}</b>
                </td>
                <td>
                  <span
                    className={`status ${designation.active ? "active" : "inactive"}`}
                  >
                    ● {designation.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>
                  <span className="register-actions">
                    <button
                      className="review-button"
                      onClick={() => edit(designation)}
                    >
                      Edit
                    </button>
                    <button
                      className="review-button"
                      onClick={() => toggle(designation)}
                    >
                      {designation.active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      className="review-button danger"
                      onClick={() => remove(designation)}
                    >
                      Delete
                    </button>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StaffRegisterOnly({
  rows,
  designations,
  open,
  add,
  update,
  remove,
}: {
  rows: Staff[];
  designations: StaffDesignation[];
  open: (member: Staff) => void;
  add: () => void;
  update: (member: Staff) => void;
  remove: (staffNo: string) => void;
}) {
  const [status, setStatus] = useState<"All" | "Active" | "Inactive">("All");
  const [staffFilters, setStaffFilters] = useState({ staffNo: "", name: "", designation: "" });
  const [editing, setEditing] = useState<Staff | null>(null);
  const visible = rows.filter((member) =>
    (status === "All" || member.status === status) &&
    member.staffNo.toLowerCase().includes(staffFilters.staffNo.toLowerCase()) &&
    `${member.firstName} ${member.lastName}`.toLowerCase().includes(staffFilters.name.toLowerCase()) &&
    member.designation.toLowerCase().includes(staffFilters.designation.toLowerCase()));
  const deleteStaff = async (member: Staff) => {
    if (
      !window.confirm(
        `Delete ${member.staffNo} · ${member.firstName} ${member.lastName}?`,
      )
    )
      return;
    const response = await fetch(`/api/v1/staff/${encodeURIComponent(member.staffNo)}`, { method: "DELETE" });
    if (!response.ok)
      return window.alert("Unable to delete staff member");
    remove(member.staffNo);
  };
  return (
    <section className="register-section">
      <div className="student-register-toolbar">
        <div className="student-register-filters staff-register-filters">
          <input value={staffFilters.staffNo} onChange={(e)=>setStaffFilters(c=>({...c,staffNo:e.target.value}))} placeholder="Staff no." />
          <input value={staffFilters.name} onChange={(e)=>setStaffFilters(c=>({...c,name:e.target.value}))} placeholder="Staff name" />
          <input value={staffFilters.designation} onChange={(e)=>setStaffFilters(c=>({...c,designation:e.target.value}))} placeholder="Designation" />
          <select value={status} onChange={(e)=>setStatus(e.target.value as "All"|"Active"|"Inactive")}><option>All</option><option>Active</option><option>Inactive</option></select>
          <button className="secondary" onClick={()=>{setStaffFilters({staffNo:"",name:"",designation:""});setStatus("All");}}>Clear filters</button>
        </div>
      </div>
      <div className="panel tablewrap">
        <table>
          <thead>
            <tr>
              <th>STAFF NO.</th>
              <th>NAME</th>
              <th>DESIGNATION</th>
              <th>PHONE NO.</th>
              <th>WHATSAPP</th>
              <th>EMAIL</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((member) => (
              <tr key={member.id} onClick={() => open(member)}>
                <td className="link">{member.staffNo}</td>
                <td>
                  <b>
                    {member.firstName} {member.lastName}
                  </b>
                </td>
                <td>{member.designation}</td>
                <td>{member.mobile}</td>
                <td>{member.whatsapp || "—"}</td>
                <td>{member.email || "—"}</td>
                <td>
                  <span className={`status ${member.status.toLowerCase()}`}>
                    ● {member.status}
                  </span>
                </td>
                <td onClick={(event) => event.stopPropagation()}>
                  <span className="register-actions">
                    <button
                      className="review-button"
                      onClick={() => open(member)}
                    >
                      View
                    </button>
                    <button
                      className="review-button"
                      onClick={() => setEditing(member)}
                    >
                      Edit
                    </button>
                    <button
                      className="review-button danger"
                      onClick={() => deleteStaff(member)}
                    >
                      Delete
                    </button>
                  </span>
                </td>
              </tr>
            ))}
            {!visible.length && (
              <tr>
                <td colSpan={8}>No staff members match this view.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {editing && (
        <EditStaff
          member={editing}
          designations={designations.filter(
            (designation) =>
              designation.active || designation.name === editing.designation,
          )}
          close={() => setEditing(null)}
          save={(member) => {
            update(member);
            setEditing(null);
          }}
        />
      )}
    </section>
  );
}

function StudentView({
  rows,
  rooms,
  payments,
  adjustments,
  open,
  add,
  update,
  remove,
}: {
  rows: Student[];
  rooms: Room[];
  payments: Payment[];
  adjustments: MonthlyAdjustment[];
  open: (s: Student) => void;
  add: () => void;
  update: (s: Student) => void;
  remove: (registrationNo: string) => void;
}) {
  const [statusFilter, setStatusFilter] = useState<
    "All" | "Active" | "Inactive"
  >("All");
  const [studentFilters, setStudentFilters] = useState({ registration: "", name: "", room: "" });
  const [editing, setEditing] = useState<Student | null>(null);
  const deleteStudent = async (student: Student) => {
    if (
      !window.confirm(
        `Delete ${student.registrationNo} · ${student.firstName} ${student.lastName}? This removes the resident from the register.`,
      )
    )
      return;
    const response = await fetch(`/api/v1/students/${encodeURIComponent(student.registrationNo)}`, { method: "DELETE" });
    if (!response.ok)
      return window.alert("Unable to delete resident");
    remove(student.registrationNo);
  };
  const today = new Date();
  const lastCompletedMonth = addMonths(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`,
    -1,
  );
  const visibleRows = rows.filter((student) =>
    (statusFilter === "All" || student.status === statusFilter) &&
    student.registrationNo.toLowerCase().includes(studentFilters.registration.toLowerCase()) &&
    `${student.firstName} ${student.lastName}`.toLowerCase().includes(studentFilters.name.toLowerCase()) &&
    student.roomNo.toLowerCase().includes(studentFilters.room.toLowerCase()));
  const depositStatus = (student: Student) => {
    const paid = payments
      .filter(
        (payment) =>
          payment.registrationNo === student.registrationNo &&
          canonicalPaymentType(payment.type) === "Deposit",
      )
      .reduce((sum, payment) => sum + payment.paidAmount, 0);
    const outstanding = Math.max(0, student.depositPayable - paid);
    return outstanding
      ? {
          text: `Outstanding Rs ${amountOnly.format(outstanding)}`,
          tone: "outstanding",
        }
      : { text: "Paid", tone: "paid" };
  };
  const roomPaymentStatus = (student: Student) => {
    const firstMonth =
      student.startDate.slice(0, 7) < "2026-01"
        ? "2026-01"
        : student.startDate.slice(0, 7);
    const finalMonth =
      student.vacatedDate &&
      student.vacatedDate.slice(0, 7) < lastCompletedMonth
        ? student.vacatedDate.slice(0, 7)
        : lastCompletedMonth;
    const outstandingMonths = monthRange(firstMonth, finalMonth).filter(
      (month) =>
        rentPayable(student, month, adjustments) >
        rentPaid(payments, student.registrationNo, month),
    );
    return outstandingMonths.length
      ? {
          text: `${outstandingMonths.map(fmtMonth).join(", ")} Outstanding`,
          tone: "outstanding",
        }
      : { text: "Paid", tone: "paid" };
  };
  return (
    <div className="content">
      <div className="student-register-toolbar">
        <div className="student-register-filters">
          <input value={studentFilters.registration} onChange={(e)=>setStudentFilters(c=>({...c,registration:e.target.value}))} placeholder="Registration no." />
          <input value={studentFilters.name} onChange={(e)=>setStudentFilters(c=>({...c,name:e.target.value}))} placeholder="Resident name" />
          <input value={studentFilters.room} onChange={(e)=>setStudentFilters(c=>({...c,room:e.target.value}))} placeholder="Hostel Room no." />
          <select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value as "All"|"Active"|"Inactive")}><option>All</option><option>Active</option><option>Inactive</option></select>
          <button className="secondary" onClick={()=>{setStudentFilters({registration:"",name:"",room:""});setStatusFilter("All");}}>Clear filters</button>
        </div>
      </div>
      <div className="panel tablewrap">
        <table className="student-register-table">
          <thead>
            <tr>
              <th>REGISTRATION NO.</th>
              <th>NAME</th>
              <th>CONTACT</th>
              <th>WHATSAPP</th>
              <th>EMAIL</th>
              <th>HOSTEL ROOM</th>
              <th>SECURITY DEPOSIT</th>
              <th>HOSTEL ROOM PAYMENTS</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((s) => {
              const deposit = depositStatus(s);
              const roomPayments = roomPaymentStatus(s);
              return (
                <tr key={s.id} onClick={() => open(s)}>
                  <td className="link">{s.registrationNo}</td>
                  <td>
                    <b>
                      {s.firstName} {s.lastName}
                    </b>
                    <small>{s.university}</small>
                  </td>
                  <td>{s.mobile}</td>
                  <td>{s.whatsapp}</td>
                  <td>{s.email}</td>
                  <td>
                    <mark>{s.roomNo}</mark>
                  </td>
                  <td>
                    <span className={`financial-state ${deposit.tone}`}>
                      {deposit.text}
                    </span>
                  </td>
                  <td>
                    <span className={`financial-state ${roomPayments.tone}`}>
                      {roomPayments.text}
                    </span>
                  </td>
                  <td>
                    <span className={`status ${studentStatusTone(s)}`}>
                      ● {s.status}
                    </span>
                  </td>
                  <td onClick={(event) => event.stopPropagation()}>
                    <span className="register-actions">
                      <button className="review-button" onClick={() => open(s)}>
                        View
                      </button>
                      <button
                        className="review-button"
                        onClick={() => setEditing(s)}
                      >
                        Edit
                      </button>
                      <button
                        className="review-button danger"
                        onClick={() => deleteStudent(s)}
                      >
                        Delete
                      </button>
                    </span>
                  </td>
                </tr>
              );
            })}
            {!visibleRows.length && (
              <tr>
                <td colSpan={10} className="empty-table-row">
                  {statusFilter === "All"
                    ? "No residents found."
                    : `No ${statusFilter.toLowerCase()} residents found.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {editing && (
        <EditStudent
          student={editing}
          rooms={rooms}
          close={() => setEditing(null)}
          save={(student) => {
            update(student);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
function PaymentView({
  payments,
  students,
  shopTenants,
  shopUtilityBills,
  adjustments,
  openStudent,
  from,
  to,
  setFrom,
  setTo,
  section,
  setSection,
  adjustmentAdded,
  adjustmentUpdated,
  adjustmentDeleted,
  utilityAdded,
  utilityUpdated,
  utilityDeleted,
  paymentUpdated,
  paymentDeleted,
  invoices,
  paymentEvidence,
  invoicesUpdated,
  invoiceUpdated,
  evidenceReviewed,
  reviewer,
  canExportLedger,
  addPayment,
}: {
  payments: Payment[];
  students: Student[];
  shopTenants: ShopTenant[];
  shopUtilityBills: ShopUtilityBill[];
  adjustments: MonthlyAdjustment[];
  openStudent: (student: Student) => void;
  from: string;
  to: string;
  setFrom: (value: string) => void;
  setTo: (value: string) => void;
  section:
    | "ledger"
    | "rooms"
    | "shops"
    | "utilities"
    | "deposits"
    | "evidence"
    | "invoices";
  setSection: (
    value:
      | "ledger"
      | "rooms"
      | "shops"
      | "utilities"
      | "deposits"
      | "evidence"
      | "invoices",
  ) => void;
  adjustmentAdded: (adjustment: MonthlyAdjustment) => void;
  adjustmentUpdated: (adjustment: MonthlyAdjustment) => void;
  adjustmentDeleted: (id: number) => void;
  utilityAdded: (bill: ShopUtilityBill) => void;
  utilityUpdated: (bill: ShopUtilityBill) => void;
  utilityDeleted: (id: number) => void;
  paymentUpdated: (payment: Payment) => void;
  paymentDeleted: (id: number) => void;
  invoices: StudentInvoice[];
  paymentEvidence: StudentPaymentEvidence[];
  invoicesUpdated: (invoices: StudentInvoice[]) => void;
  invoiceUpdated: (invoice: StudentInvoice) => void;
  evidenceReviewed: (entry: StudentPaymentEvidence, payment?: Payment) => void;
  reviewer: string;
  canExportLedger: boolean;
  addPayment: () => void;
}) {
  const [roomSection, setRoomSection] = useState<"paid" | "payable">("paid");
  const [shopSection, setShopSection] = useState<"paid" | "payable">("paid");
  const [adjustmentForm, setAdjustmentForm] = useState(false);
  const [shopAdjustmentForm, setShopAdjustmentForm] = useState(false);
  const [matrixExport, setMatrixExport] = useState<"rooms" | "shops" | null>(null);
  const [roomExportFilter, setRoomExportFilter] = useState<{ type: "All" | "Resident ID" | "Hostel Room No."; value: string }>({ type: "All", value: "" });
  const [roomFilters, setRoomFilters] = useState({ registration: "", name: "", room: "" });
  const [shopFilters, setShopFilters] = useState({ registration: "", name: "", shop: "" });
  const [roomFrom, setRoomFrom] = useState(from), [roomTo, setRoomTo] = useState(to);
  const [shopFrom, setShopFrom] = useState(from), [shopTo, setShopTo] = useState(to);
  const changeRoomFrom = (value: string) => {
    setRoomFrom(value);
    if (!roomTo || roomTo < value || monthRange(value, roomTo).length > 12) setRoomTo(addMonths(value, 11));
  };
  const changeRoomTo = (value: string) => {
    if (value >= roomFrom && monthRange(roomFrom, value).length <= 12) setRoomTo(value);
  };
  const changeShopFrom = (value: string) => {
    setShopFrom(value);
    if (!shopTo || shopTo < value || monthRange(value, shopTo).length > 12) setShopTo(addMonths(value, 11));
  };
  const changeShopTo = (value: string) => {
    if (value >= shopFrom && monthRange(shopFrom, value).length <= 12) setShopTo(value);
  };
  const matrixExportData = (kind: "rooms" | "shops") => {
    const exportFrom = kind === "rooms" ? roomFrom : shopFrom;
    const exportTo = kind === "rooms" ? roomTo : shopTo;
    const months = monthRange(exportFrom, exportTo).slice(0, 12);
    const mode = kind === "rooms" ? roomSection : shopSection;
    const headers = [kind === "rooms" ? "HOSTEL ROOM" : "SHOP", "REGISTRATION", kind === "rooms" ? "NAME" : "TENANT / BUSINESS", ...months.map(fmtMonth)];
    const rows = kind === "rooms"
      ? [...students].filter((student) =>
          roomExportFilter.type === "All" ||
          (roomExportFilter.type === "Resident ID" && student.registrationNo.toLowerCase().includes(roomExportFilter.value.toLowerCase())) ||
          (roomExportFilter.type === "Hostel Room No." && student.roomNo.toLowerCase().includes(roomExportFilter.value.toLowerCase())),
        ).sort((a, b) => a.roomNo.localeCompare(b.roomNo, undefined, { numeric: true })).map((student) => [
          student.roomNo,
          student.registrationNo,
          `${student.firstName} ${student.lastName}`,
          ...months.map((month) => mode === "paid"
            ? rentPaid(payments, student.registrationNo, month)
            : invoices.find((invoice) => invoice.registrationNo === student.registrationNo && invoice.invoiceType === "Rent" && invoice.month === month && invoice.status !== "Cancelled")?.amount || 0),
        ])
      : [...shopTenants].filter((tenant) =>
          tenant.registrationNo.toLowerCase().includes(shopFilters.registration.toLowerCase()) &&
          `${tenant.businessName} ${tenant.firstName} ${tenant.lastName}`.toLowerCase().includes(shopFilters.name.toLowerCase()) &&
          tenant.shopNo.toLowerCase().includes(shopFilters.shop.toLowerCase()),
        ).sort((a, b) => a.shopNo.localeCompare(b.shopNo, undefined, { numeric: true })).map((tenant) => [
          tenant.shopNo,
          tenant.registrationNo,
          tenant.businessName || `${tenant.firstName} ${tenant.lastName}`,
          ...months.map((month) => mode === "paid"
            ? shopPaymentPaid(payments, tenant, month)
            : shopRentPayable(tenant, month, adjustments) +
              shopUtilityAmount(shopUtilityBills, "Electricity", month, tenant.shopNo) +
              shopUtilityAmount(shopUtilityBills, "Water", month, tenant.shopNo)),
        ]);
    return { months, mode, headers, rows };
  };
  const exportMatrixSpreadsheet = async (kind: "rooms" | "shops") => {
    const XLSX = await import("xlsx");
    const { headers, rows, mode } = matrixExportData(kind);
    const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    sheet["!cols"] = headers.map((_, index) => ({ wch: index === 2 ? 30 : index < 3 ? 18 : 15 }));
    sheet["!autofilter"] = { ref: `A1:${XLSX.utils.encode_col(headers.length - 1)}${Math.max(1, rows.length + 1)}` };
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, `${kind === "rooms" ? "Room" : "Shop"} ${mode === "paid" ? "Paid" : "Payable"}`);
    const exportFrom = kind === "rooms" ? roomFrom : shopFrom, exportTo = kind === "rooms" ? roomTo : shopTo;
    XLSX.writeFile(book, `Perk-Haven-${kind}-${mode}-${exportFrom}-to-${exportTo}.xlsx`);
  };
  const exportMatrixPdf = async (kind: "rooms" | "shops") => {
    const { jsPDF } = await import("jspdf");
    const { headers, rows, mode } = matrixExportData(kind);
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 8;
    const identityWidths = [17, 29, 42];
    const monthWidth = (pageWidth - margin * 2 - identityWidths.reduce((sum, width) => sum + width, 0)) / Math.max(12, headers.length - 3);
    const widths = [...identityWidths, ...headers.slice(3).map(() => monthWidth)];
    const title = `${kind === "rooms" ? "HOSTEL ROOM" : "SHOP"} PAYMENTS — AMOUNT ${mode === "paid" ? "PAID" : "PAYABLE"}`;
    const drawHeader = (page: number) => {
      pdf.setFillColor(15, 48, 78); pdf.rect(0, 0, pageWidth, 21, "F");
      pdf.setTextColor(255, 255, 255); pdf.setFont("helvetica", "bold"); pdf.setFontSize(13);
      pdf.text("THE PERK HAVEN HOSTEL", margin, 8); pdf.setFontSize(9); pdf.text(title, margin, 15);
      const exportFrom = kind === "rooms" ? roomFrom : shopFrom, exportTo = kind === "rooms" ? roomTo : shopTo;
      pdf.setFontSize(7); pdf.text(`${fmtMonth(exportFrom)} – ${fmtMonth(exportTo)}  |  Page ${page}`, pageWidth - margin, 15, { align: "right" });
      let x = margin; pdf.setFillColor(229, 237, 246); pdf.rect(margin, 25, widths.reduce((a, b) => a + b, 0), 11, "F");
      pdf.setTextColor(15, 48, 78); pdf.setFontSize(6.4);
      headers.forEach((header, index) => { pdf.text(header, x + widths[index] / 2, 31.5, { align: "center", maxWidth: widths[index] - 2 }); x += widths[index]; });
      return 36;
    };
    let page = 1, y = drawHeader(page);
    rows.forEach((row, rowIndex) => {
      if (y + 8 > pageHeight - 10) { pdf.addPage("a4", "landscape"); page += 1; y = drawHeader(page); }
      if (rowIndex % 2) { pdf.setFillColor(247, 249, 252); pdf.rect(margin, y, widths.reduce((a, b) => a + b, 0), 8, "F"); }
      let x = margin; pdf.setTextColor(20, 39, 61); pdf.setFont("helvetica", "normal"); pdf.setFontSize(6.3);
      row.forEach((value, index) => { const text = index >= 3 ? (Number(value) ? `LKR ${Number(value).toLocaleString("en-LK")}` : "—") : String(value); pdf.text(text, index >= 3 ? x + widths[index] - 1 : x + 1, y + 5, index >= 3 ? { align: "right", maxWidth: widths[index] - 2 } : { maxWidth: widths[index] - 2 }); x += widths[index]; });
      y += 8;
    });
    const exportFrom = kind === "rooms" ? roomFrom : shopFrom, exportTo = kind === "rooms" ? roomTo : shopTo;
    downloadBlob(
      pdf.output("blob"),
      `Perk-Haven-${kind}-${mode}-${exportFrom}-to-${exportTo}.pdf`,
    );
  };
  return (
    <div className="content payment-workspace">
      <div className="payment-tabs-row">
      <div className="payment-tabs" role="tablist" aria-label="Payment views">
        <button
          className={section === "ledger" ? "active" : ""}
          onClick={() => setSection("ledger")}
        >
          All Payments
        </button>
        <button
          className={section === "rooms" ? "active" : ""}
          onClick={() => setSection("rooms")}
        >

          Hostel Room Payments
        </button>
        <button
          className={section === "shops" ? "active" : ""}
          onClick={() => setSection("shops")}
        >
          Shop Payments
        </button>
        <button
          className={section === "utilities" ? "active" : ""}
          onClick={() => setSection("utilities")}
        >
          Shop Utility Calculation
        </button>
        <button
          className={section === "deposits" ? "active" : ""}
          onClick={() => setSection("deposits")}
        >

          Security Deposit Payments
        </button>
        <button
          className={section === "invoices" ? "active" : ""}
          onClick={() => setSection("invoices")}
        >
          Invoice Ledger
        </button>
      </div>
      <div className="payment-tab-actions">
        {section === "ledger" && (
          <>
            <button className="primary" onClick={addPayment}>＋ Add payment</button>
            {canExportLedger && <button className="secondary" onClick={() => window.dispatchEvent(new Event("export-payment-ledger"))}>⇩ Print / Export</button>}
          </>
        )}
        {section === "invoices" && (
          <>
            <label className="month-control">Billing month<input id="manual-invoice-month" type="month" defaultValue={new Date().toISOString().slice(0, 7)} /></label>
            <button className="primary" onClick={() => { const month = (document.getElementById("manual-invoice-month") as HTMLInputElement | null)?.value; window.dispatchEvent(new CustomEvent("issue-due-invoices", { detail: month })); }}>Issue invoices</button>
            <button className="secondary" onClick={() => window.dispatchEvent(new Event("export-invoice-ledger"))}>⇩ Print / Export</button>
          </>
        )}
      </div>
      </div>
      {section === "ledger" && (
        <PaymentLedger
          payments={payments}
          students={students}
          openStudent={openStudent}
          updated={paymentUpdated}
          removed={paymentDeleted}
          canExport={canExportLedger}
        />
      )}
      {section === "rooms" && (
        <>
          <div className="room-payment-toolbar">
            <div
              className="subtabs"
              role="tablist"
              aria-label="Hostel Room payment views"
            >
              <button
                className={roomSection === "paid" ? "active" : ""}
                onClick={() => setRoomSection("paid")}
              >
                Amount Paid
              </button>
              <button
                className={roomSection === "payable" ? "active" : ""}
                onClick={() => setRoomSection("payable")}
              >
                Amount Payable
              </button>
            </div>
            <div className="room-analysis-filters">
              <input list="room-payment-student-ids" value={roomFilters.registration} onChange={(event) => setRoomFilters((current) => ({ ...current, registration: event.target.value }))} placeholder="Resident ID" aria-label="Filter by resident ID" />
              <input list="room-payment-student-names" value={roomFilters.name} onChange={(event) => setRoomFilters((current) => ({ ...current, name: event.target.value }))} placeholder="Resident name" aria-label="Filter by resident name" />
              <input list="room-payment-room-nos" value={roomFilters.room} onChange={(event) => setRoomFilters((current) => ({ ...current, room: event.target.value }))} placeholder="Hostel Room no." aria-label="Filter by hostel room number" />
              <datalist id="room-payment-student-ids">{students.map((student) => <option value={student.registrationNo} key={student.id} />)}</datalist>
              <datalist id="room-payment-student-names">{students.map((student) => <option value={`${student.firstName} ${student.lastName}`.trim()} key={student.id} />)}</datalist>
              <datalist id="room-payment-room-nos">{[...new Set(students.map((student) => student.roomNo).filter(Boolean))].map((room) => <option value={room} key={room} />)}</datalist>
              <button className="secondary" onClick={() => setRoomFilters({ registration: "", name: "", room: "" })}>Clear filters</button>
            </div>
            <div className="period-controls">
              <label>
                From{" "}
                <input
                  type="month"
                  value={roomFrom}
                  onChange={(event) => changeRoomFrom(event.target.value)}
                />
              </label>
              <label>
                To{" "}
                <input
                  type="month"
                  value={roomTo}
                  min={roomFrom}
                  max={addMonths(roomFrom, 11)}
                  onChange={(event) => changeRoomTo(event.target.value)}
                />
              </label>
              {roomSection === "payable" && (
                <span className="invoice-source-note">
                  Final amounts are sourced from the Invoice Ledger
                </span>
              )}
              <button className="secondary" onClick={() => setMatrixExport("rooms")}>⇩ Print / Export</button>
            </div>
            <small className="period-caption">
              {fmtMonth(roomFrom)} – {fmtMonth(roomTo)} · maximum 12 months
            </small>
          </div>
          <RoomPaymentMatrix
            mode={roomSection}
            students={students}
            filters={roomFilters}
            payments={payments}
            invoices={invoices}
            from={roomFrom}
            to={roomTo}
            openStudent={openStudent}
          />
        </>
      )}
      {section === "shops" && (
        <>
          <div className="room-payment-toolbar">
            <div
              className="subtabs"
              role="tablist"
              aria-label="Shop payment views"
            >
              <button
                className={shopSection === "paid" ? "active" : ""}
                onClick={() => setShopSection("paid")}
              >
                Amount Paid
              </button>
              <button
                className={shopSection === "payable" ? "active" : ""}
                onClick={() => setShopSection("payable")}
              >
                Amount Payable
              </button>
            </div>
            <div className="room-analysis-filters">
              <input list="shop-payment-registrations" value={shopFilters.registration} onChange={(event) => setShopFilters((current) => ({ ...current, registration: event.target.value }))} placeholder="Shop registration" aria-label="Filter by shop registration" />
              <input list="shop-payment-names" value={shopFilters.name} onChange={(event) => setShopFilters((current) => ({ ...current, name: event.target.value }))} placeholder="Tenant / business" aria-label="Filter by tenant or business" />
              <input list="shop-payment-shop-nos" value={shopFilters.shop} onChange={(event) => setShopFilters((current) => ({ ...current, shop: event.target.value }))} placeholder="Shop no." aria-label="Filter by shop number" />
              <datalist id="shop-payment-registrations">{shopTenants.map((tenant) => <option value={tenant.registrationNo} key={tenant.id} />)}</datalist>
              <datalist id="shop-payment-names">{shopTenants.map((tenant) => <option value={tenant.businessName || `${tenant.firstName} ${tenant.lastName}`.trim()} key={tenant.id} />)}</datalist>
              <datalist id="shop-payment-shop-nos">{[...new Set(shopTenants.map((tenant) => tenant.shopNo).filter(Boolean))].map((shop) => <option value={shop} key={shop} />)}</datalist>
              <button className="secondary" onClick={() => setShopFilters({ registration: "", name: "", shop: "" })}>Clear filters</button>
            </div>
            <div className="period-controls">
              <label>
                From{" "}
                <input
                  type="month"
                  value={shopFrom}
                  onChange={(event) => changeShopFrom(event.target.value)}
                />
              </label>
              <label>
                To{" "}
                <input
                  type="month"
                  value={shopTo}
                  min={shopFrom}
                  max={addMonths(shopFrom, 11)}
                  onChange={(event) => changeShopTo(event.target.value)}
                />
              </label>
              {shopSection === "payable" && (
                <button
                  className="secondary"
                  onClick={() => setShopAdjustmentForm(true)}
                >
                  ＋ Add adjustment
                </button>
              )}
              <button className="secondary" onClick={() => setMatrixExport("shops")}>⇩ Print / Export</button>
            </div>
            <small className="period-caption">
              {fmtMonth(shopFrom)} – {fmtMonth(shopTo)} · maximum 12 months
            </small>
          </div>
          <ShopPaymentMatrix
            mode={shopSection}
            tenants={shopTenants}
            payments={payments}
            adjustments={adjustments}
            utilityBills={shopUtilityBills}
            filters={shopFilters}
            from={shopFrom}
            to={shopTo}
            adjustmentUpdated={adjustmentUpdated}
            adjustmentDeleted={adjustmentDeleted}
          />
        </>
      )}
      {section === "utilities" && (
        <ShopUtilitiesView
          bills={shopUtilityBills}
          invoices={invoices}
          added={utilityAdded}
          updated={utilityUpdated}
          removed={utilityDeleted}
          invoicesUpdated={invoicesUpdated}
        />
      )}
      {section === "deposits" && (
        <DepositView
          students={students}
          payments={payments}
          adjustments={adjustments}
          openStudent={openStudent}
        />
      )}
      {section === "invoices" && (
        <InvoiceLedger
          invoices={invoices}
          students={students}
          invoicesUpdated={invoicesUpdated}
          invoiceUpdated={invoiceUpdated}
        />
      )}
      {shopAdjustmentForm && (
        <ShopAdjustmentModal
          tenants={shopTenants}
          close={() => setShopAdjustmentForm(false)}
          save={(adjustment) => {
            adjustmentAdded(adjustment);
            setShopAdjustmentForm(false);
          }}
        />
      )}
      {matrixExport && (
        <div className="backdrop">
          <div className="modal compactmodal">
            <ModalHead
              tag="PAYMENT ANALYSIS"
              title={`Print / Export ${matrixExport === "rooms" ? "Room" : "Shop"} Payments`}
              text={`Export the current ${(matrixExport === "rooms" ? roomSection : shopSection) === "paid" ? "Amount Paid" : "Amount Payable"} view for ${fmtMonth(matrixExport === "rooms" ? roomFrom : shopFrom)} to ${fmtMonth(matrixExport === "rooms" ? roomTo : shopTo)}.`}
              close={() => setMatrixExport(null)}
            />
            {matrixExport === "rooms" && (
              <section className="matrix-export-filters">
                <label>
                  Export filter
                  <select
                    value={roomExportFilter.type}
                    onChange={(event) => setRoomExportFilter({ type: event.target.value as "All" | "Resident ID" | "Hostel Room No.", value: "" })}
                  >
                    <option>All</option>
                    <option>Resident ID</option>
                    <option>Hostel Room No.</option>
                  </select>
                </label>
                {roomExportFilter.type !== "All" && (
                  <label>
                    {roomExportFilter.type}
                    <input
                      value={roomExportFilter.value}
                      onChange={(event) => setRoomExportFilter((current) => ({ ...current, value: event.target.value }))}
                      placeholder={`Enter ${roomExportFilter.type.toLowerCase()}`}
                      autoFocus
                    />
                  </label>
                )}
                <p><b>{matrixExportData("rooms").rows.length}</b>  resident record(s) selected.</p>
              </section>
            )}
            <div className="modalactions">
              <button onClick={() => setMatrixExport(null)}>Cancel</button>
              <button className="secondary" disabled={matrixExport === "rooms" && (!matrixExportData("rooms").rows.length || (roomExportFilter.type !== "All" && !roomExportFilter.value.trim()))} onClick={() => void exportMatrixPdf(matrixExport)}>Download PDF</button>
              <button className="primary" disabled={matrixExport === "rooms" && (!matrixExportData("rooms").rows.length || (roomExportFilter.type !== "All" && !roomExportFilter.value.trim()))} onClick={() => void exportMatrixSpreadsheet(matrixExport)}>Export Spreadsheet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type ActionListProps = {
  paymentEvidence: StudentPaymentEvidence[];
  payments: Payment[];
  expenses: Expense[];
  profileRequests: StudentProfileRequest[];
  roomTransferRequests: RoomTransferRequest[];
  students: Student[];
  reviewer: string;
  reviewerRole: AuthenticatedUser["role"];
  evidenceReviewed: (entry: StudentPaymentEvidence, payment?: Payment) => void;
  expenseUpdated: (expense: Expense) => void;
  profileReviewed: (request: StudentProfileRequest, student?: Student) => void;
  roomTransferReviewed: (
    request: RoomTransferRequest,
    student?: Student,
  ) => void;
  studentUpdated: (student: Student) => void;
  go: (page: Page) => void;
};
type ActionFilter = "Pending" | "Completed" | "Closed" | "All";
const actionMatches = (
  filter: ActionFilter,
  status: "Pending" | "Completed" | "Closed",
) => filter === "All" || filter === status;

function ActionList(props: ActionListProps) {
  void ActionListLegacy;
  const {
    paymentEvidence,
    expenses,
    profileRequests,
    roomTransferRequests,
    students,
    reviewer,
    reviewerRole,
    evidenceReviewed,
    expenseUpdated,
    profileReviewed,
    studentUpdated,
    roomTransferReviewed,
    go,
  } = props;
  const [tab, setTab] = useState<
    | "Payment Evidence"
    | "Payment Verification"
    | "Expense Approval"
    | "Profile Edit Approval"
    | "Check-Out Notice Approval"
    | "Hostel Room Change Approval"
  >("Payment Evidence");
  const [filter, setFilter] = useState<ActionFilter>("Pending"),
    [bankSources, setBankSources] = useState<BankSource[]>([]),
    [reviewingExpense, setReviewingExpense] = useState<Expense | null>(null);
  useEffect(() => {
    fetch("/api/v1/bank-reconciliation")
      .then((response) => response.json())
      .then((result) => setBankSources(result.sources || []))
      .catch(() => setBankSources([]));
  }, []);
  const evidenceStatus = (
    entry: StudentPaymentEvidence,
  ): "Pending" | "Completed" | "Closed" =>
    entry.status === "Pending"
      ? "Pending"
      : entry.status === "Approved"
        ? "Completed"
        : "Closed";
  const expenseStatus = (entry: Expense): "Pending" | "Completed" | "Closed" =>
    entry.approvalStatus === "Approved"
      ? "Completed"
      : entry.approvalStatus === "Disapproved"
        ? "Closed"
        : "Pending";
  const profileStatus = (
    entry: StudentProfileRequest,
  ): "Pending" | "Completed" | "Closed" =>
    entry.status === "Approved"
      ? "Completed"
      : entry.status === "Rejected"
        ? "Closed"
        : "Pending";
  const noticeStatus = (
    student: Student,
  ): "Pending" | "Completed" | "Closed" =>
    student.noticeApprovalStatus === "Approved"
      ? "Completed"
      : student.noticeApprovalStatus === "Rejected"
        ? "Closed"
        : "Pending";
  const roomTransferStatus = (
    entry: RoomTransferRequest,
  ): "Pending" | "Completed" | "Closed" =>
    entry.status === "Rejected"
      ? "Closed"
      : entry.status === "Pending"
        ? "Pending"
        : "Completed";
  const visibleEvidence = paymentEvidence.filter((entry) =>
    actionMatches(filter, evidenceStatus(entry)),
  );
  const visiblePayments = bankSources.filter(
    (entry) =>
      entry.sourceType === "Payment" &&
      actionMatches(filter, entry.bankTransactionId ? "Completed" : "Pending"),
  );
  const visibleExpenses = expenses.filter((entry) =>
    actionMatches(filter, expenseStatus(entry)),
  );
  const visibleProfiles = profileRequests.filter((entry) =>
    actionMatches(filter, profileStatus(entry)),
  );
  const visibleNotices = students.filter(
    (entry) =>
      entry.noticeToVacateDate && actionMatches(filter, noticeStatus(entry)),
  );
  const visibleRoomTransfers = roomTransferRequests.filter((entry) =>
    actionMatches(filter, roomTransferStatus(entry)),
  );
  const pendingCounts = {
    "Payment Evidence": paymentEvidence.filter(
      (entry) => evidenceStatus(entry) === "Pending",
    ).length,
    "Payment Verification": bankSources.filter(
      (entry) => entry.sourceType === "Payment" && !entry.bankTransactionId,
    ).length,
    "Expense Approval": expenses.filter(
      (entry) => expenseStatus(entry) === "Pending",
    ).length,
    "Profile Edit Approval": profileRequests.filter(
      (entry) => profileStatus(entry) === "Pending",
    ).length,
    "Check-Out Notice Approval": students.filter(
      (entry) => entry.noticeToVacateDate && noticeStatus(entry) === "Pending",
    ).length,
    "Hostel Room Change Approval": roomTransferRequests.filter(
      (entry) => roomTransferStatus(entry) === "Pending",
    ).length,
  };
  return (
    <div className="content action-list">
      <div className="action-filter-bar">
        <span>SHOW ACTIONS</span>
        {(["Pending", "Completed", "Closed", "All"] as ActionFilter[]).map(
          (item) => (
            <button
              key={item}
              className={filter === item ? "active" : ""}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ),
        )}
      </div>
      <div className="action-list-tabs" role="tablist">
        {(Object.keys(pendingCounts) as Array<keyof typeof pendingCounts>).map(
          (item) => (
            <button
              key={item}
              className={tab === item ? "active" : ""}
              onClick={() => setTab(item)}
            >
              {item}
              <em>{pendingCounts[item]}</em>
            </button>
          ),
        )}
      </div>
      {tab === "Payment Evidence" && (
        <ActionPaymentEvidence
          entries={visibleEvidence}
          reviewer={reviewer}
          reviewed={evidenceReviewed}
          statusFor={evidenceStatus}
        />
      )}
      {tab === "Payment Verification" && (
        <ActionPaymentVerification
          entries={visiblePayments}
          go={() => go("Bank Reconciliation")}
        />
      )}
      {tab === "Expense Approval" && (
        <ActionExpenses
          entries={visibleExpenses}
          statusFor={expenseStatus}
          review={setReviewingExpense}
        />
      )}
      {tab === "Profile Edit Approval" && (
        <ProfileRequestAdmin
          requests={visibleProfiles}
          students={students}
          reviewer={reviewer}
          reviewerRole={reviewerRole}
          reviewed={profileReviewed}
        />
      )}
      {tab === "Check-Out Notice Approval" && (
        <ActionVacatingNotices
          students={visibleNotices}
          reviewer={reviewer}
          updated={studentUpdated}
          statusFor={noticeStatus}
        />
      )}
      {tab === "Hostel Room Change Approval" && (
        <RoomTransferActionList
          entries={visibleRoomTransfers}
          reviewer={reviewer}
          reviewerRole={reviewerRole}
          reviewed={roomTransferReviewed}
          statusFor={roomTransferStatus}
        />
      )}
      {reviewingExpense && (
        <ExpenseApproval
          expense={reviewingExpense}
          close={() => setReviewingExpense(null)}
          save={(entry) => {
            expenseUpdated(entry);
            setReviewingExpense(null);
          }}
        />
      )}
    </div>
  );
}

function ActionPaymentEvidence({
  entries,
  reviewer,
  reviewed,
  statusFor,
}: {
  entries: StudentPaymentEvidence[];
  reviewer: string;
  reviewed: (entry: StudentPaymentEvidence, payment?: Payment) => void;
  statusFor: (
    entry: StudentPaymentEvidence,
  ) => "Pending" | "Completed" | "Closed";
}) {
  const [notes, setNotes] = useState<Record<number, string>>({}),
    [busy, setBusy] = useState(0),
    [error, setError] = useState("");
  const decide = async (
    entry: StudentPaymentEvidence,
    decision: "Approved" | "Rejected",
  ) => {
    setBusy(entry.id);
    setError("");
    const response = await fetch("/api/payment-evidence", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: entry.id,
        decision,
        reviewNote: notes[entry.id] || "",
        reviewedBy: reviewer,
        paidDate: entry.submittedDate,
      }),
    });
    const result = await response.json();
    setBusy(0);
    if (!response.ok)
      return setError(result.error || "Unable to review submission");
    reviewed(result.evidence, result.payment);
  };
  return (
    <section className="panel payment-section">
      <div className="section-heading">
        <div>
          <p className="tag">PAYMENT EVIDENCE</p>
          <h2>Resident payment submissions</h2>
        </div>
      </div>
      {error && <p className="form-error">⚠ {error}</p>}
      <div className="tablewrap">
        <table className="ledger-table">
          <thead>
            <tr>
              <th>SUBMISSION</th>
              <th>RESIDENT</th>
              <th>MONTH</th>
              <th>AMOUNT<small>(LKR)</small></th>
              <th>EVIDENCE</th>
              <th>ACTION STATUS</th>
              <th>LOGGED DATE</th>
              <th>ACTION DATE</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const status = statusFor(entry);
              return (
                <tr key={entry.id}>
                  <td>
                    <b className="transaction-id">{entry.submissionId}</b>
                  </td>
                  <td>
                    {entry.registrationNo}
                    <small>{entry.studentName}</small>
                  </td>
                  <td>{fmtMonth(entry.month)}</td>
                  <td>
                    <b>{amountOnly.format(entry.amount)}</b>
                  </td>
                  <td>
                    <a
                      className="evidence-link"
                      href={`/api/payment-evidence/file?id=${entry.id}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {entry.evidenceName}
                    </a>
                  </td>
                  <td>
                    <span className={`action-status ${status.toLowerCase()}`}>
                      {status}
                    </span>
                  </td>
                  <td>{fmtDate(entry.submittedDate)}</td>
                  <td>
                    {entry.reviewedAt
                      ? fmtDate(entry.reviewedAt.slice(0, 10))
                      : "—"}
                  </td>
                  <td>
                    {entry.status === "Pending" ? (
                      <div className="evidence-review-actions">
                        <input
                          placeholder="Review note"
                          value={notes[entry.id] || ""}
                          onChange={(event) =>
                            setNotes((current) => ({
                              ...current,
                              [entry.id]: event.target.value,
                            }))
                          }
                        />
                        <button
                          className="reject-button"
                          disabled={busy === entry.id}
                          onClick={() => decide(entry, "Rejected")}
                        >
                          Reject
                        </button>
                        <button
                          className="primary compact"
                          disabled={busy === entry.id}
                          onClick={() => decide(entry, "Approved")}
                        >
                          Approve
                        </button>
                      </div>
                    ) : (
                      <small>
                        {entry.reviewedBy}
                        {entry.reviewNote ? ` · ${entry.reviewNote}` : ""}
                      </small>
                    )}
                  </td>
                </tr>
              );
            })}
            {!entries.length && (
              <tr>
                <td colSpan={9}>No actions match this filter.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RoomTransferActionList({
  entries,
  reviewer,
  reviewerRole,
  reviewed,
  statusFor,
}: {
  entries: RoomTransferRequest[];
  reviewer: string;
  reviewerRole: AuthenticatedUser["role"];
  reviewed: (request: RoomTransferRequest, student?: Student) => void;
  statusFor: (
    request: RoomTransferRequest,
  ) => "Pending" | "Completed" | "Closed";
}) {
  const [reviewing, setReviewing] = useState<RoomTransferRequest | null>(null);
  return (
    <section className="panel payment-section">
      <div className="section-heading">
        <div>
          <p className="tag">HOSTEL ROOM CHANGE APPROVAL</p>
          <h2>Resident hostel room-transfer requests</h2>
        </div>
      </div>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Request No.</th>
              <th>Requested</th>
              <th>Resident</th>
              <th>Current Hostel Room</th>
              <th>Requested Hostel Room</th>
              <th>Intended Start</th>
              <th>Availability</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Action Taken</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td>
                  <b>{entry.requestNo}</b>
                </td>
                <td>{fmtDate(entry.requestedDate)}</td>
                <td>
                  {entry.studentName}
                  <small>{entry.registrationNo}</small>
                </td>
                <td>{entry.currentRoomNo}</td>
                <td>{entry.requestedRoomNo}</td>
                <td>
                  {fmtDate(entry.proposedStartDate || entry.intendedStartDate)}
                </td>
                <td>
                  {entry.earliestAvailableDate
                    ? `${entry.studentResponseStatus} · ${fmtDate(entry.earliestAvailableDate)}`
                    : entry.roomAvailabilityStatus}
                </td>
                <td>{entry.reason || "—"}</td>
                <td>
                  <span
                    className={`action-status ${statusFor(entry).toLowerCase()}`}
                  >
                    {statusFor(entry)}
                  </span>
                </td>
                <td>
                  {entry.reviewedAt
                    ? fmtDate(entry.reviewedAt.slice(0, 10))
                    : "—"}
                </td>
                <td>
                  {entry.status === "Pending" ? (
                    <button
                      className="secondary"
                      onClick={() => setReviewing(entry)}
                    >
                      Review
                    </button>
                  ) : (
                    <small>
                      {entry.reviewedBy || "Management"}
                      {entry.reviewNote ? ` · ${entry.reviewNote}` : ""}
                    </small>
                  )}
                </td>
              </tr>
            ))}
            {!entries.length && (
              <tr>
                <td colSpan={11}>No hostel room-change actions match this filter.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {reviewing && (
        <RoomTransferApproval
          request={reviewing}
          reviewer={reviewer}
          reviewerRole={reviewerRole}
          close={() => setReviewing(null)}
          save={(request, student) => {
            reviewed(request, student);
            setReviewing(null);
          }}
        />
      )}
    </section>
  );
}

function RoomTransferApproval({
  request,
  reviewer,
  reviewerRole,
  close,
  save,
}: {
  request: RoomTransferRequest;
  reviewer: string;
  reviewerRole: AuthenticatedUser["role"];
  close: () => void;
  save: (request: RoomTransferRequest, student?: Student) => void;
}) {
  const [transferDate, setTransferDate] = useState(
    request.proposedStartDate ||
      request.earliestAvailableDate ||
      request.intendedStartDate ||
      new Date().toISOString().slice(0, 10),
  );
  const [deposit, setDeposit] = useState(String(request.revisedDepositAmount));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const decide = async (decision: "Approved" | "Rejected") => {
    if (busy) return;
    setBusy(true);
    setError("");
    const response = await fetch("/api/room-transfer-requests", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: request.id,
        decision,
        transferDate,
        revisedDepositAmount: Number(deposit),
        reviewNote: note,
        reviewedBy: reviewer,
        reviewerRole,
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error || "Unable to review hostel room change.");
      setBusy(false);
      return;
    }
    save(result.request, result.student);
  };
  const difference = Number(deposit || 0) - request.originalDepositAmount;
  return (
    <div className="backdrop">
      <div className="modal paymentmodal">
        <ModalHead
          tag="HOSTEL ROOM CHANGE APPROVAL"
          title={`Review ${request.requestNo}`}
          text={`${request.studentName} · ${request.currentRoomNo} → ${request.requestedRoomNo}`}
          close={close}
        />
        <div className="vacating-notice-body">
          <div className="notice-date-summary">
            <span>
              <small>CURRENT SECURITY DEPOSIT</small>
              <b>{cash.format(request.originalDepositAmount)}</b>
            </span>
            <span>
              <small>STANDARD REVISED SECURITY DEPOSIT</small>
              <b>{cash.format(request.revisedDepositAmount)}</b>
            </span>
            <span>
              <small>RESIDENT&apos;S INTENDED DATE</small>
              <b>{fmtDate(request.intendedStartDate)}</b>
            </span>
            <span>
              <small>HOSTEL ROOM AVAILABILITY</small>
              <b>
                {request.earliestAvailableDate
                  ? fmtDate(request.earliestAvailableDate)
                  : request.roomAvailabilityStatus}
              </b>
            </span>
          </div>
          <label>
            Effective transfer date
            <input
              type="date"
              value={transferDate}
              onChange={(event) => setTransferDate(event.target.value)}
              required
            />
          </label>
          <label>

            Revised security deposit amount (LKR)
            <input
              type="number"
              min="0"
              step="0.01"
              value={deposit}
              onChange={(event) => setDeposit(event.target.value)}
            />
          </label>
          <p className={difference > 0 ? "payment-warning" : "payment-success"}>
            {difference > 0
              ? `${cash.format(difference)} will become immediately payable.`
              : difference < 0
                ? `${cash.format(Math.abs(difference))} will be applied to the oldest outstanding monthly accommodation fee.`
                : "No security deposit adjustment is required."}
          </p>
          <label>
            Management note
            <textarea
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </label>
          {error && <p className="form-error">⚠ {error}</p>}
        </div>
        <footer className="student-modal-actions">
          <button type="button" onClick={close}>
            Cancel
          </button>
          <button
            type="button"
            className="danger"
            disabled={busy}
            onClick={() => decide("Rejected")}
          >
            Reject
          </button>
          <button
            type="button"
            className="primary"
            disabled={busy || !transferDate || !deposit}
            onClick={() => decide("Approved")}
          >
            {busy ? "Saving…" : "Approve transfer"}
          </button>
        </footer>
      </div>
    </div>
  );
}

function ActionPaymentVerification({
  entries,
  go,
}: {
  entries: BankSource[];
  go: () => void;
}) {
  return (
    <section className="panel payment-section">
      <div className="section-heading">
        <div>
          <p className="tag">PAYMENT VERIFICATION</p>
          <h2>Bank reconciliation actions</h2>
        </div>
        <button className="primary" onClick={go}>
          Open Bank Reconciliation
        </button>
      </div>
      <div className="tablewrap">
        <table className="ledger-table">
          <thead>
            <tr>
              <th>TRANSACTION</th>
              <th>DESCRIPTION</th>
              <th>AMOUNT<small>(LKR)</small></th>
              <th>ACTION STATUS</th>
              <th>LOGGED DATE</th>
              <th>ACTION DATE</th>
              <th>BANK TRANSACTION</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const status = entry.bankTransactionId ? "Completed" : "Pending";
              return (
                <tr key={`${entry.sourceType}-${entry.recordId}`}>
                  <td>
                    <b className="transaction-id">{entry.transactionId}</b>
                  </td>
                  <td>{entry.description}</td>
                  <td>
                    <b>{amountOnly.format(entry.amount)}</b>
                  </td>
                  <td>
                    <span className={`action-status ${status.toLowerCase()}`}>
                      {status}
                    </span>
                  </td>
                  <td>{fmtDate(entry.date)}</td>
                  <td>
                    {entry.actionDate
                      ? fmtDate(entry.actionDate.slice(0, 10))
                      : "—"}
                  </td>
                  <td>{entry.bankTransactionId || "—"}</td>
                </tr>
              );
            })}
            {!entries.length && (
              <tr>
                <td colSpan={7}>No actions match this filter.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ActionExpenses({
  entries,
  statusFor,
  review,
}: {
  entries: Expense[];
  statusFor: (entry: Expense) => "Pending" | "Completed" | "Closed";
  review: (entry: Expense) => void;
}) {
  return (
    <section className="panel payment-section">
      <div className="section-heading">
        <div>
          <p className="tag">EXPENSE APPROVAL</p>
          <h2>Expense actions</h2>
        </div>
      </div>
      <div className="tablewrap">
        <table className="ledger-table">
          <thead>
            <tr>
              <th>TRANSACTION</th>
              <th>CATEGORY</th>
              <th>AMOUNT<small>(LKR)</small></th>
              <th>ACTION STATUS</th>
              <th>LOGGED DATE</th>
              <th>ACTION DATE</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const status = statusFor(entry);
              return (
                <tr key={entry.id}>
                  <td>
                    <b className="transaction-id">{entry.transactionId}</b>
                  </td>
                  <td>{entry.categoryName}</td>
                  <td>
                    <b>{amountOnly.format(entry.amount)}</b>
                  </td>
                  <td>
                    <span className={`action-status ${status.toLowerCase()}`}>
                      {status}
                    </span>
                  </td>
                  <td>{fmtDate(entry.createdAt.slice(0, 10))}</td>
                  <td>
                    {entry.approvedAt
                      ? fmtDate(entry.approvedAt.slice(0, 10))
                      : "—"}
                  </td>
                  <td>
                    {status === "Pending" ? (
                      <button
                        className="review-button"
                        onClick={() => review(entry)}
                      >
                        Review
                      </button>
                    ) : (
                      <small>{entry.approvalNote || "Action completed"}</small>
                    )}
                  </td>
                </tr>
              );
            })}
            {!entries.length && (
              <tr>
                <td colSpan={7}>No actions match this filter.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ActionVacatingNotices({
  students,
  reviewer,
  updated,
  statusFor,
}: {
  students: Student[];
  reviewer: string;
  updated: (student: Student) => void;
  statusFor: (student: Student) => "Pending" | "Completed" | "Closed";
}) {
  const [notes, setNotes] = useState<Record<string, string>>({}),
    [busy, setBusy] = useState(""),
    [error, setError] = useState("");
  const decide = async (
    student: Student,
    decision: "Approved" | "Rejected",
  ) => {
    setBusy(student.registrationNo);
    setError("");
    const response = await fetch("/api/students", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        kind: "noticeReview",
        registrationNo: student.registrationNo,
        decision,
        reviewNote: notes[student.registrationNo] || "",
        reviewedBy: reviewer,
      }),
    });
    const result = await response.json();
    setBusy("");
    if (!response.ok)
      return setError(result.error || "Unable to review notice.");
    updated(result.student);
  };
  return (
    <section className="panel payment-section">
      <div className="section-heading">
        <div>
          <p className="tag">CHECK-OUT NOTICES</p>
          <h2>Resident notice actions</h2>
        </div>
      </div>
      {error && <p className="form-error">⚠ {error}</p>}
      <div className="tablewrap">
        <table className="ledger-table">
          <thead>
            <tr>
              <th>REGISTRATION</th>
              <th>RESIDENT</th>
              <th>INTENDED DATE</th>
              <th>ACTION STATUS</th>
              <th>LOGGED DATE</th>
              <th>ACTION DATE</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => {
              const status = statusFor(student);
              return (
                <tr key={student.registrationNo}>
                  <td>
                    <b className="transaction-id">{student.registrationNo}</b>
                  </td>
                  <td>
                    {student.firstName} {student.lastName}
                    <small>Hostel Room {student.roomNo}</small>
                  </td>
                  <td>
                    <b>{fmtDate(student.intendedVacateDate || "")}</b>
                  </td>
                  <td>
                    <span className={`action-status ${status.toLowerCase()}`}>
                      {status}
                    </span>
                  </td>
                  <td>{fmtDate(student.noticeToVacateDate || "")}</td>
                  <td>
                    {student.noticeReviewedAt
                      ? fmtDate(student.noticeReviewedAt.slice(0, 10))
                      : "—"}
                  </td>
                  <td>
                    {status === "Pending" ? (
                      <div className="evidence-review-actions">
                        <input
                          value={notes[student.registrationNo] || ""}
                          onChange={(event) =>
                            setNotes((current) => ({
                              ...current,
                              [student.registrationNo]: event.target.value,
                            }))
                          }
                          placeholder="Management note"
                        />
                        <button
                          className="reject-button"
                          disabled={busy === student.registrationNo}
                          onClick={() => decide(student, "Rejected")}
                        >
                          Reject
                        </button>
                        <button
                          className="primary compact"
                          disabled={busy === student.registrationNo}
                          onClick={() => decide(student, "Approved")}
                        >
                          Approve
                        </button>
                      </div>
                    ) : (
                      <small>
                        {student.noticeReviewedBy}
                        {student.noticeReviewNote
                          ? ` · ${student.noticeReviewNote}`
                          : ""}
                      </small>
                    )}
                  </td>
                </tr>
              );
            })}
            {!students.length && (
              <tr>
                <td colSpan={7}>No actions match this filter.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ActionListLegacy({
  paymentEvidence,
  payments: _payments,
  expenses,
  profileRequests,
  students,
  reviewer,
  reviewerRole,
  evidenceReviewed,
  expenseUpdated,
  profileReviewed,
  studentUpdated,
  go,
}: ActionListProps) {
  void _payments;
  const [tab, setTab] = useState<
    | "Payment Evidence"
    | "Payment Verification"
    | "Expense Approval"
    | "Profile Edit Approval"
    | "Check-Out Notice Approval"
  >("Payment Evidence");
  const [reviewingExpense, setReviewingExpense] = useState<Expense | null>(
    null,
  );
  const [bankSources, setBankSources] = useState<BankSource[]>([]);
  const pendingExpenses = expenses.filter(
    (entry) =>
      entry.approvalStatus === "Pending" ||
      entry.approvalStatus === "More Details Requested",
  );
  const pendingNotices = students.filter(
    (student) =>
      student.noticeToVacateDate &&
      (student.noticeApprovalStatus || "Pending") === "Pending",
  );
  useEffect(() => {
    fetch("/api/v1/bank-reconciliation")
      .then((response) => response.json())
      .then((result) => setBankSources(result.sources || []))
      .catch(() => setBankSources([]));
  }, []);
  const unverifiedPayments = bankSources.filter(
    (source) => source.sourceType === "Payment" && !source.bankTransactionId,
  );
  const counts: Record<typeof tab, number> = {
    "Payment Evidence": paymentEvidence.filter(
      (entry) => entry.status === "Pending",
    ).length,
    "Payment Verification": unverifiedPayments.length,
    "Expense Approval": pendingExpenses.length,
    "Profile Edit Approval": profileRequests.filter(
      (entry) => entry.status === "Pending",
    ).length,
    "Check-Out Notice Approval": pendingNotices.length,
  };
  return (
    <div className="content action-list">
      <Title
        tag="MANAGEMENT ACTIONS"
        title="Action List"
        text="Review and complete all items awaiting Admin, Chairman or Managing Director action."
      />
      <div className="action-list-tabs" role="tablist">
        {(Object.keys(counts) as Array<typeof tab>).map((item) => (
          <button
            key={item}
            className={tab === item ? "active" : ""}
            onClick={() => setTab(item)}
          >
            {item}
            <em>{counts[item]}</em>
          </button>
        ))}
      </div>
      {tab === "Payment Evidence" && (
        <PaymentEvidenceLedger
          entries={paymentEvidence.filter(
            (entry) => entry.status === "Pending",
          )}
          reviewer={reviewer}
          reviewed={evidenceReviewed}
        />
      )}
      {tab === "Payment Verification" && (
        <section className="panel payment-section">
          <div className="section-heading">
            <div>
              <p className="tag">BANK/CASH VERIFICATION</p>
              <h2>Payments awaiting bank reconciliation</h2>
              <span>
                Match each ledger transaction to its bank transaction.
              </span>
            </div>
            <button
              className="primary"
              onClick={() => go("Bank Reconciliation")}
            >
              Open Bank Reconciliation
            </button>
          </div>
          <div className="tablewrap">
            <table className="ledger-table">
              <thead>
                <tr>
                  <th>TRANSACTION ID</th>
                  <th>DATE</th>
                  <th>DESCRIPTION</th>
                  <th>AMOUNT<small>(LKR)</small></th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {unverifiedPayments.map((entry) => (
                  <tr key={`${entry.sourceType}-${entry.recordId}`}>
                    <td>
                      <b className="transaction-id">{entry.transactionId}</b>
                    </td>
                    <td>{fmtDate(entry.date)}</td>
                    <td>{entry.description}</td>
                    <td>
                      <b>{amountOnly.format(entry.amount)}</b>
                    </td>
                    <td>
                      <span className="approval-status pending">
                        Pending verification
                      </span>
                    </td>
                  </tr>
                ))}
                {!unverifiedPayments.length && (
                  <tr>
                    <td colSpan={5}>
                      No payments are awaiting bank verification.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {tab === "Expense Approval" && (
        <section className="panel payment-section">
          <div className="section-heading">
            <div>
              <p className="tag">EXPENSE MANAGEMENT</p>
              <h2>Expenses awaiting approval</h2>
            </div>
          </div>
          <div className="tablewrap">
            <table className="ledger-table">
              <thead>
                <tr>
                  <th>TRANSACTION ID</th>
                  <th>DATE</th>
                  <th>CATEGORY</th>
                  <th>PERSON PAID</th>
                  <th>AMOUNT<small>(LKR)</small></th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {pendingExpenses.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      <b className="transaction-id">{entry.transactionId}</b>
                    </td>
                    <td>{fmtDate(entry.transactionDate)}</td>
                    <td>{entry.categoryName}</td>
                    <td>{entry.personPaidName}</td>
                    <td>
                      <b>{amountOnly.format(entry.amount)}</b>
                    </td>
                    <td>
                      <span
                        className={`approval-status ${entry.approvalStatus.toLowerCase().replaceAll(" ", "-")}`}
                      >
                        {entry.approvalStatus}
                      </span>
                    </td>
                    <td>
                      <button
                        className="review-button"
                        onClick={() => setReviewingExpense(entry)}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
                {!pendingExpenses.length && (
                  <tr>
                    <td colSpan={7}>No expenses are awaiting approval.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {tab === "Profile Edit Approval" && (
        <ProfileRequestAdmin
          requests={profileRequests.filter(
            (entry) => entry.status === "Pending",
          )}
          students={students}
          reviewer={reviewer}
          reviewerRole={reviewerRole}
          reviewed={profileReviewed}
        />
      )}
      {tab === "Check-Out Notice Approval" && (
        <VacatingNoticeActionList
          students={pendingNotices}
          reviewer={reviewer}
          updated={studentUpdated}
        />
      )}
      {reviewingExpense && (
        <ExpenseApproval
          expense={reviewingExpense}
          close={() => setReviewingExpense(null)}
          save={(entry) => {
            expenseUpdated(entry);
            setReviewingExpense(null);
          }}
        />
      )}
    </div>
  );
}

function VacatingNoticeActionList({
  students,
  reviewer,
  updated,
}: {
  students: Student[];
  reviewer: string;
  updated: (student: Student) => void;
}) {
  const [notes, setNotes] = useState<Record<string, string>>({}),
    [busy, setBusy] = useState(""),
    [error, setError] = useState("");
  const decide = async (
    student: Student,
    decision: "Approved" | "Rejected",
  ) => {
    setBusy(student.registrationNo);
    setError("");
    const response = await fetch("/api/students", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        kind: "noticeReview",
        registrationNo: student.registrationNo,
        decision,
        reviewNote: notes[student.registrationNo] || "",
        reviewedBy: reviewer,
      }),
    });
    const result = await response.json();
    setBusy("");
    if (!response.ok)
      return setError(result.error || "Unable to review notice.");
    updated(result.student);
  };
  return (
    <section className="panel payment-section">
      <div className="section-heading">
        <div>
          <p className="tag">RESIDENT NOTICES</p>
          <h2>Vacating notices awaiting approval</h2>
          <span>

            Review the notice date and intended check-out date before deciding.
          </span>
        </div>
      </div>
      {error && <p className="form-error">⚠ {error}</p>}
      <div className="tablewrap">
        <table className="ledger-table">
          <thead>
            <tr>
              <th>REGISTRATION</th>
              <th>RESIDENT</th>
              <th>HOSTEL ROOM</th>
              <th>NOTICE DATE</th>
              <th>INTENDED CHECK-OUT DATE</th>
              <th>NOTE / ACTION</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.registrationNo}>
                <td>
                  <b className="transaction-id">{student.registrationNo}</b>
                </td>
                <td>
                  {student.firstName} {student.lastName}
                </td>
                <td>
                  <mark>{student.roomNo}</mark>
                </td>
                <td>{fmtDate(student.noticeToVacateDate || "")}</td>
                <td>
                  <b>{fmtDate(student.intendedVacateDate || "")}</b>
                </td>
                <td>
                  <div className="evidence-review-actions">
                    <input
                      value={notes[student.registrationNo] || ""}
                      onChange={(event) =>
                        setNotes((current) => ({
                          ...current,
                          [student.registrationNo]: event.target.value,
                        }))
                      }
                      placeholder="Management note"
                    />
                    <button
                      className="reject-button"
                      disabled={busy === student.registrationNo}
                      onClick={() => decide(student, "Rejected")}
                    >
                      Reject
                    </button>
                    <button
                      className="primary compact"
                      disabled={busy === student.registrationNo}
                      onClick={() => decide(student, "Approved")}
                    >
                      Approve
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!students.length && (
              <tr>
                <td colSpan={6}>No check-out notices are awaiting approval.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PaymentEvidenceLedger({
  entries,
  reviewer,
  reviewed,
}: {
  entries: StudentPaymentEvidence[];
  reviewer: string;
  reviewed: (entry: StudentPaymentEvidence, payment?: Payment) => void;
}) {
  const [notes, setNotes] = useState<Record<number, string>>({}),
    [busy, setBusy] = useState(0),
    [error, setError] = useState("");
  const decide = async (
    entry: StudentPaymentEvidence,
    decision: "Approved" | "Rejected",
  ) => {
    setBusy(entry.id);
    setError("");
    const response = await fetch("/api/payment-evidence", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: entry.id,
        decision,
        reviewNote: notes[entry.id] || "",
        reviewedBy: reviewer,
        paidDate: entry.submittedDate,
      }),
    });
    const result = await response.json();
    setBusy(0);
    if (!response.ok)
      return setError(result.error || "Unable to review submission");
    reviewed(result.evidence, result.payment);
  };
  return (
    <section className="panel payment-section">
      <div className="section-heading">
        <div>
          <p className="tag">RESIDENT SUBMISSIONS</p>
          <h2>Payment Evidence</h2>
          <span>
            Evidence remains here until Admin, Chairman or Managing Director
            verifies it. Approval creates a verified Payment Ledger transaction.
          </span>
        </div>
      </div>
      {error && <p className="form-error">⚠ {error}</p>}
      <div className="tablewrap">
        <table className="ledger-table evidence-ledger">
          <thead>
            <tr>
              <th>SUBMISSION ID</th>
              <th>DATE</th>
              <th>INVOICE</th>
              <th>REGISTRATION</th>
              <th>NAME</th>
              <th>HOSTEL ROOM</th>
              <th>MONTH</th>
              <th>AMOUNT<small>(LKR)</small></th>
              <th>EVIDENCE</th>
              <th>REMARKS</th>
              <th>STATUS / ACTION</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td>
                  <b className="transaction-id">{entry.submissionId}</b>
                </td>
                <td>{fmtDate(entry.submittedDate)}</td>
                <td>{entry.invoiceNo}</td>
                <td>
                  <b>{entry.registrationNo}</b>
                </td>
                <td>{entry.studentName}</td>
                <td>
                  <mark>{entry.roomNo}</mark>
                </td>
                <td>{fmtMonth(entry.month)}</td>
                <td>
                  <b>{amountOnly.format(entry.amount)}</b>
                </td>
                <td>
                  <a
                    className="review-button"
                    href={`/api/payment-evidence/file?id=${entry.id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View {entry.evidenceName}
                  </a>
                </td>
                <td>{entry.remarks || "—"}</td>
                <td>
                  {entry.status === "Pending" ? (
                    <div className="evidence-review-actions">
                      <input
                        placeholder="Review note"
                        value={notes[entry.id] || ""}
                        onChange={(event) =>
                          setNotes((current) => ({
                            ...current,
                            [entry.id]: event.target.value,
                          }))
                        }
                      />
                      <button
                        className="reject-button"
                        disabled={busy === entry.id}
                        onClick={() => decide(entry, "Rejected")}
                      >
                        Reject
                      </button>
                      <button
                        className="primary compact"
                        disabled={busy === entry.id}
                        onClick={() => decide(entry, "Approved")}
                      >
                        Approve
                      </button>
                    </div>
                  ) : (
                    <>
                      <span
                        className={`approval-status ${entry.status.toLowerCase()}`}
                      >
                        {entry.status}
                      </span>
                      <small>
                        {entry.reviewedBy}
                        {entry.reviewNote ? ` · ${entry.reviewNote}` : ""}
                      </small>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {!entries.length && (
              <tr>
                <td colSpan={11}>

                  No resident payment evidence has been submitted.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function InvoiceLedger({
  invoices,
  students,
  invoicesUpdated,
  invoiceUpdated,
}: {
  invoices: StudentInvoice[];
  students: Student[];
  invoicesUpdated: (rows: StudentInvoice[]) => void;
  invoiceUpdated: (row: StudentInvoice) => void;
}) {
  const [editing, setEditing] = useState<StudentInvoice | null>(null),
    [previewing, setPreviewing] = useState<StudentInvoice | null>(null),
    [exportOpen, setExportOpen] = useState(false),
    [exportFilters, setExportFilters] = useState({ invoice: "", registration: "", name: "", room: "", type: "All", status: "All" }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const exportRows = invoices.filter((invoice) =>
    invoice.invoiceNo.toLowerCase().includes(exportFilters.invoice.toLowerCase()) &&
    invoice.registrationNo.toLowerCase().includes(exportFilters.registration.toLowerCase()) &&
    invoice.studentName.toLowerCase().includes(exportFilters.name.toLowerCase()) &&
    invoice.roomNo.toLowerCase().includes(exportFilters.room.toLowerCase()) &&
    (exportFilters.type === "All" || invoice.invoiceType === exportFilters.type) &&
    (exportFilters.status === "All" || invoice.status === exportFilters.status));
  const exportInvoicesSpreadsheet = async () => {
    const XLSX = await import("xlsx");
    const data = exportRows.map((invoice) => ({ "INVOICE NO.": invoice.invoiceNo, "ISSUE DATE": fmtCompactDate(invoice.issueDate), "DUE DATE": fmtCompactDate(invoice.dueDate), TYPE: invoice.invoiceType, MONTH: invoice.invoiceType === "Deposit" ? "" : fmtMonth(invoice.month), REGISTRATION: invoice.registrationNo, NAME: invoice.studentName, ROOM: invoice.roomNo, AMOUNT: invoice.amount, STATUS: invoice.status, REVISION: `Rev.${invoiceRevision(invoice)}` }));
    const sheet = XLSX.utils.json_to_sheet(data); sheet["!autofilter"] = { ref: `A1:K${Math.max(1, data.length + 1)}` }; sheet["!cols"] = [{wch:20},{wch:14},{wch:14},{wch:18},{wch:16},{wch:20},{wch:28},{wch:10},{wch:16},{wch:14},{wch:12}];
    const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book, sheet, "Invoice Ledger"); XLSX.writeFile(book, `Perk-Haven-Invoice-Ledger-${new Date().toISOString().slice(0,10)}.xlsx`);
  };
  const exportInvoicesPdf = async () => {
    const { jsPDF } = await import("jspdf"); const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" }); const pageWidth = pdf.internal.pageSize.getWidth(), pageHeight = pdf.internal.pageSize.getHeight(), margin = 8;
    const headers = ["INVOICE NO.","ISSUED","DUE","TYPE","MONTH","REGISTRATION","NAME","HOSTEL ROOM","AMOUNT","STATUS","REV."]; const widths = [28,19,19,20,20,28,40,15,24,20,14];
    const drawHeader = (page:number) => { pdf.setFillColor(15,48,78); pdf.rect(0,0,pageWidth,22,"F"); pdf.setTextColor(255,255,255); pdf.setFont("helvetica","bold"); pdf.setFontSize(13); pdf.text("THE PERK HAVEN HOSTEL",margin,9); pdf.setFontSize(9); pdf.text("INVOICE LEDGER",margin,16); pdf.setFontSize(7); pdf.text(`Page ${page}`,pageWidth-margin,16,{align:"right"}); let x=margin; pdf.setFillColor(229,237,246); pdf.rect(margin,26,widths.reduce((a,b)=>a+b,0),10,"F"); pdf.setTextColor(15,48,78); pdf.setFontSize(6.2); headers.forEach((h,i)=>{pdf.text(h,x+widths[i]/2,32,{align:"center",maxWidth:widths[i]-2});x+=widths[i];}); return 36; };
    let page=1,y=drawHeader(page); exportRows.forEach((invoice,index)=>{ if(y+8>pageHeight-10){pdf.addPage("a4","landscape");page++;y=drawHeader(page);} if(index%2){pdf.setFillColor(247,249,252);pdf.rect(margin,y,widths.reduce((a,b)=>a+b,0),8,"F");} const values=[invoice.invoiceNo,fmtCompactDate(invoice.issueDate),fmtCompactDate(invoice.dueDate),invoice.invoiceType,invoice.invoiceType==="Deposit"?"—":fmtMonth(invoice.month),invoice.registrationNo,invoice.studentName,invoice.roomNo,`LKR ${invoice.amount.toLocaleString("en-LK")}`,invoice.status,`Rev.${invoiceRevision(invoice)}`]; let x=margin; pdf.setTextColor(20,39,61);pdf.setFont("helvetica","normal");pdf.setFontSize(6.2);values.forEach((v,i)=>{pdf.text(String(v),x+1,y+5,{maxWidth:widths[i]-2});x+=widths[i];});y+=8; }); downloadBlob(pdf.output("blob"),`Perk-Haven-Invoice-Ledger-${new Date().toISOString().slice(0,10)}.pdf`);
  };
  const generate = async (month?: string) => {
    setBusy(true);
    setError("");
    const response = await fetch(`/api/v1/invoices/generation-runs${month ? `?month=${encodeURIComponent(month)}` : ""}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
    });
    const result = await response.json();
    setBusy(false);
    if (!response.ok)
      return setError(result.detail || "Unable to issue invoices");
    const refreshed = await fetch("/api/v1/invoices?size=100");
    if (refreshed.ok) invoicesUpdated(((await refreshed.json()) as ApiPage<StudentInvoice>).items);
  };
  useEffect(() => {
    const issue = (event: Event) => void generate((event as CustomEvent<string>).detail);
    window.addEventListener("issue-due-invoices", issue);
    return () => window.removeEventListener("issue-due-invoices", issue);
  });
  useEffect(() => { const open = () => setExportOpen(true); window.addEventListener("export-invoice-ledger", open); return () => window.removeEventListener("export-invoice-ledger", open); }, []);
  return (
    <section className="panel payment-section">
      {error && <p className="form-error">⚠ {error}</p>}
      <div className="tablewrap">
        <table className="ledger-table">
          <thead>
            <tr>
              <th>INVOICE NO.</th>
              <th>ISSUE DATE</th>
              <th>DUE DATE</th>
              <th>MONTH</th>
              <th>REGISTRATION</th>
              <th>NAME</th>
              <th>HOSTEL ROOM</th>
              <th>AMOUNT<small>(LKR)</small></th>
              <th>STATUS</th>
              <th>REVISION</th>
              <th>EMAIL</th>
              <th>TRANSACTION ID(S)</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => {
              const student = students.find(
                (item) => item.registrationNo === invoice.registrationNo,
              );
              return (
                <tr key={invoice.id}>
                  <td>
                    <b className="transaction-id">{invoice.invoiceNo}</b>
                  </td>
                  <td>{fmtDate(invoice.issueDate)}</td>
                  <td>{fmtDate(invoice.dueDate)}</td>
                  <td>{invoice.invoiceType === "Deposit" ? "—" : fmtMonth(invoice.month)}</td>
                  <td>
                    <b>{invoice.registrationNo}</b>
                  </td>
                  <td>{invoice.studentName}</td>
                  <td>
                    <mark>{invoice.roomNo}</mark>
                  </td>
                  <td>
                    <b>{amountOnly.format(invoice.amount)}</b>
                  </td>
                  <td>
                    <span
                      className={`invoice-status ${invoice.status.toLowerCase().replace(" ", "-")}`}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td>Rev.{invoiceRevision(invoice)}</td>
                  <td>
                    <small>{invoice.emailStatus}</small>
                  </td>
                  <td>{invoice.transactionIds?.length ? invoice.transactionIds.join(", ") : "—"}</td>
                  <td>
                    <div className="admin-row-actions">
                      <button
                        type="button"
                        className="review-button"
                        onClick={() => setPreviewing(invoice)}
                      >
                        View PDF
                      </button>
                      <button type="button" className="review-button" onClick={() => setPreviewing(invoice)}>Download PDF</button>
                      <button
                        className="review-button"
                        onClick={() => setEditing(invoice)}
                      >
                        Adjust & reissue
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!invoices.length && (
              <tr>
                <td colSpan={13}>No invoices have been issued.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {exportOpen && <div className="backdrop"><div className="modal paymentmodal"><ModalHead tag="INVOICE LEDGER" title="Print / Export Invoice Ledger" text={`${exportRows.length} invoice record(s) selected.`} close={() => setExportOpen(false)} /><section className="formgrid three payment-export-filters">
        <label>Invoice No.<input value={exportFilters.invoice} onChange={(e)=>setExportFilters(c=>({...c,invoice:e.target.value}))}/></label>
        <label>Registration<input value={exportFilters.registration} onChange={(e)=>setExportFilters(c=>({...c,registration:e.target.value}))}/></label>
        <label>Name<input value={exportFilters.name} onChange={(e)=>setExportFilters(c=>({...c,name:e.target.value}))}/></label>
        <label>Hostel Room<input value={exportFilters.room} onChange={(e)=>setExportFilters(c=>({...c,room:e.target.value}))}/></label>
        <label>Invoice type<select value={exportFilters.type} onChange={(e)=>setExportFilters(c=>({...c,type:e.target.value}))}><option>All</option><option value="Deposit">Security Deposit</option><option value="Rent">Monthly Accommodation Fee</option><option>Shop Electricity</option><option>Shop Water</option></select></label>
        <label>Status<select value={exportFilters.status} onChange={(e)=>setExportFilters(c=>({...c,status:e.target.value}))}><option>All</option><option>Issued</option><option>Partially Paid</option><option>Paid</option><option>Cancelled</option></select></label>
        <button className="secondary" onClick={()=>setExportFilters({invoice:"",registration:"",name:"",room:"",type:"All",status:"All"})}>Clear filters</button>
      </section><div className="modalactions"><button onClick={()=>setExportOpen(false)}>Cancel</button><button className="secondary" disabled={!exportRows.length} onClick={()=>void exportInvoicesPdf()}>Download PDF</button><button className="primary" disabled={!exportRows.length} onClick={()=>void exportInvoicesSpreadsheet()}>Export Spreadsheet</button></div></div></div>}
      {editing && (
        <InvoiceEditModal
          invoice={editing}
          close={() => setEditing(null)}
          save={(invoice) => {
            invoiceUpdated(invoice);
            setEditing(null);
          }}
        />
      )}
      {previewing && (
        <InvoicePreviewModal
          invoice={previewing}
          student={students.find(
            (item) => item.registrationNo === previewing.registrationNo,
          )}
          close={() => setPreviewing(null)}
        />
      )}
    </section>
  );
}

function InvoiceEditModal({
  invoice,
  close,
  save,
}: {
  invoice: StudentInvoice;
  close: () => void;
  save: (invoice: StudentInvoice) => void;
}) {
  const initialAdjustments: Array<{ type: MonthlyAdjustment["type"]; effect: "Reduce" | "Increase"; amount: number; note: string }> =
    invoice.adjustments?.length
      ? invoice.adjustments.map((row) => ({ type: adjustmentUiType(row.type), effect: row.effect, amount: Number(row.amount), note: row.note || "" }))
      : ["Late Start Adjustment", "Early Vacate Adjustment", "Vacation Discount", "Other Adjustment"].map((type) => ({
          type: type as MonthlyAdjustment["type"], effect: "Reduce" as const, amount: 0, note: "",
        }));
  const [amount, setAmount] = useState(invoice.amount);
  const [baseAmount] = useState(invoice.baseAmount ?? invoice.amount);
  const [invoiceAdjustments, setInvoiceAdjustments] = useState(initialAdjustments);
  const [remarks, setRemarks] = useState(invoice.remarks);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const calculatedAmount = Math.max(
          0,
          baseAmount -
            invoiceAdjustments.reduce(
              (sum, row) =>
                sum + (row.effect === "Increase" ? -row.amount : row.amount),
              0,
            ),
        );
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const response = await fetch(`/api/v1/invoices/${invoice.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        amount: calculatedAmount,
        remarks,
        adjustments:
          invoiceAdjustments.map((row) => ({
            type: adjustmentApiType(row.type),
            effect: row.effect.toUpperCase(),
            amount: row.amount,
            note: row.note,
          })),
      }),
    });
    const result = await response.json();
    setSaving(false);
    if (!response.ok)
      return setError(result.detail || "Unable to reissue invoice");
    save(result);
  };
  return (
    <div className="backdrop">
      <form className="modal paymentmodal" onSubmit={submit}>
        <ModalHead
          tag="INVOICE ADMINISTRATION"
          title={`Adjust and reissue ${invoice.invoiceNo}`}
          text={`Apply any increase or reduction to this invoice here. Saving creates Rev.${String(invoice.version).padStart(2, "0")} and the revised total becomes the Amount Payable source.`}
          close={close}
        />
        <section className="formgrid two">
          <label>
            Invoice month
            <input value={fmtMonth(invoice.month)} disabled />
          </label>
          <label>

            Resident
            <input
              value={`${invoice.registrationNo} · ${invoice.studentName}`}
              disabled
            />
          </label>
          <label>
            Amount payable (LKR)
            <input
              type="number"
              min="0"
              step="0.01"
              value={calculatedAmount}
              onChange={(event) => setAmount(Number(event.target.value))}
              disabled
              required
            />
          </label>
          {(
            <div className="wide invoice-adjustment-editor">
              <div className="invoice-adjustment-summary">
                <span>
                  <small>STANDARD MONTHLY ACCOMMODATION FEE</small>
                  <b>{cash.format(baseAmount)}</b>
                </span>
                <span>
                  <small>FINAL AMOUNT PAYABLE</small>
                  <b>{cash.format(calculatedAmount)}</b>
                </span>
              </div>
              <div className="invoice-adjustment-heading">
                <b>Invoice adjustments</b>
                <small>
                  Leave the amount at nil when an adjustment does not apply.
                  Only non-zero adjustments appear on the invoice.
                </small>
              </div>
              {invoiceAdjustments.map((row, index) => (
                <div className="invoice-adjustment-row" key={row.type}>
                  <label>
                    Adjustment
                    <input value={row.type} disabled />
                  </label>
                  <label>
                    Effect
                    <select
                      value={row.effect}
                      onChange={(event) =>
                        setInvoiceAdjustments((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index
                              ? {
                                  ...item,
                                  effect: event.target.value as
                                    | "Reduce"
                                    | "Increase",
                                }
                              : item,
                          ),
                        )
                      }
                    >
                      <option>Reduce</option>
                      <option>Increase</option>
                    </select>
                  </label>
                  <label>
                    Amount (LKR)
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.amount || ""}
                      placeholder="Nil"
                      onChange={(event) =>
                        setInvoiceAdjustments((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index
                              ? {
                                  ...item,
                                  amount: Math.max(
                                    0,
                                    Number(event.target.value) || 0,
                                  ),
                                }
                              : item,
                          ),
                        )
                      }
                    />
                  </label>
                  <label>
                    Note
                    <input
                      value={row.note}
                      placeholder="Optional description"
                      onChange={(event) =>
                        setInvoiceAdjustments((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, note: event.target.value }
                              : item,
                          ),
                        )
                      }
                    />
                  </label>
                </div>
              ))}
            </div>
          )}
          <label>
            Issue date
            <input type="date" value={invoice.issueDate} disabled />
          </label>
          <label>
            Due date
            <input type="date" value={invoice.dueDate} disabled />
          </label>
          <label className="wide">
            Remarks
            <textarea
              rows={3}
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
            />
          </label>
        </section>
        {error && <p className="form-error">⚠ {error}</p>}
        <Actions
          close={close}
          text={saving ? "Saving…" : "Save and reissue"}
          disabled={saving}
        />
      </form>
    </div>
  );
}

function PaymentLedger({
  payments,
  students,
  openStudent,
  updated,
  removed,
  canExport,
}: {
  payments: Payment[];
  students: Student[];
  openStudent: (student: Student) => void;
  updated: (payment: Payment) => void;
  removed: (id: number) => void;
  canExport: boolean;
}) {
  const [bankSources, setBankSources] = useState<BankSource[]>([]);
  const [previewReceipt, setPreviewReceipt] = useState<Payment | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFilters, setExportFilters] = useState({
    transaction: "",
    invoice: "",
    registration: "",
    name: "",
    room: "",
    type: "All",
    monthFrom: "",
    monthTo: "",
    paidFrom: "",
    paidTo: "",
    verification: "All",
  });
  useEffect(() => {
    fetch("/api/v1/bank-reconciliation")
      .then((response) => response.json())
      .then((result) => result.sources && setBankSources(result.sources))
      .catch(() => {});
  }, []);
  const [filters, setFilters] = useState({
    transaction: "",
    invoice: "",
    registration: "",
    name: "",
    room: "",
    type: "All",
  });
  const [editing, setEditing] = useState<Payment | null>(null);
  const [error, setError] = useState("");
  const setCashVerification = async (payment: Payment, verified: boolean) => {
    setError("");
    const response = await fetch("/api/payments", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "verify-cash", id: payment.id, verified }),
    });
    const result = await response.json();
    if (!response.ok)
      return setError(result.error || "Unable to update cash verification");
    updated(result.payment);
  };
  const deletePayment = async (payment: Payment) => {
    if (
      !window.confirm(
        `Delete ${transactionIdFor(payment)}? This cannot be undone.`,
      )
    )
      return;
    setError("");
    const response = await fetch(`/api/payments?id=${payment.id}`, {
      method: "DELETE",
    });
    const result = await response.json();
    if (!response.ok)
      return setError(result.error || "Unable to delete payment");
    removed(payment.id);
    setBankSources((current) =>
      current.filter(
        (source) =>
          !(source.sourceType === "Payment" && source.recordId === payment.id),
      ),
    );
  };
  const [sort, setSort] = useState<{
    key:
      | "transaction"
      | "invoice"
      | "date"
      | "type"
      | "registration"
      | "name"
      | "room"
      | "month"
      | "amount"
      | "evidence";
    direction: "asc" | "desc";
  }>({ key: "transaction", direction: "desc" });
  const setFilter = (key: keyof typeof filters, value: string) =>
    setFilters((current) => ({ ...current, [key]: value }));
  const sortValue = (payment: Payment) =>
    ({
      transaction: transactionIdFor(payment),
      invoice: payment.invoiceNo,
      date: payment.paidDate,
      type: canonicalPaymentType(payment.type),
      registration: payment.registrationNo,
      name: payment.studentName,
      room: payment.roomNo,
      month: payment.month,
      amount: payment.paidAmount,
      evidence: payment.evidenceName,
    })[sort.key];
  const changeSort = (key: typeof sort.key) =>
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );
  const sortHead = (column: typeof sort.key, label: string) => (
    <button className="table-sort-head" onClick={() => changeSort(column)}>
      {label}
      <span>
        {sort.key === column ? (sort.direction === "asc" ? "▲" : "▼") : "↕"}
      </span>
    </button>
  );
  const rows = [...payments]
    .filter((payment) => payment.paidAmount > 0)
    .filter(
      (payment) =>
        transactionIdFor(payment)
          .toLowerCase()
          .includes(filters.transaction.toLowerCase()) &&
        (payment.invoiceNo || "")
          .toLowerCase()
          .includes(filters.invoice.toLowerCase()) &&
        payment.registrationNo
          .toLowerCase()
          .includes(filters.registration.toLowerCase()) &&
        payment.studentName
          .toLowerCase()
          .includes(filters.name.toLowerCase()) &&
        payment.roomNo.toLowerCase().includes(filters.room.toLowerCase()) &&
        (filters.type === "All" ||
          canonicalPaymentType(payment.type) === filters.type),
    )
    .sort((a, b) => {
      const left = sortValue(a);
      const right = sortValue(b);
      const result =
        typeof left === "number" && typeof right === "number"
          ? left - right
          : String(left).localeCompare(String(right), undefined, {
              numeric: true,
            });
      return (sort.direction === "asc" ? 1 : -1) * result;
    });
  const exportRows = [...payments]
    .filter((payment) => payment.paidAmount > 0)
    .filter((payment) => {
      const bank = bankSources.find(
        (source) =>
          source.sourceType === "Payment" && source.recordId === payment.id,
      );
      const type = canonicalPaymentType(payment.type);
      return (
        transactionIdFor(payment)
          .toLowerCase()
          .includes(exportFilters.transaction.toLowerCase()) &&
        (payment.invoiceNo || "")
          .toLowerCase()
          .includes(exportFilters.invoice.toLowerCase()) &&
        payment.registrationNo
          .toLowerCase()
          .includes(exportFilters.registration.toLowerCase()) &&
        payment.studentName
          .toLowerCase()
          .includes(exportFilters.name.toLowerCase()) &&
        payment.roomNo.toLowerCase().includes(exportFilters.room.toLowerCase()) &&
        (exportFilters.type === "All" || type === exportFilters.type) &&
        (!exportFilters.monthFrom ||
          (payment.month && payment.month >= exportFilters.monthFrom)) &&
        (!exportFilters.monthTo ||
          (payment.month && payment.month <= exportFilters.monthTo)) &&
        (!exportFilters.paidFrom || payment.paidDate >= exportFilters.paidFrom) &&
        (!exportFilters.paidTo || payment.paidDate <= exportFilters.paidTo) &&
        (exportFilters.verification === "All" ||
          (exportFilters.verification === "Verified"
            ? Boolean(bank?.bankTransactionId)
            : !bank?.bankTransactionId))
      );
    })
    .sort(
      (left, right) =>
        right.paidDate.localeCompare(left.paidDate) || right.id - left.id,
    );
  const exportSpreadsheet = async () => {
    const XLSX = await import("xlsx");
    const headers = [
      "TRANSACTION ID",
      "INVOICE NO.",
      "DATE",
      "TYPE",
      "REGISTRATION / SOURCE",
      "NAME",
      "HOSTEL ROOM / REFERENCE",
      "MONTH",
      "AMOUNT",
      "BANK/CASH VERIFICATION",
      "BANK TRANSACTION ID",
      "EVIDENCE",
    ];
    const data = exportRows.map((payment) => {
      const bank = bankSources.find(
        (source) =>
          source.sourceType === "Payment" && source.recordId === payment.id,
      );
      return {
        "TRANSACTION ID": transactionIdFor(payment),
        "INVOICE NO.": payment.invoiceNo || "",
        DATE: fmtCompactDate(payment.paidDate),
        TYPE: canonicalPaymentType(payment.type),
        "REGISTRATION / SOURCE": payment.registrationNo,
        NAME: payment.studentName,
        "ROOM / REFERENCE": payment.roomNo,
        MONTH:
          canonicalPaymentType(payment.type) === "Deposit"
            ? ""
            : fmtMonth(payment.month),
        AMOUNT: payment.paidAmount,
        "BANK/CASH VERIFICATION": (payment.settlementMethod || "Bank Transfer") === "Cash" ? (payment.cashVerified ? "Verified" : "Unverified") : (bank?.bankTransactionId ? "Verified" : "Unverified"),
        "BANK TRANSACTION ID": (payment.settlementMethod || "Bank Transfer") === "Cash" ? "N/A" : (bank?.bankTransactionId || ""),
        EVIDENCE: payment.evidenceName || "",
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });
    worksheet["!cols"] = [
      { wch: 20 },
      { wch: 20 },
      { wch: 14 },
      { wch: 20 },
      { wch: 24 },
      { wch: 30 },
      { wch: 20 },
      { wch: 16 },
      { wch: 16 },
      { wch: 20 },
      { wch: 22 },
      { wch: 30 },
    ];
    worksheet["!autofilter"] = { ref: `A1:L${Math.max(1, data.length + 1)}` };
    for (let row = 2; row <= data.length + 1; row += 1) {
      const amountCell = worksheet[`I${row}`];
      if (amountCell) amountCell.z = "LKR #,##0.00";
    }
    const workbook = XLSX.utils.book_new();
    workbook.Props = {
      Title: "The Perk Haven Payment Ledger",
      Subject: "Payment Ledger Export",
      Author: "The Perk Haven Hostel",
      CreatedDate: new Date(),
    };
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payment Ledger");
    XLSX.writeFile(
      workbook,
      `Perk-Haven-Payment-Ledger-${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };
  const exportPdf = async () => {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const columns = [
      { label: "TRANSACTION ID", width: 25 },
      { label: "INVOICE NO.", width: 25 },
      { label: "DATE", width: 18 },
      { label: "TYPE", width: 21 },
      { label: "REGISTRATION", width: 23 },
      { label: "NAME", width: 32 },
      { label: "HOSTEL ROOM / REF.", width: 19 },
      { label: "MONTH", width: 19 },
      { label: "AMOUNT", width: 20 },
      { label: "BANK STATUS", width: 18 },
      { label: "BANK TXN ID", width: 24 },
      { label: "EVIDENCE", width: 33 },
    ];
    const totalWidth = columns.reduce((sum, column) => sum + column.width, 0);
    const textWithin = (value: unknown, width: number) => {
      const text = String(value ?? "");
      const max = Math.max(3, Math.floor(width / 1.65));
      return text.length > max ? `${text.slice(0, max - 1)}…` : text;
    };
    const drawHeader = (pageNumber: number) => {
      pdf.setFillColor(15, 48, 78);
      pdf.rect(0, 0, pageWidth, 23, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.text("THE PERK HAVEN HOSTEL", margin, 9);
      pdf.setFontSize(10);
      pdf.text("PAYMENT LEDGER", margin, 16);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      pdf.text(
        `Generated ${fmtCompactDate(new Date().toISOString().slice(0, 10))}  |  ${exportRows.length} record(s)  |  Page ${pageNumber}`,
        pageWidth - margin,
        16,
        { align: "right" },
      );
      let x = margin;
      pdf.setFillColor(229, 237, 246);
      pdf.rect(margin, 27, totalWidth, 10, "F");
      pdf.setTextColor(15, 48, 78);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(6.3);
      columns.forEach((column) => {
        pdf.text(column.label, x + 1.2, 33);
        x += column.width;
      });
      return 37;
    };
    let pageNumber = 1;
    let y = drawHeader(pageNumber);
    pdf.setFontSize(6.5);
    exportRows.forEach((payment, index) => {
      if (y + 8 > pageHeight - 12) {
        pdf.addPage("a4", "landscape");
        pageNumber += 1;
        y = drawHeader(pageNumber);
      }
      const bank = bankSources.find(
        (source) => source.sourceType === "Payment" && source.recordId === payment.id,
      );
      const values = [
        transactionIdFor(payment),
        payment.invoiceNo || "—",
        fmtCompactDate(payment.paidDate),
        canonicalPaymentType(payment.type),
        payment.registrationNo,
        payment.studentName,
        payment.roomNo,
        canonicalPaymentType(payment.type) === "Deposit" ? "—" : fmtMonth(payment.month),
        payment.paidAmount.toLocaleString("en-LK", { minimumFractionDigits: 2 }),
        bank?.bankTransactionId ? "Verified" : "Unverified",
        bank?.bankTransactionId || "—",
        payment.evidenceName || "—",
      ];
      if (index % 2 === 1) {
        pdf.setFillColor(247, 249, 252);
        pdf.rect(margin, y, totalWidth, 8, "F");
      }
      pdf.setDrawColor(214, 224, 235);
      pdf.line(margin, y + 8, margin + totalWidth, y + 8);
      pdf.setTextColor(20, 39, 61);
      pdf.setFont("helvetica", "normal");
      let x = margin;
      values.forEach((value, columnIndex) => {
        const column = columns[columnIndex];
        const rightAligned = columnIndex === 8;
        pdf.text(
          textWithin(value, column.width),
          rightAligned ? x + column.width - 1.2 : x + 1.2,
          y + 5,
          rightAligned ? { align: "right" } : undefined,
        );
        x += column.width;
      });
      y += 8;
    });
    const total = exportRows.reduce((sum, payment) => sum + payment.paidAmount, 0);
    if (y + 12 > pageHeight - 10) {
      pdf.addPage("a4", "landscape");
      pageNumber += 1;
      y = drawHeader(pageNumber);
    }
    pdf.setFillColor(223, 239, 234);
    pdf.rect(margin, y + 2, totalWidth, 10, "F");
    pdf.setTextColor(9, 92, 70);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.text("TOTAL AMOUNT", margin + totalWidth - 54, y + 8);
    pdf.text(`LKR ${total.toLocaleString("en-LK", { minimumFractionDigits: 2 })}`, margin + totalWidth - 2, y + 8, { align: "right" });
    downloadBlob(
      pdf.output("blob"),
      `Perk-Haven-Payment-Ledger-${new Date().toISOString().slice(0, 10)}.pdf`,
    );
  };
  useEffect(() => {
    const exportLedger = () => setExportOpen(true);
    window.addEventListener("export-payment-ledger", exportLedger);
    return () =>
      window.removeEventListener("export-payment-ledger", exportLedger);
  }, []);
  return (
    <section className="panel payment-section">
      <div className="ledger-filters">
        <label>
          Transaction ID
          <input
            aria-label="Filter by transaction ID"
            value={filters.transaction}
            onChange={(e) => setFilter("transaction", e.target.value)}
          />
        </label>
        <label>
          Invoice No.
          <input
            aria-label="Filter by invoice number"
            value={filters.invoice}
            onChange={(e) => setFilter("invoice", e.target.value)}
          />
        </label>
        <label>
          Registration No.
          <input
            aria-label="Filter by registration number"
            value={filters.registration}
            onChange={(e) => setFilter("registration", e.target.value)}
          />
        </label>
        <label>
          Name
          <input
            aria-label="Filter by name"
            value={filters.name}
            onChange={(e) => setFilter("name", e.target.value)}
          />
        </label>
        <label>

          Hostel Room No.
          <input
            aria-label="Filter by hostel room number"
            value={filters.room}
            onChange={(e) => setFilter("room", e.target.value)}
          />
        </label>
        <label>
          Payment Type
          <select
            value={filters.type}
            onChange={(event) => setFilter("type", event.target.value)}
          >
            <option>All</option>
            <option value="Rent">Monthly Accommodation Fee</option>
            <option value="Deposit">Security Deposit</option>
          </select>
        </label>
        <button
          type="button"
          className="secondary ledger-filter-clear"
          onClick={() =>
            setFilters({
              transaction: "",
              invoice: "",
              registration: "",
              name: "",
              room: "",
              type: "All",
            })
          }
        >
          Clear filters
        </button>
      </div>
      <div className="tablewrap">
        <table className="ledger-table">
          <thead>
            <tr>
              <th>{sortHead("transaction", "TRANSACTION ID")}</th>
              <th>{sortHead("invoice", "INVOICE NO.")}</th>
              <th>{sortHead("date", "DATE")}</th>
              <th>{sortHead("type", "TYPE")}</th>
              <th>{sortHead("registration", "REGISTRATION / SOURCE")}</th>
              <th>{sortHead("name", "NAME")}</th>
              <th>{sortHead("room", "HOSTEL ROOM / REFERENCE")}</th>
              <th>{sortHead("month", "MONTH")}</th>
              <th>{sortHead("amount", "AMOUNT (LKR)")}</th>
              <th>TRANSACTION TYPE</th>
              <th>BANK/CASH VERIFICATION</th>
              <th>BANK TRANSACTION ID</th>
              <th>PAYMENT RECEIPT</th>
              <th>{sortHead("evidence", "EVIDENCE")}</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((payment) => {
              const settlementMethod = payment.settlementMethod || "Bank Transfer";
              const bank = bankSources.find(
                (source) =>
                  source.sourceType === "Payment" &&
                  source.recordId === payment.id,
              );
              const receiptAvailable = settlementMethod === "Cash"
                ? Boolean(payment.cashVerified)
                : Boolean(
                    bank?.bankTransactionId &&
                      bank.reconciledAmount + 0.01 >= payment.paidAmount,
                  );
              return (
                <tr key={`${transactionIdFor(payment)}-${payment.id}`}>
                  <td>
                    <b className="transaction-id">
                      {transactionIdFor(payment)}
                    </b>
                  </td>
                  <td>
                    {payment.invoiceNo ? (
                      <b className="transaction-id">{payment.invoiceNo}</b>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{fmtCompactDate(payment.paidDate)}</td>
                  <td>
                    <span
                      className={`payment-type ${canonicalPaymentType(payment.type).toLowerCase()}`}
                    >
                      {canonicalPaymentType(payment.type)}
                    </span>
                  </td>
                  <td>
                    <b>{payment.registrationNo}</b>
                  </td>
                  <td>
                    <button
                      className="student-name-link"
                      onClick={() => {
                        const student = students.find(
                          (item) =>
                            item.registrationNo === payment.registrationNo,
                        );
                        if (student) openStudent(student);
                      }}
                    >
                      {payment.studentName}
                    </button>
                  </td>
                  <td>
                    <mark>{payment.roomNo}</mark>
                  </td>
                  <td>
                    {canonicalPaymentType(payment.type) === "Deposit"
                      ? "—"
                      : fmtMonth(payment.month)}
                  </td>
                  <td>
                    <b>{amountOnly.format(payment.paidAmount)}</b>
                  </td>
                  <td>
                    <b>
                      {settlementMethod === "Bank Transfer"
                        ? "Bank"
                        : settlementMethod}
                    </b>
                  </td>
                  <td>
                    {settlementMethod === "Cash" ? (
                      <label className="cash-verification-control">
                        <select
                          aria-label={`Bank/Cash Verification for ${transactionIdFor(payment)}`}
                          value={payment.cashVerified ? "Verified" : "Unverified"}
                          onChange={(event) =>
                            void setCashVerification(
                              payment,
                              event.target.value === "Verified",
                            )
                          }
                        >
                          <option>Unverified</option>
                          <option>Verified</option>
                        </select>
                      </label>
                    ) : (
                      <span
                        className={`bank-status ${receiptAvailable ? "verified" : "unverified"}`}
                      >
                        {receiptAvailable ? "Verified" : "Unverified"}
                      </span>
                    )}
                  </td>
                  <td>
                    {settlementMethod === "Cash" ? (
                      "N/A"
                    ) : bank?.bankTransactionId ? (
                      <b className="transaction-id">{bank.bankTransactionId}</b>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    {receiptAvailable ? (
                      <div className="receipt-actions">
                        <button
                          type="button"
                          className="review-button"
                          onClick={() => setPreviewReceipt(payment)}
                        >
                          View PDF
                        </button>
                        <a
                          className="evidence-download-link"
                          href={`/api/payments/receipt?id=${payment.id}&download=1`}
                          download
                        >
                          Download PDF
                        </a>
                        {payment.receiptEmailStatus &&
                          !payment.receiptEmailStatus
                            .toLowerCase()
                            .includes("pending bank verification") && (
                            <small>{payment.receiptEmailStatus}</small>
                          )}
                      </div>
                    ) : (
                      <span className="receipt-pending">
                        Pending verification
                      </span>
                    )}
                  </td>
                  <td>
                    {payment.evidenceName ? (
                      <a
                        className="evidence-download-link"
                        href={`/api/payments/evidence?id=${payment.id}`}
                        download
                      >
                        ⇩ {payment.evidenceName}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <button
                        className="review-button"
                        onClick={() => setEditing(payment)}
                      >
                        Edit
                      </button>
                      <button
                        className="danger-button"
                        onClick={() => deletePayment(payment)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {previewReceipt && (
        <PdfDocumentPreviewModal
          title={`Payment Receipt — ${transactionIdFor(previewReceipt)}`}
          source={`/api/payments/receipt?id=${previewReceipt.id}`}
          downloadSource={`/api/payments/receipt?id=${previewReceipt.id}&download=1`}
          close={() => setPreviewReceipt(null)}
        />
      )}
      {error && <p className="form-error">⚠ {error}</p>}
      {editing && (
        <PaymentEditModal
          payment={editing}
          close={() => setEditing(null)}
          save={(payment) => {
            updated(payment);
            setEditing(null);
            setBankSources((current) =>
              current.filter(
                (source) =>
                  !(
                    source.sourceType === "Payment" &&
                    source.recordId === payment.id
                  ),
              ),
            );
          }}
        />
      )}
      {canExport && exportOpen && (
        <div className="backdrop">
          <div className="modal paymentmodal payment-export-modal">
            <ModalHead
              tag="PAYMENT LEDGER"
              title="Print / Export Payment Ledger"
              text="Choose the records to include. The same filters apply to the downloadable PDF and spreadsheet. Leave a field blank to include all values."
              close={() => setExportOpen(false)}
            />
            <section className="formgrid three payment-export-filters">
              <label>
                Transaction ID
                <input
                  value={exportFilters.transaction}
                  onChange={(event) =>
                    setExportFilters((current) => ({
                      ...current,
                      transaction: event.target.value,
                    }))
                  }
                  placeholder="All transactions"
                />
              </label>
              <label>
                Invoice No.
                <input
                  value={exportFilters.invoice}
                  onChange={(event) =>
                    setExportFilters((current) => ({
                      ...current,
                      invoice: event.target.value,
                    }))
                  }
                  placeholder="All invoices"
                />
              </label>
              <label>
                Registration No.
                <input
                  value={exportFilters.registration}
                  onChange={(event) =>
                    setExportFilters((current) => ({
                      ...current,
                      registration: event.target.value,
                    }))
                  }
                  placeholder="All registrations"
                />
              </label>
              <label>

                Resident / payer name
                <input
                  value={exportFilters.name}
                  onChange={(event) =>
                    setExportFilters((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="All names"
                />
              </label>
              <label>

                Hostel Room / reference
                <input
                  value={exportFilters.room}
                  onChange={(event) =>
                    setExportFilters((current) => ({
                      ...current,
                      room: event.target.value,
                    }))
                  }
                  placeholder="All hostel rooms"
                />
              </label>
              <label>
                Payment type
                <select
                  value={exportFilters.type}
                  onChange={(event) =>
                    setExportFilters((current) => ({
                      ...current,
                      type: event.target.value,
                    }))
                  }
                >
                  <option>All</option>
                  <option value="Rent">Monthly Accommodation Fee</option>
                  <option value="Deposit">Security Deposit</option>
                  <option value="Shop Rent">Shop Monthly Accommodation Fee</option>
                  <option>Shop Electricity</option>
                  <option>Shop Water</option>
                  <option>Other Income</option>
                </select>
              </label>
              <label>
                Payment month from
                <input
                  type="month"
                  value={exportFilters.monthFrom}
                  onChange={(event) =>
                    setExportFilters((current) => ({
                      ...current,
                      monthFrom: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Payment month to
                <input
                  type="month"
                  value={exportFilters.monthTo}
                  onChange={(event) =>
                    setExportFilters((current) => ({
                      ...current,
                      monthTo: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Payment date from
                <input
                  type="date"
                  value={exportFilters.paidFrom}
                  onChange={(event) =>
                    setExportFilters((current) => ({
                      ...current,
                      paidFrom: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Payment date to
                <input
                  type="date"
                  value={exportFilters.paidTo}
                  onChange={(event) =>
                    setExportFilters((current) => ({
                      ...current,
                      paidTo: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Bank verification
                <select
                  value={exportFilters.verification}
                  onChange={(event) =>
                    setExportFilters((current) => ({
                      ...current,
                      verification: event.target.value,
                    }))
                  }
                >
                  <option>All</option>
                  <option>Verified</option>
                  <option>Unverified</option>
                </select>
              </label>
            </section>
            <div className="payment-export-summary">
              <b>{exportRows.length}</b> payment record(s) will be exported.
            </div>
            <div className="modalactions">
              <button
                onClick={() =>
                  setExportFilters({
                    transaction: "",
                    invoice: "",
                    registration: "",
                    name: "",
                    room: "",
                    type: "All",
                    monthFrom: "",
                    monthTo: "",
                    paidFrom: "",
                    paidTo: "",
                    verification: "All",
                  })
                }
              >
                Clear filters
              </button>
              <button onClick={() => setExportOpen(false)}>Cancel</button>
              <button
                className="secondary"
                disabled={!exportRows.length}
                onClick={() => void exportPdf()}
              >
                Download PDF
              </button>
              <button
                className="primary"
                disabled={!exportRows.length}
                onClick={() => void exportSpreadsheet()}
              >
                Export Spreadsheet
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function PaymentEditModal({
  payment,
  close,
  save,
}: {
  payment: Payment;
  close: () => void;
  save: (payment: Payment) => void;
}) {
  const [amount, setAmount] = useState(payment.paidAmount),
    [date, setDate] = useState(payment.paidDate),
    [month, setMonth] = useState(payment.month),
    [name, setName] = useState(payment.studentName),
    [reference, setReference] = useState(payment.roomNo),
    [settlementMethod, setSettlementMethod] = useState<
      "Bank Transfer" | "Cash" | "Cash/Bank"
    >(payment.settlementMethod || "Bank Transfer"),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false);
  const deposit = canonicalPaymentType(payment.type) === "Deposit";
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/payments", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: payment.id,
          paidAmount: amount,
          paidDate: date,
          month,
          studentName: name,
          roomNo: reference,
          settlementMethod,
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Unable to update payment");
      save(result.payment);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to update payment",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="backdrop">
      <form className="modal paymentmodal" onSubmit={submit}>
        <ModalHead
          tag="ADMIN PAYMENT EDIT"
          title={`Edit ${transactionIdFor(payment)}`}
          text="Changing a verified record will remove its bank reconciliation so it can be matched again."
          close={close}
        />
        <section className="formgrid two">
          <label>
            Payment type
            <input value={canonicalPaymentType(payment.type)} disabled />
          </label>
          <label>
            Registration / source
            <input value={payment.registrationNo} disabled />
          </label>
          <label>
            Name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>
          <label>

            Hostel Room / reference
            <input
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              required
            />
          </label>
          {!deposit && (
            <label>
              Corresponding month
              <input
                type="month"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
                required
              />
            </label>
          )}
          <label>
            Paid amount (LKR)
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(Number(event.target.value))}
              required
            />
          </label>
          <label>
            Payment date
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </label>
          <label>
            Settlement method
            <select
              value={settlementMethod}
              onChange={(event) =>
                setSettlementMethod(
                  event.target.value as
                    | "Bank Transfer"
                    | "Cash"
                    | "Cash/Bank",
                )
              }
            >
              <option>Bank Transfer</option>
              <option>Cash</option>
              <option>Cash/Bank</option>
            </select>
          </label>
        </section>
        {error && <p className="form-error">⚠ {error}</p>}
        <div className="modalactions">
          <button type="button" onClick={close}>
            Cancel
          </button>
          <button className="primary" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

function OtherIncomeView({
  payments,
  added,
  updated,
  removed,
}: {
  payments: Payment[];
  added: (payment: Payment) => void;
  updated: (payment: Payment) => void;
  removed: (id: number) => void;
}) {
  type IncomeCategory = { id: number; name: string; active: boolean };
  const [tab, setTab] = useState<"categories" | "ledger" | "summary">("categories");
  const [categories, setCategories] = useState<IncomeCategory[]>([]);
  const [rows, setRows] = useState<Payment[]>(
    payments.filter((payment) => payment.type === "Other Income"),
  );
  const [editing, setEditing] = useState<Payment | null>(null);
  const [reviewing, setReviewing] = useState<Payment | null>(null);
  const [adding, setAdding] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [error, setError] = useState("");
  const [summaryFrom, setSummaryFrom] = useState("2026-01");
  const [summaryTo, setSummaryTo] = useState("2026-12");
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFilters, setExportFilters] = useState({ from: "", to: "", categories: [] as string[], types: [] as string[], statuses: [] as string[] });
  const summaryMonths = monthRange(summaryFrom, summaryTo).slice(0, 12);
  const approvedIncomeRows = rows.filter(
    (payment) => (payment.incomeApprovalStatus || "Pending") === "Approved",
  );
  const incomeForMonth = (category: string, month: string) =>
    approvedIncomeRows
      .filter(
        (payment) =>
          (payment.incomeCategory || "Other Income") === category &&
          (payment.month || payment.paidDate.slice(0, 7)) === month,
      )
      .reduce((sum, payment) => sum + payment.paidAmount, 0);
  const exportRows = rows.filter((payment) =>
    (!exportFilters.from || payment.paidDate >= exportFilters.from) &&
    (!exportFilters.to || payment.paidDate <= exportFilters.to) &&
    (!exportFilters.categories.length || exportFilters.categories.includes(payment.incomeCategory || "Other Income")) &&
    (!exportFilters.types.length || exportFilters.types.includes(payment.incomeAccountType || "PH Account")) &&
    (!exportFilters.statuses.length || exportFilters.statuses.includes(payment.incomeApprovalStatus || "Pending")),
  );
  const exportIncomeSpreadsheet = async () => {
    const XLSX = await import("xlsx");
    const headers = ["TRANSACTION ID", "CATEGORY", "DATE", "AMOUNT", "TYPE", "STATUS", "BANK TRANSACTION ID", "EVIDENCE"];
    const data = exportRows.map((payment) => [transactionIdFor(payment), payment.incomeCategory || "Other Income", fmtCompactDate(payment.paidDate), payment.paidAmount, payment.incomeAccountType || "PH Account", payment.incomeApprovalStatus || "Pending", payment.incomeAccountType === "PH Account" ? payment.bankTransactionId || "" : "N/A", payment.evidenceName || ""]);
    const sheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
    sheet["!cols"] = headers.map((header) => ({ wch: Math.max(14, Math.min(28, header.length + 4)) }));
    sheet["!autofilter"] = { ref: `A1:H${Math.max(1, data.length + 1)}` };
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Other Income Ledger");
    XLSX.writeFile(book, `Perk-Haven-Other-Income-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };
  const exportIncomePdf = async () => {
    const { jsPDF } = await import("jspdf");
    const headers = ["TRANSACTION ID", "CATEGORY", "DATE", "AMOUNT", "TYPE", "STATUS", "BANK ID", "EVIDENCE"];
    const data = exportRows.map((payment) => [transactionIdFor(payment), payment.incomeCategory || "Other Income", fmtCompactDate(payment.paidDate), amountOnly.format(payment.paidAmount), payment.incomeAccountType || "PH Account", payment.incomeApprovalStatus || "Pending", payment.incomeAccountType === "PH Account" ? payment.bankTransactionId || "—" : "N/A", payment.evidenceName || "—"]);
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth(), pageHeight = pdf.internal.pageSize.getHeight(), margin = 8, columnWidth = (pageWidth - margin * 2) / headers.length;
    const drawHeader = (page: number) => { pdf.setFillColor(15, 48, 78); pdf.rect(0, 0, pageWidth, 21, "F"); pdf.setTextColor(255, 255, 255); pdf.setFont("helvetica", "bold"); pdf.setFontSize(13); pdf.text("THE PERK HAVEN HOSTEL", margin, 8); pdf.setFontSize(9); pdf.text("OTHER INCOME LEDGER", margin, 15); pdf.setFontSize(7); pdf.text(`Page ${page}`, pageWidth - margin, 15, { align: "right" }); pdf.setFillColor(229, 237, 246); pdf.rect(margin, 25, pageWidth - margin * 2, 11, "F"); pdf.setTextColor(15, 48, 78); pdf.setFontSize(5.8); headers.forEach((header, index) => pdf.text(header, margin + columnWidth * index + columnWidth / 2, 31.5, { align: "center", maxWidth: columnWidth - 2 })); return 36; };
    let page = 1, y = drawHeader(page);
    data.forEach((row, rowIndex) => { if (y + 8 > pageHeight - 8) { pdf.addPage("a4", "landscape"); page += 1; y = drawHeader(page); } if (rowIndex % 2) { pdf.setFillColor(247, 249, 252); pdf.rect(margin, y, pageWidth - margin * 2, 8, "F"); } pdf.setTextColor(20, 39, 61); pdf.setFont("helvetica", "normal"); pdf.setFontSize(5.8); row.forEach((value, index) => pdf.text(String(value), margin + columnWidth * index + 1, y + 5, { maxWidth: columnWidth - 2 })); y += 8; });
    downloadBlob(pdf.output("blob"), "Perk-Haven-Other-Income-Ledger.pdf");
  };
  useEffect(() => {
    Promise.all([
      fetch("/api/other-income/categories").then((response) => response.json()),
      fetch("/api/other-income").then((response) => response.json()),
    ]).then(([categoryData, incomeData]) => {
      setCategories(categoryData.categories || []);
      setRows(incomeData.income || []);
    });
  }, []);
  const addCategory = async () => {
    setError("");
    const response = await fetch("/api/other-income/categories", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: categoryName }),
    });
    const result = await response.json();
    if (!response.ok) return setError(result.error || "Unable to add category");
    setCategories((current) => [...current, result.category].sort((a, b) => a.name.localeCompare(b.name)));
    setCategoryName("");
  };
  const toggleCategory = async (category: IncomeCategory) => {
    const response = await fetch("/api/other-income/categories", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: category.id, active: !category.active }),
    });
    const result = await response.json();
    if (!response.ok) return setError(result.error || "Unable to update category");
    setCategories((current) => current.map((item) => item.id === result.category.id ? result.category : item));
  };
  const deleteRow = async (payment: Payment) => {
    if (!window.confirm(`Delete ${transactionIdFor(payment)}?`)) return;
    const response = await fetch(`/api/payments?id=${payment.id}`, {
      method: "DELETE",
    });
    const result = await response.json();
    if (!response.ok)
      return setError(result.error || "Unable to delete other income");
    setRows((current) => current.filter((item) => item.id !== payment.id));
    removed(payment.id);
  };
  return (
    <div className="content">
      <div className="tab-action-row">
        <div className="payment-tabs other-income-tabs">
          <button className={tab === "ledger" ? "active" : ""} onClick={() => setTab("ledger")}>Other Income Ledger</button>
          <button className={tab === "summary" ? "active" : ""} onClick={() => setTab("summary")}>Other Income Summary</button>
          <button className={tab === "categories" ? "active" : ""} onClick={() => setTab("categories")}>Income Categories</button>
        </div>
        {tab === "categories" ? (
          <div className="income-category-add">
            <input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="New income category" />
            <button className="primary" onClick={addCategory}>+ Add category</button>
          </div>
        ) : tab === "ledger" ? (
          <div className="toolbar-actions"><button className="primary" onClick={() => setAdding(true)}>+ Add other income</button><button className="secondary" onClick={() => setExportOpen(true)}>⇩ Print / Export</button></div>
        ) : (
          <div className="expense-summary-period" aria-label="Other income summary period">
            <label className="month-control">From<input type="month" value={summaryFrom} max={summaryTo} onChange={(event) => { const value = event.target.value; setSummaryFrom(value); if (summaryTo < value || monthRange(value, summaryTo).length > 12) setSummaryTo(addMonths(value, 11)); }} /></label>
            <label className="month-control">To<input type="month" value={summaryTo} min={summaryFrom} max={addMonths(summaryFrom, 11)} onChange={(event) => setSummaryTo(event.target.value)} /></label>
          </div>
        )}
      </div>
      {tab === "categories" ? (
        <section className="panel tablewrap income-category-panel">
          <table>
            <thead>
              <tr>
                <th>CATEGORY</th><th>STATUS</th><th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td><b>{category.name}</b></td>
                  <td><span className={`status ${category.active ? "active" : "inactive"}`}>● {category.active ? "Active" : "Inactive"}</span></td>
                  <td><button className="review-button" onClick={() => toggleCategory(category)}>{category.active ? "Deactivate" : "Activate"}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : tab === "ledger" ? (
        <section className="panel tablewrap other-income-ledger-panel">
          <table className="other-income-ledger">
            <thead><tr>
              <th>TRANSACTION ID</th><th>CATEGORY</th><th>DATE</th><th>EVIDENCE</th><th>AMOUNT<small>(LKR)</small></th><th>TYPE</th><th>STATUS</th><th>BANK TRANSACTION ID</th><th>ADMIN ACTIONS</th>
            </tr></thead>
            <tbody>
              {rows.map((payment) => (
                <tr key={payment.id}>
                  <td><b className="transaction-id">{transactionIdFor(payment)}</b></td>
                  <td>{payment.incomeCategory || "Other Income"}</td>
                  <td>{fmtDate(payment.paidDate)}</td>
                  <td>{payment.evidenceName ? <a href={`/api/payments/evidence?id=${payment.id}`} download>{payment.evidenceName}</a> : "—"}</td>
                  <td className="amount-cell"><b>{amountOnly.format(payment.paidAmount)}</b></td>
                  <td>{payment.incomeAccountType || "PH Account"}</td>
                  <td><span className={`approval-status ${(payment.incomeApprovalStatus || "Pending").toLowerCase()}`}>{payment.incomeApprovalStatus || "Pending"}</span></td>
                  <td>{payment.incomeAccountType === "PH Account" ? payment.bankTransactionId || "Pending reconciliation" : "N/A"}</td>
                  <td><div className="admin-row-actions">
                    <button className="review-button" onClick={() => setReviewing(payment)}>Review</button>
                    <button className="review-button" onClick={() => setEditing(payment)}>Edit</button>
                    <button className="danger-button" onClick={() => deleteRow(payment)}>Delete</button>
                  </div></td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={9}>No Other Income transactions have been recorded.</td></tr>}
            </tbody>
          </table>
        </section>
      ) : (
        <section className="panel tablewrap summary-table-wrap other-income-summary-wrap">
          <table
            className="expense-summary-table other-income-summary-table"
            style={{
              width:
                summaryMonths.length === 12
                  ? "100%"
                  : `calc(${(summaryMonths.length / 12) * 100}% + ${350 * (1 - summaryMonths.length / 12)}px)`,
            }}
          >
            <colgroup>
              <col className="other-income-category" />
              {summaryMonths.map((month) => <col className="other-income-month" key={`width-${month}`} />)}
              <col className="other-income-total" />
            </colgroup>
            <thead><tr><th>CATEGORY</th>{summaryMonths.map((month) => <th key={month}>{fmtMonth(month).split(" ")[0]}<small>{month.slice(0, 4)}</small></th>)}<th>TOTAL</th></tr></thead>
            <tbody>
              {categories.map((category) => {
                const values = summaryMonths.map((month) => incomeForMonth(category.name, month));
                return <tr key={category.id}><td><b>{category.name}</b></td>{values.map((value, index) => <td className="amount-cell" key={summaryMonths[index]}>{amountOnly.format(value)}</td>)}<td className="amount-cell"><b>{amountOnly.format(values.reduce((sum, value) => sum + value, 0))}</b></td></tr>;
              })}
              <tr className="summary-total-row"><td>TOTAL OTHER INCOME</td>{summaryMonths.map((month) => <td className="amount-cell" key={month}><b>{amountOnly.format(approvedIncomeRows.filter((payment) => (payment.month || payment.paidDate.slice(0, 7)) === month).reduce((sum, payment) => sum + payment.paidAmount, 0))}</b></td>)}<td className="amount-cell"><b>{amountOnly.format(approvedIncomeRows.filter((payment) => summaryMonths.includes(payment.month || payment.paidDate.slice(0, 7))).reduce((sum, payment) => sum + payment.paidAmount, 0))}</b></td></tr>
            </tbody>
          </table>
        </section>
      )}
      {error && <p className="form-error">⚠ {error}</p>}
      {exportOpen && <div className="backdrop"><div className="modal paymentmodal payment-export-modal"><ModalHead tag="OTHER INCOME" title="Print / Export Other Income Ledger" text="Filter the ledger before downloading the PDF or spreadsheet." close={() => setExportOpen(false)} /><section className="formgrid three payment-export-filters"><label>Date from<input type="date" value={exportFilters.from} onChange={(event) => setExportFilters((current) => ({ ...current, from: event.target.value }))} /></label><label>Date to<input type="date" value={exportFilters.to} onChange={(event) => setExportFilters((current) => ({ ...current, to: event.target.value }))} /></label><label>Category<select multiple size={4} value={exportFilters.categories} onChange={(event) => setExportFilters((current) => ({ ...current, categories: Array.from(event.target.selectedOptions, (option) => option.value) }))}>{categories.map((category) => <option key={category.id}>{category.name}</option>)}</select></label><label>Type<select multiple size={3} value={exportFilters.types} onChange={(event) => setExportFilters((current) => ({ ...current, types: Array.from(event.target.selectedOptions, (option) => option.value) }))}>{["PH Account", "Other Account", "Cash"].map((value) => <option key={value}>{value}</option>)}</select></label><label>Status<select multiple size={2} value={exportFilters.statuses} onChange={(event) => setExportFilters((current) => ({ ...current, statuses: Array.from(event.target.selectedOptions, (option) => option.value) }))}>{["Approved", "Pending"].map((value) => <option key={value}>{value}</option>)}</select></label></section><div className="payment-export-summary"><b>{exportRows.length}</b> record(s) will be exported.</div><div className="modalactions"><button onClick={() => setExportFilters({ from: "", to: "", categories: [], types: [], statuses: [] })}>Clear filters</button><button onClick={() => setExportOpen(false)}>Cancel</button><button className="secondary" disabled={!exportRows.length} onClick={() => void exportIncomePdf()}>Download PDF</button><button className="primary" disabled={!exportRows.length} onClick={() => void exportIncomeSpreadsheet()}>Export Spreadsheet</button></div></div></div>}
      {(adding || editing) && <OtherIncomeEntryModal categories={categories.filter((item) => item.active)} existing={editing || undefined} close={() => { setAdding(false); setEditing(null); }} save={(payment) => { setRows((current) => editing ? current.map((item) => item.id === payment.id ? payment : item) : [payment, ...current]); if (editing) updated(payment); else added(payment); setAdding(false); setEditing(null); }} />}
      {reviewing && <OtherIncomeReview payment={reviewing} close={() => setReviewing(null)} save={(payment) => { setRows((current) => current.map((item) => item.id === payment.id ? { ...item, ...payment } : item)); updated(payment); setReviewing(null); }} />}
    </div>
  );
}

function OtherIncomeEntryModal({ categories, existing, close, save }: { categories: Array<{ id: number; name: string }>; existing?: Payment; close: () => void; save: (payment: Payment) => void }) {
  const [error, setError] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    let response: Response;
    if (existing) {
      response = await fetch("/api/other-income", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: existing.id, category: form.get("category"), paidDate: form.get("paidDate"), paidAmount: form.get("paidAmount"), accountType: form.get("accountType"), source: form.get("source"), reference: form.get("reference") }) });
    } else response = await fetch("/api/other-income", { method: "POST", body: form });
    const result = await response.json();
    if (!response.ok) return setError(result.error || "Unable to save income");
    save(result.payment);
  };
  return <div className="backdrop"><form className="modal paymentmodal" onSubmit={submit}>
    <ModalHead tag="OTHER INCOME" title={existing ? "Edit income entry" : "Add other income"} text="PH Account income is approved through bank reconciliation. Other Account and Cash income require manual approval." close={close} />
    <FormSection title="Income details">
      <label>Category<select name="category" defaultValue={existing?.incomeCategory || ""} required><option value="">Select category</option>{categories.map((item) => <option key={item.id}>{item.name}</option>)}</select></label>
      <Field name="paidDate" label="Date" type="date" defaultValue={existing?.paidDate} required />
      <Field name="paidAmount" label="Amount" type="number" min="0.01" step="0.01" defaultValue={existing?.paidAmount} required />
      <label>Type<select name="accountType" defaultValue={existing?.incomeAccountType || "PH Account"} required><option>PH Account</option><option>Other Account</option><option>Cash</option></select></label>
      <Field name="source" label="Source / payer" defaultValue={existing?.studentName} required />
      <Field name="reference" label="Reference" defaultValue={existing?.roomNo} />
      {!existing && <label className="wide evidence-upload">Evidence<input name="evidence" type="file" accept="image/*,.pdf" required /><span>↑ Upload income evidence</span></label>}
      {error && <p className="form-error wide">⚠ {error}</p>}
    </FormSection>
    <Actions close={close} text={existing ? "Save changes" : "Record income"} />
  </form></div>;
}

function OtherIncomeReview({ payment, close, save }: { payment: Payment; close: () => void; save: (payment: Payment) => void }) {
  const [error, setError] = useState("");
  const manual = payment.incomeAccountType !== "PH Account";
  const approve = async () => {
    const response = await fetch("/api/other-income", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: payment.id, action: "approve" }) });
    const result = await response.json();
    if (!response.ok) return setError(result.error || "Unable to approve income");
    save(result.payment);
  };
  return <div className="backdrop"><div className="modal paymentmodal">
    <ModalHead tag="OTHER INCOME" title={`Review ${transactionIdFor(payment)}`} text={manual ? "Management may approve this entry manually." : "This PH Account entry is approved only after bank reconciliation."} close={close} />
    <div className="detailgrid modal-detail-grid"><Detail title="INCOME DETAILS" rows={[["Category", payment.incomeCategory || "Other Income"], ["Date", fmtDate(payment.paidDate)], ["Amount", amountOnly.format(payment.paidAmount)], ["Type", payment.incomeAccountType || "PH Account"], ["Source", payment.studentName], ["Reference", payment.roomNo || "—"], ["Evidence", payment.evidenceName || "—"], ["Status", payment.incomeApprovalStatus || "Pending"]]} /></div>
    {error && <p className="form-error">⚠ {error}</p>}
    <div className="modalactions"><button onClick={close}>Close</button>{manual && payment.incomeApprovalStatus !== "Approved" && <button className="primary" onClick={approve}>Approve income</button>}</div>
  </div></div>;
}

function RoomPaymentMatrix({
  mode,
  students,
  payments,
  invoices,
  from,
  to,
  openStudent,
  filters,
}: {
  mode: "paid" | "payable";
  students: Student[];
  payments: Payment[];
  invoices: StudentInvoice[];
  from: string;
  to: string;
  openStudent: (student: Student) => void;
  filters: { registration: string; name: string; room: string };
}) {
  const months = monthRange(from, to).slice(0, 12);
  const visibleStudents = [...students].filter((student) =>
    student.registrationNo.toLowerCase().includes(filters.registration.toLowerCase()) &&
    `${student.firstName} ${student.lastName}`.toLowerCase().includes(filters.name.toLowerCase()) &&
    student.roomNo.toLowerCase().includes(filters.room.toLowerCase()),
  ).sort(
    (a, b) =>
      a.roomNo.localeCompare(b.roomNo, undefined, { numeric: true }) ||
      a.registrationNo.localeCompare(b.registrationNo),
  );
  const totalPaid = (month: string) =>
    visibleStudents.reduce(
      (sum, student) => sum + rentPaid(payments, student.registrationNo, month),
      0,
    );
  const invoicePayable = (registrationNo: string, month: string) =>
    invoices.find(
      (invoice) =>
        invoice.registrationNo === registrationNo &&
        invoice.invoiceType === "Rent" &&
        invoice.month === month &&
        invoice.status !== "Cancelled",
    )?.amount || 0;
  const totalPayable = (month: string) =>
    visibleStudents.reduce(
      (sum, student) => sum + invoicePayable(student.registrationNo, month),
      0,
    );
  return (
    <section className="panel payment-section">
      <div className="summary-table-wrap">
        <table
          className="summary-table room-payment-table"
          style={{
            width:
              months.length === 12
                ? "100%"
                : `calc(${(months.length / 12) * 100}% + ${560 * (1 - months.length / 12)}px)`,
          }}
        >
          <colgroup>
            <col className="analysis-room" />
            <col className="analysis-registration" />
            <col className="analysis-name" />
            {months.map((month) => (
              <col className="analysis-month" key={`width-${month}`} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th>HOSTEL ROOM</th>
              <th>REGISTRATION</th>
              <th>NAME</th>
              {months.map((month) => (
                <th key={month}>
                  {new Date(`${month}-02`).toLocaleDateString("en-LK", {
                    month: "short",
                  })}
                  <small>{month.slice(0, 4)}</small>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleStudents.map((student) => (
              <tr key={student.registrationNo}>
                <td>
                  <mark>{student.roomNo}</mark>
                </td>
                <td>
                  <b>{student.registrationNo}</b>
                </td>
                <td>
                  <button
                    className="student-name-link"
                    onClick={() => openStudent(student)}
                  >
                    {student.firstName} {student.lastName}
                  </button>
                  <small>{student.status}</small>
                </td>
                {months.map((month) => {
                  const paid = rentPaid(
                      payments,
                      student.registrationNo,
                      month,
                    ),
                    payable = invoicePayable(student.registrationNo, month);
                  const value = mode === "paid" ? paid : payable;
                  const status =
                    mode === "paid"
                      ? paid >= payable && payable > 0
                        ? "paid"
                        : paid > 0
                          ? "partial"
                          : "unpaid"
                      : payable > 0
                        ? "standard"
                        : "unpaid";
                  return (
                    <td
                      key={month}
                      className={`payment-cell ${status}`}
                      title={
                        mode === "paid"
                          ? `Paid ${amountOnly.format(paid)} of ${amountOnly.format(payable)}`
                          : payable > 0
                            ? `Invoice Ledger amount ${amountOnly.format(payable)}`
                            : "No accommodation fee invoice issued for this month"
                      }
                    >
                      <b>
                        {payable > 0 || mode === "paid"
                          ? shortCash(value)
                          : "Not invoiced"}
                      </b>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            {mode === "paid" ? (
              <>
                <tr>
                  <th colSpan={3}>TOTAL RECEIVED</th>
                  {months.map((month) => (
                    <td key={month}>{shortCash(totalPaid(month))}</td>
                  ))}
                </tr>
                <tr>
                  <th colSpan={3}>TOTAL PAYABLE</th>
                  {months.map((month) => (
                    <td key={month}>{shortCash(totalPayable(month))}</td>
                  ))}
                </tr>
                <tr className="outstanding-total">
                  <th colSpan={3}>TOTAL OUTSTANDING</th>
                  {months.map((month) => (
                    <td key={month}>
                      {shortCash(
                        Math.max(0, totalPayable(month) - totalPaid(month)),
                      )}
                    </td>
                  ))}
                </tr>
              </>
            ) : (
              <tr>
                <th colSpan={3}>TOTAL INVOICED</th>
                {months.map((month) => (
                  <td key={month}>{shortCash(totalPayable(month))}</td>
                ))}
              </tr>
            )}
          </tfoot>
        </table>
      </div>
    </section>
  );
}

function ShopPaymentMatrix({
  mode,
  tenants,
  payments,
  adjustments,
  utilityBills,
  from,
  to,
  adjustmentUpdated,
  adjustmentDeleted,
  filters,
}: {
  mode: "paid" | "payable";
  tenants: ShopTenant[];
  payments: Payment[];
  adjustments: MonthlyAdjustment[];
  utilityBills: ShopUtilityBill[];
  from: string;
  to: string;
  adjustmentUpdated: (adjustment: MonthlyAdjustment) => void;
  adjustmentDeleted: (id: number) => void;
  filters: { registration: string; name: string; shop: string };
}) {
  const [selectedAdjustment, setSelectedAdjustment] = useState<{
    tenant: ShopTenant;
    month: string;
  } | null>(null);
  const months = monthRange(from, to).slice(0, 12);
  const rows = [...tenants].filter((tenant) =>
    tenant.registrationNo.toLowerCase().includes(filters.registration.toLowerCase()) &&
    `${tenant.businessName} ${tenant.firstName} ${tenant.lastName}`.toLowerCase().includes(filters.name.toLowerCase()) &&
    tenant.shopNo.toLowerCase().includes(filters.shop.toLowerCase()),
  ).sort(
    (a, b) =>
      a.shopNo.localeCompare(b.shopNo, undefined, { numeric: true }) ||
      a.registrationNo.localeCompare(b.registrationNo),
  );
  const payableFor = (tenant: ShopTenant, month: string) =>
    shopRentPayable(tenant, month, adjustments) +
    shopUtilityAmount(utilityBills, "Electricity", month, tenant.shopNo) +
    shopUtilityAmount(utilityBills, "Water", month, tenant.shopNo);
  const totalPaid = (month: string) =>
    rows.reduce(
      (sum, tenant) => sum + shopPaymentPaid(payments, tenant, month),
      0,
    );
  const totalPayable = (month: string) =>
    rows.reduce((sum, tenant) => sum + payableFor(tenant, month), 0);
  return (
    <section className="panel payment-section">
      <div className="summary-table-wrap">
        <table
          className="summary-table room-payment-table shop-payment-table"
          style={{
            width:
              months.length === 12
                ? "100%"
                : `calc(${(months.length / 12) * 100}% + ${560 * (1 - months.length / 12)}px)`,
          }}
        >
          <colgroup>
            <col className="analysis-room" />
            <col className="analysis-registration" />
            <col className="analysis-name" />
            {months.map((month) => (
              <col className="analysis-month" key={`width-${month}`} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th>SHOP</th>
              <th>REGISTRATION</th>
              <th>TENANT / BUSINESS</th>
              {months.map((month) => (
                <th key={month}>
                  {new Date(`${month}-02`).toLocaleDateString("en-LK", {
                    month: "short",
                  })}
                  <small>{month.slice(0, 4)}</small>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((tenant) => (
              <tr key={tenant.registrationNo}>
                <td>
                  <mark>{tenant.shopNo}</mark>
                </td>
                <td>
                  <b>{tenant.registrationNo}</b>
                </td>
                <td>
                  <b>{tenant.businessName}</b>
                  <small>
                    {tenant.firstName} {tenant.lastName} · {tenant.status}
                  </small>
                </td>
                {months.map((month) => {
                  const paid = shopPaymentPaid(payments, tenant, month),
                    payable = payableFor(tenant, month),
                    value = mode === "paid" ? paid : payable,
                    adjustment = adjustmentTotal(
                      adjustments,
                      tenant.registrationNo,
                      month,
                    ),
                    electricity = shopUtilityAmount(
                      utilityBills,
                      "Electricity",
                      month,
                      tenant.shopNo,
                    ),
                    water = shopUtilityAmount(
                      utilityBills,
                      "Water",
                      month,
                      tenant.shopNo,
                    ),
                    missing = [
                      !utilityBills.some(
                        (bill) =>
                          bill.utilityType === "Electricity" &&
                          bill.month === month,
                      )
                        ? "Electricity"
                        : "",
                      !utilityBills.some(
                        (bill) =>
                          bill.utilityType === "Water" && bill.month === month,
                      )
                        ? "Water"
                        : "",
                    ].filter(Boolean);
                  const status =
                    mode === "paid"
                      ? paid >= payable && payable > 0
                        ? "paid"
                        : paid > 0
                          ? "partial"
                          : "unpaid"
                      : missing.length
                        ? "utilities-pending"
                        : adjustment !== 0
                          ? "adjusted"
                          : "standard";
                  const adjustmentLabel =
                    adjustment > 0
                      ? `−${shortCash(Math.abs(adjustment))}`
                      : `+${shortCash(Math.abs(adjustment))}`;
                  return (
                    <td
                      key={month}
                      className={`payment-cell ${status}`}
                      title={
                        mode === "paid"
                          ? `Paid ${amountOnly.format(paid)} of ${amountOnly.format(payable)}`
                          : `monthly accommodation fee ${amountOnly.format(shopRentPayable(tenant, month, adjustments))}; electricity ${amountOnly.format(electricity)}; water ${amountOnly.format(water)}`
                      }
                    >
                      {mode === "payable" && adjustment !== 0 ? (
                        <button
                          className="adjustment-cell-button"
                          onClick={() =>
                            setSelectedAdjustment({ tenant, month })
                          }
                        >
                          <b>{shortCash(value)}</b>
                          <small>Monthly Accommodation Fee adj. {adjustmentLabel}</small>
                          <em>View details</em>
                          {missing.length > 0 && (
                            <small className="utility-missing">
                              {missing.join(" & ")} pending
                            </small>
                          )}
                        </button>
                      ) : (
                        <>
                          <b>{shortCash(value)}</b>
                          {mode === "payable" && (
                            <small
                              className={
                                missing.length
                                  ? "utility-missing"
                                  : "utility-included"
                              }
                            >
                              {missing.length
                                ? `${missing.join(" & ")} pending`
                                : `Incl. E ${shortCash(electricity)} · W ${shortCash(water)}`}
                            </small>
                          )}
                        </>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={months.length + 3}>
                  No shop tenants have been registered.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            {mode === "paid" ? (
              <>
                <tr>
                  <th colSpan={3}>TOTAL RECEIVED</th>
                  {months.map((month) => (
                    <td key={month}>{shortCash(totalPaid(month))}</td>
                  ))}
                </tr>
                <tr>
                  <th colSpan={3}>TOTAL PAYABLE</th>
                  {months.map((month) => (
                    <td key={month}>{shortCash(totalPayable(month))}</td>
                  ))}
                </tr>
                <tr className="outstanding-total">
                  <th colSpan={3}>TOTAL OUTSTANDING</th>
                  {months.map((month) => (
                    <td key={month}>
                      {shortCash(
                        Math.max(0, totalPayable(month) - totalPaid(month)),
                      )}
                    </td>
                  ))}
                </tr>
              </>
            ) : (
              <>
                <tr>
                  <th colSpan={3}>TOTAL PAYABLE</th>
                  {months.map((month) => (
                    <td key={month}>{shortCash(totalPayable(month))}</td>
                  ))}
                </tr>
                <tr>
                  <th colSpan={3}>
                    NET ADJUSTMENTS (− REDUCTION / + INCREASE)
                  </th>
                  {months.map((month) => (
                    <td key={month}>
                      {shortCash(
                        rows.reduce(
                          (sum, tenant) =>
                            sum -
                            adjustmentTotal(
                              adjustments,
                              tenant.registrationNo,
                              month,
                            ),
                          0,
                        ),
                      )}
                    </td>
                  ))}
                </tr>
              </>
            )}
          </tfoot>
        </table>
      </div>
      {selectedAdjustment && (
        <ShopAdjustmentBreakdownModal
          tenant={selectedAdjustment.tenant}
          month={selectedAdjustment.month}
          adjustments={adjustments.filter(
            (item) =>
              item.registrationNo ===
                selectedAdjustment.tenant.registrationNo &&
              item.month === selectedAdjustment.month,
          )}
          close={() => setSelectedAdjustment(null)}
          save={adjustmentUpdated}
          remove={adjustmentDeleted}
        />
      )}
    </section>
  );
}

function ShopUtilitiesView({
  bills,
  invoices,
  added,
  updated,
  removed,
  invoicesUpdated,
}: {
  bills: ShopUtilityBill[];
  invoices: StudentInvoice[];
  added: (bill: ShopUtilityBill) => void;
  updated: (bill: ShopUtilityBill) => void;
  removed: (id: number) => void;
  invoicesUpdated: (rows: StudentInvoice[]) => void;
}) {
  const [utilityType, setUtilityType] = useState<"Electricity" | "Water">(
    "Electricity",
  );
  const [editing, setEditing] = useState<ShopUtilityBill | null | "new">(null);
  const [previewingInvoice, setPreviewingInvoice] =
    useState<StudentInvoice | null>(null);
  useEffect(() => {
    fetch("/api/invoices")
      .then((response) => response.json())
      .then((result) => result.invoices && invoicesUpdated(result.invoices))
      .catch(() => {});
  }, [bills.length]);
  const rows = bills
    .filter((bill) => bill.utilityType === utilityType)
    .sort((a, b) => b.month.localeCompare(a.month));
  const remove = async (bill: ShopUtilityBill) => {
    if (
      !window.confirm(
        `Delete the ${bill.utilityType.toLowerCase()} calculation for ${fmtMonth(bill.month)}?`,
      )
    )
      return;
    const response = await fetch("/api/shop-utilities", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: bill.id }),
    });
    const result = await response.json();
    if (!response.ok)
      return window.alert(result.error || "Unable to delete utility entry");
    removed(bill.id);
    const refreshed = await fetch("/api/invoices")
      .then((value) => value.json())
      .catch(() => null);
    if (refreshed?.invoices) invoicesUpdated(refreshed.invoices);
  };
  return (
    <section className="panel payment-section shop-utilities-panel">
      <div className="section-heading">
        <div>
          <p className="tag">SHOP UTILITIES</p>
          <h2>Electricity and water calculations</h2>
          <span>
            Enter the monthly bill and each shop’s units. The rate and shop
            amounts calculate automatically.
          </span>
        </div>
        <button className="primary" onClick={() => setEditing("new")}>
          ＋ Add {utilityType.toLowerCase()} bill
        </button>
      </div>
      <div className="utility-subtabs subtabs">
        <button
          className={utilityType === "Electricity" ? "active" : ""}
          onClick={() => setUtilityType("Electricity")}
        >
          Electricity
        </button>
        <button
          className={utilityType === "Water" ? "active" : ""}
          onClick={() => setUtilityType("Water")}
        >
          Water
        </button>
      </div>
      <div className="tablewrap">
        <table className="utility-table">
          <thead>
            <tr>
              <th>MONTH</th>
              <th>TOTAL AMOUNT<small>(LKR)</small></th>
              <th>TOTAL UNITS</th>
              <th>EVIDENCE</th>
              <th>RATE / UNIT<small>(LKR)</small></th>
              <th>SHOP 1 UNITS</th>
              <th>SHOP 1 AMOUNT</th>
              <th>SHOP 2 UNITS</th>
              <th>SHOP 2 AMOUNT</th>
              <th>SHOP 3 UNITS</th>
              <th>SHOP 3 AMOUNT</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((bill) => {
              const rate = shopUtilityRate(bill);
              const utilityInvoice = (shopNo: number) => invoices.find(
                (invoice) => invoice.sourceUtilityBillId === bill.id && Number(invoice.roomNo.match(/\d+/)?.[0] || 0) === shopNo,
              );
              return (
                <tr key={bill.id}>
                  <td>
                    <b>{fmtMonth(bill.month)}</b>
                  </td>
                  <td>{amountOnly.format(bill.totalAmount)}</td>
                  <td>{amountOnly.format(bill.totalUnits)}</td>
                  <td>{bill.evidenceName || "—"}</td>
                  <td>
                    <b>{amountOnly.format(rate)}</b>
                  </td>
                  <td>{amountOnly.format(bill.shop1Units)}</td>
                  <td><button type="button" className="invoice-amount-link" title={utilityInvoice(1) ? `Invoice reference: ${utilityInvoice(1)!.invoiceNo}` : "Invoice is being prepared"} disabled={!utilityInvoice(1)} onClick={() => { const invoice = utilityInvoice(1); if (invoice) setPreviewingInvoice(invoice); }}>{amountOnly.format(bill.shop1Units * rate)}</button></td>
                  <td>{amountOnly.format(bill.shop2Units)}</td>
                  <td><button type="button" className="invoice-amount-link" title={utilityInvoice(2) ? `Invoice reference: ${utilityInvoice(2)!.invoiceNo}` : "Invoice is being prepared"} disabled={!utilityInvoice(2)} onClick={() => { const invoice = utilityInvoice(2); if (invoice) setPreviewingInvoice(invoice); }}>{amountOnly.format(bill.shop2Units * rate)}</button></td>
                  <td>{amountOnly.format(bill.shop3Units)}</td>
                  <td><button type="button" className="invoice-amount-link" title={utilityInvoice(3) ? `Invoice reference: ${utilityInvoice(3)!.invoiceNo}` : "Invoice is being prepared"} disabled={!utilityInvoice(3)} onClick={() => { const invoice = utilityInvoice(3); if (invoice) setPreviewingInvoice(invoice); }}>{amountOnly.format(bill.shop3Units * rate)}</button></td>
                  <td>
                    <span className="register-actions">
                      <button
                        className="review-button"
                        onClick={() => setEditing(bill)}
                      >
                        Edit
                      </button>
                      <button
                        className="review-button danger"
                        onClick={() => remove(bill)}
                      >
                        Delete
                      </button>
                    </span>
                  </td>
                </tr>
              );
            })}
            {!rows.length && (
              <tr>
                <td colSpan={12} className="empty-table-row">
                  No {utilityType.toLowerCase()} bills have been entered.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {editing && (
        <ShopUtilityModal
          utilityType={utilityType}
          existing={editing === "new" ? undefined : editing}
          close={() => setEditing(null)}
          save={(bill, issuedInvoices) => {
            if (editing === "new") added(bill);
            else updated(bill);
            if (issuedInvoices.length) {
              const ids = new Set(issuedInvoices.map((invoice) => invoice.id));
              invoicesUpdated([...invoices.filter((invoice) => !ids.has(invoice.id)), ...issuedInvoices]);
            }
            setEditing(null);
          }}
        />
      )}
      {previewingInvoice && (
        <InvoicePreviewModal
          invoice={previewingInvoice}
          close={() => setPreviewingInvoice(null)}
        />
      )}
    </section>
  );
}

function ShopUtilityModal({
  utilityType,
  existing,
  close,
  save,
}: {
  utilityType: "Electricity" | "Water";
  existing?: ShopUtilityBill;
  close: () => void;
  save: (bill: ShopUtilityBill, invoices: StudentInvoice[]) => void;
}) {
  const [totalAmount, setTotalAmount] = useState(existing?.totalAmount || 0),
    [totalUnits, setTotalUnits] = useState(existing?.totalUnits || 0),
    [shop1, setShop1] = useState(existing?.shop1Units || 0),
    [shop2, setShop2] = useState(existing?.shop2Units || 0),
    [shop3, setShop3] = useState(existing?.shop3Units || 0),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false);
  const rate = totalUnits > 0 ? totalAmount / totalUnits : 0;
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    form.set("utilityType", utilityType);
    form.set("totalAmount", String(totalAmount));
    form.set("totalUnits", String(totalUnits));
    form.set("shop1Units", String(shop1));
    form.set("shop2Units", String(shop2));
    form.set("shop3Units", String(shop3));
    if (existing) form.set("id", String(existing.id));
    const response = await fetch("/api/shop-utilities", {
      method: existing ? "PATCH" : "POST",
      body: form,
    });
    const result = await response.json();
    setSaving(false);
    if (!response.ok)
      return setError(result.error || "Unable to save utility bill");
    save(result.bill, result.invoices || []);
  };
  return (
    <div className="backdrop">
      <form className="modal paymentmodal" onSubmit={submit}>
        <ModalHead
          tag="SHOP UTILITIES"
          title={`${existing ? "Edit" : "Add"} ${utilityType.toLowerCase()} bill`}
          text="The rate and each shop amount are calculated automatically."
          close={close}
        />
        <FormSection title="Monthly bill">
          <Field
            name="month"
            label="Month"
            type="month"
            defaultValue={existing?.month}
            required
          />
          <label>
            Total amount (LKR)
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={totalAmount || ""}
              onChange={(event) => setTotalAmount(Number(event.target.value))}
              required
            />
          </label>
          <label>
            Total units
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={totalUnits || ""}
              onChange={(event) => setTotalUnits(Number(event.target.value))}
              required
            />
          </label>
          <div className="calculated-field">
            <small>CALCULATED RATE</small>
            <b>{cash.format(rate)} / unit</b>
          </div>
          <label className="file">
            Evidence
            <input
              name="evidence"
              type="file"
              accept="image/*,.pdf"
              required={!existing}
            />
            <span>
              {existing?.evidenceName
                ? `Current: ${existing.evidenceName} · choose a file to replace`
                : "↑ Upload electricity/water bill"}
            </span>
          </label>
        </FormSection>
        <FormSection title="Shop unit allocation">
          <label>
            Shop 1 units
            <input
              type="number"
              min="0"
              step="0.01"
              value={shop1 || ""}
              onChange={(event) => setShop1(Number(event.target.value))}
            />
          </label>
          <div className="calculated-field">
            <small>SHOP 1 AMOUNT</small>
            <b>{cash.format(shop1 * rate)}</b>
          </div>
          <label>
            Shop 2 units
            <input
              type="number"
              min="0"
              step="0.01"
              value={shop2 || ""}
              onChange={(event) => setShop2(Number(event.target.value))}
            />
          </label>
          <div className="calculated-field">
            <small>SHOP 2 AMOUNT</small>
            <b>{cash.format(shop2 * rate)}</b>
          </div>
          <label>
            Shop 3 units
            <input
              type="number"
              min="0"
              step="0.01"
              value={shop3 || ""}
              onChange={(event) => setShop3(Number(event.target.value))}
            />
          </label>
          <div className="calculated-field">
            <small>SHOP 3 AMOUNT</small>
            <b>{cash.format(shop3 * rate)}</b>
          </div>
          {error && <p className="form-error wide">⚠ {error}</p>}
        </FormSection>
        <Actions
          close={close}
          text={saving ? "Saving…" : "Save utility calculation"}
          disabled={saving}
        />
      </form>
    </div>
  );
}

function DepositView({
  students,
  payments,
  adjustments,
  openStudent,
}: {
  students: Student[];
  payments: Payment[];
  adjustments: MonthlyAdjustment[];
  openStudent: (student: Student) => void;
}) {
  const [filters, setFilters] = useState({ registration: "", name: "", room: "" });
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFilters, setExportFilters] = useState({ registration: "", name: "", room: "", status: "All" });
  const today = new Date();
  const lastCompletedMonth = addMonths(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`,
    -1,
  );
  const rows = [...students].filter((student) =>
    student.registrationNo.toLowerCase().includes(filters.registration.toLowerCase()) &&
    `${student.firstName} ${student.lastName}`.toLowerCase().includes(filters.name.toLowerCase()) &&
    student.roomNo.toLowerCase().includes(filters.room.toLowerCase()),
  ).sort((a, b) =>
    a.roomNo.localeCompare(b.roomNo, undefined, { numeric: true }),
  );
  const depositExportRows = rows.map((student) => {
    const depositPaid = payments.filter((payment) => payment.registrationNo === student.registrationNo && canonicalPaymentType(payment.type) === "Deposit").reduce((sum, payment) => sum + payment.paidAmount, 0);
    const start = student.startDate.slice(0, 7) < "2026-01" ? "2026-01" : student.startDate.slice(0, 7);
    const rentOutstanding = monthRange(start, lastCompletedMonth).reduce((sum, month) => sum + Math.max(0, rentPayable(student, month, adjustments) - rentPaid(payments, student.registrationNo, month)), 0);
    const deductions = Math.min(depositPaid, rentOutstanding);
    return {
      room: student.roomNo,
      registration: student.registrationNo,
      name: `${student.firstName} ${student.lastName}`,
      payable: student.depositPayable,
      paid: depositPaid,
      outstanding: Math.max(0, student.depositPayable - depositPaid),
      status: student.status,
      rentOutstanding,
      deductions,
      liability: Math.max(0, depositPaid - deductions),
    };
  });
  const filteredDepositExportRows = depositExportRows.filter((row) => row.registration.toLowerCase().includes(exportFilters.registration.toLowerCase()) && row.name.toLowerCase().includes(exportFilters.name.toLowerCase()) && row.room.toLowerCase().includes(exportFilters.room.toLowerCase()) && (exportFilters.status === "All" || row.status === exportFilters.status));
  const exportDepositSpreadsheet = async () => {
    const XLSX = await import("xlsx");
    const data = filteredDepositExportRows.map((row) => ({ "ROOM": row.room, "STUDENT ID": row.registration, "NAME": row.name, "DEPOSIT PAYABLE": row.payable, "AMOUNT PAID": row.paid, "DEPOSIT OUTSTANDING": row.outstanding, "STATUS": row.status, "RENT OUTSTANDING": row.rentOutstanding, "DEPOSIT DEDUCTIONS": row.deductions, "CURRENT LIABILITY": row.liability }));
    const sheet = XLSX.utils.json_to_sheet(data);
    sheet["!cols"] = [{ wch: 10 }, { wch: 20 }, { wch: 30 }, ...Array(7).fill({ wch: 20 })];
    sheet["!autofilter"] = { ref: `A1:J${Math.max(1, data.length + 1)}` };
    const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book, sheet, "Security Deposit Payments");
    XLSX.writeFile(book, `Perk-Haven-security deposit-Payments-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };
  const exportDepositPdf = async () => {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth(), pageHeight = pdf.internal.pageSize.getHeight(), margin = 8;
    const headers = ["HOSTEL ROOM", "RESIDENT ID", "NAME", "PAYABLE", "PAID", "SECURITY DEPOSIT DUE", "STATUS", "MONTHLY ACCOMMODATION FEE DUE", "DEDUCTIONS", "LIABILITY"];
    const widths = [14, 24, 40, 27, 25, 28, 20, 27, 27, 27];
    const drawHeader = (page: number) => { pdf.setFillColor(15, 48, 78); pdf.rect(0, 0, pageWidth, 22, "F"); pdf.setTextColor(255,255,255); pdf.setFont("helvetica", "bold"); pdf.setFontSize(13); pdf.text("THE PERK HAVEN HOSTEL", margin, 9); pdf.setFontSize(9); pdf.text("SECURITY DEPOSIT PAYMENT REGISTER", margin, 16); pdf.setFontSize(7); pdf.text(`Page ${page}`, pageWidth - margin, 16, { align: "right" }); let x = margin; pdf.setFillColor(229,237,246); pdf.rect(margin, 26, widths.reduce((a,b)=>a+b,0), 10, "F"); pdf.setTextColor(15,48,78); pdf.setFontSize(6.2); headers.forEach((header,index)=>{pdf.text(header,x+widths[index]/2,32,{align:"center",maxWidth:widths[index]-2});x+=widths[index];}); return 36; };
    let page = 1, y = drawHeader(page);
    filteredDepositExportRows.forEach((row, rowIndex) => { if (y + 8 > pageHeight - 10) { pdf.addPage("a4", "landscape"); page += 1; y = drawHeader(page); } if (rowIndex % 2) { pdf.setFillColor(247,249,252); pdf.rect(margin,y,widths.reduce((a,b)=>a+b,0),8,"F"); } const values = [row.room,row.registration,row.name,row.payable,row.paid,row.outstanding,row.status,row.rentOutstanding,row.deductions,row.liability]; let x=margin; pdf.setTextColor(20,39,61); pdf.setFont("helvetica","normal"); pdf.setFontSize(6.2); values.forEach((value,index)=>{const numeric=index>=3&&index!==6; const text=numeric?`LKR ${Number(value).toLocaleString("en-LK")}`:String(value); pdf.text(text,numeric?x+widths[index]-1:x+1,y+5,numeric?{align:"right",maxWidth:widths[index]-2}:{maxWidth:widths[index]-2});x+=widths[index];}); y+=8; });
    downloadBlob(
      pdf.output("blob"),
      `Perk-Haven-security deposit-Payments-${new Date().toISOString().slice(0,10)}.pdf`,
    );
  };
  return (
    <section className="panel payment-section">
      <div className="section-toolbar end"><button className="secondary" onClick={() => setExportOpen(true)}>⇩ Print / Export</button></div>
      {exportOpen && (
        <div className="backdrop">
          <div className="modal compactmodal">
            <ModalHead tag="SECURITY DEPOSIT PAYMENTS" title="Print / Export Security Deposit Payments" text={`${filteredDepositExportRows.length} resident record(s) selected.`} close={() => setExportOpen(false)} />
            <section className="formgrid three payment-export-filters">
              <label>Resident ID<input value={exportFilters.registration} onChange={(e)=>setExportFilters(c=>({...c,registration:e.target.value}))}/></label>
              <label>Name<input value={exportFilters.name} onChange={(e)=>setExportFilters(c=>({...c,name:e.target.value}))}/></label>
              <label>Hostel Room No.<input value={exportFilters.room} onChange={(e)=>setExportFilters(c=>({...c,room:e.target.value}))}/></label>
              <label>Status<select value={exportFilters.status} onChange={(e)=>setExportFilters(c=>({...c,status:e.target.value}))}><option>All</option><option>Active</option><option>Inactive</option></select></label>
              <button className="secondary" onClick={()=>setExportFilters({registration:"",name:"",room:"",status:"All"})}>Clear filters</button>
            </section>
            <div className="modalactions">
              <button onClick={() => setExportOpen(false)}>Cancel</button>
              <button className="secondary" disabled={!filteredDepositExportRows.length} onClick={() => void exportDepositPdf()}>Download PDF</button>
              <button className="primary" disabled={!filteredDepositExportRows.length} onClick={() => void exportDepositSpreadsheet()}>Export Spreadsheet</button>
            </div>
          </div>
        </div>
      )}
      <div className="deposit-filter-bar">
        <input list="deposit-student-ids" value={filters.registration} onChange={(event) => setFilters((current) => ({ ...current, registration: event.target.value }))} placeholder="Resident ID" aria-label="Filter security deposits by resident ID" />
        <input list="deposit-student-names" value={filters.name} onChange={(event) => setFilters((current) => ({ ...current, name: event.target.value }))} placeholder="Resident name" aria-label="Filter security deposits by resident name" />
        <input list="deposit-room-nos" value={filters.room} onChange={(event) => setFilters((current) => ({ ...current, room: event.target.value }))} placeholder="Hostel Room no." aria-label="Filter security deposits by hostel room number" />
        <datalist id="deposit-student-ids">{students.map((student) => <option value={student.registrationNo} key={student.id} />)}</datalist>
        <datalist id="deposit-student-names">{students.map((student) => <option value={`${student.firstName} ${student.lastName}`.trim()} key={student.id} />)}</datalist>
        <datalist id="deposit-room-nos">{[...new Set(students.map((student) => student.roomNo).filter(Boolean))].map((room) => <option value={room} key={room} />)}</datalist>
        <button className="secondary" onClick={() => setFilters({ registration: "", name: "", room: "" })}>Clear filters</button>
      </div>
      <div className="tablewrap">
        <table className="deposit-table">
          <thead>
            <tr>
              <th>HOSTEL ROOM</th>
              <th>NAME</th>
              <th>SECURITY DEPOSIT PAYABLE<small>(LKR)</small></th>
              <th>AMOUNT PAID<small>(LKR)</small></th>
              <th>SECURITY DEPOSIT OUTSTANDING<small>(LKR)</small></th>
              <th>STATUS</th>
              <th>MONTHLY ACCOMMODATION FEE OUTSTANDING<small>(LKR)</small></th>
              <th>SECURITY DEPOSIT DEDUCTIONS<small>(LKR)</small></th>
              <th>CURRENT LIABILITY<small>(LKR)</small></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((student) => {
              const deposits = payments.filter(
                (payment) =>
                  payment.registrationNo === student.registrationNo &&
                  canonicalPaymentType(payment.type) === "Deposit",
              );
              const depositPayable = student.depositPayable;
              const depositPaid = deposits.reduce(
                (sum, payment) => sum + payment.paidAmount,
                0,
              );
              const start =
                student.startDate.slice(0, 7) < "2026-01"
                  ? "2026-01"
                  : student.startDate.slice(0, 7);
              const dueMonths = monthRange(start, lastCompletedMonth);
              const rentOutstanding = dueMonths.reduce(
                (sum, month) =>
                  sum +
                  Math.max(
                    0,
                    rentPayable(student, month, adjustments) -
                      rentPaid(payments, student.registrationNo, month),
                  ),
                0,
              );
              const deductions = Math.min(depositPaid, rentOutstanding),
                liability = Math.max(0, depositPaid - deductions);
              return (
                <tr key={student.registrationNo}>
                  <td>
                    <mark>{student.roomNo}</mark>
                  </td>
                  <td>
                    <button
                      className="student-name-link"
                      onClick={() => openStudent(student)}
                    >
                      {student.firstName} {student.lastName}
                    </button>
                    <small>{student.registrationNo}</small>
                  </td>
                  <td>{amountOnly.format(depositPayable)}</td>
                  <td>
                    <b>{amountOnly.format(depositPaid)}</b>
                  </td>
                  <td
                    className={depositPayable > depositPaid ? "red" : "green"}
                  >
                    {amountOnly.format(Math.max(0, depositPayable - depositPaid))}
                  </td>
                  <td>
                    <span className={`status ${studentStatusTone(student)}`}>
                      ● {student.status}
                    </span>
                  </td>
                  <td className="red">{amountOnly.format(rentOutstanding)}</td>
                  <td>{amountOnly.format(deductions)}</td>
                  <td>
                    <b className="liability">{amountOnly.format(liability)}</b>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AdjustmentModal({
  students,
  close,
  save,
}: {
  students: Student[];
  close: () => void;
  save: (adjustment: MonthlyAdjustment) => void;
}) {
  const [error, setError] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/adjustments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form)),
    });
    const result = await response.json();
    if (!response.ok)
      return setError(result.error || "Unable to save adjustment");
    save(result.adjustment);
  };
  return (
    <div className="backdrop">
      <form className="modal paymentmodal" onSubmit={submit}>
        <ModalHead
          tag="MONTHLY ACCOMMODATION FEE"
          title="Add payable adjustment"
          text="Increase or reduce the standard monthly monthly accommodation fee."
          close={close}
        />
        <FormSection title="Adjustment details">
          <label>

            Resident
            <select name="registrationNo" required>
              <option value="">Select resident</option>
              {students.map((student) => (
                <option key={student.id} value={student.registrationNo}>
                  {student.registrationNo} · {student.firstName}{" "}
                  {student.lastName}
                </option>
              ))}
            </select>
          </label>
          <Field name="month" label="Month" type="month" required />
          <label>
            Adjustment type
            <select name="type">
              <option>Late Start Adjustment</option>
              <option>Early Vacate Adjustment</option>
              <option>Vacation Discount</option>
              <option>Other Adjustment</option>
            </select>
          </label>
          <label>
            Effect on payable
            <select name="effect">
              <option value="Reduce">Reduce payable (−)</option>
              <option value="Increase">Increase payable (+)</option>
            </select>
          </label>
          <Field
            name="amount"
            label="Adjustment amount (LKR)"
            type="number"
            min="0.01"
            step="0.01"
            required
          />
          <Field name="note" label="Note" type="text" />
          {error && <p className="form-error">{error}</p>}
        </FormSection>
        <Actions close={close} text="Save adjustment" />
      </form>
    </div>
  );
}

function ShopAdjustmentModal({
  tenants,
  close,
  save,
}: {
  tenants: ShopTenant[];
  close: () => void;
  save: (adjustment: MonthlyAdjustment) => void;
}) {
  const [error, setError] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/adjustments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(
        Object.fromEntries(new FormData(event.currentTarget)),
      ),
    });
    const result = await response.json();
    if (!response.ok)
      return setError(result.error || "Unable to save adjustment");
    save(result.adjustment);
  };
  return (
    <div className="backdrop">
      <form className="modal paymentmodal" onSubmit={submit}>
        <ModalHead
          tag="SHOP MONTHLY ACCOMMODATION FEE"
          title="Add payable adjustment"
          text="Increase or reduce a shop tenant’s monthly accommodation fee payable."
          close={close}
        />
        <FormSection title="Adjustment details">
          <label>
            Shop tenant
            <select name="registrationNo" required>
              <option value="">Select shop tenant</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.registrationNo}>
                  {tenant.shopNo} · {tenant.registrationNo} ·{" "}
                  {tenant.businessName}
                </option>
              ))}
            </select>
          </label>
          <Field name="month" label="Month" type="month" required />
          <label>
            Adjustment type
            <select name="type">
              <option>Late Start Adjustment</option>
              <option>Early Vacate Adjustment</option>
              <option>Vacation Discount</option>
              <option>Other Adjustment</option>
            </select>
          </label>
          <label>
            Effect on payable
            <select name="effect">
              <option value="Reduce">Reduce payable (−)</option>
              <option value="Increase">Increase payable (+)</option>
            </select>
          </label>
          <Field
            name="amount"
            label="Adjustment amount (LKR)"
            type="number"
            min="0.01"
            step="0.01"
            required
          />
          <Field name="note" label="Note" type="text" />
          {error && <p className="form-error">⚠ {error}</p>}
        </FormSection>
        <Actions close={close} text="Save adjustment" />
      </form>
    </div>
  );
}

function AdjustmentBreakdownModal({
  student,
  month,
  adjustments,
  close,
  save,
  remove,
}: {
  student: Student;
  month: string;
  adjustments: MonthlyAdjustment[];
  close: () => void;
  save: (adjustment: MonthlyAdjustment) => void;
  remove: (id: number) => void;
}) {
  const [editing, setEditing] = useState<MonthlyAdjustment | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const deleteAdjustment = async (item: MonthlyAdjustment) => {
    if (!window.confirm(`Delete this ${item.type.toLowerCase()} entry?`))
      return;
    setError("");
    const response = await fetch("/api/adjustments", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: item.id }),
    });
    const result = await response.json();
    if (!response.ok)
      return setError(result.error || "Unable to delete adjustment");
    remove(item.id);
    if (editing?.id === item.id) setEditing(null);
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;
    setError("");
    setSaving(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/adjustments", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: editing.id,
          type: form.get("type"),
          effect: form.get("effect"),
          amount: Number(form.get("amount")),
          note: form.get("note"),
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Unable to update adjustment");
      save(result.adjustment);
      setEditing(null);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to update adjustment",
      );
    } finally {
      setSaving(false);
    }
  };
  const total = adjustments.reduce((sum, item) => sum + item.amount, 0);
  return (
    <div className="backdrop">
      <div className="modal paymentmodal adjustment-breakdown">
        <ModalHead
          tag="MONTHLY ACCOMMODATION FEE"
          title={`Adjustment breakdown · ${fmtMonth(month)}`}
          text={`${student.registrationNo} · ${student.firstName} ${student.lastName} · hostel room ${student.roomNo}`}
          close={close}
        />
        <section className="adjustment-summary">
          <span>
            <small>STANDARD MONTHLY ACCOMMODATION FEE</small>
            <b>{cash.format(student.monthlyRent)}</b>
          </span>
          <span>
            <small>NET ADJUSTMENT</small>
            <b>
              {total > 0 ? "−" : total < 0 ? "+" : ""}{" "}
              {cash.format(Math.abs(total))}
            </b>
          </span>
          <span>
            <small>AMOUNT PAYABLE</small>
            <b>{cash.format(Math.max(0, student.monthlyRent - total))}</b>
          </span>
        </section>
        <section className="adjustment-list">
          <h3>Adjustment entries</h3>
          {adjustments.map((item) => (
            <article key={item.id}>
              <div>
                <b>{item.type}</b>
                <span>{item.note || "No note entered"}</span>
              </div>
              <strong>
                {item.amount > 0 ? "−" : "+"}{" "}
                {cash.format(Math.abs(item.amount))}
              </strong>
              <span className="adjustment-entry-actions">
                <button
                  className="review-button"
                  onClick={() => {
                    setEditing(item);
                    setError("");
                  }}
                >
                  Edit
                </button>
                <button
                  className="review-button danger"
                  onClick={() => deleteAdjustment(item)}
                >
                  Delete
                </button>
              </span>
            </article>
          ))}
        </section>
        {editing && (
          <form className="adjustment-edit-form" onSubmit={submit}>
            <h3>Edit adjustment</h3>
            <label>
              Adjustment type
              <select name="type" defaultValue={editing.type}>
                <option>Late Start Adjustment</option>
                <option>Early Vacate Adjustment</option>
                <option>Vacation Discount</option>
                <option>Other Adjustment</option>
              </select>
            </label>
            <label>
              Effect on payable
              <select
                name="effect"
                defaultValue={editing.amount < 0 ? "Increase" : "Reduce"}
              >
                <option value="Reduce">Reduce payable (−)</option>
                <option value="Increase">Increase payable (+)</option>
              </select>
            </label>
            <label>
              Adjustment amount (LKR)
              <input
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                required
                defaultValue={Math.abs(editing.amount)}
              />
            </label>
            <label>
              Note
              <input name="note" defaultValue={editing.note} />
            </label>
            {error && <p className="form-error wide">⚠ {error}</p>}
            <div className="inline-actions wide">
              <button
                type="button"
                className="secondary"
                onClick={() => setEditing(null)}
              >
                Cancel edit
              </button>
              <button className="primary" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        )}
        <footer className="modalactions">
          <button className="secondary" onClick={close}>
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}

function ShopAdjustmentBreakdownModal({
  tenant,
  month,
  adjustments,
  close,
  save,
  remove,
}: {
  tenant: ShopTenant;
  month: string;
  adjustments: MonthlyAdjustment[];
  close: () => void;
  save: (adjustment: MonthlyAdjustment) => void;
  remove: (id: number) => void;
}) {
  const [editing, setEditing] = useState<MonthlyAdjustment | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/adjustments", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: editing.id,
          type: form.get("type"),
          effect: form.get("effect"),
          amount: Number(form.get("amount")),
          note: form.get("note"),
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Unable to update adjustment");
      save(result.adjustment);
      setEditing(null);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to update adjustment",
      );
    } finally {
      setSaving(false);
    }
  };
  const deleteAdjustment = async (item: MonthlyAdjustment) => {
    if (!window.confirm(`Delete this ${item.type.toLowerCase()} entry?`))
      return;
    const response = await fetch("/api/adjustments", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: item.id }),
    });
    const result = await response.json();
    if (!response.ok)
      return setError(result.error || "Unable to delete adjustment");
    remove(item.id);
    if (editing?.id === item.id) setEditing(null);
  };
  const total = adjustments.reduce((sum, item) => sum + item.amount, 0);
  return (
    <div className="backdrop">
      <div className="modal paymentmodal adjustment-breakdown">
        <ModalHead
          tag="SHOP MONTHLY ACCOMMODATION FEE"
          title={`Adjustment breakdown · ${fmtMonth(month)}`}
          text={`${tenant.registrationNo} · ${tenant.businessName} · ${tenant.shopNo}`}
          close={close}
        />
        <section className="adjustment-summary">
          <span>
            <small>STANDARD MONTHLY ACCOMMODATION FEE</small>
            <b>{cash.format(tenant.monthlyRent)}</b>
          </span>
          <span>
            <small>NET ADJUSTMENT</small>
            <b>
              {total > 0 ? "−" : total < 0 ? "+" : ""}{" "}
              {cash.format(Math.abs(total))}
            </b>
          </span>
          <span>
            <small>AMOUNT PAYABLE</small>
            <b>{cash.format(Math.max(0, tenant.monthlyRent - total))}</b>
          </span>
        </section>
        <section className="adjustment-list">
          <h3>Adjustment entries</h3>
          {adjustments.map((item) => (
            <article key={item.id}>
              <div>
                <b>{item.type}</b>
                <span>{item.note || "No note entered"}</span>
              </div>
              <strong>
                {item.amount > 0 ? "−" : "+"}{" "}
                {cash.format(Math.abs(item.amount))}
              </strong>
              <span className="adjustment-entry-actions">
                <button
                  className="review-button"
                  onClick={() => {
                    setEditing(item);
                    setError("");
                  }}
                >
                  Edit
                </button>
                <button
                  className="review-button danger"
                  onClick={() => deleteAdjustment(item)}
                >
                  Delete
                </button>
              </span>
            </article>
          ))}
        </section>
        {editing && (
          <form className="adjustment-edit-form" onSubmit={submit}>
            <h3>Edit adjustment</h3>
            <label>
              Adjustment type
              <select name="type" defaultValue={editing.type}>
                <option>Late Start Adjustment</option>
                <option>Early Vacate Adjustment</option>
                <option>Vacation Discount</option>
                <option>Other Adjustment</option>
              </select>
            </label>
            <label>
              Effect on payable
              <select
                name="effect"
                defaultValue={editing.amount < 0 ? "Increase" : "Reduce"}
              >
                <option value="Reduce">Reduce payable (−)</option>
                <option value="Increase">Increase payable (+)</option>
              </select>
            </label>
            <label>
              Adjustment amount (LKR)
              <input
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                required
                defaultValue={Math.abs(editing.amount)}
              />
            </label>
            <label>
              Note
              <input name="note" defaultValue={editing.note} />
            </label>
            {error && <p className="form-error wide">⚠ {error}</p>}
            <div className="inline-actions wide">
              <button
                type="button"
                className="secondary"
                onClick={() => setEditing(null)}
              >
                Cancel edit
              </button>
              <button className="primary" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        )}
        {error && !editing && <p className="form-error">⚠ {error}</p>}
        <footer className="modalactions">
          <button className="secondary" onClick={close}>
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}

function RoomView({
  canManage,
  students,
  rooms,
  shops,
  tenants,
  openStudent,
  saveRoom,
  roomAdded,
  roomRemoved,
  shopUpdated,
  shopAdded,
  shopRemoved,
}: {
  canManage: boolean;
  students: Student[];
  rooms: Room[];
  shops: Shop[];
  tenants: ShopTenant[];
  openStudent: (student: Student) => void;
  saveRoom: (room: Room) => void;
  roomAdded: (room: Room) => void;
  roomRemoved: (roomNo: string) => void;
  shopUpdated: (shop: Shop) => void;
  shopAdded: (shop: Shop) => void;
  shopRemoved: (shopNo: string) => void;
}) {
  const [section, setSection] = useState<"rooms" | "shops">("rooms");
  const [view, setView] = useState<"cards" | "table">("table");
  const [adding, setAdding] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const createProperty = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (creating) return;
    setCreating(true);
    setError("");
    try {
      const propertySection = section;
      const form = new FormData(event.currentTarget);
      const identifier = String(form.get(propertySection === "rooms" ? "roomNo" : "shopNo") ?? "").trim();
      const path = propertySection === "rooms" ? "/api/v1/rooms" : "/api/v1/shops";
      const body = propertySection === "rooms"
        ? { roomNo: identifier, type: form.get("type"), beds: Number(form.get("beds")), price: Number(form.get("price")), active: true }
        : { shopNo: identifier, standardRent: Number(form.get("standardRent")), active: true };
      const response = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 409 && identifier) {
          const existingResponse = await fetch(`${path}/${encodeURIComponent(identifier)}`);
          if (existingResponse.ok) {
            const existing = await existingResponse.json();
            if (propertySection === "rooms") roomAdded(existing as Room); else shopAdded(existing as Shop);
            setAdding(false);
            return;
          }
        }
        setError(result.detail || "Unable to create this property");
        return;
      }
      if (propertySection === "rooms") roomAdded(result as Room); else shopAdded(result as Shop);
      setAdding(false);
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setCreating(false);
    }
  };
  const deleteRoom = async (room: Room) => {
    if (!window.confirm(`Delete hostel room ${room.roomNo}?`)) return;
    const response = await fetch(`/api/v1/rooms/${encodeURIComponent(room.roomNo)}`, { method: "DELETE" });
    if (!response.ok) return window.alert("Unable to delete this hostel room. Remove assigned residents first.");
    roomRemoved(room.roomNo);
  };
  const deleteShop = async (shop: Shop) => {
    if (!window.confirm(`Delete ${shop.shopNo}?`)) return;
    const response = await fetch(`/api/v1/shops/${encodeURIComponent(shop.shopNo)}`, { method: "DELETE" });
    if (!response.ok) return window.alert("Unable to delete this shop. Remove assigned tenants first.");
    shopRemoved(shop.shopNo);
  };
  return (
    <div className="content">
      <Title
        tag="OCCUPANCY"
        title="Hostel Room and shop occupancy"
        text="Monitor occupied and vacant hostel rooms and commercial shops."
      />
      <div className="payment-tabs-row occupancy-actions-row">
        <div className="payment-tabs" role="tablist" aria-label="Hostel Room and shop views">
          <button className={section === "rooms" ? "active" : ""} onClick={() => setSection("rooms")}>Hostel Rooms</button>
          <button className={section === "shops" ? "active" : ""} onClick={() => setSection("shops")}>Shops</button>
        </div>
        {canManage && (
          <div className="register-actions">
          <button className="primary" onClick={() => { setAdding(true); setError(""); }}>
            ＋ Add {section === "rooms" ? "room" : "shop"}
          </button>
          </div>
        )}
      </div>
      {adding && (
        <form className="panel category-add" onSubmit={createProperty}>
          {section === "rooms" ? (
            <>
              <Field name="roomNo" label="Hostel Room number" required />
              <Field name="type" label="Hostel Room type" required />
              <Field name="beds" label="Number of beds" type="number" min="1" required />
              <Field name="price" label="Price per bed (LKR)" type="number" min="0" required />
            </>
          ) : (
            <>
              <Field name="shopNo" label="Shop number" required />
              <Field name="standardRent" label="Standard monthly accommodation fee (LKR)" type="number" min="0" required />
            </>
          )}
          <button className="primary" disabled={creating}>{creating ? "Saving…" : "Save"}</button>
          <button type="button" className="secondary" disabled={creating} onClick={() => setAdding(false)}>Cancel</button>
          {error && <p className="form-error">⚠ {error}</p>}
        </form>
      )}
      {section === "rooms" && (
        <>
          <div className="room-viewbar" aria-label="Hostel Room view">
            <button
              className={view === "table" ? "active" : ""}
              onClick={() => setView("table")}
            >
              ▤ Bed table
            </button>
            <button
              className={view === "cards" ? "active" : ""}
              onClick={() => setView("cards")}
            >

              ▦ Hostel Room cards
            </button>
          </div>
          {view === "cards" ? (
            <div className="roomgrid">
              {rooms.map((room) => (
                <RoomCard
                  key={room.roomNo}
                  room={room}
                  occupants={students.filter(
                    (student) => student.roomNo === room.roomNo,
                  )}
                  openStudent={openStudent}
                  saveRoom={saveRoom}
                  onDelete={canManage ? deleteRoom : undefined}
                />
              ))}
            </div>
          ) : (
            <RoomBedTable
              rooms={rooms}
              students={students}
              openStudent={openStudent}
              saveRoom={saveRoom}
            />
          )}
        </>
      )}
      {section === "shops" && (
        <ShopOccupancy shops={shops} tenants={tenants} update={shopUpdated} onDelete={canManage ? deleteShop : undefined} />
      )}
    </div>
  );
}

function ShopRegister({
  tenants,
  shops,
  registering,
  update,
  remove,
}: {
  tenants: ShopTenant[];
  shops: Shop[];
  registering: () => void;
  update: (tenant: ShopTenant) => void;
  remove: (id: number) => void;
}) {
  const [filter, setFilter] = useState<"All" | "Active" | "Inactive">("All");
  const [shopFilters, setShopFilters] = useState({ registration: "", name: "", shop: "", contact: "" });
  const [emergencyTenant, setEmergencyTenant] = useState<ShopTenant | null>(
    null,
  );
  const [editingTenant, setEditingTenant] = useState<ShopTenant | null>(null);
  const visible = tenants.filter((tenant) =>
    (filter === "All" || tenant.status === filter) &&
    tenant.registrationNo.toLowerCase().includes(shopFilters.registration.toLowerCase()) &&
    `${tenant.businessName} ${tenant.firstName} ${tenant.lastName}`.toLowerCase().includes(shopFilters.name.toLowerCase()) &&
    tenant.shopNo.toLowerCase().includes(shopFilters.shop.toLowerCase()) &&
    `${tenant.mobile} ${tenant.whatsapp} ${tenant.email}`.toLowerCase().includes(shopFilters.contact.toLowerCase()));
  const changeStatus = async (tenant: ShopTenant) => {
    const nextStatus = tenant.status === "Active" ? "Inactive" : "Active";
    const updated = { ...tenant, status: nextStatus, endDate: nextStatus === "Inactive" ? tenant.endDate || new Date().toISOString().slice(0, 10) : "" } as ShopTenant;
    const response = await fetch(`/api/v1/shop-tenants/${encodeURIComponent(tenant.registrationNo)}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(tenantRequest(updated)),
    });
    const result = await response.json();
    if (response.ok) update(tenantFromApi(result));
  };
  const deleteTenant = async (tenant: ShopTenant) => {
    if (
      !window.confirm(
        `Delete ${tenant.registrationNo} · ${tenant.businessName}?`,
      )
    )
      return;
    const response = await fetch(`/api/v1/shop-tenants/${encodeURIComponent(tenant.registrationNo)}`, { method: "DELETE" });
    if (!response.ok)
      return window.alert("Unable to delete shop tenant");
    remove(tenant.id);
  };
  return (
    <section>
      <div className="student-register-toolbar"><div className="student-register-filters shop-register-filters">
        <input value={shopFilters.registration} onChange={(e)=>setShopFilters(c=>({...c,registration:e.target.value}))} placeholder="Shop registration" />
        <input value={shopFilters.name} onChange={(e)=>setShopFilters(c=>({...c,name:e.target.value}))} placeholder="Tenant / business" />
        <input value={shopFilters.shop} onChange={(e)=>setShopFilters(c=>({...c,shop:e.target.value}))} placeholder="Shop no." />
        <input value={shopFilters.contact} onChange={(e)=>setShopFilters(c=>({...c,contact:e.target.value}))} placeholder="Contact / email" />
        <select value={filter} onChange={(e)=>setFilter(e.target.value as "All"|"Active"|"Inactive")}><option>All</option><option>Active</option><option>Inactive</option></select>
        <button className="secondary" onClick={()=>{setShopFilters({registration:"",name:"",shop:"",contact:""});setFilter("All");}}>Clear filters</button>
      </div></div>
      <div className="panel tablewrap">
        <table>
          <thead>
            <tr>
              <th>REGISTRATION NO.</th>
              <th>SHOP</th>
              <th>BUSINESS / TENANT</th>
              <th>CONTACT</th>
              <th>EMERGENCY CONTACT</th>
              <th>MONTHLY ACCOMMODATION FEE<small>(LKR)</small></th>
              <th>ACCOMMODATION START DATE</th>
              <th>END DATE</th>
              <th>STATUS</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((tenant) => (
              <tr key={tenant.id}>
                <td>
                  <b className="transaction-id">{tenant.registrationNo}</b>
                </td>
                <td>
                  <b>{tenant.shopNo}</b>
                </td>
                <td>
                  <b>{tenant.businessName}</b>
                  <small>
                    {tenant.firstName} {tenant.lastName}
                  </small>
                </td>
                <td>
                  {tenant.mobile}
                  <small>{tenant.email || tenant.whatsapp}</small>
                </td>
                <td>
                  {tenant.emergency1Name ? (
                    <>
                      <b>{tenant.emergency1Name}</b>
                      <small>
                        {tenant.emergency1Contact} ·{" "}
                        {tenant.emergency1Relationship ||
                          "Relationship not entered"}
                      </small>
                    </>
                  ) : (
                    <span className="muted-cell">Not entered</span>
                  )}
                  <button
                    className="emergency-edit-link"
                    onClick={() => setEmergencyTenant(tenant)}
                  >
                    {tenant.emergency1Name ? "Edit contacts" : "Add contacts"}
                  </button>
                </td>
                <td>
                  <b>{amountOnly.format(tenant.monthlyRent)}</b>
                </td>
                <td>{fmtDate(tenant.startDate)}</td>
                <td>{fmtDate(tenant.endDate)}</td>
                <td>
                  <span className={`status ${tenant.status.toLowerCase()}`}>
                    ● {tenant.status}
                  </span>
                </td>
                <td>
                  <span className="register-actions">
                    <button
                      className="review-button"
                      onClick={() => setEditingTenant(tenant)}
                    >
                      Edit
                    </button>
                    <button
                      className="review-button"
                      onClick={() => changeStatus(tenant)}
                    >
                      {tenant.status === "Active"
                        ? "End tenancy"
                        : "Reactivate"}
                    </button>
                    <button
                      className="review-button danger"
                      onClick={() => deleteTenant(tenant)}
                    >
                      Delete
                    </button>
                  </span>
                </td>
              </tr>
            ))}
            {!visible.length && (
              <tr>
                <td colSpan={10}>No shop tenants match this view.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {emergencyTenant && (
        <ShopEmergencyModal
          tenant={emergencyTenant}
          close={() => setEmergencyTenant(null)}
          save={(tenant) => {
            update(tenant);
            setEmergencyTenant(null);
          }}
        />
      )}
      {editingTenant && (
        <ShopTenantEditModal
          tenant={editingTenant}
          shops={shops}
          close={() => setEditingTenant(null)}
          save={(tenant) => {
            update(tenant);
            setEditingTenant(null);
          }}
        />
      )}
    </section>
  );
}

function ShopOccupancy({
  shops,
  tenants,
  update,
  onDelete,
}: {
  shops: Shop[];
  tenants: ShopTenant[];
  update: (shop: Shop) => void;
  onDelete?: (shop: Shop) => void;
}) {
  return (
    <section>
      <div className="expense-section-head">
        <div>
          <p className="tag">SHOP OCCUPANCY</p>
          <h2>Shop 1, Shop 2 and Shop 3</h2>
          <p>
            View current tenants, vacancies and editable standard monthly rents.
            Tenant registration is managed under Registers.
          </p>
        </div>
      </div>
      <div className="shop-grid">
        {shops.map((shop) => (
          <ShopCard
            key={shop.id}
            shop={shop}
            tenant={tenants.find(
              (tenant) =>
                tenant.shopNo === shop.shopNo && tenant.status === "Active",
            )}
            update={update}
            onDelete={onDelete}
          />
        ))}
      </div>
    </section>
  );
}

function ShopCard({
  shop,
  tenant,
  update,
  onDelete,
}: {
  shop: Shop;
  tenant?: ShopTenant;
  update: (shop: Shop) => void;
  onDelete?: (shop: Shop) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [rent, setRent] = useState(String(shop.standardRent));
  const save = async () => {
    const response = await fetch(`/api/v1/shops/${encodeURIComponent(shop.shopNo)}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ shopNo: shop.shopNo, standardRent: Number(rent), active: shop.active }),
    });
    const result = await response.json();
    if (response.ok) {
      update(result);
      setEditing(false);
    }
  };
  return (
    <article className={`shop-card panel ${tenant ? "occupied" : "vacant"}`}>
      <div className="roomtop">
        <div>
          <small>COMMERCIAL SPACE</small>
          <b>{shop.shopNo}</b>
        </div>
        <span>{tenant ? "Occupied" : "Vacant"}</span>
      </div>
      {tenant ? (
        <div className="shop-tenant">
          <b>{tenant.businessName}</b>
          <span>
            {tenant.firstName} {tenant.lastName}
          </span>
          <small>
            {tenant.registrationNo} · {tenant.mobile}
          </small>
        </div>
      ) : (
        <div className="shop-tenant">
          <b>Available</b>
          <span>No active tenant assigned</span>
        </div>
      )}
      <div className="roommeta">
        <span>
          <small>STANDARD MONTHLY ACCOMMODATION FEE</small>
          {editing ? (
            <span className="price-editor">
              <input
                type="number"
                min="0"
                value={rent}
                onChange={(event) => setRent(event.target.value)}
              />
              <button onClick={save}>Save</button>
              <button onClick={() => setEditing(false)}>Cancel</button>
            </span>
          ) : (
            <span>
              <b>
                {shop.standardRent ? cash.format(shop.standardRent) : "Not set"}
              </b>
              <button onClick={() => setEditing(true)}>Edit monthly accommodation fee</button>
            </span>
          )}
        </span>
      </div>
      {onDelete && !tenant && <button className="review-button danger" onClick={() => onDelete(shop)}>Delete shop</button>}
    </article>
  );
}

function ShopTenantModal({
  shops,
  close,
  save,
}: {
  shops: Shop[];
  close: () => void;
  save: (tenant: ShopTenant) => void;
}) {
  const [error, setError] = useState("");
  const [selected, setSelected] = useState("");
  const [rent, setRent] = useState("");
  const [deposit, setDeposit] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) || "");
    try {
      const response = await fetch("/api/v1/shop-tenants", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          registrationNo: value("registrationNo"), shopNo: value("shopNo"), businessName: value("businessName"),
          firstName: value("firstName"), lastName: value("lastName"), idNo: value("idNo"), mobile: value("mobile"),
          whatsapp: value("whatsapp"), email: value("email"), address: value("address"),
          registeredDate: value("registeredDate"), startDate: value("startDate"), endDate: null,
          monthlyRent: Number(rent),
          depositPayable: Number(deposit),
          status: "ACTIVE",
          emergencyContacts: [
            { name: value("emergency1Name"), phone: value("emergency1Contact"), relationship: value("emergency1Relationship"), address: value("emergency1Address") },
            { name: value("emergency2Name"), phone: value("emergency2Contact"), relationship: value("emergency2Relationship"), address: value("emergency2Address") },
          ].filter((contact) => contact.name),
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.detail || "Unable to register tenant");
      save(tenantFromApi(result));
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to register tenant",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="backdrop">
      <form className="modal" onSubmit={submit}>
        <ModalHead
          tag="SHOP DATABASE"
          title="Register shop tenant"
          text="The registration number is generated automatically after saving."
          close={close}
        />
        <FormSection title="Shop and business details">
          <Field name="registrationNo" label="Registration number" required />
          <label>
            Shop
            <select
              name="shopNo"
              value={selected}
              required
              onChange={(event) => {
                const shop = shops.find(
                  (item) => item.shopNo === event.target.value,
                );
                setSelected(event.target.value);
                setRent(shop?.standardRent ? String(shop.standardRent) : "");
                setDeposit(
                  shop?.standardRent ? String(shop.standardRent * 3) : "",
                );
              }}
            >
              <option value="">Select shop</option>
              {shops.map((shop) => (
                <option key={shop.id}>{shop.shopNo}</option>
              ))}
            </select>
          </label>
          <Field name="businessName" label="Business / trading name" required />
          <Field name="idNo" label="Business registration / ID no." required />
          <Field name="firstName" label="Tenant first name" required />
          <Field name="lastName" label="Tenant last name" required />
          <Field name="mobile" label="Mobile no." required />
          <Field name="whatsapp" label="WhatsApp no." />
          <Field name="email" label="Email address" type="email" required />
          <Field name="address" label="Address" required />
          <Field
            name="registeredDate"
            label="Registration date"
            type="date"
            required
          />
          <Field
            name="startDate"
            label="Agreement accommodation start date"
            type="date"
            required
          />
          <label>

            Monthly accommodation fee (LKR)
            <input
              type="number"
              min="0"
              required
              value={rent}
              onChange={(event) => {
                setRent(event.target.value);
                setDeposit(String(Number(event.target.value || 0) * 3));
              }}
            />
          </label>
          <label>

            Security Deposit payable (LKR)
            <input
              type="number"
              min="0"
              required
              value={deposit}
              onChange={(event) => setDeposit(event.target.value)}
            />
          </label>
        </FormSection>
        <FormSection title="Emergency Contact 1">
          <Field name="emergency1Name" label="Contact 1 · name" required />
          <Field name="emergency1Contact" label="Contact 1 · phone" required />
          <Field name="emergency1Relationship" label="Relationship" required />
          <Field
            name="emergency1Address"
            label="Contact 1 · address"
            wide
            required
          />
        </FormSection>
        <FormSection title="Emergency Contact 2">
          <Field name="emergency2Name" label="Contact 2 · name" />
          <Field name="emergency2Contact" label="Contact 2 · phone" />
          <Field name="emergency2Relationship" label="Relationship" />
          <Field name="emergency2Address" label="Contact 2 · address" wide />
          {error && <p className="form-error wide">⚠ {error}</p>}
        </FormSection>
        <Actions
          close={close}
          text={saving ? "Registering…" : "Register tenant"}
          disabled={saving}
        />
      </form>
    </div>
  );
}

function ShopTenantEditModal({
  tenant,
  shops,
  close,
  save,
}: {
  tenant: ShopTenant;
  shops: Shop[];
  close: () => void;
  save: (tenant: ShopTenant) => void;
}) {
  const [error, setError] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) || "");
    const updated = {
      ...tenant,
      shopNo: value("shopNo"), businessName: value("businessName"), firstName: value("firstName"), lastName: value("lastName"),
      idNo: value("idNo"), mobile: value("mobile"), whatsapp: value("whatsapp"), email: value("email"), address: value("address"),
      registeredDate: value("registeredDate"), startDate: value("startDate"), endDate: value("endDate"),
      monthlyRent: Number(value("monthlyRent")), depositPayable: Number(value("depositPayable")), status: value("status") as ShopTenant["status"],
      emergency1Name: value("emergency1Name"), emergency1Contact: value("emergency1Contact"), emergency1Relationship: value("emergency1Relationship"), emergency1Address: value("emergency1Address"),
      emergency2Name: value("emergency2Name"), emergency2Contact: value("emergency2Contact"), emergency2Relationship: value("emergency2Relationship"), emergency2Address: value("emergency2Address"),
    };
    const response = await fetch(`/api/v1/shop-tenants/${encodeURIComponent(tenant.registrationNo)}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(tenantRequest(updated)),
    });
    const result = await response.json();
    if (!response.ok)
      return setError(result.detail || "Unable to update shop tenant");
    save(tenantFromApi(result));
  };
  return (
    <div className="backdrop">
      <form className="modal" onSubmit={submit}>
        <ModalHead
          tag="SHOP DATABASE"
          title="Edit shop tenant"
          text={`${tenant.registrationNo} · ${tenant.businessName}`}
          close={close}
        />
        <FormSection title="Shop and business details">
          <label>
            Shop
            <select name="shopNo" defaultValue={tenant.shopNo} required>
              {shops.map((shop) => (
                <option key={shop.id}>{shop.shopNo}</option>
              ))}
            </select>
          </label>
          <Field
            name="businessName"
            label="Business / trading name"
            defaultValue={tenant.businessName}
            required
          />
          <Field
            name="idNo"
            label="Business registration / ID no."
            defaultValue={tenant.idNo}
          />
          <Field
            name="firstName"
            label="Tenant first name"
            defaultValue={tenant.firstName}
            required
          />
          <Field
            name="lastName"
            label="Tenant last name"
            defaultValue={tenant.lastName}
            required
          />
          <Field
            name="mobile"
            label="Mobile no."
            defaultValue={tenant.mobile}
            required
          />
          <Field
            name="whatsapp"
            label="WhatsApp no."
            defaultValue={tenant.whatsapp}
          />
          <Field
            name="email"
            label="Email address"
            type="email"
            defaultValue={tenant.email}
          />
          <Field name="address" label="Address" defaultValue={tenant.address} />
          <Field
            name="registeredDate"
            label="Registration date"
            type="date"
            defaultValue={tenant.registeredDate}
            required
          />
          <Field
            name="startDate"
            label="Agreement accommodation start date"
            type="date"
            defaultValue={tenant.startDate}
            required
          />
          <Field
            name="endDate"
            label="End date"
            type="date"
            defaultValue={tenant.endDate}
          />
          <Field
            name="monthlyRent"
            label="Monthly accommodation fee (LKR)"
            type="number"
            min="0"
            defaultValue={tenant.monthlyRent}
            required
          />
          <Field
            name="depositPayable"
            label="Security Deposit payable (LKR)"
            type="number"
            min="0"
            defaultValue={tenant.depositPayable}
            required
          />
          <label>
            Status
            <select name="status" defaultValue={tenant.status}>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </label>
        </FormSection>
        <FormSection title="Emergency contacts">
          <Field
            name="emergency1Name"
            label="Contact 1 · name"
            defaultValue={tenant.emergency1Name}
            required
          />
          <Field
            name="emergency1Contact"
            label="Contact 1 · phone"
            defaultValue={tenant.emergency1Contact}
            required
          />
          <Field
            name="emergency1Relationship"
            label="Relationship"
            defaultValue={tenant.emergency1Relationship}
          />
          <Field
            name="emergency1Address"
            label="Contact 1 · address"
            defaultValue={tenant.emergency1Address}
            wide
          />
          <Field
            name="emergency2Name"
            label="Contact 2 · name"
            defaultValue={tenant.emergency2Name}
            startRow
          />
          <Field
            name="emergency2Contact"
            label="Contact 2 · phone"
            defaultValue={tenant.emergency2Contact}
          />
          <Field
            name="emergency2Relationship"
            label="Relationship"
            defaultValue={tenant.emergency2Relationship}
          />
          <Field
            name="emergency2Address"
            label="Contact 2 · address"
            defaultValue={tenant.emergency2Address}
            wide
          />
          {error && <p className="form-error wide">⚠ {error}</p>}
        </FormSection>
        <Actions close={close} text="Save shop tenant" />
      </form>
    </div>
  );
}

function ShopEmergencyModal({
  tenant,
  close,
  save,
}: {
  tenant: ShopTenant;
  close: () => void;
  save: (tenant: ShopTenant) => void;
}) {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const value = (name: string) => String(form.get(name) || "");
      const updated = {
        ...tenant,
        emergency1Name: value("emergency1Name"), emergency1Contact: value("emergency1Contact"),
        emergency1Relationship: value("emergency1Relationship"), emergency1Address: value("emergency1Address"),
        emergency2Name: value("emergency2Name"), emergency2Contact: value("emergency2Contact"),
        emergency2Relationship: value("emergency2Relationship"), emergency2Address: value("emergency2Address"),
      };
      const response = await fetch(`/api/v1/shop-tenants/${encodeURIComponent(tenant.registrationNo)}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(tenantRequest(updated)),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.detail || "Unable to save emergency contacts");
      save(tenantFromApi(result));
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to save emergency contacts",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="backdrop">
      <form className="modal" onSubmit={submit}>
        <ModalHead
          tag="SHOP DATABASE"
          title="Emergency contact details"
          text={`${tenant.registrationNo} · ${tenant.businessName} · ${tenant.shopNo}`}
          close={close}
        />
        <FormSection title="Emergency Contact 1">
          <Field
            name="emergency1Name"
            label="Contact 1 · name"
            defaultValue={tenant.emergency1Name}
            required
          />
          <Field
            name="emergency1Contact"
            label="Contact 1 · phone"
            defaultValue={tenant.emergency1Contact}
            required
          />
          <Field
            name="emergency1Relationship"
            label="Relationship"
            defaultValue={tenant.emergency1Relationship}
            required
          />
          <Field
            name="emergency1Address"
            label="Contact 1 · address"
            defaultValue={tenant.emergency1Address}
            wide
            required
          />
        </FormSection>
        <FormSection title="Emergency Contact 2">
          <Field
            name="emergency2Name"
            label="Contact 2 · name"
            defaultValue={tenant.emergency2Name}
          />
          <Field
            name="emergency2Contact"
            label="Contact 2 · phone"
            defaultValue={tenant.emergency2Contact}
          />
          <Field
            name="emergency2Relationship"
            label="Relationship"
            defaultValue={tenant.emergency2Relationship}
          />
          <Field
            name="emergency2Address"
            label="Contact 2 · address"
            defaultValue={tenant.emergency2Address}
            wide
          />
          {error && <p className="form-error wide">⚠ {error}</p>}
        </FormSection>
        <Actions
          close={close}
          text={saving ? "Saving…" : "Save emergency contacts"}
          disabled={saving}
        />
      </form>
    </div>
  );
}

function RoomBedTable({
  rooms,
  students,
  openStudent,
  saveRoom,
}: {
  rooms: Room[];
  students: Student[];
  openStudent: (student: Student) => void;
  saveRoom: (room: Room) => void;
}) {
  const [editingRoom, setEditingRoom] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const savePrice = async (room: Room) => {
    const nextPrice = Number(price);
    if (!Number.isFinite(nextPrice) || nextPrice < 0) return;
    const response = await fetch(`/api/v1/rooms/${encodeURIComponent(room.roomNo)}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...room, price: nextPrice, active: true }) });
    if (!response.ok) return;
    saveRoom({ ...room, price: nextPrice });
    setEditingRoom(null);
  };
  return (
    <section className="bed-table-panel">
      <div className="bed-status-legend" aria-label="Bed status legend">
        <span>
          <i className="occupied" /> Occupied
        </span>
        <span>
          <i className="vacant" /> Vacant
        </span>
        <span>
          <i className="not-applicable" /> Not applicable
        </span>
      </div>
      <div className="bed-table-wrap">
        <table className="bed-table">
          <thead>
            <tr>
              <th>Hostel Room</th>
              <th>Bed 1</th>
              <th>Bed 2</th>
              <th>Bed 3</th>
              <th className="bed-price-heading">Standard price / bed</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => {
              const occupants = students.filter(
                (student) => student.roomNo === room.roomNo,
              );
              return (
                <tr key={room.roomNo}>
                  <th scope="row">
                    <b>{room.roomNo}</b>
                    <small>{room.type}</small>
                  </th>
                  {Array.from({ length: 3 }).map((_, index) => {
                    const student = occupants[index];
                    if (index >= room.beds)
                      return (
                        <td className="bed-cell not-applicable" key={index}>
                          <span>—</span>
                          <small>Not applicable</small>
                        </td>
                      );
                    if (!student)
                      return (
                        <td className="bed-cell vacant" key={index}>
                          <b>Vacant</b>
                          <small>Available</small>
                        </td>
                      );
                    return (
                      <td className="bed-cell occupied" key={index}>
                        <button
                          className="student-name-link"
                          onClick={() => openStudent(student)}
                        >
                          {student.firstName} {student.lastName}
                        </button>
                        <small>{student.registrationNo}</small>
                      </td>
                    );
                  })}
                  <td className="bed-price-cell">
                    {editingRoom === room.roomNo ? (
                      <div className="bed-price-edit"><input aria-label={`Price for hostel room ${room.roomNo}`} type="number" min="0" value={price} onChange={(event)=>setPrice(event.target.value)} /><span><button onClick={()=>void savePrice(room)}>Save</button><button onClick={()=>setEditingRoom(null)}>Cancel</button></span></div>
                    ) : (
                      <div><b>{amountOnly.format(room.price)}</b><button onClick={()=>{setPrice(String(room.price));setEditingRoom(room.roomNo);}}>Edit price</button></div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RoomCard({
  room,
  occupants,
  openStudent,
  saveRoom,
  onDelete,
}: {
  room: Room;
  occupants: Student[];
  openStudent: (student: Student) => void;
  saveRoom: (room: Room) => void;
  onDelete?: (room: Room) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [price, setPrice] = useState(String(room.price));
  const savePrice = async () => {
    const nextPrice = Number(price);
    if (!Number.isFinite(nextPrice) || nextPrice < 0) return;
    const response = await fetch(`/api/v1/rooms/${encodeURIComponent(room.roomNo)}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...room, price: nextPrice, active: true }),
    });
    if (!response.ok) return;
    saveRoom({ ...room, price: nextPrice });
    setEditing(false);
  };
  return (
    <article className="room">
      <div className="roomtop">
        <div>
          <small>HOSTEL ROOM</small>
          <b>{room.roomNo}</b>
        </div>
        <span className={occupants.length === room.beds ? "full" : ""}>
          {occupants.length === room.beds
            ? "Full"
            : `${room.beds - occupants.length} available`}
        </span>
      </div>
      <div className="beds">
        {Array.from({ length: room.beds }).map((_, index) => (
          <i className={index < occupants.length ? "occupied" : ""} key={index}>
            ▰
          </i>
        ))}
      </div>
      <div className="roommeta">
        <span>
          <small>TYPE</small>
          <b>{room.type}</b>
        </span>
        <span className="price-editor">
          <small>PRICE / BED</small>
          {editing ? (
            <span>
              <input
                aria-label={`Price for hostel room ${room.roomNo}`}
                type="number"
                min="0"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
              />
              <button onClick={savePrice}>Save</button>
              <button
                onClick={() => {
                  setPrice(String(room.price));
                  setEditing(false);
                }}
              >
                Cancel
              </button>
            </span>
          ) : (
            <span>
              <b>{cash.format(room.price)}</b>
              <button onClick={() => setEditing(true)}>Edit price</button>
            </span>
          )}
        </span>
      </div>
      <div className="occupants">
        {occupants.length ? (
          occupants.map((student) => (
            <div key={student.id}>
              <i>
                {student.firstName[0]}
                {student.lastName[0]}
              </i>
              <span>
                <button
                  className="student-name-link"
                  onClick={() => openStudent(student)}
                >
                  {student.firstName} {student.lastName}
                </button>
                <small>{student.registrationNo}</small>
              </span>
            </div>
          ))
        ) : (
          <p>No active residents assigned.</p>
        )}
      </div>
      {onDelete && !occupants.length && <button className="review-button danger" onClick={() => onDelete(room)}>Delete hostel room</button>}
    </article>
  );
}

function BankReconciliationHeaderSummary() {
  const [summary, setSummary] = useState({
    transactions: 0,
    reconciled: 0,
    review: 0,
    balance: 0,
  });
  useEffect(() => {
    const loadSummary = () =>
      fetch("/api/v1/bank-reconciliation")
        .then((response) => response.json())
        .then((result) => {
          const bankRows = (result.bankTransactions || []) as BankTransaction[];
          const links = (result.links || []) as BankLink[];
          const linkedTotal = (bankTransactionId: string) =>
            links
              .filter((link) => link.bankTransactionId === bankTransactionId)
              .reduce((sum, link) => sum + link.reconciledAmount, 0);
          const reconciled = bankRows.filter(
            (row) =>
              Math.abs(linkedTotal(row.bankTransactionId) - Math.abs(row.amount)) <
              0.01,
          ).length;
          const latest = [...bankRows].sort(
            (left, right) =>
              right.transactionDate.localeCompare(left.transactionDate) ||
              right.id - left.id,
          )[0];
          setSummary({
            transactions: bankRows.length,
            reconciled,
            review: bankRows.length - reconciled,
            balance: latest?.accountBalance || 0,
          });
        })
        .catch(() => {});
    loadSummary();
    window.addEventListener("bank-reconciliation-updated", loadSummary);
    return () =>
      window.removeEventListener("bank-reconciliation-updated", loadSummary);
  }, []);
  return (
    <div className="bank-header-summary">
      <span>
        <small>BANK TRANSACTIONS</small>
        <b>{summary.transactions}</b>
      </span>
      <span>
        <small>FULLY RECONCILED</small>
        <b>{summary.reconciled}</b>
      </span>
      <span>
        <small>REQUIRES REVIEW</small>
        <b>{summary.review}</b>
      </span>
      <span className="bank-header-balance">
        <small>CURRENT BANK BALANCE</small>
        <b>{cash.format(summary.balance)}</b>
      </span>
      <div className="bank-header-upload-wrap">
        <button
          className="primary bank-header-upload"
          onClick={() => window.dispatchEvent(new Event("open-bank-import"))}
        >
          ↑ Upload bank spreadsheet
        </button>
        <small>Accepted formats: Excel .xlsx/.xls and .csv.</small>
      </div>
    </div>
  );
}

function BankReconciliation() {
  const [bankRows, setBankRows] = useState<BankTransaction[]>([]);
  const [links, setLinks] = useState<BankLink[]>([]);
  const [sources, setSources] = useState<BankSource[]>([]);
  const [reconciling, setReconciling] = useState<BankTransaction | null>(null);
  const [viewing, setViewing] = useState<BankTransaction | null>(null);
  const [editing, setEditing] = useState<BankTransaction | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [sort, setSort] = useState<{
    key: keyof BankTransaction;
    direction: "asc" | "desc";
  }>({ key: "transactionDate", direction: "desc" });
  const load = async () => {
    const response = await fetch("/api/v1/bank-reconciliation");
    const result = await response.json();
    if (response.ok) {
      setBankRows(result.bankTransactions || []);
      setLinks(result.links || []);
      setSources(result.sources || []);
      window.dispatchEvent(new Event("bank-reconciliation-updated"));
    }
  };
  useEffect(() => {
    fetch("/api/v1/bank-reconciliation")
      .then((response) => response.json())
      .then((result) => {
        if (result.bankTransactions) setBankRows(result.bankTransactions);
        if (result.links) setLinks(result.links);
        if (result.sources) setSources(result.sources);
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    const openImport = () => importInputRef.current?.click();
    window.addEventListener("open-bank-import", openImport);
    return () => window.removeEventListener("open-bank-import", openImport);
  }, []);
  const importFile = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setError("");
    setMessage("");
    const form = new FormData();
    form.set("file", file);
    try {
      const response = await fetch("/api/v1/bank-reconciliation", {
        method: "POST",
        body: form,
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Unable to import spreadsheet");
      setMessage(
        `${result.imported} new transaction(s) imported · ${result.duplicates} duplicate(s) skipped${result.invalid ? ` · ${result.invalid} invalid row(s) skipped` : ""}`,
      );
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to import spreadsheet",
      );
    } finally {
      setUploading(false);
    }
  };
  const linkedAmount = (bankTransactionId: string) =>
    links
      .filter((link) => link.bankTransactionId === bankTransactionId)
      .reduce((sum, link) => sum + link.reconciledAmount, 0);
  const linkedIds = (bankTransactionId: string) =>
    links
      .filter((link) => link.bankTransactionId === bankTransactionId)
      .map((link) => link.sourceTransactionId);
  const bankDate = (value: string) => {
    const [year, month, day] = value.slice(0, 10).split("-");
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return year && month && day
      ? `${Number(day)}-${monthNames[Number(month) - 1]}-${year}`
      : value || "—";
  };
  const changeSort = (key: keyof BankTransaction) =>
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );
  const head = (key: keyof BankTransaction, label: string) => (
    <button className="table-sort-head" onClick={() => changeSort(key)}>
      {label}
      <span>
        {sort.key === key ? (sort.direction === "asc" ? "▲" : "▼") : "↕"}
      </span>
    </button>
  );
  const rows = [...bankRows].sort((left, right) => {
    const a = left[sort.key],
      b = right[sort.key];
    const result =
      typeof a === "number" && typeof b === "number"
        ? a - b
        : String(a).localeCompare(String(b), undefined, { numeric: true });
    return (sort.direction === "asc" ? 1 : -1) * result;
  });
  const deleteBankRow = async (row: BankTransaction) => {
    if (
      !window.confirm(
        `Delete ${row.bankTransactionId}? Any linked reconciliation will be removed.`,
      )
    )
      return;
    setError("");
    const response = await fetch(`/api/v1/bank-reconciliation?id=${row.id}`, {
      method: "DELETE",
    });
    const result = await response.json();
    if (!response.ok)
      return setError(result.error || "Unable to delete bank transaction");
    await load();
  };
  return (
    <div className="content bank-reconciliation-view">
      <input
        ref={importInputRef}
        className="bank-import-input"
        type="file"
        accept=".xlsx,.xls,.csv"
        disabled={uploading}
        onChange={(event) => {
          importFile(event.target.files?.[0]);
          event.currentTarget.value = "";
        }}
      />
      {message && <p className="import-message success">✓ {message}</p>}
      {error && <p className="import-message error">⚠ {error}</p>}
      <div className="panel tablewrap">
        <table className="bank-reconciliation-table">
          <colgroup>
            <col className="col-bank-id" />
            <col className="col-bank-date" />
            <col className="col-bank-remarks" />
            <col className="col-bank-cheque" />
            <col className="col-bank-code" />
            <col className="col-bank-branch" />
            <col className="col-bank-amount" />
            <col className="col-bank-direction" />
            <col className="col-bank-balance" />
            <col className="col-bank-reconciled" />
            <col className="col-bank-difference" />
            <col className="col-bank-links" />
            <col className="col-bank-status" />
            <col className="col-bank-actions" />
          </colgroup>
          <thead>
            <tr>
              <th className="bank-id-column">
                {head("bankTransactionId", "TRANSACTION ID")}
              </th>
              <th>{head("transactionDate", "DATE")}</th>
              <th>{head("remarks", "REMARKS")}</th>
              <th>{head("chequeNo", "CHEQUE NO")}</th>
              <th>{head("branchCode", "BRANCH CODE")}</th>
              <th>{head("branchName", "BRANCH NAME")}</th>
              <th>{head("amount", "AMOUNT (LKR)")}</th>
              <th>{head("drCr", "DR / CR")}</th>
              <th>{head("accountBalance", "ACCOUNT BALANCE")}</th>
              <th>RECONCILED AMOUNT<small>(LKR)</small></th>
              <th>DIFFERENCE (LKR)</th>
              <th>TRANSACTION IDS</th>
              <th>RECONCILIATION STATUS</th>
              <th>ADMIN CONTROLS</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const reconciled = linkedAmount(row.bankTransactionId),
                ids = linkedIds(row.bankTransactionId),
                rawDifference = reconciled - Math.abs(row.amount),
                difference =
                  Math.abs(rawDifference) < 0.01
                    ? 0
                    : Math.min(0, rawDifference),
                full = difference === 0;
              return (
                <tr
                  key={row.id}
                  className={difference < 0 ? "reconciliation-shortfall" : ""}
                >
                  <td>
                    <b className="transaction-id">{row.bankTransactionId}</b>
                  </td>
                  <td>{bankDate(row.transactionDate)}</td>
                  <td className="bank-remarks">{row.remarks || "—"}</td>
                  <td>{row.chequeNo || "—"}</td>
                  <td>{row.branchCode || "—"}</td>
                  <td>{row.branchName || "—"}</td>
                  <td>
                    <b>{amountOnly.format(row.amount)}</b>
                  </td>
                  <td>
                    <span
                      className={`bank-direction ${row.drCr.toLowerCase().includes("cr") ? "credit" : "debit"}`}
                    >
                      {row.drCr || "—"}
                    </span>
                  </td>
                  <td>
                    {amountOnly.format(row.accountBalance)}
                  </td>
                  <td>
                    {reconciled ? (
                      <button
                        className="reconciled-amount-link"
                        onClick={() => setViewing(row)}
                      >
                        {row.currency} {amountOnly.format(reconciled)}
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <b
                      className={
                        difference < 0
                          ? "reconciliation-difference shortfall"
                          : "reconciliation-difference balanced"
                      }
                    >
                      {amountOnly.format(difference)}
                    </b>
                  </td>
                  <td>
                    <div className="linked-transaction-ids">
                      {ids.map((id) => (
                        <b key={id}>{id}</b>
                      ))}
                      {!ids.length && "—"}
                    </div>
                  </td>
                  <td className="reconciliation-cell">
                    <span
                      className={`bank-status ${full ? "verified" : reconciled ? "partial" : "unverified"}`}
                    >
                      {full
                        ? "Fully Reconciled"
                        : reconciled
                          ? "Partially Reconciled"
                          : "Not Reconciled"}
                    </span>
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <button
                        className="review-button"
                        onClick={() => setReconciling(row)}
                      >
                        Reconcile
                      </button>
                      <button
                        className="review-button"
                        onClick={() => setEditing(row)}
                      >
                        Edit
                      </button>
                      <button
                        className="danger-button"
                        onClick={() => deleteBankRow(row)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!rows.length && (
              <tr>
                <td colSpan={14}>
                  Upload a bank spreadsheet to begin reconciliation.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {reconciling && (
        <BankReconcileModal
          bank={reconciling}
          sources={sources}
          existingLinks={links.filter(
            (link) => link.bankTransactionId === reconciling.bankTransactionId,
          )}
          close={() => setReconciling(null)}
          saved={async () => {
            setReconciling(null);
            await load();
          }}
        />
      )}
      {viewing && (
        <BankReconciliationDetails
          bank={viewing}
          links={links.filter(
            (link) => link.bankTransactionId === viewing.bankTransactionId,
          )}
          sources={sources}
          close={() => setViewing(null)}
        />
      )}
      {editing && (
        <BankTransactionEditModal
          bank={editing}
          close={() => setEditing(null)}
          saved={async () => {
            setEditing(null);
            await load();
          }}
        />
      )}
    </div>
  );
}

function BankTransactionEditModal({
  bank,
  close,
  saved,
}: {
  bank: BankTransaction;
  close: () => void;
  saved: () => void;
}) {
  const [form, setForm] = useState({
    transactionDate: bank.transactionDate,
    remarks: bank.remarks,
    chequeNo: bank.chequeNo,
    branchCode: bank.branchCode,
    branchName: bank.branchName,
    currency: bank.currency,
    amount: bank.amount,
    drCr: bank.drCr,
    accountBalance: bank.accountBalance,
  });
  const [error, setError] = useState(""),
    [saving, setSaving] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/v1/bank-reconciliation", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: bank.id, ...form }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Unable to update bank transaction");
      saved();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to update bank transaction",
      );
    } finally {
      setSaving(false);
    }
  };
  const textField =
    (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
      setForm((current) => ({ ...current, [key]: event.target.value }));
  return (
    <div className="backdrop">
      <form className="modal paymentmodal" onSubmit={submit}>
        <ModalHead
          tag="ADMIN BANK EDIT"
          title={`Edit ${bank.bankTransactionId}`}
          text="Editing this row removes its current reconciliation links."
          close={close}
        />
        <section className="formgrid two">
          <label>
            Date
            <input
              type="date"
              value={form.transactionDate}
              onChange={textField("transactionDate")}
              required
            />
          </label>
          <label>
            Amount
            <input
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  amount: Number(event.target.value),
                }))
              }
              required
            />
          </label>
          <label className="span-two">
            Remarks
            <input value={form.remarks} onChange={textField("remarks")} />
          </label>
          <label>
            Cheque no.
            <input value={form.chequeNo} onChange={textField("chequeNo")} />
          </label>
          <label>
            Branch code
            <input value={form.branchCode} onChange={textField("branchCode")} />
          </label>
          <label>
            Branch name
            <input value={form.branchName} onChange={textField("branchName")} />
          </label>
          <label>
            Currency
            <input
              value={form.currency}
              onChange={textField("currency")}
              required
            />
          </label>
          <label>
            DR / CR
            <input value={form.drCr} onChange={textField("drCr")} />
          </label>
          <label>
            Account balance
            <input
              type="number"
              step="0.01"
              value={form.accountBalance}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  accountBalance: Number(event.target.value),
                }))
              }
            />
          </label>
        </section>
        {error && <p className="form-error">⚠ {error}</p>}
        <div className="modalactions">
          <button type="button" onClick={close}>
            Cancel
          </button>
          <button className="primary" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

function BankReconcileModal({
  bank,
  sources,
  existingLinks,
  close,
  saved,
}: {
  bank: BankTransaction;
  sources: BankSource[];
  existingLinks: BankLink[];
  close: () => void;
  saved: () => void;
}) {
  const isDebit = bank.drCr.toLowerCase().includes("dr");
  const allowedSourceTypes: BankSource["sourceType"][] = isDebit
    ? ["Expense", "Petty Cash Deposit"]
    : ["Payment"];
  const [sourceType, setSourceType] = useState<BankSource["sourceType"]>(
    allowedSourceTypes[0],
  );
  const [search, setSearch] = useState("");
  const keyFor = (source: BankSource) =>
    `${source.sourceType}:${source.recordId}`;
  const [selected, setSelected] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      existingLinks.map((link) => [
        `${link.sourceType}:${link.sourceRecordId}`,
        link.reconciledAmount,
      ]),
    ),
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const bankAmount = Math.abs(bank.amount);
  const total = Object.values(selected).reduce(
    (sum, amount) => sum + amount,
    0,
  );
  const remaining = Math.max(0, bankAmount - total);
  const candidates = sources
    .filter(
      (source) =>
        (!source.bankTransactionId ||
          source.bankTransactionId === bank.bankTransactionId) &&
        allowedSourceTypes.includes(source.sourceType) &&
        source.sourceType === sourceType &&
        `${source.transactionId} ${source.description} ${source.date} ${source.amount}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort(
      (a, b) =>
        Math.abs(a.amount - remaining) - Math.abs(b.amount - remaining) ||
        b.date.localeCompare(a.date),
    );
  const exceedsBankAmount = total > bankAmount + 0.01;
  const reconcile = async () => {
    setSaving(true);
    setError("");
    const selections = sources
      .filter((source) => selected[keyFor(source)])
      .map((source) => ({
        sourceType: source.sourceType,
        recordId: source.recordId,
        reconciledAmount: selected[keyFor(source)],
      }));
    try {
      const response = await fetch("/api/v1/bank-reconciliation", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          bankTransactionId: bank.bankTransactionId,
          selections,
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Unable to reconcile transactions");
      saved();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to reconcile transactions",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="backdrop">
      <div className="modal bank-reconcile-modal">
        <ModalHead
          tag="BANK RECONCILIATION"
          title={`Reconcile ${bank.bankTransactionId}`}
          text={`${fmtDate(bank.transactionDate)} · ${bank.currency} ${amountOnly.format(bank.amount)} · ${bank.remarks || "No remarks"}`}
          close={close}
        />
        <section className="reconcile-balance">
          <span>
            <small>REMAINING BANK AMOUNT</small>
            <b>
              {bank.currency} {amountOnly.format(remaining)}
            </b>
          </span>
          <span>
            <small>SELECTED NOW</small>
            <b className={exceedsBankAmount ? "red" : ""}>
              {bank.currency} {amountOnly.format(total)}
            </b>
          </span>
        </section>
        <section className="reconcile-controls">
          <label>
            Transaction type
            <select
              value={sourceType}
              onChange={(event) =>
                setSourceType(event.target.value as typeof sourceType)
              }
            >
              {allowedSourceTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
          <label>
            Search
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Transaction ID, name, amount or date"
            />
          </label>
        </section>
        <p className="reconciliation-source-rule">
          {isDebit
            ? "Debit bank transactions can be matched only to Expense Ledger or Petty Cash Ledger records."
            : "Credit bank transactions can be matched only to Payments or Other Income records."}
        </p>
        <div className="reconcile-source-list">
          <table>
            <thead>
              <tr>
                <th>SELECT</th>
                <th>TYPE</th>
                <th>TRANSACTION ID</th>
                <th>DATE</th>
                <th>DETAILS</th>
                <th>RECORD AMOUNT<small>(LKR)</small></th>
                <th>RECONCILE AMOUNT<small>(LKR)</small></th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((source) => {
                const key = keyFor(source),
                  checked = Boolean(selected[key]);
                return (
                  <tr key={key}>
                    <td>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) =>
                          setSelected((current) => {
                            const next = { ...current };
                            if (event.target.checked)
                              next[key] = Math.min(source.amount, remaining);
                            else delete next[key];
                            return next;
                          })
                        }
                      />
                    </td>
                    <td>
                      <span className="source-type">{source.sourceType}</span>
                    </td>
                    <td>
                      <b className="transaction-id">{source.transactionId}</b>
                    </td>
                    <td>{fmtDate(source.date)}</td>
                    <td>{source.description}</td>
                    <td>{amountOnly.format(source.amount)}</td>
                    <td>
                      <input
                        className="reconcile-amount-input"
                        type="number"
                        min="0.01"
                        step="0.01"
                        disabled={!checked}
                        value={selected[key] || ""}
                        onChange={(event) =>
                          setSelected((current) => ({
                            ...current,
                            [key]: Number(event.target.value),
                          }))
                        }
                      />
                    </td>
                  </tr>
                );
              })}
              {!candidates.length && (
                <tr>
                  <td colSpan={7}>No unlinked transactions match this view.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {exceedsBankAmount && (
          <p className="form-error reconciliation-limit-error">
            ⚠ Reconciled amount cannot exceed the bank transaction amount. Bank
            amount: {bank.currency} {amountOnly.format(bankAmount)} · Total
            after selection: {bank.currency} {amountOnly.format(total)}{" "}
            · Reduce by {bank.currency}{" "}
            {amountOnly.format(total - bankAmount)}.
          </p>
        )}
        {error && <p className="form-error">⚠ {error}</p>}
        <div className="modalactions">
          <button onClick={close}>Cancel</button>
          <button
            className="primary"
            disabled={!total || exceedsBankAmount || saving}
            onClick={reconcile}
          >
            {saving ? "Reconciling…" : "Save reconciliation"}
          </button>
        </div>
      </div>
    </div>
  );
}

function BankReconciliationDetails({
  bank,
  links,
  sources,
  close,
}: {
  bank: BankTransaction;
  links: BankLink[];
  sources: BankSource[];
  close: () => void;
}) {
  return (
    <div className="backdrop">
      <div className="modal paymentmodal">
        <ModalHead
          tag="RECONCILED TRANSACTIONS"
          title={bank.bankTransactionId}
          text={`${fmtDate(bank.transactionDate)} · ${bank.currency} ${amountOnly.format(bank.amount)} · ${bank.remarks || "No remarks"}`}
          close={close}
        />
        <section className="reconciliation-detail-list">
          <table>
            <thead>
              <tr>
                <th>TYPE</th>
                <th>TRANSACTION ID</th>
                <th>DATE</th>
                <th>DETAILS</th>
                <th>RECONCILED AMOUNT<small>(LKR)</small></th>
              </tr>
            </thead>
            <tbody>
              {links.map((link) => {
                const source = sources.find(
                  (item) =>
                    item.sourceType === link.sourceType &&
                    item.recordId === link.sourceRecordId,
                );
                return (
                  <tr key={link.id}>
                    <td>{link.sourceType}</td>
                    <td>
                      <b className="transaction-id">
                        {link.sourceTransactionId}
                      </b>
                    </td>
                    <td>{fmtDate(source?.date || "")}</td>
                    <td>{source?.description || "—"}</td>
                    <td>
                      <b>{amountOnly.format(link.reconciledAmount)}</b>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <th colSpan={4}>TOTAL RECONCILED</th>
                <th>
                  {amountOnly.format(
                    links.reduce((sum, link) => sum + link.reconciledAmount, 0),
                  )}
                </th>
              </tr>
            </tfoot>
          </table>
        </section>
        <div className="modalactions">
          <button className="primary" onClick={close}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function FinancialAccounts({
  payments,
  expenses,
  categories,
}: {
  payments: Payment[];
  expenses: Expense[];
  categories: ExpenseCategory[];
}) {
  const [fromMonth, setFromMonth] = useState("2026-01");
  const [toMonth, setToMonth] = useState("2026-12");
  const [view, setView] = useState<"monthly" | "detailed" | "financial-year">(
    "monthly",
  );
  const [financialYearStart, setFinancialYearStart] = useState(2025);
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(["income-room"]),
  );
  const [exportOpen, setExportOpen] = useState(false);
  const [exportScope, setExportScope] = useState<"All" | "Income" | "Expenses" | "Net Income">("All");
  const [exportCategories, setExportCategories] = useState<string[]>([]);
  const toggle = (key: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const financialYearMonths = monthRange(
    `${financialYearStart}-04`,
    `${financialYearStart + 1}-03`,
  );
  const visibleMonths =
    view === "financial-year"
      ? financialYearMonths
      : monthRange(fromMonth, toMonth).slice(0, 12);
  const periodFrom = visibleMonths[0] || fromMonth;
  const periodTo = visibleMonths.at(-1) || toMonth;
  const inPeriod = (month: string) => month >= periodFrom && month <= periodTo;
  const incomePayments = payments.filter(
    (payment) =>
      payment.paidAmount > 0 &&
      canonicalPaymentType(payment.type) !== "Deposit" &&
      (payment.type !== "Other Income" ||
        (payment.incomeApprovalStatus || "Pending") === "Approved") &&
      inPeriod(payment.month || payment.paidDate.slice(0, 7)),
  );
  const incomeGroups = [
    {
      key: "income-room",
      label: "Monthly Accommodation Fee",
      rows: incomePayments.filter(
        (payment) => canonicalPaymentType(payment.type) === "Rent",
      ),
    },
    {
      key: "income-shop",
      label: "Shop Monthly Accommodation Fee",
      rows: incomePayments.filter((payment) => payment.type === "Shop Rent"),
    },
    {
      key: "income-other",
      label: "Other Income",
      rows: incomePayments.filter((payment) => payment.type === "Other Income"),
    },
  ];
  const approvedExpenses = expenses.filter(
    (expense) =>
      expense.approvalStatus === "Approved" &&
      inPeriod(expense.transactionDate.slice(0, 7)),
  );
  const expenseGroups = [
    ...new Set(categories.map((category) => category.mainCategory)),
  ]
    .sort()
    .map((mainCategory) => ({
      key: `expense-${mainCategory}`,
      mainCategory,
      label: mainCategory === "Staff Costs" ? "Staff Expenses" : mainCategory,
      rows: approvedExpenses.filter(
        (expense) =>
          categories.find((category) => category.id === expense.categoryId)
            ?.mainCategory === mainCategory,
      ),
    }));
  const totalIncome = incomeGroups.reduce(
    (sum, group) =>
      sum +
      group.rows.reduce(
        (groupSum, payment) => groupSum + payment.paidAmount,
        0,
      ),
    0,
  );
  const totalExpenses = approvedExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  );
  const netIncome = totalIncome - totalExpenses;
  const financialExportData = () => {
    const headers = ["ACCOUNT / CATEGORY", ...visibleMonths.map(fmtMonth), "PERIOD TOTAL"];
    const rows: Array<Array<string | number>> = [];
    if (exportScope === "All" || exportScope === "Income") {
      incomeGroups.forEach((group) => {
        const values = visibleMonths.map((month) => group.rows.filter((payment) => (payment.month || payment.paidDate.slice(0, 7)) === month).reduce((sum, payment) => sum + payment.paidAmount, 0));
        rows.push([group.label, ...values, values.reduce((sum, value) => sum + value, 0)]);
      });
      rows.push(["TOTAL INCOME", ...visibleMonths.map((month) => incomeGroups.reduce((sum, group) => sum + group.rows.filter((payment) => (payment.month || payment.paidDate.slice(0, 7)) === month).reduce((subtotal, payment) => subtotal + payment.paidAmount, 0), 0)), totalIncome]);
    }
    if (exportScope === "All" || exportScope === "Expenses") {
      expenseGroups.filter((group) => !exportCategories.length || exportCategories.includes(group.mainCategory)).forEach((group) => {
        const values = visibleMonths.map((month) => group.rows.filter((expense) => expense.transactionDate.slice(0, 7) === month).reduce((sum, expense) => sum + expense.amount, 0));
        rows.push([group.label, ...values, values.reduce((sum, value) => sum + value, 0)]);
      });
      rows.push(["TOTAL EXPENSES", ...visibleMonths.map((month) => approvedExpenses.filter((expense) => expense.transactionDate.slice(0, 7) === month).reduce((sum, expense) => sum + expense.amount, 0)), totalExpenses]);
    }
    if (exportScope === "All" || exportScope === "Net Income") {
      const values = visibleMonths.map((month) => {
        const income = incomeGroups.reduce((sum, group) => sum + group.rows.filter((payment) => (payment.month || payment.paidDate.slice(0, 7)) === month).reduce((subtotal, payment) => subtotal + payment.paidAmount, 0), 0);
        const expense = approvedExpenses.filter((item) => item.transactionDate.slice(0, 7) === month).reduce((sum, item) => sum + item.amount, 0);
        return income - expense;
      });
      rows.push(["NET INCOME", ...values, values.reduce((sum, value) => sum + value, 0)]);
    }
    return { headers, rows };
  };
  const exportFinancialSpreadsheet = async () => {
    const XLSX = await import("xlsx");
    const data = financialExportData();
    const sheet = XLSX.utils.aoa_to_sheet([data.headers, ...data.rows]);
    sheet["!cols"] = data.headers.map((header, index) => ({ wch: index === 0 ? 28 : 14 }));
    const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book, sheet, "Financial Summary");
    XLSX.writeFile(book, `Perk-Haven-Financial-Summary-${periodFrom}-${periodTo}.xlsx`);
  };
  const exportFinancialPdf = async () => {
    const { jsPDF } = await import("jspdf");
    const data = financialExportData();
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth(), pageHeight = pdf.internal.pageSize.getHeight(), margin = 7, firstWidth = 42, otherWidth = (pageWidth - margin * 2 - firstWidth) / (data.headers.length - 1);
    const drawHeader = (page: number) => { pdf.setFillColor(15, 48, 78); pdf.rect(0, 0, pageWidth, 21, "F"); pdf.setTextColor(255, 255, 255); pdf.setFont("helvetica", "bold"); pdf.setFontSize(13); pdf.text("THE PERK HAVEN HOSTEL", margin, 8); pdf.setFontSize(9); pdf.text(`FINANCIAL SUMMARY · ${fmtMonth(periodFrom)} – ${fmtMonth(periodTo)}`, margin, 15); pdf.setFontSize(7); pdf.text(`Page ${page}`, pageWidth - margin, 15, { align: "right" }); pdf.setFillColor(229, 237, 246); pdf.rect(margin, 25, pageWidth - margin * 2, 11, "F"); pdf.setTextColor(15, 48, 78); pdf.setFontSize(5.2); data.headers.forEach((header, index) => pdf.text(header, index === 0 ? margin + 1 : margin + firstWidth + otherWidth * (index - 1) + otherWidth / 2, 31.5, { align: index === 0 ? "left" : "center", maxWidth: index === 0 ? firstWidth - 2 : otherWidth - 1 })); return 36; };
    let page = 1, y = drawHeader(page);
    data.rows.forEach((row, rowIndex) => { if (y + 8 > pageHeight - 8) { pdf.addPage("a4", "landscape"); page += 1; y = drawHeader(page); } if (rowIndex % 2) { pdf.setFillColor(247, 249, 252); pdf.rect(margin, y, pageWidth - margin * 2, 8, "F"); } pdf.setTextColor(20, 39, 61); pdf.setFont("helvetica", "normal"); pdf.setFontSize(5.6); row.forEach((value, index) => pdf.text(typeof value === "number" ? amountOnly.format(value) : String(value), index === 0 ? margin + 1 : margin + firstWidth + otherWidth * index - 1, y + 5, { align: index === 0 ? "left" : "right", maxWidth: index === 0 ? firstWidth - 2 : otherWidth - 1 })); y += 8; });
    downloadBlob(pdf.output("blob"), `Perk-Haven-Financial-Summary-${periodFrom}-${periodTo}.pdf`);
  };
  const datedMonths = [
    ...payments.map((payment) => payment.month || payment.paidDate.slice(0, 7)),
    ...expenses.map((expense) => expense.transactionDate.slice(0, 7)),
  ].filter(Boolean);
  const currentFinancialYear =
    new Date().getMonth() + 1 >= 4
      ? new Date().getFullYear()
      : new Date().getFullYear() - 1;
  const financialYearStarts = [
    ...new Set([
      2025,
      currentFinancialYear,
      ...datedMonths.map((month) =>
        Number(month.slice(5, 7)) >= 4
          ? Number(month.slice(0, 4))
          : Number(month.slice(0, 4)) - 1,
      ),
    ]),
  ].filter((year) => year >= 2025).sort((a, b) => b - a);
  return (
    <div className="content financial-accounts">
      <div className="financial-heading">
        {view === "financial-year" ? (
          <div className="account-period">
            <label>
              Financial year
              <select
                value={financialYearStart}
                onChange={(event) =>
                  setFinancialYearStart(Number(event.target.value))
                }
              >
                {financialYearStarts.map((year) => (
                  <option value={year} key={year}>
                    FY {year}/{year + 1}
                  </option>
                ))}
              </select>
            </label>
            <button className="secondary" onClick={() => setExportOpen(true)}>⇩ Print / Export</button>
          </div>
        ) : (
          <div className="account-period">
            <label>
              From
              <input
                type="month"
                value={fromMonth}
                onChange={(event) => {
                  const next = event.target.value;
                  setFromMonth(next);
                  if (toMonth < next || toMonth > addMonths(next, 11))
                    setToMonth(addMonths(next, 11));
                }}
              />
            </label>
            <label>
              To
              <input
                type="month"
                min={fromMonth}
                max={addMonths(fromMonth, 11)}
                value={toMonth}
                onChange={(event) => setToMonth(event.target.value)}
              />
            </label>
            <button className="secondary" onClick={() => setExportOpen(true)}>⇩ Print / Export</button>
          </div>
        )}
        <div className="account-summary-cards">
        <article className="panel income">
          <small>TOTAL INCOME</small>
          <b>{cash.format(totalIncome)}</b>
          <span>Monthly Accommodation Fee, Shop Monthly Accommodation Fee and Other Income</span>
        </article>
        <article className="panel expense">
          <small>TOTAL EXPENSES</small>
          <b>{cash.format(totalExpenses)}</b>
          <span>Approved hostel expenses</span>
        </article>
        <article
          className={`panel net ${netIncome < 0 ? "negative" : "positive"}`}
        >
          <small>NET INCOME</small>
          <b>{cash.format(netIncome)}</b>
          <span>Total income less total expenses</span>
        </article>
        </div>
      </div>
      <div
        className="payment-tabs account-view-tabs"
        role="tablist"
        aria-label="Financial account views"
      >
        <button
          className={view === "monthly" ? "active" : ""}
          onClick={() => setView("monthly")}
        >
          Monthly Summary
        </button>
        <button
          className={view === "financial-year" ? "active" : ""}
          onClick={() => setView("financial-year")}
        >
          Financial Year Summary
        </button>
        <button
          className={view === "detailed" ? "active" : ""}
          onClick={() => setView("detailed")}
        >
          Detailed Statement
        </button>
      </div>
      {(view === "monthly" || view === "financial-year") && (
        <FinancialMonthlyMatrix
          months={visibleMonths}
          incomeGroups={incomeGroups}
          expenses={approvedExpenses}
          categories={categories}
          expanded={expanded}
          toggle={toggle}
          title={
            view === "financial-year"
              ? `FY ${financialYearStart}/${financialYearStart + 1}`
              : `${fmtMonth(periodFrom)} – ${fmtMonth(periodTo)}`
          }
        />
      )}
      {view === "detailed" && (
        <div className="panel tablewrap account-statement-wrap">
          <table className="account-statement">
            <thead>
              <tr>
                <th>ACCOUNT / DETAILS</th>
                <th>REFERENCE</th>
                <th>DATE</th>
                <th>AMOUNT<small>(LKR)</small></th>
              </tr>
            </thead>
            <tbody>
              <tr className="account-section income">
                <td colSpan={4}>INCOME</td>
              </tr>
              {incomeGroups.map((group) => {
                const subtotal = group.rows.reduce(
                  (sum, payment) => sum + payment.paidAmount,
                  0,
                );
                return (
                  <FragmentAccount key={group.key}>
                    <tr className="account-group">
                      <td>
                        <button
                          className="group-toggle"
                          onClick={() => toggle(group.key)}
                          aria-expanded={expanded.has(group.key)}
                        >
                          {expanded.has(group.key) ? "−" : "+"}
                        </button>
                        <b>{group.label}</b>
                      </td>
                      <td>{group.rows.length} transaction(s)</td>
                      <td>
                        {fmtMonth(fromMonth)} – {fmtMonth(toMonth)}
                      </td>
                      <td>
                        <b>{amountOnly.format(subtotal)}</b>
                      </td>
                    </tr>
                    {expanded.has(group.key) &&
                      group.rows
                        .sort((a, b) => b.paidDate.localeCompare(a.paidDate))
                        .map((payment) => (
                          <tr
                            className="account-detail"
                            key={`${group.key}-${payment.id}`}
                          >
                            <td>
                              <span className="tree-line">↳</span>
                              {payment.studentName}
                            </td>
                            <td>
                              {transactionIdFor(payment)} · {payment.roomNo}
                            </td>
                            <td>{fmtDate(payment.paidDate)}</td>
                            <td>{amountOnly.format(payment.paidAmount)}</td>
                          </tr>
                        ))}
                  </FragmentAccount>
                );
              })}
              <tr className="account-total income">
                <td colSpan={3}>TOTAL INCOME</td>
                <td>{amountOnly.format(totalIncome)}</td>
              </tr>
              <tr className="account-section expense">
                <td colSpan={4}>EXPENSES</td>
              </tr>
              {expenseGroups.map((group) => {
                const subtotal = group.rows.reduce(
                  (sum, expense) => sum + expense.amount,
                  0,
                );
                const subcategories = categories.filter(
                  (category) => category.mainCategory === group.mainCategory,
                );
                return (
                  <FragmentAccount key={group.key}>
                    <tr className="account-group">
                      <td>
                        <button
                          className="group-toggle"
                          onClick={() => toggle(group.key)}
                          aria-expanded={expanded.has(group.key)}
                        >
                          {expanded.has(group.key) ? "−" : "+"}
                        </button>
                        <b>{group.label}</b>
                      </td>
                      <td>{group.rows.length} transaction(s)</td>
                      <td>
                        {fmtMonth(fromMonth)} – {fmtMonth(toMonth)}
                      </td>
                      <td>
                        <b>{amountOnly.format(subtotal)}</b>
                      </td>
                    </tr>
                    {expanded.has(group.key) &&
                      subcategories.map((category) => {
                        const subRows = group.rows.filter(
                          (expense) => expense.categoryId === category.id,
                        );
                        const subKey = `${group.key}-${category.id}`;
                        return (
                          <FragmentAccount key={subKey}>
                            <tr className="account-subgroup">
                              <td>
                                <button
                                  className="group-toggle small"
                                  onClick={() => toggle(subKey)}
                                  aria-expanded={expanded.has(subKey)}
                                >
                                  {expanded.has(subKey) ? "−" : "+"}
                                </button>
                                <span>{category.name}</span>
                              </td>
                              <td>{subRows.length} transaction(s)</td>
                              <td>Approved</td>
                              <td>
                                {amountOnly.format(
                                  subRows.reduce(
                                    (sum, expense) => sum + expense.amount,
                                    0,
                                  ),
                                )}
                              </td>
                            </tr>
                            {expanded.has(subKey) &&
                              subRows
                                .sort((a, b) =>
                                  b.transactionDate.localeCompare(
                                    a.transactionDate,
                                  ),
                                )
                                .map((expense) => (
                                  <tr
                                    className="account-detail level-two"
                                    key={`${subKey}-${expense.id}`}
                                  >
                                    <td>
                                      <span className="tree-line">↳</span>
                                      {expense.remarks || expense.categoryName}
                                    </td>
                                    <td>
                                      {expense.transactionId} ·{" "}
                                      {expense.personPaidName}
                                    </td>
                                    <td>{fmtDate(expense.transactionDate)}</td>
                                    <td>{amountOnly.format(expense.amount)}</td>
                                  </tr>
                                ))}
                          </FragmentAccount>
                        );
                      })}
                  </FragmentAccount>
                );
              })}
              <tr className="account-total expense">
                <td colSpan={3}>TOTAL EXPENSES</td>
                <td>{amountOnly.format(totalExpenses)}</td>
              </tr>
              <tr
                className={`account-net ${netIncome < 0 ? "negative" : "positive"}`}
              >
                <td colSpan={3}>NET INCOME</td>
                <td>{amountOnly.format(netIncome)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      {exportOpen && <div className="backdrop"><div className="modal paymentmodal payment-export-modal"><ModalHead tag="FINANCIAL SUMMARY" title="Print / Export Financial Summary" text={`Export the selected period from ${fmtMonth(periodFrom)} to ${fmtMonth(periodTo)}.`} close={() => setExportOpen(false)} /><section className="formgrid two payment-export-filters"><label>Information<select value={exportScope} onChange={(event) => setExportScope(event.target.value as typeof exportScope)}>{["All", "Income", "Expenses", "Net Income"].map((value) => <option key={value}>{value}</option>)}</select></label>{(exportScope === "All" || exportScope === "Expenses") && <label>Expense categories<select multiple size={5} value={exportCategories} onChange={(event) => setExportCategories(Array.from(event.target.selectedOptions, (option) => option.value))}>{expenseGroups.map((group) => <option key={group.mainCategory}>{group.label}</option>)}</select><small>Select one or more; leave empty for all.</small></label>}</section><div className="payment-export-summary"><b>{financialExportData().rows.length}</b> summary row(s) will be exported.</div><div className="modalactions"><button onClick={() => { setExportScope("All"); setExportCategories([]); }}>Clear filters</button><button onClick={() => setExportOpen(false)}>Cancel</button><button className="secondary" disabled={!financialExportData().rows.length} onClick={() => void exportFinancialPdf()}>Download PDF</button><button className="primary" disabled={!financialExportData().rows.length} onClick={() => void exportFinancialSpreadsheet()}>Export Spreadsheet</button></div></div></div>}
    </div>
  );
}

function FinancialMonthlyMatrix({
  months,
  incomeGroups,
  expenses,
  categories,
  expanded,
  toggle,
  title,
}: {
  months: string[];
  incomeGroups: { key: string; label: string; rows: Payment[] }[];
  expenses: Expense[];
  categories: ExpenseCategory[];
  expanded: Set<string>;
  toggle: (key: string) => void;
  title: string;
}) {
  const paymentAmount = (rows: Payment[], month: string) =>
    rows
      .filter(
        (payment) => (payment.month || payment.paidDate.slice(0, 7)) === month,
      )
      .reduce((sum, payment) => sum + payment.paidAmount, 0);
  const expenseAmount = (rows: Expense[], month: string) =>
    rows
      .filter((expense) => expense.transactionDate.slice(0, 7) === month)
      .reduce((sum, expense) => sum + expense.amount, 0);
  const orderedMainCategories = expenseMainCategories.filter((main) =>
    categories.some((category) => category.mainCategory === main),
  );
  const totalIncomeForMonth = (month: string) =>
    incomeGroups.reduce(
      (sum, group) => sum + paymentAmount(group.rows, month),
      0,
    );
  const totalExpensesForMonth = (month: string) =>
    expenseAmount(expenses, month);
  const rowTotal = (values: number[]) =>
    values.reduce((sum, value) => sum + value, 0);
  const matrixWidth = `${230 + months.length * 110 + 125}px`;
  return (
    <div className="panel financial-matrix-panel">
      <div className="financial-matrix-title">
        <b>{title}</b>
        <span>Security Deposits excluded · Approved expenses only</span>
      </div>
      <div className="tablewrap">
        <table
          className={`financial-monthly-table ${months.length === 12 ? "full-period" : "short-period"}`}
          style={{ width: matrixWidth }}
        >
          <colgroup>
            <col style={{ width: 230 }} />
            {months.map((month) => <col key={month} style={{ width: 110 }} />)}
            <col style={{ width: 125 }} />
          </colgroup>
          <thead>
            <tr>
              <th>ACCOUNT / CATEGORY</th>
              {months.map((month) => (
                <th key={month}>
                  {fmtMonth(month).split(" ")[0]}
                  <small>{month.slice(0, 4)}</small>
                </th>
              ))}
              <th>PERIOD TOTAL</th>
            </tr>
          </thead>
          <tbody>
            <tr className="financial-matrix-section income">
              <td colSpan={months.length + 2}>INCOME</td>
            </tr>
            {incomeGroups.map((group) => {
              const values = months.map((month) =>
                paymentAmount(group.rows, month),
              );
              return (
                <tr key={group.key}>
                  <td>
                    <b>{group.label}</b>
                  </td>
                  {values.map((value, index) => (
                    <td key={months[index]}>{amountOnly.format(value)}</td>
                  ))}
                  <td>
                    <b>{amountOnly.format(rowTotal(values))}</b>
                  </td>
                </tr>
              );
            })}
            <tr className="financial-matrix-total income">
              <td>TOTAL INCOME</td>
              {months.map((month) => (
                <td key={month}>{amountOnly.format(totalIncomeForMonth(month))}</td>
              ))}
              <td>{amountOnly.format(rowTotal(months.map(totalIncomeForMonth)))}</td>
            </tr>
            <tr className="financial-matrix-section expense">
              <td colSpan={months.length + 2}>EXPENSES</td>
            </tr>
            {orderedMainCategories.map((mainCategory) => {
              const key = `matrix-${mainCategory}`;
              const categoryIds = categories
                .filter((category) => category.mainCategory === mainCategory)
                .map((category) => category.id);
              const rows = expenses.filter((expense) =>
                categoryIds.includes(expense.categoryId),
              );
              const values = months.map((month) => expenseAmount(rows, month));
              return (
                <FragmentAccount key={key}>
                  <tr className="financial-matrix-group">
                    <td>
                      <button
                        className="group-toggle"
                        onClick={() => toggle(key)}
                        aria-expanded={expanded.has(key)}
                      >
                        {expanded.has(key) ? "−" : "+"}
                      </button>
                      <b>{mainCategory}</b>
                    </td>
                    {values.map((value, index) => (
                      <td key={months[index]}>{amountOnly.format(value)}</td>
                    ))}
                    <td>
                      <b>{amountOnly.format(rowTotal(values))}</b>
                    </td>
                  </tr>
                  {expanded.has(key) &&
                    categories
                      .filter(
                        (category) => category.mainCategory === mainCategory,
                      )
                      .map((category) => {
                        const subRows = rows.filter(
                          (expense) => expense.categoryId === category.id,
                        );
                        const subValues = months.map((month) =>
                          expenseAmount(subRows, month),
                        );
                        return (
                          <tr
                            className="financial-matrix-subgroup"
                            key={`${key}-${category.id}`}
                          >
                            <td>
                              {category.code && <small>{category.code}</small>}
                              <span>{category.name}</span>
                            </td>
                            {subValues.map((value, index) => (
                              <td key={months[index]}>{amountOnly.format(value)}</td>
                            ))}
                            <td>{amountOnly.format(rowTotal(subValues))}</td>
                          </tr>
                        );
                      })}
                </FragmentAccount>
              );
            })}
            <tr className="financial-matrix-total expense">
              <td>TOTAL EXPENSES</td>
              {months.map((month) => (
                <td key={month}>{amountOnly.format(totalExpensesForMonth(month))}</td>
              ))}
              <td>
                {amountOnly.format(rowTotal(months.map(totalExpensesForMonth)))}
              </td>
            </tr>
            <tr className="financial-matrix-net">
              <td>NET INCOME</td>
              {months.map((month) => (
                <td key={month}>
                  {amountOnly.format(
                    totalIncomeForMonth(month) - totalExpensesForMonth(month),
                  )}
                </td>
              ))}
              <td>
                {amountOnly.format(
                  rowTotal(
                    months.map(
                      (month) =>
                        totalIncomeForMonth(month) -
                        totalExpensesForMonth(month),
                    ),
                  ),
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FragmentAccount({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
function ExpensesView({
  categories,
  expenses,
  staff,
  search,
  categoryAdded,
  categoryUpdated,
  categoryDeleted,
  expenseAdded,
  expenseUpdated,
  expenseDeleted,
}: {
  categories: ExpenseCategory[];
  expenses: Expense[];
  staff: Staff[];
  search: string;
  categoryAdded: (category: ExpenseCategory) => void;
  categoryUpdated: (category: ExpenseCategory) => void;
  categoryDeleted: (id: number) => void;
  expenseAdded: (expense: Expense) => void;
  expenseUpdated: (expense: Expense) => void;
  expenseDeleted: (id: number, payrollId?: number | null) => void;
}) {
  const [tab, setTab] = useState<
    "categories" | "entry" | "petty-cash" | "summary"
  >("entry");
  const [addingExpense, setAddingExpense] = useState(false);
  const [addingPettyCashDeposit, setAddingPettyCashDeposit] = useState(false);
  const [pettyCashDeposits, setPettyCashDeposits] = useState<
    PettyCashDeposit[]
  >([]);
  const [bankSources, setBankSources] = useState<BankSource[]>([]);
  const [reviewingPettyDeposit, setReviewingPettyDeposit] =
    useState<PettyCashDeposit | null>(null);
  const [pettySort, setPettySort] = useState<{
    key: "transaction" | "date" | "category" | "amount" | "person";
    direction: "asc" | "desc";
  }>({ key: "date", direction: "desc" });
  const [reviewing, setReviewing] = useState<Expense | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [newMainCategory, setNewMainCategory] = useState("Utilities");
  const [categoryError, setCategoryError] = useState("");
  const [expenseExport, setExpenseExport] = useState<
    "entry" | "petty-cash" | "summary" | null
  >(null);
  const [expenseExportFilters, setExpenseExportFilters] = useState({
    from: "",
    to: "",
    mainCategories: [] as string[],
    subCategories: [] as string[],
    people: [] as string[],
    methods: [] as string[],
    statuses: [] as string[],
  });
  const [summaryStart, setSummaryStart] = useState("2026-01");
  const [summaryEnd, setSummaryEnd] = useState("2026-12");
  const [expandedCategoryGroups, setExpandedCategoryGroups] = useState<
    Set<string>
  >(new Set());
  const months = monthRange(summaryStart, summaryEnd).slice(0, 12);
  const changeSummaryStart = (value: string) => {
    setSummaryStart(value);
    if (
      !summaryEnd ||
      summaryEnd < value ||
      monthRange(value, summaryEnd).length > 12
    ) {
      setSummaryEnd(addMonths(value, 11));
    }
  };
  const changeSummaryEnd = (value: string) => {
    if (
      value >= summaryStart &&
      monthRange(summaryStart, value).length <= 12
    ) {
      setSummaryEnd(value);
    }
  };
  useEffect(() => {
    fetch("/api/v1/petty-cash")
      .then((response) => response.json())
      .then(
        (result) => result.deposits && setPettyCashDeposits(result.deposits),
      )
      .catch(() => {});
    fetch("/api/v1/bank-reconciliation")
      .then((response) => response.json())
      .then((result) => result.sources && setBankSources(result.sources))
      .catch(() => {});
  }, []);
  const bankSource = (sourceType: BankSource["sourceType"], recordId: number) =>
    bankSources.find(
      (source) =>
        source.sourceType === sourceType && source.recordId === recordId,
    );
  const expenseLedgerStatus = (expense: Expense) => {
    if (expense.approvalStatus !== "Approved")
      return "Unapproved Transaction";
    if (expense.settlingMethod === "Petty Cash") return "Approved";
    const reconciliation = bankSource("Expense", expense.id);
    return reconciliation?.bankTransactionId &&
      reconciliation.reconciledAmount + 0.01 >= expense.amount
      ? "Verified"
      : "Unverified";
  };
  const filtered = expenses.filter((expense) =>
    `${expense.transactionId} ${categories.find((category) => category.id === expense.categoryId)?.mainCategory || ""} ${expense.categoryName} ${expense.personPaidName} ${expense.settlingMethod} ${expense.approvalStatus}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const addCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCategoryError("");
    const categoryName = newCategory.trim();
    if (!categoryName) {
      setCategoryError("Enter a sub-category name before adding the expense category.");
      return;
    }
    const response = await fetch("/api/v1/expenses/categories", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        mainCategory: newMainCategory,
        name: categoryName,
      }),
    });
    const result = await response.json();
    if (!response.ok)
      return setCategoryError(result.error || "Unable to add category");
    categoryAdded(result.category);
    setNewCategory("");
  };
  const toggleCategory = async (category: ExpenseCategory) => {
    const response = await fetch("/api/v1/expenses/categories", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: category.id, active: !category.active }),
    });
    const result = await response.json();
    if (response.ok) categoryUpdated(result.category);
  };
  const editCategory = async (category: ExpenseCategory) => {
    const name = window.prompt("Expense sub-category name", category.name);
    if (name === null) return;
    const mainCategory = window.prompt(
      `Main category (${expenseMainCategories.join(", ")})`,
      category.mainCategory,
    );
    if (mainCategory === null) return;
    setCategoryError("");
    const response = await fetch("/api/v1/expenses/categories", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: category.id, name, mainCategory }),
    });
    const result = await response.json();
    if (!response.ok) return setCategoryError(result.error || "Unable to edit category");
    categoryUpdated(result.category);
  };
  const deleteCategory = async (category: ExpenseCategory) => {
    if (!window.confirm(`Delete ${category.name}?`)) return;
    setCategoryError("");
    const response = await fetch(`/api/v1/expenses/categories?id=${category.id}`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) return setCategoryError(result.error || "Unable to delete category");
    categoryDeleted(category.id);
  };
  const approved = expenses.filter(
    (expense) => expense.approvalStatus === "Approved",
  );
  const approvedPettyCashExpenses = approved.filter(
    (expense) => expense.settlingMethod === "Petty Cash",
  );
  const pettyCashExpenses = expenses.filter(
    (expense) => expense.settlingMethod === "Petty Cash",
  );
  const approvedPettyDeposits = pettyCashDeposits.filter(
    (deposit) => deposit.approvalStatus === "Approved",
  );
  const pettyCashBalance =
    approvedPettyDeposits.reduce((sum, deposit) => sum + deposit.amount, 0) -
    approvedPettyCashExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const pettyCashRows = [
    ...pettyCashDeposits.map((deposit) => ({
      kind: "deposit" as const,
      transaction: deposit.transactionId,
      date: deposit.transactionDate,
      category: deposit.category,
      amount: deposit.amount,
      person: "N/A",
      method: "N/A",
      status: deposit.approvalStatus,
      deposit,
    })),
    ...pettyCashExpenses.map((expense) => ({
      kind: "expense" as const,
      transaction: expense.transactionId,
      date: expense.transactionDate,
      category: expense.categoryName,
      amount: expense.amount,
      person: expense.personPaidName,
      method: expense.settlingMethod,
      status: expense.approvalStatus,
      expense,
    })),
  ].sort((left, right) => {
    const leftValue = left[pettySort.key];
    const rightValue = right[pettySort.key];
    const result =
      typeof leftValue === "number" && typeof rightValue === "number"
        ? leftValue - rightValue
        : String(leftValue).localeCompare(String(rightValue), undefined, {
            numeric: true,
          });
    return (pettySort.direction === "asc" ? 1 : -1) * result;
  });
  const changePettySort = (key: typeof pettySort.key) =>
    setPettySort((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );
  const pettySortHead = (key: typeof pettySort.key, label: string) => (
    <button className="table-sort-head" onClick={() => changePettySort(key)}>
      {label}
      <span>
        {pettySort.key === key
          ? pettySort.direction === "asc"
            ? "▲"
            : "▼"
          : "↕"}
      </span>
    </button>
  );
  const expenseExportData = () => {
    if (expenseExport === "summary") {
      return {
        title: "Expense Summary",
        headers: ["MAIN CATEGORY", "SUB-CATEGORY", ...months.map(fmtMonth), "TOTAL"],
        rows: categories
          .filter((category) => (!expenseExportFilters.mainCategories.length || expenseExportFilters.mainCategories.includes(category.mainCategory)) && (!expenseExportFilters.subCategories.length || expenseExportFilters.subCategories.includes(category.name)))
          .map((category) => {
            const values = months.map((month) => approved.filter((expense) => expense.categoryId === category.id && expense.transactionDate.slice(0, 7) === month).reduce((sum, expense) => sum + expense.amount, 0));
            return [category.mainCategory, category.name, ...values, values.reduce((sum, value) => sum + value, 0)];
          }),
      };
    }
    if (expenseExport === "petty-cash") {
      return {
        title: "Petty Cash Ledger",
        headers: ["TRANSACTION ID", "DATE", "CATEGORY", "AMOUNT", "PERSON PAID", "TYPE"],
        rows: pettyCashRows
          .filter((row) => (!expenseExportFilters.from || row.date >= expenseExportFilters.from) && (!expenseExportFilters.to || row.date <= expenseExportFilters.to) && (!expenseExportFilters.subCategories.length || expenseExportFilters.subCategories.includes(row.category)) && (!expenseExportFilters.people.length || expenseExportFilters.people.includes(row.person)) && (!expenseExportFilters.methods.length || expenseExportFilters.methods.includes(row.method)) && (!expenseExportFilters.statuses.length || expenseExportFilters.statuses.includes(row.status)))
          .map((row) => [row.transaction, fmtCompactDate(row.date), row.category, row.amount, row.person, row.kind === "deposit" ? "Deposit" : "Expense"]),
      };
    }
    return {
      title: "Expense Ledger",
      headers: ["TRANSACTION ID", "DATE", "CATEGORY", "SUB-CATEGORY", "AMOUNT", "PERSON PAID", "METHOD", "STATUS", "EVIDENCE"],
      rows: filtered
        .filter((expense) => {
          const mainCategory = categories.find((category) => category.id === expense.categoryId)?.mainCategory || "";
          return (!expenseExportFilters.from || expense.transactionDate >= expenseExportFilters.from) && (!expenseExportFilters.to || expense.transactionDate <= expenseExportFilters.to) && (!expenseExportFilters.mainCategories.length || expenseExportFilters.mainCategories.includes(mainCategory)) && (!expenseExportFilters.subCategories.length || expenseExportFilters.subCategories.includes(expense.categoryName)) && (!expenseExportFilters.people.length || expenseExportFilters.people.includes(expense.personPaidName)) && (!expenseExportFilters.methods.length || expenseExportFilters.methods.includes(expense.settlingMethod)) && (!expenseExportFilters.statuses.length || expenseExportFilters.statuses.includes(expenseLedgerStatus(expense)));
        })
        .map((expense) => [expense.transactionId, fmtCompactDate(expense.transactionDate), categories.find((category) => category.id === expense.categoryId)?.mainCategory || "", expense.categoryName, expense.amount, expense.personPaidName, expense.settlingMethod, expenseLedgerStatus(expense), expense.evidenceName || ""]),
    };
  };
  const exportExpensesSpreadsheet = async () => {
    const XLSX = await import("xlsx");
    const data = expenseExportData();
    const sheet = XLSX.utils.aoa_to_sheet([data.headers, ...data.rows]);
    sheet["!cols"] = data.headers.map((header) => ({ wch: Math.max(14, Math.min(28, header.length + 5)) }));
    sheet["!autofilter"] = { ref: `A1:${XLSX.utils.encode_col(data.headers.length - 1)}${Math.max(1, data.rows.length + 1)}` };
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, data.title.slice(0, 31));
    XLSX.writeFile(book, `Perk-Haven-${data.title.replaceAll(" ", "-")}-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };
  const exportExpensesPdf = async () => {
    const { jsPDF } = await import("jspdf");
    const data = expenseExportData();
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth(), pageHeight = pdf.internal.pageSize.getHeight(), margin = 8;
    const width = (pageWidth - margin * 2) / data.headers.length;
    const drawHeader = (page: number) => {
      pdf.setFillColor(15, 48, 78); pdf.rect(0, 0, pageWidth, 21, "F");
      pdf.setTextColor(255, 255, 255); pdf.setFont("helvetica", "bold"); pdf.setFontSize(13); pdf.text("THE PERK HAVEN HOSTEL", margin, 8);
      pdf.setFontSize(9); pdf.text(data.title.toUpperCase(), margin, 15); pdf.setFontSize(7); pdf.text(`Page ${page}`, pageWidth - margin, 15, { align: "right" });
      pdf.setFillColor(229, 237, 246); pdf.rect(margin, 25, pageWidth - margin * 2, 11, "F"); pdf.setTextColor(15, 48, 78); pdf.setFontSize(5.8);
      data.headers.forEach((header, index) => pdf.text(header, margin + width * index + width / 2, 31.5, { align: "center", maxWidth: width - 2 }));
      return 36;
    };
    let page = 1, y = drawHeader(page);
    data.rows.forEach((row, rowIndex) => {
      if (y + 8 > pageHeight - 8) { pdf.addPage("a4", "landscape"); page += 1; y = drawHeader(page); }
      if (rowIndex % 2) { pdf.setFillColor(247, 249, 252); pdf.rect(margin, y, pageWidth - margin * 2, 8, "F"); }
      pdf.setTextColor(20, 39, 61); pdf.setFont("helvetica", "normal"); pdf.setFontSize(5.8);
      row.forEach((value, index) => pdf.text(typeof value === "number" ? `LKR ${value.toLocaleString("en-LK")}` : String(value || "—"), margin + width * index + 1, y + 5, { maxWidth: width - 2 }));
      y += 8;
    });
    downloadBlob(pdf.output("blob"), `Perk-Haven-${data.title.replaceAll(" ", "-")}.pdf`);
  };
  const deleteExpense = async (expense: Expense) => {
    if (
      !window.confirm(`Delete ${expense.transactionId}? This cannot be undone.`)
    )
      return;
    const response = await fetch(`/api/v1/expenses?id=${expense.id}`, {
      method: "DELETE",
    });
    const result = await response.json();
    if (!response.ok)
      return setCategoryError(result.error || "Unable to delete expense");
    expenseDeleted(expense.id, result.payrollId);
    setBankSources((current) =>
      current.filter(
        (source) =>
          !(source.sourceType === "Expense" && source.recordId === expense.id),
      ),
    );
  };
  return (
    <div className="content expense-view">
      <div className="expense-tab-toolbar">
        <div
          className="payment-tabs expense-tabs"
          role="tablist"
          aria-label="Hostel expense views"
        >
          <button
            className={tab === "categories" ? "active" : ""}
            onClick={() => setTab("categories")}
          >
            Expense Categories
          </button>
          <button
            className={tab === "entry" ? "active" : ""}
            onClick={() => setTab("entry")}
          >
            Expense Ledger
          </button>
          <button
            className={tab === "petty-cash" ? "active" : ""}
            onClick={() => setTab("petty-cash")}
          >
            Petty Cash
          </button>
          <button
            className={tab === "summary" ? "active" : ""}
            onClick={() => setTab("summary")}
          >
            Expense Summary
          </button>
        </div>
        {tab === "categories" && (
          <form
            className="category-add category-hierarchy-add category-add-inline"
            onSubmit={addCategory}
          >
            <label>
              Main category
              <select
                value={newMainCategory}
                onChange={(event) => setNewMainCategory(event.target.value)}
              >
                {expenseMainCategories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>
            <label>
              Sub-category
              <input
                value={newCategory}
                onChange={(event) => setNewCategory(event.target.value)}
                placeholder="Enter sub-category name"
                required
              />
            </label>
            <button className="primary" type="submit">＋ Add Expense Category</button>
          </form>
        )}
        {tab === "entry" && (
          <div className="toolbar-actions"><button className="primary" onClick={() => setAddingExpense(true)}>＋ Add Expenses</button><button className="secondary" onClick={() => setExpenseExport("entry")}>⇩ Print / Export</button></div>
        )}
        {tab === "petty-cash" && (
          <div className="toolbar-actions"><button className="primary" onClick={() => setAddingPettyCashDeposit(true)}>＋ Add Petty Cash Deposit</button><button className="secondary" onClick={() => setExpenseExport("petty-cash")}>⇩ Print / Export</button></div>
        )}
        {tab === "summary" && (
          <div className="expense-summary-period" aria-label="Expense summary period">
            <label className="month-control">
              From
              <input
                type="month"
                value={summaryStart}
                max={summaryEnd}
                onChange={(event) => changeSummaryStart(event.target.value)}
              />
            </label>
            <label className="month-control">
              To
              <input
                type="month"
                value={summaryEnd}
                min={summaryStart}
                max={addMonths(summaryStart, 11)}
                onChange={(event) => changeSummaryEnd(event.target.value)}
              />
            </label>
            <button className="secondary" onClick={() => setExpenseExport("summary")}>⇩ Print / Export</button>
          </div>
        )}
      </div>
      {categoryError && <p className="form-error">⚠ {categoryError}</p>}

      {tab === "categories" && (
        <section>
          <div className="panel tablewrap">
            <table className="category-table">
              <thead>
                <tr>
                  <th>CODE</th>
                  <th>MAIN CATEGORY</th>
                  <th>SUB-CATEGORY</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {expenseMainCategories.map((mainCategory) => {
                  const query = search.trim().toLowerCase();
                  const allSubcategories = categories
                    .filter(
                      (category) => category.mainCategory === mainCategory,
                    )
                    .sort((a, b) => (a.code || "").localeCompare(b.code || ""));
                  const mainMatches =
                    mainCategory.toLowerCase().includes(query) ||
                    (expenseMainCategoryCodes[mainCategory] || "")
                      .toLowerCase()
                      .includes(query);
                  const shownSubcategories =
                    !query || mainMatches
                      ? allSubcategories
                      : allSubcategories.filter((category) =>
                          `${category.code || ""} ${category.name}`
                            .toLowerCase()
                            .includes(query),
                        );
                  if (query && !mainMatches && !shownSubcategories.length)
                    return null;
                  const open =
                    expandedCategoryGroups.has(mainCategory) || Boolean(query);
                  return (
                    <FragmentAccount key={mainCategory}>
                      <tr
                        className="category-main-row"
                        onClick={() =>
                          setExpandedCategoryGroups((current) => {
                            const next = new Set(current);
                            if (next.has(mainCategory))
                              next.delete(mainCategory);
                            else next.add(mainCategory);
                            return next;
                          })
                        }
                      >
                        <td>
                          <b className="category-code main">
                            {expenseMainCategoryCodes[mainCategory]}
                          </b>
                        </td>
                        <td>
                          <button className="category-drill-button">
                            <span>{open ? "−" : "+"}</span>
                            {mainCategory}
                          </button>
                        </td>
                        <td>
                          {open
                            ? `${shownSubcategories.length} sub-categories shown`
                            : `${allSubcategories.length} sub-categories · click to view`}
                        </td>
                        <td>—</td>
                        <td>{open ? "Collapse" : "Expand"}</td>
                      </tr>
                      {open &&
                        shownSubcategories.map((category) => (
                          <tr className="category-sub-row" key={category.id}>
                            <td>
                              <b className="category-code">
                                {category.code || "Pending"}
                              </b>
                            </td>
                            <td>
                              <span className="category-tree">
                                ↳ {mainCategory}
                              </span>
                            </td>
                            <td>
                              <b>{category.name}</b>
                            </td>
                            <td>
                              <span
                                className={`status ${category.active ? "active" : "inactive"}`}
                              >
                                ● {category.active ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td>
                              <div className="admin-row-actions">
                                <button className="review-button" onClick={() => editCategory(category)}>Edit</button>
                                <button className="review-button" onClick={() => toggleCategory(category)}>{category.active ? "Deactivate" : "Activate"}</button>
                                <button className="danger-button" onClick={() => deleteCategory(category)}>Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </FragmentAccount>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "entry" && (
        <section>
          <div className="expense-stats">
            <article className="panel">
              <small>TOTAL RECORDED</small>
              <b>
                {cash.format(
                  expenses.reduce((sum, expense) => sum + expense.amount, 0),
                )}
              </b>
              <span>{expenses.length} transaction(s)</span>
            </article>
            <article className="panel">
              <small>PENDING MANAGEMENT REVIEW</small>
              <b>
                {
                  expenses.filter(
                    (expense) =>
                      expense.approvalStatus === "Pending" ||
                      expense.approvalStatus === "More Details Requested",
                  ).length
                }
              </b>
              <span>Approval cannot be set during entry</span>
            </article>
            <article className="panel">
              <small>APPROVED</small>
              <b>
                {cash.format(
                  approved.reduce((sum, expense) => sum + expense.amount, 0),
                )}
              </b>
              <span>Included in approved expense totals</span>
            </article>
          </div>
          <div className="panel tablewrap">
            <table className="expense-ledger-table">
              <thead>
                <tr>
                  <th>TRANSACTION ID</th>
                  <th>TRANSACTION DATE</th>
                  <th>CATEGORY</th>
                  <th>AMOUNT<small>(LKR)</small></th>
                  <th>PERSON PAID</th>
                  <th>METHOD</th>
                  <th>EVIDENCE</th>
                  <th>STATUS</th>
                  <th>BANK TRANSACTION ID</th>
                  <th>MANAGEMENT / ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((expense) => {
                  const bank = bankSource("Expense", expense.id);
                  const status = expenseLedgerStatus(expense);
                  return (
                    <tr key={expense.id}>
                      <td>
                        <b className="transaction-id">
                          {expense.transactionId}
                        </b>
                        <small>
                          Entered {fmtDate(expense.createdAt.slice(0, 10))}
                        </small>
                      </td>
                      <td>{fmtDate(expense.transactionDate)}</td>
                      <td>
                        <b>
                          {categories.find(
                            (category) => category.id === expense.categoryId,
                          )?.mainCategory || "Other"}
                        </b>
                        <small>{expense.categoryName}</small>
                      </td>
                      <td>
                        <b>{amountOnly.format(expense.amount)}</b>
                      </td>
                      <td>
                        <b>{expense.personPaidName}</b>
                        <small>{expense.personPaidStaffNo}</small>
                      </td>
                      <td>{expense.settlingMethod}</td>
                      <td>
                        <a
                          className="evidence-link"
                          href={`/api/v1/expenses/evidence?transactionId=${encodeURIComponent(expense.transactionId)}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {expense.evidenceName}
                        </a>
                      </td>
                      <td>
                        <span
                          className={`approval-status ${status.toLowerCase().replaceAll(" ", "-")}`}
                        >
                          {status}
                        </span>
                        {expense.approvalNote && (
                          <small>{expense.approvalNote}</small>
                        )}
                      </td>
                      <td>
                        {expense.settlingMethod === "Petty Cash" ? (
                          "N/A"
                        ) : bank?.bankTransactionId ? (
                          <b className="transaction-id">
                            {bank.bankTransactionId}
                          </b>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <div className="admin-row-actions">
                          <button
                            className="review-button"
                            onClick={() => setReviewing(expense)}
                          >
                            Review
                          </button>
                          <button
                            className="review-button"
                            onClick={() => setEditingExpense(expense)}
                          >
                            Edit
                          </button>
                          <button
                            className="danger-button"
                            onClick={() => deleteExpense(expense)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!filtered.length && (
                  <tr>
                    <td colSpan={10}>
                      No expense transactions match this view.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "petty-cash" && (
        <section>
          <div className="petty-cash-balance panel">
            <div>
              <small>CURRENT PETTY CASH BALANCE</small>
              <b className={pettyCashBalance < 0 ? "negative" : ""}>
                {cash.format(pettyCashBalance)}
              </b>
              <span>
                Total deposits less Management-approved Petty Cash expenses
              </span>
            </div>
            <div className="petty-cash-breakdown">
              <span>
                <small>APPROVED PETTY CASH DEPOSITS</small>
                <b>
                  {cash.format(
                    approvedPettyDeposits.reduce(
                      (sum, deposit) => sum + deposit.amount,
                      0,
                    ),
                  )}
                </b>
              </span>
              <span>
                <small>APPROVED EXPENSES</small>
                <b>
                  {cash.format(
                    approvedPettyCashExpenses.reduce(
                      (sum, expense) => sum + expense.amount,
                      0,
                    ),
                  )}
                </b>
              </span>
            </div>
          </div>
          <div className="panel tablewrap">
            <table className="petty-cash-table">
              <thead>
                <tr>
                  <th>{pettySortHead("transaction", "TRANSACTION ID")}</th>
                  <th>{pettySortHead("date", "TRANSACTION DATE")}</th>
                  <th>{pettySortHead("category", "CATEGORY")}</th>
                  <th>{pettySortHead("amount", "AMOUNT (LKR)")}</th>
                  <th>{pettySortHead("person", "PERSON PAID")}</th>
                  <th>EVIDENCE</th>
                  <th>STATUS / ACTION</th>
                  <th>BANK TRANSACTION ID</th>
                </tr>
              </thead>
              <tbody>
                {pettyCashRows.map((row) => {
                  const bank = bankSource(
                    row.kind === "deposit" ? "Petty Cash Deposit" : "Expense",
                    row.kind === "deposit" ? row.deposit.id : row.expense.id,
                  );
                  return (
                    <tr
                      key={`${row.kind}-${row.transaction}`}
                      className={row.kind}
                    >
                      <td>
                        {row.kind === "expense" ? (
                          <button
                            className="student-name-link"
                            onClick={() => {
                              setTab("entry");
                              setReviewing(row.expense);
                            }}
                          >
                            {row.transaction}
                          </button>
                        ) : (
                          <b className="transaction-id">{row.transaction}</b>
                        )}
                      </td>
                      <td>{fmtDate(row.date)}</td>
                      <td>
                        <b>{row.category}</b>
                      </td>
                      <td>
                        <b
                          className={
                            row.kind === "deposit" ? "petty-in" : "petty-out"
                          }
                        >
                          {row.kind === "deposit" ? "+" : "−"}{" "}
                          {amountOnly.format(row.amount)}
                        </b>
                      </td>
                      <td>{row.person}</td>
                      <td>
                        {row.kind === "deposit" ? (
                          <a
                            className="evidence-link"
                            href={`/api/v1/petty-cash/evidence?transactionId=${encodeURIComponent(row.transaction)}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {row.deposit.evidenceName}
                          </a>
                        ) : (
                          <a
                            className="evidence-link"
                            href={`/api/v1/expenses/evidence?transactionId=${encodeURIComponent(row.transaction)}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {row.expense.evidenceName}
                          </a>
                        )}
                      </td>
                      <td>
                        {row.kind === "deposit" ? (
                          <>
                            <span
                              className={`approval-status ${row.deposit.approvalStatus.toLowerCase()}`}
                            >
                              {row.deposit.approvalStatus}
                            </span>
                            {row.deposit.approvalStatus === "Approved" ? (
                              <small>Locked · Owner only</small>
                            ) : (
                              <button
                                className="review-button"
                                onClick={() =>
                                  setReviewingPettyDeposit(row.deposit)
                                }
                              >
                                Management review
                              </button>
                            )}
                          </>
                        ) : (
                          <>
                            <span
                              className={`approval-status ${expenseLedgerStatus(row.expense).toLowerCase().replaceAll(" ", "-")}`}
                            >
                              {expenseLedgerStatus(row.expense)}
                            </span>
                            {row.expense.approvalStatus !== "Approved" && (
                              <button
                                className="review-button"
                                onClick={() => {
                                  setTab("entry");
                                  setReviewing(row.expense);
                                }}
                              >
                                Management review
                              </button>
                            )}
                          </>
                        )}
                      </td>
                      <td>
                        {row.kind === "expense" ? (
                          "N/A"
                        ) : bank?.bankTransactionId ? (
                          <b className="transaction-id">
                            {bank.bankTransactionId}
                          </b>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
                {!pettyCashRows.length && (
                  <tr>
                    <td colSpan={8}>
                      No Petty Cash transactions have been recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "summary" && (
        <section>
          <div className="panel tablewrap">
            <table
              className="expense-summary-table"
              style={{
                width:
                  months.length === 12
                    ? "100%"
                    : `calc(${(months.length / 12) * 100}% + ${520 * (1 - months.length / 12)}px)`,
              }}
            >
              <colgroup>
                <col className="expense-main-category" />
                <col className="expense-sub-category" />
                {months.map((month) => (
                  <col className="expense-month" key={`expense-width-${month}`} />
                ))}
                <col className="expense-total" />
              </colgroup>
              <thead>
                <tr>
                  <th>MAIN CATEGORY</th>
                  <th>SUB-CATEGORY</th>
                  {months.map((month) => (
                    <th key={month}>{fmtMonth(month)}</th>
                  ))}
                  <th>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => {
                  const values = months.map((month) =>
                    approved
                      .filter(
                        (expense) =>
                          expense.categoryId === category.id &&
                          expense.transactionDate.slice(0, 7) === month,
                      )
                      .reduce((sum, expense) => sum + expense.amount, 0),
                  );
                  return (
                    <tr key={category.id}>
                      <td>
                        <b>{category.mainCategory}</b>
                      </td>
                      <td>{category.name}</td>
                      {values.map((value, index) => (
                        <td key={months[index]}>
                          {value ? value.toLocaleString("en-LK") : "—"}
                        </td>
                      ))}
                      <td>
                        <b>
                          {values
                            .reduce((sum, value) => sum + value, 0)
                            .toLocaleString("en-LK")}
                        </b>
                      </td>
                    </tr>
                  );
                })}
                <tr className="summary-total">
                  <td colSpan={2}>
                    <b>TOTAL APPROVED EXPENSES</b>
                  </td>
                  {months.map((month) => (
                    <td key={month}>
                      <b>
                        {approved
                          .filter(
                            (expense) =>
                              expense.transactionDate.slice(0, 7) === month,
                          )
                          .reduce((sum, expense) => sum + expense.amount, 0)
                          .toLocaleString("en-LK")}
                      </b>
                    </td>
                  ))}
                  <td>
                    <b>
                      {approved
                        .filter((expense) =>
                          months.includes(
                            expense.transactionDate.slice(0, 7),
                          ),
                        )
                        .reduce((sum, expense) => sum + expense.amount, 0)
                        .toLocaleString("en-LK")}
                    </b>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}
      {expenseExport && (
        <div className="backdrop"><div className="modal paymentmodal payment-export-modal">
          <ModalHead tag="EXPENSE MANAGEMENT" title={`Print / Export ${expenseExportData().title}`} text="Filter the records before downloading the PDF or spreadsheet. Leave fields blank to include all records." close={() => setExpenseExport(null)} />
          <section className="formgrid three payment-export-filters">
            {expenseExport !== "summary" && <><label>Date from<input type="date" value={expenseExportFilters.from} onChange={(event) => setExpenseExportFilters((current) => ({ ...current, from: event.target.value }))} /></label><label>Date to<input type="date" value={expenseExportFilters.to} onChange={(event) => setExpenseExportFilters((current) => ({ ...current, to: event.target.value }))} /></label></>}
            {expenseExport !== "petty-cash" && <label>Main category<select multiple size={4} value={expenseExportFilters.mainCategories} onChange={(event) => setExpenseExportFilters((current) => ({ ...current, mainCategories: Array.from(event.target.selectedOptions, (option) => option.value) }))}>{expenseMainCategories.map((value) => <option key={value}>{value}</option>)}</select><small>Select one or more; leave empty for all.</small></label>}
            <label>Sub-category<select multiple size={4} value={expenseExportFilters.subCategories} onChange={(event) => setExpenseExportFilters((current) => ({ ...current, subCategories: Array.from(event.target.selectedOptions, (option) => option.value) }))}>{[...new Set(expenseExport === "petty-cash" ? pettyCashRows.map((row) => row.category) : categories.filter((category) => !expenseExportFilters.mainCategories.length || expenseExportFilters.mainCategories.includes(category.mainCategory)).map((category) => category.name))].sort().map((value) => <option key={value}>{value}</option>)}</select><small>Select one or more; leave empty for all.</small></label>
            {expenseExport !== "summary" && <>
              <label>Person<select multiple size={4} value={expenseExportFilters.people} onChange={(event) => setExpenseExportFilters((current) => ({ ...current, people: Array.from(event.target.selectedOptions, (option) => option.value) }))}>{[...new Set(expenseExport === "petty-cash" ? pettyCashRows.map((row) => row.person) : filtered.map((expense) => expense.personPaidName))].sort().map((value) => <option key={value}>{value}</option>)}</select><small>Select one or more; leave empty for all.</small></label>
              <label>Method<select multiple size={4} value={expenseExportFilters.methods} onChange={(event) => setExpenseExportFilters((current) => ({ ...current, methods: Array.from(event.target.selectedOptions, (option) => option.value) }))}>{[...new Set(expenseExport === "petty-cash" ? pettyCashRows.map((row) => row.method) : filtered.map((expense) => expense.settlingMethod))].sort().map((value) => <option key={value}>{value}</option>)}</select><small>Select one or more; leave empty for all.</small></label>
              <label>Status<select multiple size={4} value={expenseExportFilters.statuses} onChange={(event) => setExpenseExportFilters((current) => ({ ...current, statuses: Array.from(event.target.selectedOptions, (option) => option.value) }))}>{[...new Set(expenseExport === "petty-cash" ? pettyCashRows.map((row) => row.status) : filtered.map(expenseLedgerStatus))].sort().map((value) => <option key={value}>{value}</option>)}</select><small>Select one or more; leave empty for all.</small></label>
            </>}
          </section>
          <div className="payment-export-summary"><b>{expenseExportData().rows.length}</b> record(s) will be exported.</div>
          <div className="modalactions"><button onClick={() => setExpenseExportFilters({ from: "", to: "", mainCategories: [], subCategories: [], people: [], methods: [], statuses: [] })}>Clear filters</button><button onClick={() => setExpenseExport(null)}>Cancel</button><button className="secondary" disabled={!expenseExportData().rows.length} onClick={() => void exportExpensesPdf()}>Download PDF</button><button className="primary" disabled={!expenseExportData().rows.length} onClick={() => void exportExpensesSpreadsheet()}>Export Spreadsheet</button></div>
        </div></div>
      )}
      {addingExpense && (
        <AddExpense
          categories={categories.filter((category) => category.active)}
          staff={staff.filter((member) => member.status === "Active")}
          close={() => setAddingExpense(false)}
          save={(expense) => {
            expenseAdded(expense);
            setAddingExpense(false);
          }}
        />
      )}
      {editingExpense && (
        <ExpenseEditModal
          expense={editingExpense}
          categories={categories}
          staff={staff}
          close={() => setEditingExpense(null)}
          save={(expense) => {
            expenseUpdated(expense);
            setEditingExpense(null);
            setBankSources((current) =>
              current.filter(
                (source) =>
                  !(
                    source.sourceType === "Expense" &&
                    source.recordId === expense.id
                  ),
              ),
            );
          }}
        />
      )}
      {addingPettyCashDeposit && (
        <PettyCashDepositModal
          close={() => setAddingPettyCashDeposit(false)}
          save={(deposit) => {
            setPettyCashDeposits((current) => [deposit, ...current]);
            setAddingPettyCashDeposit(false);
          }}
        />
      )}
      {reviewingPettyDeposit && (
        <PettyCashDepositApproval
          deposit={reviewingPettyDeposit}
          close={() => setReviewingPettyDeposit(null)}
          save={(deposit) => {
            setPettyCashDeposits((current) =>
              current.map((item) => (item.id === deposit.id ? deposit : item)),
            );
            setReviewingPettyDeposit(null);
          }}
        />
      )}
      {reviewing && (
        <ExpenseApproval
          expense={reviewing}
          close={() => setReviewing(null)}
          save={(expense) => {
            expenseUpdated(expense);
            setReviewing(null);
          }}
        />
      )}
    </div>
  );
}

function ExpenseEditModal({
  expense,
  categories,
  staff,
  close,
  save,
}: {
  expense: Expense;
  categories: ExpenseCategory[];
  staff: Staff[];
  close: () => void;
  save: (expense: Expense) => void;
}) {
  const [categoryId, setCategoryId] = useState(expense.categoryId),
    [amount, setAmount] = useState(expense.amount),
    [date, setDate] = useState(expense.transactionDate),
    [person, setPerson] = useState(expense.personPaidStaffNo),
    [method, setMethod] = useState(expense.settlingMethod),
    [remarks, setRemarks] = useState(expense.remarks),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/v1/expenses", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: "details",
          id: expense.id,
          categoryId,
          amount,
          transactionDate: date,
          personPaidStaffNo: person,
          settlingMethod: method,
          remarks,
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Unable to update expense");
      save(result.expense);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to update expense",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="backdrop">
      <form className="modal paymentmodal" onSubmit={submit}>
        <ModalHead
          tag="ADMIN EXPENSE EDIT"
          title={`Edit ${expense.transactionId}`}
          text="Changing a verified expense removes its bank reconciliation so it can be matched again."
          close={close}
        />
        <FormSection title="Expense details">
          <label>
            Category
            <select
              value={categoryId}
              onChange={(event) => setCategoryId(Number(event.target.value))}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.mainCategory} · {category.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Amount (LKR)
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(Number(event.target.value))}
              required
            />
          </label>
          <label>
            Transaction date
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </label>
          <label>
            Person paid
            <select
              value={person}
              onChange={(event) => setPerson(event.target.value)}
            >
              {staff.map((member) => (
                <option key={member.staffNo} value={member.staffNo}>
                  {member.firstName} {member.lastName}
                </option>
              ))}
            </select>
          </label>
          <label>
            Settling method
            <select
              value={method}
              onChange={(event) =>
                setMethod(event.target.value as Expense["settlingMethod"])
              }
            >
              <option>Bank Transfer</option>
              <option>Petty Cash</option>
            </select>
          </label>
          <label className="wide">
            Remarks
            <textarea
              rows={3}
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
            />
          </label>
          {error && <p className="form-error wide">⚠ {error}</p>}
        </FormSection>
        <Actions
          close={close}
          text={saving ? "Saving…" : "Save changes"}
          disabled={saving}
        />
      </form>
    </div>
  );
}

function PettyCashDepositModal({
  close,
  save,
}: {
  close: () => void;
  save: (deposit: PettyCashDeposit) => void;
}) {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/v1/petty-cash", {
        method: "POST",
        body: form,
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Unable to record petty cash deposit");
      save(result.deposit);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to record petty cash deposit",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="backdrop">
      <form className="modal paymentmodal" onSubmit={submit}>
        <ModalHead
          tag="PETTY CASH"
          title="Add Petty Cash Deposit"
          text="A PCD-[year]-0001 transaction ID will be generated automatically."
          close={close}
        />
        <FormSection title="Petty cash deposit details">
          <Field
            name="transactionDate"
            label="Transaction date"
            type="date"
            required
          />
          <Field
            name="amount"
            label="Amount (LKR)"
            type="number"
            min="0.01"
            step="0.01"
            required
          />
          <label>
            Category
            <input value="Petty Cash Deposit" readOnly />
          </label>
          <label>
            Person paid
            <input value="N/A" readOnly />
          </label>
          <label className="wide">
            Evidence
            <input name="evidence" type="file" accept="image/*,.pdf" required />
            <small>
              Attach a bank slip, receipt or other proof (maximum 10 MB).
            </small>
          </label>
          {error && <p className="form-error wide">⚠ {error}</p>}
        </FormSection>
        <Actions
          close={close}
          text={saving ? "Recording…" : "Record petty cash deposit"}
          disabled={saving}
        />
      </form>
    </div>
  );
}

function PettyCashDepositApproval({
  deposit,
  close,
  save,
}: {
  deposit: PettyCashDeposit;
  close: () => void;
  save: (deposit: PettyCashDeposit) => void;
}) {
  const [decision, setDecision] = useState<"Approved" | "Disapproved">(
    "Approved",
  );
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const response = await fetch("/api/v1/petty-cash", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: deposit.id,
        approvalStatus: decision,
        approvalNote: note,
        role: "Management",
      }),
    });
    const result = await response.json();
    if (!response.ok)
      return setError(result.error || "Unable to update approval");
    save(result.deposit);
  };
  return (
    <div className="backdrop">
      <form className="modal paymentmodal" onSubmit={submit}>
        <ModalHead
          tag="MANAGEMENT REVIEW"
          title={deposit.transactionId}
          text="Review the evidence before approving this Petty Cash deposit."
          close={close}
        />
        <FormSection title="Petty cash deposit approval">
          <label>
            Amount
            <input value={cash.format(deposit.amount)} readOnly />
          </label>
          <label>
            Transaction date
            <input value={fmtDate(deposit.transactionDate)} readOnly />
          </label>
          <label className="wide">
            Evidence
            <a
              className="evidence-link evidence-review"
              href={`/api/v1/petty-cash/evidence?transactionId=${encodeURIComponent(deposit.transactionId)}`}
              target="_blank"
              rel="noreferrer"
            >
              Open {deposit.evidenceName}
            </a>
          </label>
          <label>
            Decision
            <select
              value={decision}
              onChange={(event) =>
                setDecision(event.target.value as "Approved" | "Disapproved")
              }
            >
              <option>Approved</option>
              <option>Disapproved</option>
            </select>
          </label>
          <label className="wide">
            Management note
            <textarea
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </label>
          {error && <p className="form-error wide">⚠ {error}</p>}
          <div className="approval-entry-note wide">
            <b>Approved petty cash deposits are locked</b>
            <small>
              After approval, only an authenticated Owner account may change
              this record.
            </small>
          </div>
        </FormSection>
        <Actions close={close} text="Save decision" />
      </form>
    </div>
  );
}

function AddExpense({
  categories,
  staff,
  close,
  save,
  payrollPrefill,
}: {
  categories: ExpenseCategory[];
  staff: Staff[];
  close: () => void;
  save: (expense: Expense, payroll?: StaffPayroll) => void;
  payrollPrefill?: PayrollExpensePrefill;
}) {
  const [error, setError] = useState("");
  const [evidenceName, setEvidenceName] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    if (payroll && payrollPrefill) {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      doc.setFillColor(16, 48, 76);
      doc.rect(0, 0, 210, 35, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("THE PERK HAVEN", 18, 17);
      doc.setFontSize(9);
      doc.text("HOSTEL STAFF PAYSLIP", 18, 25);
      doc.setTextColor(18, 42, 66);
      doc.setFontSize(16);
      doc.text(`Payslip - ${fmtMonth(payroll.month)}`, 18, 49);
      doc.setFontSize(10);
      doc.text(
        `${payrollPrefill.member.firstName} ${payrollPrefill.member.lastName} · ${payroll.staffNo}`,
        18,
        59,
      );
      const lines: [string, number][] = [
        ["Gross pay", payroll.amountPayable],
        ["Salary advance", payroll.salaryAdvance],
        ["No-pay deduction", payroll.noPayDeduction],
        ["Other deductions", payroll.otherDeductions],
        ["Employee EPF", payroll.employeeEpf],
        ["Net payable", payroll.totalPaid],
      ];
      lines.forEach(([label, value], index) => {
        const y = 75 + index * 10;
        doc.setFont("helvetica", index === lines.length - 1 ? "bold" : "normal");
        doc.text(label, 22, y);
        doc.text(`LKR ${amountOnly.format(value)}`, 188, y, { align: "right" });
      });
      const blob = doc.output("blob");
      form.set(
        "evidence",
        new File([blob], `Payslip-${payroll.staffNo}-${payroll.month}.pdf`, {
          type: "application/pdf",
        }),
      );
    }
    const response = await fetch("/api/v1/expenses", {
      method: "POST",
      body: form,
    });
    const result = await response.json();
    if (!response.ok)
      return setError(result.error || "Unable to record expense");
    save(result.expense, result.payroll || undefined);
  };
  const payroll = payrollPrefill?.payroll;
  const salaryCategory = categories.find(
    (category) => category.name === "Staff Salary",
  );
  const salaryMethod =
    payroll?.paymentMethod === "Bank Transfer" ? "Bank Transfer" : "Petty Cash";
  return (
    <div className="backdrop">
      <form className="modal paymentmodal" onSubmit={submit}>
        <ModalHead
          tag="HOSTEL EXPENSES"
          title={payroll ? "Submit payslip" : "Enter an expense"}
          text={
            payroll
              ? `Submit the finalised payslip for ${payrollPrefill?.member.firstName} ${payrollPrefill?.member.lastName} · ${fmtMonth(payroll.month)}. The salary expense and payslip evidence will be created automatically.`
              : "The E-[year]-0001 transaction ID is generated automatically."
          }
          close={close}
        />
        <FormSection title="Expense details">
          {payroll && (
            <input type="hidden" name="payrollId" value={payroll.id} />
          )}
          <label>
            Expense category
            <select
              name="categoryId"
              required
              defaultValue={salaryCategory ? String(salaryCategory.id) : ""}
              disabled={Boolean(payroll)}
            >
              <option value="">Select category</option>
              {expenseMainCategories.map((mainCategory) => {
                const options = categories.filter(
                  (category) => category.mainCategory === mainCategory,
                );
                return options.length ? (
                  <optgroup label={mainCategory} key={mainCategory}>
                    {options.map((category) => (
                      <option value={category.id} key={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </optgroup>
                ) : null;
              })}
            </select>
            {payroll && salaryCategory && (
              <input
                type="hidden"
                name="categoryId"
                value={salaryCategory.id}
              />
            )}
          </label>
          <Field
            name="amount"
            label="Amount (LKR)"
            type="number"
            min="0.01"
            step="0.01"
            defaultValue={payroll?.totalPaid}
            readOnly={Boolean(payroll)}
            required
          />
          <Field
            name="transactionDate"
            label="Transaction date"
            type="date"
            defaultValue={payroll?.paymentDate || today}
            readOnly={Boolean(payroll)}
            required
          />
          <label>
            Date entered in system
            <input value={today} readOnly />
          </label>
          <label>
            Person paid
            <select
              name="personPaidStaffNo"
              required
              defaultValue={payrollPrefill?.member.staffNo || ""}
              disabled={Boolean(payroll)}
            >
              <option value="">Select staff member</option>
              {staff.map((member) => (
                <option value={member.staffNo} key={member.staffNo}>
                  {member.firstName} {member.lastName} · {member.staffNo}
                </option>
              ))}
            </select>
            {payroll && (
              <input
                type="hidden"
                name="personPaidStaffNo"
                value={payrollPrefill?.member.staffNo}
              />
            )}
          </label>
          <label>
            Settling method
            <select
              name="settlingMethod"
              required
              defaultValue={payroll ? salaryMethod : ""}
              disabled={Boolean(payroll)}
            >
              <option value="">Select method</option>
              <option>Bank Transfer</option>
              <option>Petty Cash</option>
            </select>
            {payroll && (
              <input type="hidden" name="settlingMethod" value={salaryMethod} />
            )}
          </label>
          <label className="wide">
            Remarks
            <textarea
              name="remarks"
              rows={3}
              maxLength={500}
              defaultValue={
                payroll ? `Staff salary for ${fmtMonth(payroll.month)}` : ""
              }
              readOnly={Boolean(payroll)}
              placeholder="Short description of this expense"
            />
          </label>
          {payroll && (
            <div className="approval-entry-note wide">
              <b>Payment destination</b>
              <small>
                {payrollPrefill?.member.accountNo
                  ? `${payrollPrefill.member.accountHolderName || `${payrollPrefill.member.firstName} ${payrollPrefill.member.lastName}`} · ${payrollPrefill.member.bank} · ${payrollPrefill.member.bankBranch} · ${payrollPrefill.member.accountNo}`
                  : "No bank account details are saved for this staff member. Verify the payment destination before attaching evidence."}
              </small>
            </div>
          )}
          {payroll ? (
            <div className="approval-entry-note wide">
              <b>Evidence: system-generated payslip</b>
              <small>
                The payslip PDF will be attached automatically to the linked
                Staff Salary expense.
              </small>
            </div>
          ) : (
            <label className="wide evidence-upload">
              Evidence
              <input
                name="evidence"
                type="file"
                accept="image/*,.pdf"
                required
                onChange={(event) =>
                  setEvidenceName(event.target.files?.[0]?.name || "")
                }
              />
              <span>
                {evidenceName
                  ? `✓ ${evidenceName}`
                  : "↑ Upload invoice, receipt or payment evidence"}
              </span>
            </label>
          )}
          <div className="approval-entry-note wide">
            <b>Approval status: Pending</b>
            <small>
              Only Management can approve, disapprove or request more details
              after this expense is recorded.
            </small>
          </div>
          {!staff.length && (
            <p className="form-error wide">
              ⚠ Add an active staff member before recording an expense.
            </p>
          )}
          {error && <p className="form-error wide">⚠ {error}</p>}
        </FormSection>
        <Actions
          close={close}
          text={payroll ? "Submit payslip" : "Record expense"}
          disabled={
            !staff.length ||
            !categories.length ||
            Boolean(payroll && !salaryCategory)
          }
        />
      </form>
    </div>
  );
}

function ExpenseApproval({
  expense,
  close,
  save,
}: {
  expense: Expense;
  close: () => void;
  save: (expense: Expense) => void;
}) {
  const [note, setNote] = useState(expense.approvalNote || "");
  const [error, setError] = useState("");
  const decide = async (
    approvalStatus: "More Details Requested" | "Approved" | "Disapproved",
  ) => {
    setError("");
    const response = await fetch("/api/v1/expenses", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: expense.id,
        approvalStatus,
        approvalNote: note,
      }),
    });
    const result = await response.json();
    if (!response.ok)
      return setError(result.error || "Unable to update approval");
    save(result.expense);
  };
  return (
    <div className="backdrop">
      <div className="modal approval-modal">
        <ModalHead
          tag="MANAGEMENT ONLY"
          title="Expense approval"
          text={`${expense.transactionId} · ${expense.categoryName} · ${cash.format(expense.amount)}`}
          close={close}
        />
        <section className="formsection">
          <h3>Review details</h3>
          <div className="approval-review-grid">
            <Detail
              title="TRANSACTION"
              rows={[
                ["Transaction date", fmtDate(expense.transactionDate)],
                [
                  "Person paid",
                  `${expense.personPaidName} (${expense.personPaidStaffNo})`,
                ],
                ["Settling method", expense.settlingMethod],
                ["Remarks", expense.remarks || "—"],
              ]}
            />
            <Detail
              title="CURRENT REVIEW"
              rows={[
                ["Status", expense.approvalStatus],
                ["Previous note", expense.approvalNote || "—"],
                ["Evidence", expense.evidenceName],
              ]}
            />
          </div>
          <label className="approval-note">
            Management note
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={4}
              placeholder="State the details required or reason for disapproval"
            />
          </label>
          {error && <p className="form-error">⚠ {error}</p>}
        </section>
        <div className="approval-actions">
          <button onClick={close}>Cancel</button>
          <button
            className="request"
            onClick={() => decide("More Details Requested")}
          >
            Ask for more details
          </button>
          <button className="disapprove" onClick={() => decide("Disapproved")}>
            Disapprove
          </button>
          <button className="approve" onClick={() => decide("Approved")}>
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}

function StaffView({
  rows,
  open,
  payroll,
  payrollAdded,
  payrollUpdated,
  payrollDeleted,
  expenseCategories,
  expenseAdded,
}: {
  rows: Staff[];
  open: (member: Staff) => void;
  payroll: StaffPayroll[];
  payrollAdded: (entry: StaffPayroll) => void;
  payrollUpdated: (entry: StaffPayroll) => void;
  payrollDeleted: (id: number, linkedExpenseId?: number | null) => void;
  expenseCategories: ExpenseCategory[];
  expenseAdded: (expense: Expense) => void;
}) {
  const [payrollMonth, setPayrollMonth] = useState("2026-01");
  const [payslipStaff, setPayslipStaff] = useState<Staff | null>(null);
  const [editingPayslip, setEditingPayslip] = useState<StaffPayroll | null>(
    null,
  );
  const [payrollExpense, setPayrollExpense] =
    useState<PayrollExpensePrefill | null>(null);
  const [payrollError, setPayrollError] = useState("");
  const [payslipPreview, setPayslipPreview] = useState<{
    url: string;
    member: Staff;
    entry: StaffPayroll;
  } | null>(null);
  const payrollSummary = rows
    .filter((member) => !member.designation.toLowerCase().includes("owner"))
    .map((member) => {
      const entry = payroll.find(
        (item) =>
          item.staffNo === member.staffNo && item.month === payrollMonth,
      );
      const basicSalary = entry?.basicSalary ?? member.monthlySalary;
      const allowances = entry?.allowances ?? 0;
      const overtime = entry?.overtime ?? 0;
      const bonus = entry?.bonus ?? 0;
      const grossPay = entry?.amountPayable ?? basicSalary;
      const salaryAdvance = entry?.salaryAdvance ?? 0;
      const noPayDeduction = entry?.noPayDeduction ?? 0;
      const otherDeductions = entry?.otherDeductions ?? 0;
      const employeeEpf = entry?.employeeEpf ?? 0;
      const totalDeductions =
        salaryAdvance + noPayDeduction + otherDeductions + employeeEpf;
      const netPayable = entry?.totalPaid ?? Math.max(0, grossPay - totalDeductions);
      const employerEpf = entry?.employerEpf ?? 0;
      const employerEtf = entry?.employerEtf ?? 0;
      return {
        member,
        entry,
        basicSalary,
        allowances,
        overtime,
        bonus,
        grossPay,
        salaryAdvance,
        noPayDeduction,
        otherDeductions,
        employeeEpf,
        totalDeductions,
        netPayable,
        employerEpf,
        employerEtf,
        totalEmployerCost: grossPay + employerEpf + employerEtf,
      };
    });
  const payrollTotals = payrollSummary.reduce(
    (totals, row) => {
      (
        [
          "basicSalary",
          "allowances",
          "overtime",
          "bonus",
          "grossPay",
          "salaryAdvance",
          "noPayDeduction",
          "otherDeductions",
          "employeeEpf",
          "totalDeductions",
          "netPayable",
          "employerEpf",
          "employerEtf",
          "totalEmployerCost",
        ] as const
      ).forEach((key) => {
        totals[key] += row[key];
      });
      return totals;
    },
    {
      basicSalary: 0,
      allowances: 0,
      overtime: 0,
      bonus: 0,
      grossPay: 0,
      salaryAdvance: 0,
      noPayDeduction: 0,
      otherDeductions: 0,
      employeeEpf: 0,
      totalDeductions: 0,
      netPayable: 0,
      employerEpf: 0,
      employerEtf: 0,
      totalEmployerCost: 0,
    },
  );
  const deletePayroll = async (entry: StaffPayroll) => {
    if (
      !window.confirm(
        `Delete the ${fmtMonth(entry.month)} payroll entry?${entry.linkedExpenseId ? " Its linked salary expense will also be deleted." : ""}`,
      )
    )
      return;
    const response = await fetch(`/api/staff/payroll?id=${entry.id}`, {
      method: "DELETE",
    });
    const result = await response.json();
    if (!response.ok)
      return setPayrollError(result.error || "Unable to delete payroll entry");
    payrollDeleted(entry.id, result.linkedExpenseId);
  };
  return (
    <div className="content database-view">
      <section>
        <div className="expense-section-head expense-actions-only staff-payroll-month">
          <label className="month-control">
            Payroll month
            <input
              type="month"
              value={payrollMonth}
              onChange={(event) => setPayrollMonth(event.target.value)}
            />
          </label>
        </div>
        <div className="panel tablewrap">
          <table className="staff-payroll-register">
            <thead>
              <tr>
                <th>STAFF NO.</th>
                <th>NAME</th>
                <th>DESIGNATION</th>
                <th>GROSS PAY<small>(LKR)</small></th>
                <th>TOTAL DEDUCTIONS<small>(LKR)</small></th>
                <th>NET PAYABLE<small>(LKR)</small></th>
                <th>PAYMENT DATE</th>
                <th>PAYMENT STATUS</th>
                <th>PAYSLIP / ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((member) => {
                const entry = payroll.find(
                  (item) =>
                    item.staffNo === member.staffNo &&
                    item.month === payrollMonth,
                );
                const owner = member.designation.toLowerCase() === "owner";
                const deductions = entry
                  ? entry.salaryAdvance +
                    entry.noPayDeduction +
                    entry.otherDeductions +
                    entry.employeeEpf
                  : 0;
                const paid = entry?.paymentStatus === "Paid";
                const submitted = entry?.paymentStatus === "Submitted";
                return (
                  <tr key={member.id}>
                    <td>
                      <button
                        className="student-name-link"
                        onClick={() => open(member)}
                      >
                        {member.staffNo}
                      </button>
                    </td>
                    <td>
                      <button
                        className="student-name-link"
                        onClick={() => open(member)}
                      >
                        {member.firstName} {member.lastName}
                      </button>
                    </td>
                    <td>{member.designation}</td>
                    <td>
                      {owner
                        ? "Not applicable"
                        : amountOnly.format(
                            entry?.amountPayable ?? member.monthlySalary,
                          )}
                    </td>
                    <td>{owner ? "—" : amountOnly.format(deductions)}</td>
                    <td>
                      <b>
                        {owner
                          ? "—"
                          : entry
                            ? amountOnly.format(entry.totalPaid)
                            : "Not prepared"}
                      </b>
                    </td>
                    <td>
                      {entry?.paymentDate
                        ? fmtDate(entry.paymentDate)
                        : entry
                          ? "Pending"
                          : "—"}
                    </td>
                    <td>
                      {owner || !entry ? (
                        "—"
                      ) : (
                        <div className="payroll-status-cell">
                          <span
                            className={`payroll-payment-status ${paid ? "paid" : submitted ? "submitted" : "outstanding"}`}
                          >
                            ● {paid ? "Paid" : submitted ? "Submitted" : "Prepared"}
                          </span>
                          {!paid && !submitted && (
                            <button
                              className="mark-paid-button"
                              onClick={() =>
                                setPayrollExpense({ member, payroll: entry })
                              }
                            >
                              Submit payslip
                            </button>
                          )}
                          {submitted && <small>Awaiting bank reconciliation</small>}
                        </div>
                      )}
                    </td>
                    <td>
                      {owner ? (
                        <span className="muted-cell">No salary</span>
                      ) : entry ? (
                        <div className="payroll-actions">
                          <button
                            className="review-button"
                            onClick={async () => {
                              const url = await downloadPayslipPdf(
                                member,
                                entry,
                                "view",
                              );
                              if (url)
                                setPayslipPreview({ url, member, entry });
                            }}
                          >
                            View
                          </button>
                          <button
                            className="review-button"
                            onClick={() => downloadPayslipPdf(member, entry)}
                          >
                            ⇩ PDF
                          </button>
                          <button
                            className="review-button"
                            onClick={() => {
                              setPayslipStaff(member);
                              setEditingPayslip(entry);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="danger-button"
                            onClick={() => deletePayroll(entry)}
                          >
                            Delete
                          </button>
                        </div>
                      ) : (
                        <button
                          className="review-button primary-lite"
                          onClick={() => {
                            setPayslipStaff(member);
                            setEditingPayslip(null);
                          }}
                        >
                          Prepare payslip
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="payroll-summary-heading">
          <b>Payroll payable summary</b>
          <span>{fmtMonth(payrollMonth)}</span>
        </div>
        <div className="panel tablewrap payroll-summary-wrap">
          <table className="payroll-summary-table">
            <thead>
              <tr>
                <th>STAFF NO.</th>
                <th>NAME</th>
                <th>STATUS</th>
                <th>BASIC SALARY<small>(LKR)</small></th>
                <th>ALLOWANCES<small>(LKR)</small></th>
                <th>OVERTIME<small>(LKR)</small></th>
                <th>BONUS<small>(LKR)</small></th>
                <th>GROSS PAY<small>(LKR)</small></th>
                <th>SALARY ADVANCE<small>(LKR)</small></th>
                <th>NO-PAY DEDUCTION<small>(LKR)</small></th>
                <th>OTHER DEDUCTIONS<small>(LKR)</small></th>
                <th>EMPLOYEE EPF<small>(LKR)</small></th>
                <th>TOTAL DEDUCTIONS<small>(LKR)</small></th>
                <th>NET PAYABLE<small>(LKR)</small></th>
                <th>EMPLOYER EPF<small>(LKR)</small></th>
                <th>EMPLOYER ETF<small>(LKR)</small></th>
                <th>TOTAL EMPLOYER COST<small>(LKR)</small></th>
              </tr>
            </thead>
            <tbody>
              {payrollSummary.map((row) => (
                <tr key={row.member.id}>
                  <td>{row.member.staffNo}</td>
                  <td>{row.member.firstName} {row.member.lastName}</td>
                  <td>{row.entry?.paymentStatus || "Not prepared"}</td>
                  <td>{amountOnly.format(row.basicSalary)}</td>
                  <td>{amountOnly.format(row.allowances)}</td>
                  <td>{amountOnly.format(row.overtime)}</td>
                  <td>{amountOnly.format(row.bonus)}</td>
                  <td>{amountOnly.format(row.grossPay)}</td>
                  <td>{amountOnly.format(row.salaryAdvance)}</td>
                  <td>{amountOnly.format(row.noPayDeduction)}</td>
                  <td>{amountOnly.format(row.otherDeductions)}</td>
                  <td>{amountOnly.format(row.employeeEpf)}</td>
                  <td>{amountOnly.format(row.totalDeductions)}</td>
                  <td><b>{amountOnly.format(row.netPayable)}</b></td>
                  <td>{amountOnly.format(row.employerEpf)}</td>
                  <td>{amountOnly.format(row.employerEtf)}</td>
                  <td><b>{amountOnly.format(row.totalEmployerCost)}</b></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th colSpan={3}>TOTAL</th>
                <th>{amountOnly.format(payrollTotals.basicSalary)}</th>
                <th>{amountOnly.format(payrollTotals.allowances)}</th>
                <th>{amountOnly.format(payrollTotals.overtime)}</th>
                <th>{amountOnly.format(payrollTotals.bonus)}</th>
                <th>{amountOnly.format(payrollTotals.grossPay)}</th>
                <th>{amountOnly.format(payrollTotals.salaryAdvance)}</th>
                <th>{amountOnly.format(payrollTotals.noPayDeduction)}</th>
                <th>{amountOnly.format(payrollTotals.otherDeductions)}</th>
                <th>{amountOnly.format(payrollTotals.employeeEpf)}</th>
                <th>{amountOnly.format(payrollTotals.totalDeductions)}</th>
                <th>{amountOnly.format(payrollTotals.netPayable)}</th>
                <th>{amountOnly.format(payrollTotals.employerEpf)}</th>
                <th>{amountOnly.format(payrollTotals.employerEtf)}</th>
                <th>{amountOnly.format(payrollTotals.totalEmployerCost)}</th>
              </tr>
            </tfoot>
          </table>
        </div>
        {payrollError && <p className="form-error">⚠ {payrollError}</p>}
      </section>
      {payslipStaff && (
        <PayslipModal
          member={payslipStaff}
          month={payrollMonth}
          existing={editingPayslip || undefined}
          close={() => {
            setPayslipStaff(null);
            setEditingPayslip(null);
          }}
          save={(entry) => {
            if (editingPayslip) payrollUpdated(entry);
            else payrollAdded(entry);
            setPayslipStaff(null);
            setEditingPayslip(null);
          }}
        />
      )}
      {payrollExpense && (
        <AddExpense
          payrollPrefill={payrollExpense}
          categories={expenseCategories.filter((category) => category.active)}
          staff={rows.filter((member) => member.status === "Active")}
          close={() => setPayrollExpense(null)}
          save={(expense, updatedPayroll) => {
            expenseAdded(expense);
            if (updatedPayroll) payrollUpdated(updatedPayroll);
            setPayrollExpense(null);
          }}
        />
      )}
      {payslipPreview && (
        <PayslipPdfViewer
          url={payslipPreview.url}
          member={payslipPreview.member}
          entry={payslipPreview.entry}
          close={() => {
            URL.revokeObjectURL(payslipPreview.url);
            setPayslipPreview(null);
          }}
        />
      )}
    </div>
  );
}

async function downloadPayslipPdf(
  member: Staff,
  entry: StaffPayroll,
  mode: "download" | "view" = "download",
) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const money = (value: number) => `LKR ${amountOnly.format(value)}`;
  const line = (label: string, value: string, y: number, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.text(label, 24, y);
    doc.text(value, 186, y, { align: "right" });
  };
  doc.setFillColor(16, 48, 76);
  doc.rect(0, 0, 210, 35, "F");
  try {
    const logo = new Image();
    logo.src = "/perkhaven-logo.png";
    await logo.decode();
    doc.addImage(logo, "PNG", 12, 4, 28, 26);
  } catch {}
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("THE PERK HAVEN", 46, 17);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("HOSTEL STAFF PAYSLIP", 46, 25);
  doc.setTextColor(18, 42, 66);
  doc.setFontSize(17);
  doc.setFont("helvetica", "bold");
  doc.text(`Payslip - ${fmtMonth(entry.month)}`, 20, 50);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Employee: ${member.firstName} ${member.lastName}`, 20, 61);
  doc.text(`Staff No: ${member.staffNo}`, 20, 67);
  doc.text(`Designation: ${member.designation}`, 112, 61);
  doc.text(
    `Payment: ${entry.paymentMethod || "Not specified"}${member.accountNo ? ` · ${member.bank} ${member.accountNo}` : ""}`,
    112,
    67,
  );
  doc.setDrawColor(208, 218, 229);
  doc.line(20, 74, 190, 74);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("EARNINGS", 20, 84);
  doc.setFontSize(9);
  line("Basic salary", money(entry.basicSalary), 94);
  line("Allowances", money(entry.allowances), 102);
  line("Overtime", money(entry.overtime), 110);
  line("Bonus", money(entry.bonus), 118);
  line("Gross pay", money(entry.amountPayable), 129, true);
  doc.setDrawColor(208, 218, 229);
  doc.line(20, 136, 190, 136);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("DEDUCTIONS", 20, 146);
  doc.setFontSize(9);
  line("Employee EPF", money(entry.employeeEpf), 156);
  line("Salary advance", money(entry.salaryAdvance), 164);
  line("No-pay deduction", money(entry.noPayDeduction), 172);
  line("Other deductions", money(entry.otherDeductions), 180);
  const totalDeductions =
    entry.employeeEpf +
    entry.salaryAdvance +
    entry.noPayDeduction +
    entry.otherDeductions;
  line("Total deductions", money(totalDeductions), 191, true);
  doc.setFillColor(231, 242, 252);
  doc.roundedRect(20, 201, 170, 20, 3, 3, "F");
  doc.setFontSize(12);
  line("NET PAYABLE", money(entry.totalPaid), 214, true);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("EMPLOYER CONTRIBUTIONS", 20, 237);
  doc.setFontSize(9);
  line("Employer EPF", money(entry.employerEpf), 247);
  line("Employer ETF", money(entry.employerEtf), 255);
  doc.setDrawColor(208, 218, 229);
  doc.line(20, 264, 190, 264);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(94, 108, 124);
  doc.text(
    `Payment date: ${entry.paymentDate ? fmtDate(entry.paymentDate) : "Pending"}`,
    20,
    274,
  );
  if (entry.notes) doc.text(`Notes: ${entry.notes.slice(0, 110)}`, 20, 280);
  doc.text(
    "This computer-generated payslip does not require a signature.",
    105,
    289,
    { align: "center" },
  );
  if (mode === "view") return URL.createObjectURL(doc.output("blob"));
  doc.save(`Perkhaven-Payslip-${member.staffNo}-${entry.month}.pdf`);
}

function PayslipPdfViewer({
  url,
  member,
  entry,
  close,
}: {
  url: string;
  member: Staff;
  entry: StaffPayroll;
  close: () => void;
}) {
  return (
    <div className="backdrop" onMouseDown={close}>
      <div
        className="modal payslip-pdf-viewer"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <ModalHead
          tag="STAFF PAYROLL"
          title={`Payslip · ${fmtMonth(entry.month)}`}
          text={`${member.firstName} ${member.lastName} · ${member.staffNo}`}
          close={close}
        />
        <iframe title={`Payslip ${entry.month}`} src={url} />
        <footer>
          <button onClick={close}>Close</button>
          <button
            className="primary"
            onClick={() => downloadPayslipPdf(member, entry)}
          >
            Download PDF
          </button>
        </footer>
      </div>
    </div>
  );
}

function PayslipModal({
  member,
  month,
  close,
  save,
  existing,
}: {
  member: Staff;
  month: string;
  close: () => void;
  save: (entry: StaffPayroll) => void;
  existing?: StaffPayroll;
}) {
  const [form, setForm] = useState({
    basicSalary: existing?.basicSalary ?? member.monthlySalary,
    allowances: existing?.allowances ?? 0,
    overtime: existing?.overtime ?? 0,
    bonus: existing?.bonus ?? 0,
    salaryAdvance: existing?.salaryAdvance ?? 0,
    noPayDeduction: existing?.noPayDeduction ?? 0,
    otherDeductions: existing?.otherDeductions ?? 0,
    employeeEpfRate: existing?.amountPayable
      ? (existing.employeeEpf / existing.amountPayable) * 100
      : 8,
    employerEpfRate: existing?.amountPayable
      ? (existing.employerEpf / existing.amountPayable) * 100
      : 12,
    employerEtfRate: existing?.amountPayable
      ? (existing.employerEtf / existing.amountPayable) * 100
      : 3,
    paymentDate: existing?.paymentDate ?? "",
    paymentMethod: existing?.paymentMethod ?? "Bank Transfer",
    notes: existing?.notes ?? "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const numberField =
    (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
      setForm((current) => ({
        ...current,
        [key]: Math.max(0, Number(event.target.value) || 0),
      }));
  const gross = form.basicSalary + form.allowances + form.overtime + form.bonus;
  const employeeEpf = (gross * form.employeeEpfRate) / 100;
  const employerEpf = (gross * form.employerEpfRate) / 100;
  const employerEtf = (gross * form.employerEtfRate) / 100;
  const totalDeductions =
    employeeEpf +
    form.salaryAdvance +
    form.noPayDeduction +
    form.otherDeductions;
  const netPayable = Math.max(0, gross - totalDeductions);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    const submitter = (event.nativeEvent as SubmitEvent)
      .submitter as HTMLButtonElement | null;
    try {
      const response = await fetch("/api/staff/payroll", {
        method: existing ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          existing
            ? { id: existing.id, ...form }
            : { staffNo: member.staffNo, month, ...form },
        ),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          result.error ||
            (existing
              ? "Unable to update payslip"
              : "Unable to prepare payslip"),
        );
      save(result.payroll);
      if (submitter?.value === "download")
        await downloadPayslipPdf(member, result.payroll);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : existing
            ? "Unable to update payslip"
            : "Unable to prepare payslip",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="backdrop" role="presentation" onMouseDown={close}>
      <div className="payslip-modal" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div>
            <p className="tag">STAFF PAYROLL</p>
            <h2>{existing ? "Edit payslip" : "Prepare payslip"}</h2>
            <p>
              {member.firstName} {member.lastName} · {member.staffNo} ·{" "}
              {fmtMonth(month)}
            </p>
          </div>
          <button aria-label="Close payslip" onClick={close}>
            ×
          </button>
        </header>
        <form onSubmit={submit}>
          <div className="payslip-layout">
            <section className="payslip-fields">
              <h3>Earnings</h3>
              <div className="formgrid two">
                <label>
                  Basic salary (LKR)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.basicSalary}
                    onChange={numberField("basicSalary")}
                    required
                  />
                </label>
                <label>
                  Allowances (LKR)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.allowances}
                    onChange={numberField("allowances")}
                  />
                </label>
                <label>
                  Overtime (LKR)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.overtime}
                    onChange={numberField("overtime")}
                  />
                </label>
                <label>
                  Bonus (LKR)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.bonus}
                    onChange={numberField("bonus")}
                  />
                </label>
              </div>
              <h3>Deductions</h3>
              <div className="formgrid two">
                <label>
                  Salary advance (LKR)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.salaryAdvance}
                    onChange={numberField("salaryAdvance")}
                  />
                </label>
                <label>
                  No-pay deduction (LKR)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.noPayDeduction}
                    onChange={numberField("noPayDeduction")}
                  />
                </label>
                <label>
                  Other deductions (LKR)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.otherDeductions}
                    onChange={numberField("otherDeductions")}
                  />
                </label>
                <label>
                  Employee EPF rate (%)
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={form.employeeEpfRate}
                    onChange={numberField("employeeEpfRate")}
                  />
                </label>
              </div>
              <h3>Employer contributions</h3>
              <div className="formgrid two">
                <label>
                  Employer EPF rate (%)
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={form.employerEpfRate}
                    onChange={numberField("employerEpfRate")}
                  />
                </label>
                <label>
                  Employer ETF rate (%)
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={form.employerEtfRate}
                    onChange={numberField("employerEtfRate")}
                  />
                </label>
              </div>
              <h3>Payment information</h3>
              <div className="formgrid two">
                <label>
                  Payment date
                  <input
                    type="date"
                    value={form.paymentDate}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        paymentDate: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Payment method
                  <select
                    value={form.paymentMethod}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        paymentMethod: event.target.value,
                      }))
                    }
                  >
                    <option>Bank Transfer</option>
                    <option>Cash</option>
                    <option>Cheque</option>
                  </select>
                </label>
                <label className="span-two">
                  Notes
                  <textarea
                    value={form.notes}
                    maxLength={220}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                    placeholder="Optional payroll note"
                  />
                </label>
              </div>
            </section>
            <aside className="payslip-preview">
              <div className="payslip-brand">
                <b>PERKHAVEN</b>
                <span>HOSTEL STAFF PAYSLIP</span>
              </div>
              <h3>{fmtMonth(month)}</h3>
              <div className="payslip-person">
                <b>
                  {member.firstName} {member.lastName}
                </b>
                <span>
                  {member.staffNo} · {member.designation}
                </span>
              </div>
              <div className="payslip-block">
                <b>EARNINGS</b>
                <span>
                  Basic salary <strong>{cash.format(form.basicSalary)}</strong>
                </span>
                <span>
                  Allowances <strong>{cash.format(form.allowances)}</strong>
                </span>
                <span>
                  Overtime <strong>{cash.format(form.overtime)}</strong>
                </span>
                <span>
                  Bonus <strong>{cash.format(form.bonus)}</strong>
                </span>
                <span className="total">
                  Gross pay <strong>{cash.format(gross)}</strong>
                </span>
              </div>
              <div className="payslip-block">
                <b>DEDUCTIONS</b>
                <span>
                  Employee EPF ({form.employeeEpfRate}%){" "}
                  <strong>{cash.format(employeeEpf)}</strong>
                </span>
                <span>
                  Salary advance{" "}
                  <strong>{cash.format(form.salaryAdvance)}</strong>
                </span>
                <span>
                  No-pay deduction{" "}
                  <strong>{cash.format(form.noPayDeduction)}</strong>
                </span>
                <span>
                  Other deductions{" "}
                  <strong>{cash.format(form.otherDeductions)}</strong>
                </span>
                <span className="total">
                  Total deductions{" "}
                  <strong>{cash.format(totalDeductions)}</strong>
                </span>
              </div>
              <div className="payslip-net">
                <span>NET PAYABLE</span>
                <strong>{cash.format(netPayable)}</strong>
              </div>
              <div className="payslip-employer">
                <b>EMPLOYER CONTRIBUTIONS</b>
                <span>
                  EPF ({form.employerEpfRate}%) {cash.format(employerEpf)}
                </span>
                <span>
                  ETF ({form.employerEtfRate}%) {cash.format(employerEtf)}
                </span>
              </div>
            </aside>
          </div>
          {error && <p className="form-error">⚠ {error}</p>}
          <footer>
            <button type="button" onClick={close}>
              Cancel
            </button>
            <button
              className="secondary-action"
              type="submit"
              value="save"
              disabled={saving}
            >
              {saving ? "Saving…" : existing ? "Save changes" : "Save payslip"}
            </button>
            <button
              className="primary"
              type="submit"
              value="download"
              disabled={saving}
            >
              {existing ? "Save changes & download PDF" : "Save & download PDF"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

function AddStaff({
  staff,
  designations,
  creatorRole,
  close,
  save,
}: {
  staff: Staff[];
  designations: StaffDesignation[];
  creatorRole: AppRole;
  close: () => void;
  save: (member: Staff) => void;
}) {
  const [error, setError] = useState("");
  const managementCreator = ["Admin", "Chairman", "Managing Director"].includes(creatorRole);
  const next = Math.max(...staff.map((member) => member.id), 0) + 1;
  const staffNo = `ST-${new Date().getFullYear()}-${String(next).padStart(3, "0")}`;
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) || "");
    const phone = (prefix: string) =>
      combinePhone(value(`${prefix}CountryCode`), value(`${prefix}Number`));
    const member: Omit<Staff, "id"> = {
      staffNo,
      firstName: value("firstName"),
      lastName: value("lastName"),
      idNo: value("idNo"),
      mobile: phone("mobile"),
      whatsapp: phone("whatsapp"),
      email: value("email"),
      address: value("address"),
      designation: value("designation"),
      monthlySalary: Number(value("monthlySalary")),
      accountHolderName: value("accountHolderName"),
      accountNo: value("accountNo"),
      bank: value("bank"),
      bankBranch: value("bankBranch"),
      emergency1Name: value("emergency1Name"),
      emergency1Contact: phone("emergency1Contact"),
      emergency1Relationship: value("emergency1Relationship"),
      emergency1Address: value("emergency1Address"),
      emergency2Name: value("emergency2Name"),
      emergency2Contact: phone("emergency2Contact"),
      emergency2Relationship: value("emergency2Relationship"),
      emergency2Address: value("emergency2Address"),
      registeredDate: new Date().toISOString().slice(0, 10),
      startDate: value("startDate"),
      finishDate: value("finishDate"),
      status: value("status") as Staff["status"],
    };
    const delegatedRequired = [
      member.firstName, member.lastName, member.idNo, member.mobile,
      member.whatsapp, member.email, member.address, member.designation,
      String(member.monthlySalary || ""), member.startDate,
      member.accountHolderName, member.accountNo, member.bank, member.bankBranch,
      member.emergency1Name, member.emergency1Contact,
      member.emergency1Relationship, member.emergency1Address,
      member.emergency2Name, member.emergency2Contact,
      member.emergency2Relationship, member.emergency2Address,
    ];
    if (!managementCreator && delegatedRequired.some((entry) => !String(entry).trim()))
      return setError("Delegated users must complete every staff detail before saving. Finish date may remain blank for current staff.");
    const response = await fetch("/api/v1/staff", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...member,
        designationId: designations.find((designation) => designation.name === member.designation)?.id || null,
        status: member.status.toUpperCase(),
        emergencyContacts: [
          { name: member.emergency1Name, phone: member.emergency1Contact, relationship: member.emergency1Relationship, address: member.emergency1Address },
          { name: member.emergency2Name, phone: member.emergency2Contact, relationship: member.emergency2Relationship, address: member.emergency2Address },
        ].filter((contact) => contact.name),
      }),
    });
    const result = await response.json();
    if (!response.ok)
      return setError(result.detail || "Unable to add staff member");
    save(staffFromApi(result));
  };
  return (
    <div className="backdrop">
      <form className="modal" onSubmit={submit}>
        <ModalHead
          tag="STAFF DATABASE"
          title="Add staff member"
          text={`Automated staff no: ${staffNo}`}
          close={close}
        />
        <p className="form-guidance">
          {managementCreator
            ? "Management may save an incomplete staff record and complete it later through Edit."
            : "All staff details are mandatory when registration is delegated. Finish date may remain blank for current staff."}
        </p>
        <FormSection title="Personal details">
          <Field name="firstName" label="First name" required />
          <Field name="lastName" label="Last name" required />
          <Field name="idNo" label="National ID no." required={!managementCreator} />
          <PhoneField prefix="mobile" label="Mobile no." required={!managementCreator} />
          <PhoneField prefix="whatsapp" label="WhatsApp no." required={!managementCreator} />
          <Field name="email" label="Email address" type="email" required />
          <Field name="address" label="Permanent address" wide required={!managementCreator} />
        </FormSection>
        <FormSection title="Emergency contacts">
          <Field name="emergency1Name" label="Contact 1 · name" required={!managementCreator} />
          <PhoneField prefix="emergency1Contact" label="Contact 1 · phone" required={!managementCreator} />
          <Field name="emergency1Relationship" label="Relationship" required={!managementCreator} />
          <Field name="emergency1Address" label="Contact 1 · address" wide required={!managementCreator} />
          <Field name="emergency2Name" label="Contact 2 · name" startRow required={!managementCreator} />
          <PhoneField prefix="emergency2Contact" label="Contact 2 · phone" required={!managementCreator} />
          <Field name="emergency2Relationship" label="Relationship" required={!managementCreator} />
          <Field name="emergency2Address" label="Contact 2 · address" wide required={!managementCreator} />
        </FormSection>
        <FormSection title="Employment details">
          <label>
            Designation
            <select name="designation" required={!managementCreator} defaultValue="">
              <option value="">Select designation</option>
              {designations.map((designation) => (
                <option key={designation.id} value={designation.name}>
                  {designation.name}
                </option>
              ))}
            </select>
          </label>
          <Field
            name="monthlySalary"
            label="Monthly salary (LKR)"
            type="number"
            min="0"
            required={!managementCreator}
          />
          <Field name="startDate" label="Accommodation start date" type="date" required={!managementCreator} />
          <Field name="finishDate" label="Finish date" type="date" />
          <label>
            Status
            <select name="status" defaultValue="Active">
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </label>
          {error && <p className="form-error">⚠ {error}</p>}
        </FormSection>
        <FormSection title="Bank account details">
          <Field name="accountHolderName" label="Account holder's name" required={!managementCreator} />
          <Field name="accountNo" label="Account no." required={!managementCreator} />
          <Field name="bank" label="Bank" required={!managementCreator} />
          <Field name="bankBranch" label="Branch" required={!managementCreator} />
        </FormSection>
        {!designations.length && (
          <p className="form-error">
            ⚠ Add an active staff designation before adding staff.
          </p>
        )}
        <Actions
          close={close}
          text="Add staff"
          disabled={!designations.length}
        />
      </form>
    </div>
  );
}

function EditStaff({
  member,
  designations,
  selfService = false,
  close,
  save,
}: {
  member: Staff;
  designations: StaffDesignation[];
  selfService?: boolean;
  close: () => void;
  save: (member: Staff) => void;
}) {
  const [error, setError] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) || "");
    const phone = (prefix: string) =>
      combinePhone(value(`${prefix}CountryCode`), value(`${prefix}Number`));
    const updated = {
      staffNo: member.staffNo,
      firstName: value("firstName"),
      lastName: value("lastName"),
      idNo: value("idNo"),
      mobile: phone("mobile"),
      whatsapp: phone("whatsapp"),
      email: value("email"),
      address: value("address"),
      designation: selfService ? member.designation : value("designation"),
      monthlySalary: selfService
        ? member.monthlySalary
        : Number(value("monthlySalary")),
      accountHolderName: value("accountHolderName"),
      accountNo: value("accountNo"),
      bank: value("bank"),
      bankBranch: value("bankBranch"),
      emergency1Name: value("emergency1Name"),
      emergency1Contact: phone("emergency1Contact"),
      emergency1Relationship: value("emergency1Relationship"),
      emergency1Address: value("emergency1Address"),
      emergency2Name: value("emergency2Name"),
      emergency2Contact: phone("emergency2Contact"),
      emergency2Relationship: value("emergency2Relationship"),
      emergency2Address: value("emergency2Address"),
      registeredDate: member.registeredDate,
      startDate: selfService ? member.startDate : value("startDate"),
      finishDate: selfService ? member.finishDate || "" : value("finishDate"),
      status: selfService ? member.status : value("status"),
    };
    const response = await fetch(`/api/v1/staff/${encodeURIComponent(member.staffNo)}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...updated,
        designationId: designations.find((designation) => designation.name === updated.designation)?.id || null,
        status: String(updated.status).toUpperCase(),
        emergencyContacts: [
          { name: updated.emergency1Name, phone: updated.emergency1Contact, relationship: updated.emergency1Relationship, address: updated.emergency1Address },
          { name: updated.emergency2Name, phone: updated.emergency2Contact, relationship: updated.emergency2Relationship, address: updated.emergency2Address },
        ].filter((contact) => contact.name),
      }),
    });
    const result = await response.json();
    if (!response.ok)
      return setError(result.detail || "Unable to update staff member");
    save(staffFromApi(result));
  };
  return (
    <div className="backdrop">
      <form className="modal" onSubmit={submit}>
        <ModalHead
          tag="STAFF PROFILE"
          title={selfService ? "Complete my profile" : "Edit staff details"}
          text={`${member.staffNo} · ${member.firstName} ${member.lastName}`}
          close={close}
        />
        <FormSection title="Personal details">
          <Field
            name="firstName"
            label="First name"
            defaultValue={member.firstName}
            required
          />
          <Field
            name="lastName"
            label="Last name"
            defaultValue={member.lastName}
            required
          />
          <Field
            name="idNo"
            label="National ID no."
            defaultValue={member.idNo}
            required
          />
          <PhoneField
            prefix="mobile"
            label="Mobile no."
            defaultValue={member.mobile}
          />
          <PhoneField
            prefix="whatsapp"
            label="WhatsApp no."
            defaultValue={member.whatsapp}
          />
          <Field
            name="email"
            label="Email address"
            type="email"
            defaultValue={member.email}
          />
          <Field
            name="address"
            label="Permanent address"
            defaultValue={member.address}
            wide
          />
        </FormSection>
        <FormSection title="Emergency contacts">
          <Field
            name="emergency1Name"
            label="Contact 1 · name"
            defaultValue={member.emergency1Name}
            required
          />
          <PhoneField
            prefix="emergency1Contact"
            label="Contact 1 · phone"
            defaultValue={member.emergency1Contact}
          />
          <Field
            name="emergency1Relationship"
            label="Relationship"
            defaultValue={member.emergency1Relationship}
          />
          <Field
            name="emergency1Address"
            label="Contact 1 · address"
            defaultValue={member.emergency1Address}
            wide
          />
          <Field
            name="emergency2Name"
            label="Contact 2 · name"
            defaultValue={member.emergency2Name}
            startRow
          />
          <PhoneField
            prefix="emergency2Contact"
            label="Contact 2 · phone"
            defaultValue={member.emergency2Contact}
          />
          <Field
            name="emergency2Relationship"
            label="Relationship"
            defaultValue={member.emergency2Relationship}
          />
          <Field
            name="emergency2Address"
            label="Contact 2 · address"
            defaultValue={member.emergency2Address}
            wide
          />
        </FormSection>
        {!selfService && (
          <FormSection title="Employment details">
            <label>
              Designation
              <select
                name="designation"
                required
                defaultValue={member.designation}
              >
                {designations.map((designation) => (
                  <option key={designation.id} value={designation.name}>
                    {designation.name}
                  </option>
                ))}
              </select>
            </label>
            <Field
              name="monthlySalary"
              label="Monthly salary (LKR)"
              type="number"
              min="0"
              defaultValue={member.monthlySalary}
              required
            />
            <Field
              name="startDate"
              label="Accommodation start date"
              type="date"
              defaultValue={member.startDate}
              required
            />
            <Field
              name="finishDate"
              label="Finish date"
              type="date"
              defaultValue={member.finishDate || ""}
            />
            <label>
              Status
              <select name="status" defaultValue={member.status}>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </label>
          </FormSection>
        )}
        <FormSection title="Bank account details">
          <Field
            name="accountHolderName"
            label="Account holder's name"
            defaultValue={member.accountHolderName}
          />
          <Field
            name="accountNo"
            label="Account no."
            defaultValue={member.accountNo}
          />
          <Field name="bank" label="Bank" defaultValue={member.bank} />
          <Field
            name="bankBranch"
            label="Branch"
            defaultValue={member.bankBranch}
          />
        </FormSection>
        {error && <p className="form-error">⚠ {error}</p>}
        <Actions close={close} text="Save staff details" />
      </form>
    </div>
  );
}
function Register({
  students,
  rooms,
  creatorRole,
  close,
  save,
}: {
  students: Student[];
  rooms: Room[];
  creatorRole: AppRole;
  close: () => void;
  save: (s: Student) => void;
}) {
  const managementCreator = ["Admin", "Chairman", "Managing Director"].includes(creatorRole);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [startDate, setStartDate] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [depositPayable, setDepositPayable] = useState("");
  const [depositAdjusted, setDepositAdjusted] = useState(false);
  const [hasMedicalCondition, setHasMedicalCondition] = useState(false);
  const [registrationError, setRegistrationError] = useState("");
  const next = Math.max(...students.map((s) => s.id), 1000) + 1,
    selectedRoomRecord = rooms.find((room) => room.roomNo === selectedRoom),
    overlappingResidents = students.filter(
      (student) =>
        student.roomNo === selectedRoom &&
        Boolean(startDate) &&
        student.startDate <= startDate &&
        (!student.vacatedDate || student.vacatedDate >= startDate),
    ),
    roomFull = Boolean(
      selectedRoomRecord &&
        startDate &&
        overlappingResidents.length >= selectedRoomRecord.beds,
    );
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setRegistrationError("");
    if (roomFull)
      return setRegistrationError(
        `hostel room ${selectedRoom} is full on ${fmtDate(startDate)}. Review the existing residents' check-out dates.`,
      );
    const f = new FormData(e.currentTarget),
      v = (k: string) => String(f.get(k) || ""),
      phone = (prefix: string) =>
        combinePhone(v(`${prefix}CountryCode`), v(`${prefix}Number`)),
      r = rooms.find((x) => x.roomNo === v("roomNo"));
    const s: Student = {
      id: next,
      registrationNo: "",
      firstName: v("firstName"),
      middleNames: v("middleNames"),
      lastName: v("lastName"),
      dateOfBirth: v("dateOfBirth"),
      idNo: v("idNo"),
      mobile: phone("mobile"),
      whatsapp: phone("whatsapp"),
      email: v("email"),
      university: v("university"),
      currentYear: v("currentYear"),
      address: v("address"),
      hasMedicalCondition,
      medicalConditionDetails: hasMedicalCondition ? v("medicalConditionDetails") : "",
      emergency1Name: v("emergency1Name"),
      emergency1Contact: phone("emergency1Contact"),
      emergency1Relationship: v("emergency1Relationship"),
      emergency1Address: v("emergency1Address"),
      emergency2Name: v("emergency2Name"),
      emergency2Contact: phone("emergency2Contact"),
      emergency2Relationship: v("emergency2Relationship"),
      emergency2Address: v("emergency2Address"),
      registeredDate: v("registeredDate"),
      startDate: v("startDate"),
      noticeToVacateDate: "",
      vacatedDate: "",
      allSettled: false,
      contractAgreementStatus: "Not signed",
      roomNo: v("roomNo"),
      monthlyRent: Number(v("monthlyRent") || r?.price || 0),
      depositPayable: Number(v("depositPayable")),
      status: "Active",
    };
    const delegatedRequired = [
      s.firstName, s.lastName, s.idNo, s.mobile, s.whatsapp, s.email,
      s.university, s.currentYear, s.address, s.emergency1Name,
      s.emergency1Contact, s.emergency1Relationship, s.emergency1Address,
      s.emergency2Name, s.emergency2Contact, s.emergency2Relationship,
      s.emergency2Address, s.registeredDate, s.startDate, s.roomNo,
      String(s.monthlyRent || ""), String(s.depositPayable || ""),
    ];
    if (!managementCreator && delegatedRequired.some((entry) => !String(entry).trim()))
      return setRegistrationError("Delegated users must complete every resident detail before saving. Only the check-out date may remain blank.");
    const response = await fetch("/api/v1/students", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...s,
        status: s.status.toUpperCase(),
        emergencyContacts: [
          { name: s.emergency1Name, phone: s.emergency1Contact, relationship: s.emergency1Relationship, address: s.emergency1Address },
          { name: s.emergency2Name, phone: s.emergency2Contact, relationship: s.emergency2Relationship, address: s.emergency2Address },
        ].filter((contact) => contact.name),
      }),
    });
    const result = await response.json();
    if (!response.ok)
      return setRegistrationError(result.detail || "Unable to register resident");
    save(studentFromApi(result));
    window.dispatchEvent(new Event("invoices-changed"));
  };
  return (
    <div className="backdrop">
      <form className="modal" onSubmit={submit}>
        <ModalHead
          tag="NEW RESIDENT"
          title="Resident registration"
          text="The registration number is assigned automatically when saved."
          close={close}
        />
        <p className="form-guidance">
          {managementCreator
            ? "Management may save an incomplete resident record and complete it later through Edit."
            : "All resident details are mandatory when registration is delegated. Only the check-out date may remain blank."}
        </p>
        <FormSection title="Personal details">
          <Field name="firstName" label="First name" required />
          <Field name="middleNames" label="Middle name(s)" />
          <Field name="lastName" label="Last name" required />
          <Field name="dateOfBirth" label="Date of birth" type="date" />
          <Field name="idNo" label="National ID no." required={!managementCreator} />
          <PhoneField prefix="mobile" label="Mobile no." required={!managementCreator} />
          <PhoneField prefix="whatsapp" label="WhatsApp no." required={!managementCreator} />
          <Field name="email" label="Email address" type="email" required />
          <Field name="university" label="University" required={!managementCreator} />
          <Field name="currentYear" label="Current year" required={!managementCreator} />
          <Field name="address" label="Permanent address" wide required={!managementCreator} />
        </FormSection>
        <FormSection title="Emergency contacts">
          <Field name="emergency1Name" label="Contact 1 · name" required={!managementCreator} />
          <PhoneField prefix="emergency1Contact" label="Contact 1 · phone" required={!managementCreator} />
          <Field name="emergency1Relationship" label="Relationship" required={!managementCreator} />
          <Field name="emergency1Address" label="Contact 1 · address" wide required={!managementCreator} />
          <Field name="emergency2Name" label="Contact 2 · name" startRow required={!managementCreator} />
          <PhoneField prefix="emergency2Contact" label="Contact 2 · phone" required={!managementCreator} />
          <Field name="emergency2Relationship" label="Relationship" required={!managementCreator} />
          <Field name="emergency2Address" label="Contact 2 · address" wide required={!managementCreator} />
        </FormSection>
        <FormSection title="Medical condition">
          <fieldset className="medical-condition-choice">
            <legend>Does the resident have a special medical condition?</legend>
            <label><input type="radio" name="hasMedicalCondition" checked={!hasMedicalCondition} onChange={() => setHasMedicalCondition(false)} /> No</label>
            <label><input type="radio" name="hasMedicalCondition" checked={hasMedicalCondition} onChange={() => setHasMedicalCondition(true)} /> Yes</label>
          </fieldset>
          {hasMedicalCondition && <label className="wide">Medical condition details<textarea name="medicalConditionDetails" maxLength={2000} required /></label>}
        </FormSection>
        <FormSection title="Hostel allocation">
          <Field
            name="registeredDate"
            label="Registration date"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
            required={!managementCreator}
          />
          <label>

            Accommodation start date
            <input
              name="startDate"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              required={!managementCreator}
            />
          </label>
          <label>

            Hostel Room no.
            <select
              name="roomNo"
              value={selectedRoom}
              onChange={(event) => {
                const roomNo = event.target.value;
                const rent = rooms.find(
                  (room) => room.roomNo === roomNo,
                )?.price;
                setSelectedRoom(roomNo);
                setMonthlyRent(rent ? String(rent) : "");
                setDepositPayable(rent ? String(rent * 3) : "");
                setDepositAdjusted(false);
              }}
              required={!managementCreator}
            >
              <option value="">Select hostel room</option>
              {rooms.map((room) => (
                <option key={room.roomNo} value={room.roomNo}>
                  {room.roomNo} · {room.type} · {cash.format(room.price)}
                </option>
              ))}
            </select>
          </label>
          <label>

            Monthly accommodation fee (LKR)
            <input
              name="monthlyRent"
              type="number"
              min="0"
              value={monthlyRent}
              onChange={(event) => {
                setMonthlyRent(event.target.value);
                if (!depositAdjusted) {
                  const rent = Number(event.target.value);
                  setDepositPayable(
                    Number.isFinite(rent) ? String(rent * 3) : "",
                  );
                }
              }}
              required={!managementCreator}
            />
          </label>
          <label>

            Security Deposit payable (LKR)
            <input
              name="depositPayable"
              type="number"
              min="0"
              value={depositPayable}
              onChange={(event) => {
                setDepositPayable(event.target.value);
                setDepositAdjusted(true);
              }}
              required
            />
            <small>

              Defaults to three months’ monthly accommodation fee. Adjust here when required.
            </small>
          </label>
          <div className="capacity-check available">
            <b>Status: Active</b>
            <small>
              Status changes only after the departure and settlement process is
              completed.
            </small>
          </div>
          {selectedRoomRecord && startDate && (
            <div
              className={`capacity-check ${roomFull ? "full" : "available"}`}
            >
              <b>
                {overlappingResidents.length} of {selectedRoomRecord.beds} beds
                occupied on {fmtDate(startDate)}
              </b>
              <small>
                {roomFull
                  ? "No bed is available for this accommodation start date."
                  : `${selectedRoomRecord.beds - overlappingResidents.length} bed space(s) available.`}
              </small>
            </div>
          )}
          {registrationError && (
            <p className="form-error">⚠ {registrationError}</p>
          )}
        </FormSection>
        <Actions close={close} text="Register resident" disabled={roomFull} />
      </form>
    </div>
  );
}
function EditStudent({
  student,
  rooms,
  close,
  save,
}: {
  student: Student;
  rooms: Room[];
  close: () => void;
  save: (student: Student) => void;
}) {
  const [error, setError] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) || "");
    const phone = (prefix: string) => combinePhone(value(`${prefix}CountryCode`), value(`${prefix}Number`));
    const response = await fetch(`/api/v1/students/${encodeURIComponent(student.registrationNo)}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        registrationNo: student.registrationNo,
        firstName: value("firstName"), middleNames: value("middleNames"), lastName: value("lastName"),
        dateOfBirth: value("dateOfBirth") || null, idNo: value("idNo"),
        mobile: phone("mobile"), whatsapp: phone("whatsapp"), email: value("email"),
        university: value("university"), currentYear: value("currentYear"), address: value("address"),
        hasMedicalCondition: value("hasMedicalCondition") === "yes",
        medicalConditionDetails: value("medicalConditionDetails"),
        registeredDate: value("registeredDate"), startDate: value("startDate"), roomNo: value("roomNo"),
        monthlyRent: Number(value("monthlyRent")), depositPayable: Number(value("depositPayable")),
        status: student.status.toUpperCase(),
        emergencyContacts: [
          { name: value("emergency1Name"), phone: phone("emergency1Contact"), relationship: value("emergency1Relationship"), address: value("emergency1Address") },
          { name: value("emergency2Name"), phone: phone("emergency2Contact"), relationship: value("emergency2Relationship"), address: value("emergency2Address") },
        ].filter((contact) => contact.name),
      }),
    });
    const result = await response.json();
    if (!response.ok)
      return setError(result.detail || "Unable to update resident");
    save(studentFromApi(result));
  };
  return (
    <div className="backdrop">
      <form className="modal" onSubmit={submit}>
        <ModalHead
          tag="RESIDENT DATABASE"
          title="Edit resident details"
          text={student.registrationNo}
          close={close}
        />
        <FormSection title="Personal details">
          <Field
            name="firstName"
            label="First name"
            defaultValue={student.firstName}
            required
          />
          <Field
            name="middleNames"
            label="Middle name(s)"
            defaultValue={student.middleNames}
          />
          <Field
            name="lastName"
            label="Last name"
            defaultValue={student.lastName}
            required
          />
          <Field
            name="dateOfBirth"
            label="Date of birth"
            type="date"
            defaultValue={student.dateOfBirth}
          />
          <Field
            name="idNo"
            label="National ID no."
            defaultValue={student.idNo}
            required
          />
          <PhoneField
            prefix="mobile"
            label="Mobile no."
            defaultValue={student.mobile}
          />
          <PhoneField
            prefix="whatsapp"
            label="WhatsApp no."
            defaultValue={student.whatsapp}
          />
          <Field
            name="email"
            label="Email address"
            type="email"
            defaultValue={student.email}
          />
          <Field
            name="address"
            label="Address"
            defaultValue={student.address}
            wide
          />
        </FormSection>
        <FormSection title="Education">
          <Field
            name="university"
            label="University"
            defaultValue={student.university}
          />
          <Field
            name="currentYear"
            label="Current year"
            defaultValue={student.currentYear}
          />
        </FormSection>
        <FormSection title="Emergency contacts">
          <Field
            name="emergency1Name"
            label="Contact 1 · name"
            defaultValue={student.emergency1Name}
            required
          />
          <PhoneField
            prefix="emergency1Contact"
            label="Contact 1 · phone"
            defaultValue={student.emergency1Contact}
          />
          <Field
            name="emergency1Relationship"
            label="Relationship"
            defaultValue={student.emergency1Relationship}
          />
          <Field
            name="emergency1Address"
            label="Contact 1 · address"
            defaultValue={student.emergency1Address}
            wide
          />
          <Field
            name="emergency2Name"
            label="Contact 2 · name"
            defaultValue={student.emergency2Name}
            startRow
          />
          <PhoneField
            prefix="emergency2Contact"
            label="Contact 2 · phone"
            defaultValue={student.emergency2Contact}
          />
          <Field
            name="emergency2Relationship"
            label="Relationship"
            defaultValue={student.emergency2Relationship}
          />
          <Field
            name="emergency2Address"
            label="Contact 2 · address"
            defaultValue={student.emergency2Address}
            wide
          />
        </FormSection>
        <FormSection title="Medical condition">
          <label>Special medical condition<select name="hasMedicalCondition" defaultValue={student.hasMedicalCondition ? "yes" : "no"}><option value="no">No</option><option value="yes">Yes</option></select></label>
          <label className="wide">Medical condition details<textarea name="medicalConditionDetails" maxLength={2000} defaultValue={student.medicalConditionDetails || ""} /></label>
        </FormSection>
        <FormSection title="Registration and hostel room">
          <Field
            name="registeredDate"
            label="Registration date"
            type="date"
            defaultValue={student.registeredDate}
            required
          />
          <Field
            name="startDate"
            label="Accommodation start date"
            type="date"
            defaultValue={student.startDate}
            required
          />
          <label>

            Hostel Room
            <select name="roomNo" defaultValue={student.roomNo} required>
              {rooms.map((room) => (
                <option key={room.roomNo}>{room.roomNo}</option>
              ))}
            </select>
          </label>
          <Field
            name="monthlyRent"
            label="Monthly accommodation fee (LKR)"
            type="number"
            min="0"
            defaultValue={student.monthlyRent}
            required
          />
          <Field
            name="depositPayable"
            label="Security Deposit payable (LKR)"
            type="number"
            min="0"
            defaultValue={student.depositPayable}
            required
          />
          {error && <p className="form-error">⚠ {error}</p>}
        </FormSection>
        <Actions close={close} text="Save resident details" />
      </form>
    </div>
  );
}

function AddPayment({
  students,
  shopTenants,
  shopUtilityBills,
  payments,
  adjustments,
  close,
  done,
  save,
}: {
  students: Student[];
  shopTenants: ShopTenant[];
  shopUtilityBills: ShopUtilityBill[];
  payments: Payment[];
  adjustments: MonthlyAdjustment[];
  close: () => void;
  done: () => void;
  save: (p: Payment) => void;
}) {
  const nextUnpaidRentMonth = (student: Student) => {
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(
      today.getMonth() + 1,
    ).padStart(2, "0")}`;
    let candidate =
      student.startDate.slice(0, 7) < "2026-01"
        ? "2026-01"
        : student.startDate.slice(0, 7);
    let checked = 0;
    while (candidate <= currentMonth && checked < 120) {
      const payableForMonth = rentPayable(student, candidate, adjustments);
      const paidForMonth = rentPaid(
        payments,
        student.registrationNo,
        candidate,
      );
      if (payableForMonth > paidForMonth) return candidate;
      candidate = addMonths(candidate, 1);
      checked += 1;
    }
    return candidate;
  };
  const [reg, setReg] = useState(""),
    [shopReg, setShopReg] = useState(""),
    [type, setType] = useState<
      | "Rent"
      | "Deposit"
      | "Shop Rent"
      | "Shop Electricity"
      | "Shop Water"
      | "Other Income"
    >("Rent"),
    [month, setMonth] = useState("2026-01"),
    [amount, setAmount] = useState(""),
    [payerName, setPayerName] = useState(""),
    [reference, setReference] = useState(""),
    [evidenceName, setEvidenceName] = useState(""),
    [paidDate, setPaidDate] = useState(""),
    [settlementMethod, setSettlementMethod] = useState<
      "Bank Transfer" | "Cash" | "Cash/Bank"
    >("Bank Transfer"),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    [recordedPayment, setRecordedPayment] = useState<Payment | null>(null),
    [dueInvoices, setDueInvoices] = useState<StudentInvoice[]>([]),
    oldestInvoice = dueInvoices.find((invoice) => invoice.status === "Issued" || invoice.status === "Partially Paid"),
    shopIncome =
      type === "Shop Rent" ||
      type === "Shop Electricity" ||
      type === "Shop Water",
    otherIncome = type === "Other Income",
    externalIncome = shopIncome || otherIncome,
    s = students.find((x) => x.registrationNo === reg),
    shopTenant = shopTenants.find(
      (tenant) => tenant.registrationNo === shopReg,
    ),
    rentAmountPayable = s ? rentPayable(s, month, adjustments) : 0,
    rentAlreadyPaid = s ? rentPaid(payments, s.registrationNo, month) : 0,
    depositAmountPayable = s ? s.depositPayable : 0,
    depositAlreadyPaid = s
      ? payments
          .filter(
            (payment) =>
              payment.registrationNo === s.registrationNo &&
              canonicalPaymentType(payment.type) === "Deposit",
          )
          .reduce((sum, payment) => sum + payment.paidAmount, 0)
      : 0,
    depositOutstanding = Math.max(0, depositAmountPayable - depositAlreadyPaid),
    rentLocked = type === "Rent" && depositOutstanding > 0,
    payable = oldestInvoice ? oldestInvoice.amount : type === "Rent" ? rentAmountPayable : depositAmountPayable,
    alreadyPaid = oldestInvoice ? (oldestInvoice.paidAmount || 0) : type === "Rent" ? rentAlreadyPaid : depositAlreadyPaid,
    remaining = Math.max(0, payable - alreadyPaid),
    currentPayment = Number(amount) || 0,
    outstandingAfter = Math.max(0, remaining - currentPayment),
    shopPayable = shopTenant
      ? type === "Shop Rent"
        ? shopRentPayable(shopTenant, month, adjustments)
        : type === "Shop Electricity"
          ? shopUtilityAmount(
              shopUtilityBills,
              "Electricity",
              month,
              shopTenant.shopNo,
            )
          : type === "Shop Water"
            ? shopUtilityAmount(
                shopUtilityBills,
                "Water",
                month,
                shopTenant.shopNo,
              )
            : 0
      : 0,
    shopAlreadyPaid =
      shopTenant && shopIncome
        ? payments
            .filter(
              (payment) =>
                payment.registrationNo === shopTenant.registrationNo &&
                payment.month === month &&
                payment.type === type,
            )
            .reduce((sum, payment) => sum + payment.paidAmount, 0)
        : 0,
    shopRemaining = Math.max(0, shopPayable - shopAlreadyPaid),
    overLimit =
      (!externalIncome &&
        (type === "Deposit" || type === "Rent") &&
        currentPayment > remaining) ||
      (shopIncome && currentPayment > shopRemaining);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving) return;
    if (!externalIncome && !s) return;
    if (shopIncome && !shopTenant)
      return setError("Select a registered shop tenant.");
    setError("");
    if (rentLocked)
      return setError(
        "Security Deposit should be Settled before entering Hostel Room Payments",
      );
    if (overLimit)
      return setError(
        type === "Rent"
          ? `This payment exceeds the remaining ${cash.format(remaining)} payable for ${fmtMonth(month)}.`
          : shopIncome
            ? `This payment exceeds the remaining ${cash.format(shopRemaining)} ${type.toLowerCase()} payable for ${fmtMonth(month)}.`
            : `This payment exceeds the remaining security deposit balance of ${cash.format(remaining)}.`,
      );
    const form = new FormData(e.currentTarget);
    const evidence = form.get("evidence");
    if (!(evidence instanceof File) || !evidence.size)
      return setError("Payment evidence is required. Upload an image or PDF before recording the payment.");
    if (!paidDate)
      return setError("Payment date is required.");
    setSaving(true);
    form.set("type", type);
    form.set("settlementMethod", settlementMethod);
    if (shopIncome && shopTenant) {
      form.set("registrationNo", shopTenant.registrationNo);
      form.set("studentName", shopTenant.businessName);
      form.set("roomNo", shopTenant.shopNo);
      form.set("payerName", shopTenant.businessName);
      form.set("reference", shopTenant.shopNo);
      form.set("month", month);
      form.set("payableAmount", String(shopPayable));
    } else if (otherIncome) {
      form.set("payerName", payerName);
      form.set("reference", reference);
      form.set("month", month);
      form.set("payableAmount", amount);
    } else if (s) {
      if (!oldestInvoice) { setSaving(false); return setError("No outstanding invoice is available for this resident."); }
      form.set("invoiceId", String(oldestInvoice.id));
      form.set("registrationNo", s.registrationNo);
      form.set("studentName", `${s.firstName} ${s.lastName}`);
      form.set("roomNo", s.roomNo);
      if (type === "Rent") form.set("month", month);
      else form.delete("month");
      if (type === "Rent") form.set("payableAmount", String(payable));
    }
    const response = await fetch(s && !externalIncome ? "/api/v1/payments" : "/api/payments", {
      method: "POST",
      body: form,
    });
    const result = await response.json();
    if (!response.ok) {
      setSaving(false);
      return setError(result.error || "Unable to record payment");
    }
    const recorded = (result.payments || [result.payment || result]) as Payment[];
    recorded.forEach(save);
    setRecordedPayment(recorded[0]);
    if (s && !externalIncome) window.dispatchEvent(new Event("invoices-changed"));
  };
  const addAnother = () => {
    setReg("");
    setShopReg("");
    setType("Rent");
    setMonth("2026-01");
    setAmount("");
    setPayerName("");
    setReference("");
    setEvidenceName("");
    setPaidDate("");
    setSettlementMethod("Bank Transfer");
    setSaving(false);
    setError("");
    setRecordedPayment(null);
  };
  if (recordedPayment)
    return (
      <div className="backdrop">
        <div className="modal paymentmodal payment-success-modal">
          <ModalHead
            tag="PAYMENT LEDGER"
            title="Payment recorded Successfully"
            text={`${transactionIdFor(recordedPayment)} has been added to the Payment Ledger.`}
            close={done}
          />
          <div className="payment-success-confirmation">
            <i>✓</i>
            <h3>Do you want to enter more records?</h3>
            <p>
              Select Yes to open a new payment form, or No to return to the
              Payment Ledger.
            </p>
          </div>
          <div className="modalactions">
            <button type="button" onClick={done}>
              No
            </button>
            <button type="button" className="primary" onClick={addAnother}>
              Yes
            </button>
          </div>
        </div>
      </div>
    );
  return (
    <div className="backdrop">
      <form className="modal paymentmodal" onSubmit={submit}>
        <ModalHead
          tag="PAYMENT DATABASE"
          title="Record a payment"
          text="Transaction IDs are automatic. Security Deposits are recorded without a corresponding month."
          close={close}
        />
        <FormSection title="Payment details">
          <label>
            Payment type
            <select
              value={type}
              disabled={Boolean(s && oldestInvoice)}
              onChange={(event) => {
                const nextType = event.target.value as
                  | "Rent"
                  | "Deposit"
                  | "Shop Rent"
                  | "Shop Electricity"
                  | "Shop Water"
                  | "Other Income";
                setType(nextType);
                setError("");
                setAmount("");
                setReg("");
                setShopReg("");
              }}
            >
              <option
                value="Rent"
                disabled={Boolean(s && depositOutstanding > 0)}
              >

                Monthly Accommodation Fee
                {s && depositOutstanding > 0 ? " — security deposit required first" : ""}
              </option>
              <option value="Deposit">Security Deposit</option>
              <option value="Shop Rent">Shop Monthly Accommodation Fee</option>
              <option value="Shop Electricity">Shop Electricity</option>
              <option value="Shop Water">Shop Water</option>
              <option value="Other Income">Other Income</option>
            </select>
          </label>
          {!externalIncome && (
            <label>

              Resident registration no.
              <select
                value={reg}
                onChange={(event) => {
                  const registrationNo = event.target.value;
                  const student = students.find(
                    (item) => item.registrationNo === registrationNo,
                  );
                  setReg(registrationNo);
                  if (student) {
                    void fetch(`/api/v1/invoices?registrationNo=${encodeURIComponent(registrationNo)}&size=100`)
                      .then(async (response) => { if (!response.ok) throw new Error("Unable to load due invoices"); return (await response.json()) as ApiPage<StudentInvoice>; })
                      .then((page) => {
                        const due = page.items.filter((invoice) => invoice.status === "Issued" || invoice.status === "Partially Paid")
                          .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.issueDate.localeCompare(b.issueDate) || a.id - b.id);
                        setDueInvoices(due);
                        if (due[0]) { setType(due[0].invoiceType === "Deposit" ? "Deposit" : "Rent"); setMonth(due[0].month || ""); setAmount(String(Math.max(0, due[0].amount - (due[0].paidAmount || 0)))); }
                      })
                      .catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load due invoices"));
                  }
                  setAmount("");
                  setError("");
                }}
                required={!externalIncome}
              >
                <option value="">Select registration no.</option>
                {students.map((x) => (
                  <option key={x.id}>{x.registrationNo}</option>
                ))}
              </select>
            </label>
          )}
          {!externalIncome && s && (
            <div className="autofill">
              <i>
                {s.firstName[0]}
                {s.lastName[0]}
              </i>
              <span>
                <b>
                  {s.firstName} {s.lastName}
                </b>
                <small>

                  Hostel Room {s.roomNo} · {cash.format(s.monthlyRent)}  monthly accommodation fee
                </small>
              </span>
            </div>
          )}
          {!externalIncome && s && (
            <div className="wide invoice-adjustment-editor">
              <div className="invoice-adjustment-heading"><b>Outstanding invoices - oldest first</b><small>Payments are allocated only to the first invoice until it is fully settled.</small></div>
              {dueInvoices.map((invoice, index) => <div className="invoice-adjustment-row" key={invoice.id}><span><b>{index + 1}. {invoice.invoiceNo}</b><small>{invoice.invoiceType === "Deposit" ? "Security Deposit" : fmtMonth(invoice.month)} · due {fmtDate(invoice.dueDate)}</small></span><b>{cash.format(Math.max(0, invoice.amount - (invoice.paidAmount || 0)))}</b></div>)}
              {!dueInvoices.length && <small>No outstanding invoices are available. Generate the required invoice first.</small>}
            </div>
          )}
          {shopIncome && (
            <label>
              Shop tenant
              <select
                value={shopReg}
                onChange={(event) => {
                  setShopReg(event.target.value);
                  setAmount("");
                  setError("");
                }}
                required
              >
                <option value="">Select registered shop tenant</option>
                {shopTenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.registrationNo}>
                    {tenant.shopNo} · {tenant.registrationNo} ·{" "}
                    {tenant.businessName}
                  </option>
                ))}
              </select>
            </label>
          )}
          {shopIncome && shopTenant && (
            <div className="autofill">
              <i>{shopTenant.shopNo.replace(/\D/g, "") || "S"}</i>
              <span>
                <b>{shopTenant.businessName}</b>
                <small>
                  {shopTenant.registrationNo} · {shopTenant.shopNo} ·{" "}
                  {cash.format(shopTenant.monthlyRent)}  monthly accommodation fee
                </small>
              </span>
            </div>
          )}
          {otherIncome && (
            <>
              <Field
                name="payerName"
                label="Income source / payer"
                value={payerName}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  setPayerName(event.target.value)
                }
                required
              />
              <Field
                name="reference"
                label="Income reference"
                value={reference}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  setReference(event.target.value)
                }
                required
              />
            </>
          )}
          {s && depositOutstanding > 0 && (
            <div className="payment-prerequisite">
              <b>Security Deposit should be Settled before entering Hostel Room Payments</b>
              <span>

                Outstanding security deposit: {cash.format(depositOutstanding)}
              </span>
            </div>
          )}
          {externalIncome && (
            <label>
              Corresponding month
              <input
                name="month"
                type="month"
                min={
                  s
                    ? s.startDate.slice(0, 7) < "2026-01"
                      ? "2026-01"
                      : s.startDate.slice(0, 7)
                    : "2026-01"
                }
                value={month}
                onChange={(event) => {
                  setMonth(event.target.value);
                  setAmount("");
                  setError("");
                }}
                required
              />
              <small>
                Used to place this income in the correct accounting period.
              </small>
            </label>
          )}
          {!externalIncome && (
            <div
              className={`payment-check ${type === "Deposit" ? "deposit-check" : ""}`}
            >
              <span>
                <small>
                  {type === "Rent" ? "MONTHLY PAYABLE" : "SECURITY DEPOSIT PAYABLE"}
                </small>
                <b>{cash.format(payable)}</b>
              </span>
              <span>
                <small>
                  {type === "Rent" ? "ALREADY PAID" : "SECURITY DEPOSIT PAID"}
                </small>
                <b>{cash.format(alreadyPaid)}</b>
              </span>
              <span>
                <small>CURRENT PAYMENT</small>
                <b>{cash.format(currentPayment)}</b>
              </span>
              <span>
                <small>OUTSTANDING AFTER PAYMENT</small>
                <b>{cash.format(outstandingAfter)}</b>
              </span>
            </div>
          )}
          {shopIncome && shopTenant && (
            <div className="payment-check">
              <span>
                <small>{type.toUpperCase()} PAYABLE</small>
                <b>{cash.format(shopPayable)}</b>
              </span>
              <span>
                <small>ALREADY PAID</small>
                <b>{cash.format(shopAlreadyPaid)}</b>
              </span>
              <span>
                <small>CURRENT PAYMENT</small>
                <b>{cash.format(currentPayment)}</b>
              </span>
              <span>
                <small>OUTSTANDING AFTER PAYMENT</small>
                <b>
                  {cash.format(Math.max(0, shopRemaining - currentPayment))}
                </b>
              </span>
            </div>
          )}
          <Field
            name="paidAmount"
            label="Paid amount (LKR)"
            type="number"
            min="0.01"
            step="0.01"
            max={
              shopIncome
                ? String(shopRemaining)
                : externalIncome
                  ? undefined
                  : String(remaining)
            }
            value={amount}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setAmount(event.target.value)
            }
            required
          />
          {!externalIncome && <label className="wide">Remarks<textarea name="remarks" rows={3} placeholder="Required when the payment differs from the outstanding invoice balance" required={currentPayment !== remaining} /></label>}
          <Field
            name="paidDate"
            label="Payment date"
            type="date"
            value={paidDate}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setPaidDate(event.target.value);
              setError("");
            }}
            required
          />
          <label>
            Settlement method
            <select
              name="settlementMethod"
              value={settlementMethod}
              onChange={(event) =>
                {
                  setSettlementMethod(
                    event.target.value as
                      | "Bank Transfer"
                      | "Cash"
                      | "Cash/Bank",
                  );
                  setEvidenceName("");
                  setError("");
                }
              }
              required
            >
              <option>Bank Transfer</option>
              <option>Cash</option>
              <option>Cash/Bank</option>
            </select>
            <small>
              Cash/Bank means cash received and subsequently deposited into the bank.
            </small>
          </label>
          {(
            <label className="file">
              Evidence
              <input
                name="evidence"
                type="file"
                accept="image/*,.pdf"
                required
                onChange={(event) => {
                  setEvidenceName(event.target.files?.[0]?.name || "");
                  setError("");
                }}
              />
              <span>
                {evidenceName
                  ? `✓ ${evidenceName}`
                  : "↑ Upload required payment evidence"}
              </span>
            </label>
          )}
          {shopIncome &&
            shopTenant &&
            type !== "Shop Rent" &&
            shopPayable === 0 && (
              <p className="form-error">
                ⚠ Add the{" "}
                {type === "Shop Electricity" ? "electricity" : "water"} bill for{" "}
                {fmtMonth(month)} under Shop Utilities before recording this
                payment.
              </p>
            )}
          {(error || overLimit) && (
            <p className="form-error">
              ⚠{" "}
              {error ||
                `Maximum allowed is ${cash.format(shopIncome ? shopRemaining : remaining)}.`}
            </p>
          )}
        </FormSection>
        <Actions
          close={close}
          text={saving ? "Recording…" : "Record payment"}
          disabled={
            saving || !paidDate ||
            !evidenceName ||
            currentPayment <= 0 ||
            (shopIncome
              ? !shopTenant ||
                !month ||
                overLimit ||
                shopRemaining <= 0
              : otherIncome
                ? !payerName || !reference || !month
                : !s || !oldestInvoice || overLimit || remaining <= 0
            )
          }
        />
      </form>
    </div>
  );
}
function ModalHead({
  tag,
  title,
  text,
  close,
}: {
  tag: string;
  title: string;
  text: string;
  close: () => void;
}) {
  return (
    <div className="modalhead">
      <div>
        <p className="tag">{tag}</p>
        <h2>{title}</h2>
        <span>{text}</span>
      </div>
      <button type="button" onClick={close}>
        ×
      </button>
    </div>
  );
}
function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="formsection">
      <h3>{title}</h3>
      <div className="formgrid">{children}</div>
    </section>
  );
}
function Field({
  label,
  wide,
  startRow,
  ...p
}: {
  label: string;
  wide?: boolean;
  startRow?: boolean;
  [key: string]: unknown;
}) {
  return (
    <label
      className={[wide ? "wide" : "", startRow ? "start-row" : ""]
        .filter(Boolean)
        .join(" ")}
    >
      {label}
      <input {...p} />
    </label>
  );
}
const phoneCountryCodes = [
  ["Sri Lanka", "+94"],
  ["India", "+91"],
  ["United Kingdom", "+44"],
  ["Australia", "+61"],
  ["New Zealand", "+64"],
  ["United States / Canada", "+1"],
  ["United Arab Emirates", "+971"],
  ["Qatar", "+974"],
  ["Saudi Arabia", "+966"],
] as const;
const splitPhone = (value = "") => {
  const normalized = value.trim();
  const match = phoneCountryCodes.find(([, code]) =>
    normalized.startsWith(code),
  );
  return {
    code: match?.[1] || "+94",
    number: match
      ? normalized.slice(match[1].length).replace(/\D/g, "")
      : normalized.replace(/\D/g, ""),
  };
};
const combinePhone = (countryCode: string, localNumber: string) => {
  const digits = localNumber.replace(/\D/g, "").replace(/^0+/, "");
  return digits ? `${countryCode}${digits}` : "";
};
function PhoneField({
  prefix,
  label,
  required = false,
  defaultValue = "",
}: {
  prefix: string;
  label: string;
  required?: boolean;
  defaultValue?: string;
}) {
  const initial = splitPhone(defaultValue);
  return (
    <label className="phone-field">
      {label}
      <span>
        <select
          name={`${prefix}CountryCode`}
          defaultValue={initial.code}
          aria-label={`${label} country code`}
        >
          {phoneCountryCodes.map(([country, code]) => (
            <option key={`${prefix}-${code}`} value={code}>
              {country} ({code})
            </option>
          ))}
        </select>
        <input
          name={`${prefix}Number`}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]{6,15}"
          defaultValue={initial.number}
          placeholder="Local number"
          required={required}
          aria-label={`${label} local number`}
        />
      </span>
      <small>
        Select the country code, then enter digits only without the leading
        zero.
      </small>
    </label>
  );
}
function Actions({
  close,
  text,
  disabled,
}: {
  close: () => void;
  text: string;
  disabled?: boolean;
}) {
  return (
    <div className="modalactions">
      <button type="button" onClick={close}>
        Cancel
      </button>
      <button className="primary" disabled={disabled}>
        {text}
      </button>
    </div>
  );
}

async function downloadStudentProfilePdf(student: Student) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const provided = (value: string | number | undefined | null) =>
    String(value ?? "").trim() || "Not provided";
  const row = (label: string, value: string | number | undefined | null, y: number) => {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(91, 108, 128);
    doc.text(label, 22, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(18, 42, 66);
    const lines = doc.splitTextToSize(provided(value), 112);
    doc.text(lines, 72, y);
  };
  const section = (title: string, y: number) => {
    doc.setFillColor(234, 242, 251);
    doc.roundedRect(18, y - 7, 174, 10, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(21, 93, 168);
    doc.text(title, 22, y);
  };

  doc.setFillColor(16, 48, 76);
  doc.rect(0, 0, 210, 35, "F");
  try {
    const logo = new Image();
    logo.src = "/perkhaven-logo.png";
    await logo.decode();
    doc.addImage(logo, "PNG", 12, 4, 28, 26);
  } catch {}
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.text("THE PERK HAVEN", 46, 16);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("RESIDENT PROFILE", 46, 24);
  doc.text(`Generated ${new Date().toLocaleDateString("en-GB")}`, 194, 24, { align: "right" });

  if (student.photoName) {
    try {
      const response = await fetch(`/api/v1/students/${encodeURIComponent(student.registrationNo)}/photo`);
      if (response.ok) {
        const format = (response.headers.get("content-type") || "").includes("png") ? "PNG" : "JPEG";
        doc.setDrawColor(205, 216, 227);
        doc.roundedRect(165, 39, 29, 34, 2, 2, "S");
        doc.addImage(new Uint8Array(await response.arrayBuffer()), format, 166, 40, 27, 32);
      }
    } catch {
      /* The profile remains downloadable if the photograph cannot be loaded. */
    }
  }

  doc.setTextColor(18, 42, 66);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text([student.firstName, student.middleNames, student.lastName].filter(Boolean).join(" "), 18, 49);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Registration No: ${student.registrationNo}`, 18, 57);
  doc.text(`Status: ${student.status}`, 157, 57, { align: "right" });

  doc.setFontSize(9);
  section("PERSONAL DETAILS", 72);
  row("Full name", [student.firstName, student.middleNames, student.lastName].filter(Boolean).join(" "), 84);
  row("Date of birth", student.dateOfBirth ? fmtDate(student.dateOfBirth) : "—", 94);
  row("National ID", student.idNo, 104);
  row("Mobile", student.mobile, 114);
  row("WhatsApp", student.whatsapp, 124);
  row("Email", student.email, 134);
  row("University", student.university, 144);
  row("Current year", student.currentYear, 154);
  row("Address", student.address, 164);

  section("PRIMARY EMERGENCY CONTACT", 172);
  row("Name", student.emergency1Name, 184);
  row("Relationship", student.emergency1Relationship, 194);
  row("Contact", student.emergency1Contact, 204);
  row("Address", student.emergency1Address, 214);

  section("SECONDARY EMERGENCY CONTACT", 232);
  row("Name", student.emergency2Name, 244);
  row("Relationship", student.emergency2Relationship, 254);
  row("Contact", student.emergency2Contact, 264);
  row("Address", student.emergency2Address, 274);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(110, 125, 143);
  doc.text("The Perk Haven Hostel · Resident profile record", 105, 290, { align: "center" });
  doc.save(`Perk-Haven-resident-Profile-${student.registrationNo}.pdf`);
}

function Profile({
  student,
  payments,
  adjustments,
  profileRequests,
  roomTransferRequests,
  tab,
  setTab,
  close,
  studentUpdated,
}: {
  student: Student;
  payments: Payment[];
  adjustments: MonthlyAdjustment[];
  profileRequests: StudentProfileRequest[];
  roomTransferRequests: RoomTransferRequest[];
  tab: string;
  setTab: (t: string) => void;
  close: () => void;
  studentUpdated: (student: Student) => void;
}) {
  const [photoBusy, setPhotoBusy] = useState(false);
  const [editingStayDates, setEditingStayDates] = useState(false);
  const [profileAgreements, setProfileAgreements] = useState<AgreementRecord[]>([]);
  const [profileSettlements, setProfileSettlements] = useState<SettlementRecord[]>([]);
  const [agreementPreview, setAgreementPreview] = useState<{ entry: AgreementRecord; data: AgreementData } | null>(null);
  const [settlementPreview, setSettlementPreview] = useState<SettlementRecord | null>(null);
  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/v1/agreements").then((response) => response.ok ? response.json() : Promise.reject(new Error("Unable to load agreements"))),
      fetch("/api/v1/checkout-settlements").then((response) => response.ok ? response.json() : Promise.reject(new Error("Unable to load check-out settlements"))),
    ]).then(([agreementResult, settlementResult]) => {
      if (!active) return;
      setProfileAgreements((agreementResult.agreements || []).filter((entry: AgreementRecord) => entry.registrationNo === student.registrationNo));
      setProfileSettlements((settlementResult.settlements || []).filter((entry: SettlementRecord) => entry.registrationNo === student.registrationNo));
    }).catch(() => { if (active) { setProfileAgreements([]); setProfileSettlements([]); } });
    return () => { active = false; };
  }, [student.registrationNo]);
  const latestTransfer = [...roomTransferRequests]
    .filter((request) => request.status === "Completed")
    .sort((a, b) =>
      (b.transferDate || b.reviewedAt).localeCompare(
        a.transferDate || a.reviewedAt,
      ),
    )[0];
  const uploadPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const photo = event.target.files?.[0];
    if (!photo) return;
    setPhotoBusy(true);
    const form = new FormData();
    form.set("file", photo);
    try {
      const response = await fetch(`/api/v1/students/${encodeURIComponent(student.registrationNo)}/photo`, {
        method: "POST",
        body: form,
      });
      const data = await response.json();
      if (response.ok) studentUpdated(studentFromApi(data));
    } finally {
      setPhotoBusy(false);
      event.target.value = "";
    }
  };
  return (
    <div className="profile">
      <header>
        <button onClick={close}>← Back to residents</button>
        <div>
          <button onClick={() => void downloadStudentProfilePdf(student)}>
            ⇩ Download profile PDF
          </button>
          <button onClick={() => setEditingStayDates(true)}>
            Edit profile
          </button>
        </div>
      </header>
      <section className="profilehero">
        <div className="profile-photo-wrap">
          <div
            className={`profile-photo ${student.photoKey ? "has-photo" : ""}`}
            role="img"
            aria-label={`Photograph of ${student.firstName} ${student.lastName}`}
            style={
              student.photoKey
                ? {
                    backgroundImage: `url("/api/v1/students/${encodeURIComponent(student.registrationNo)}/photo?v=${encodeURIComponent(student.photoName || "photo")}")`,
                  }
                : undefined
            }
          >
            {!student.photoKey
              ? `${student.firstName[0]}${student.lastName[0]}`
              : null}
          </div>
          <label className="photo-upload">
            {photoBusy
              ? "Uploading…"
              : student.photoKey
                ? "Change photo"
                : "Add photo"}
            <input
              type="file"
              accept="image/*"
              disabled={photoBusy}
              onChange={uploadPhoto}
            />
          </label>
        </div>
        <div>
          <p>{student.registrationNo}</p>
          <h2>
            {student.firstName} {student.lastName}
          </h2>
          <span className={`status ${studentStatusTone(student)}`}>
            ● {student.status}
          </span>
        </div>
        <div>
          <small>HOSTEL ROOM</small>
          <b>{student.roomNo}</b>
          <span>{cash.format(student.monthlyRent)} / month</span>
        </div>
      </section>
      <nav>
        {[
          "Personal details",
          "Emergency contacts",
          "Medical condition",
          "Payment details",
          "Agreement & Check-Out Settlement",
          "Profile Change History",
        ].map((x) => (
          <button
            key={x}
            className={tab === x ? "active" : ""}
            onClick={() => setTab(x)}
          >
            {x}
          </button>
        ))}
      </nav>
      <div className="profilebody">
        {tab === "Personal details" && (
          <div className="detailgrid">
            <Detail
              title="IDENTIFICATION"
              rows={[
                ["Full name", [student.firstName, student.middleNames, student.lastName].filter(Boolean).join(" ")],
                ["Date of birth", student.dateOfBirth ? fmtDate(student.dateOfBirth) : "—"],
                ["National ID", student.idNo],
                ["Registration", student.registrationNo],
              ]}
            />
            <Detail
              title="CONTACT"
              rows={[
                ["Mobile", student.mobile],
                ["WhatsApp", student.whatsapp],
                ["Email", student.email],
                ["Address", student.address],
              ]}
            />
            <Detail
              title="EDUCATION"
              rows={[
                ["University", student.university],
                ["Current year", student.currentYear],
              ]}
            />
            <Detail
              title="HOSTEL"
              rows={[
                ["Registered", fmtDate(student.registeredDate)],
                ["Accommodation start date", fmtDate(student.startDate)],
                [
                  "Notice to vacate",
                  student.noticeToVacateDate
                    ? fmtDate(student.noticeToVacateDate)
                    : "Not provided",
                ],
                [
                  "Vacated date",
                  student.vacatedDate
                    ? fmtDate(student.vacatedDate)
                    : "Not provided",
                ],
                    ["All settled", student.allSettled ? "Yes" : "No"],
                    [
                      "Contract agreement",
                      student.contractAgreementStatus || "Not signed",
                    ],
                [
                  "Previous hostel room",
                  latestTransfer?.currentRoomNo || "No previous hostel room",
                ],
                [
                  "Transfer date",
                  latestTransfer?.transferDate
                    ? fmtDate(latestTransfer.transferDate)
                    : "Not applicable",
                ],
                ["Hostel Room", student.roomNo],
                ["Monthly Accommodation Fee", cash.format(student.monthlyRent)],
                [
                  "Previous security deposit",
                  latestTransfer
                    ? cash.format(latestTransfer.originalDepositAmount)
                    : cash.format(
                        student.originalDepositPayable ||
                          student.depositPayable,
                      ),
                ],
                ["Current security deposit", cash.format(student.depositPayable)],
              ]}
            />
          </div>
        )}
        {tab === "Emergency contacts" && (
          <div className="detailgrid">
            <Detail
              title="PRIMARY CONTACT"
              rows={[
                ["Name", student.emergency1Name],
                ["Contact", student.emergency1Contact],
                ["Relationship", student.emergency1Relationship],
                ["Address", student.emergency1Address],
              ]}
            />
            <Detail
              title="SECONDARY CONTACT"
              rows={[
                ["Name", student.emergency2Name || "Not provided"],
                ["Contact", student.emergency2Contact || "—"],
                ["Relationship", student.emergency2Relationship || "—"],
                ["Address", student.emergency2Address || "—"],
              ]}
            />
          </div>
        )}
        {tab === "Medical condition" && (
          <div className="detailgrid">
            <Detail title="MEDICAL CONDITION" rows={[
              ["Special medical condition", student.hasMedicalCondition ? "Yes" : "No"],
              ["Details", student.hasMedicalCondition ? student.medicalConditionDetails || "Not provided" : "Not applicable"],
            ]} />
          </div>
        )}
        {tab === "Payment details" && (
          <StudentPaymentProfile
            student={student}
            payments={payments}
            adjustments={adjustments}
          />
        )}
        {tab === "Agreement & Check-Out Settlement" && (
          <div className="profile-change-history">
            <div className="section-heading history-section-heading"><div><p className="tag">AGREEMENTS</p><h2>Issued agreements</h2></div></div>
            <div className="tablewrap"><table><thead><tr><th>REFERENCE</th><th>REVISION</th><th>ISSUED</th><th>STATUS</th><th>COPY</th></tr></thead><tbody>{profileAgreements.map((entry) => { let data: AgreementData | null = null; try { data = JSON.parse(entry.agreementDataJson); } catch {} return <tr key={entry.id}><td>{entry.agreementNo}</td><td>{entry.revisionLabel}</td><td>{fmtDateTime(entry.issuedAt)}</td><td>{entry.status}</td><td>{data && <div className="inline-actions"><button className="secondary" onClick={() => setAgreementPreview({ entry, data: data! })}>View PDF</button><button className="secondary" onClick={() => downloadAgreementPdf(data!, `${entry.agreementNo}-${entry.revisionLabel}.pdf`, entry.signedName && entry.signedAt ? { name: entry.signedName, date: entry.signedAt } : undefined)}>Download PDF</button></div>}</td></tr>; })}{!profileAgreements.length && <tr><td colSpan={5}>No agreements have been issued.</td></tr>}</tbody></table></div>
            <div className="section-heading history-section-heading"><div><p className="tag">CHECK-OUT SETTLEMENTS</p><h2>Issued check-out settlements</h2></div></div>
            <div className="tablewrap"><table><thead><tr><th>REFERENCE</th><th>CHECK-OUT DATE</th><th>ISSUED</th><th>COPY</th></tr></thead><tbody>{profileSettlements.map((entry) => <tr key={entry.id}><td>{entry.settlementNo}</td><td>{entry.checkoutDate ? fmtDate(entry.checkoutDate) : "—"}</td><td>{fmtDateTime(entry.issuedAt)}</td><td><div className="inline-actions"><button className="secondary" onClick={() => setSettlementPreview(entry)}>View PDF</button><a className="button secondary" href={`/api/v1/checkout-settlements/${entry.id}/pdf`} download={`${entry.settlementNo}.pdf`}>Download PDF</a></div></td></tr>)}{!profileSettlements.length && <tr><td colSpan={4}>No check-out settlements have been issued.</td></tr>}</tbody></table></div>
          </div>
        )}
        {tab === "Profile Change History" && (
          <div className="profile-change-history">
            <ProfileRequestHistory requests={profileRequests} />
            <div className="section-heading history-section-heading">
              <div>
                <p className="tag">HOSTEL ROOM HISTORY</p>
                <h2>Hostel Room and security deposit changes</h2>
              </div>
            </div>
            <div className="tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>REQUEST</th>
                    <th>PREVIOUS HOSTEL ROOM</th>
                    <th>NEW HOSTEL ROOM</th>
                    <th>TRANSFER DATE</th>
                    <th>PREVIOUS SECURITY DEPOSIT<small>(LKR)</small></th>
                    <th>CURRENT SECURITY DEPOSIT<small>(LKR)</small></th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {roomTransferRequests.map((request) => (
                    <tr key={request.id}>
                      <td>
                        <b>{request.requestNo}</b>
                        <small>{fmtDate(request.requestedDate)}</small>
                      </td>
                      <td>{request.currentRoomNo}</td>
                      <td>{request.requestedRoomNo}</td>
                      <td>
                        {request.transferDate
                          ? fmtDate(request.transferDate)
                          : "Pending"}
                      </td>
                      <td>{amountOnly.format(request.originalDepositAmount)}</td>
                      <td>{amountOnly.format(request.revisedDepositAmount)}</td>
                      <td>
                        <span
                          className={`approval-status ${request.status.toLowerCase()}`}
                        >
                          {request.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {!roomTransferRequests.length && (
                    <tr>
                      <td colSpan={7}>No hostel room changes have been recorded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      {editingStayDates && (
        <StayDatesModal
          student={student}
          close={() => setEditingStayDates(false)}
          save={(updated) => {
            studentUpdated(updated);
            setEditingStayDates(false);
          }}
        />
      )}
      {agreementPreview && <div className="backdrop"><section className="modal agreement-workspace-modal"><ModalHead tag="ISSUED AGREEMENT" title={`${agreementPreview.entry.agreementNo} · ${agreementPreview.entry.revisionLabel}`} text="View the issued agreement without leaving the resident profile." close={() => setAgreementPreview(null)} /><AgreementDocumentPreview data={agreementPreview.data} signature={agreementPreview.entry.signedName && agreementPreview.entry.signedAt ? { name: agreementPreview.entry.signedName, date: agreementPreview.entry.signedAt } : undefined} /><div className="modalactions"><button className="secondary" onClick={() => downloadAgreementPdf(agreementPreview.data, `${agreementPreview.entry.agreementNo}-${agreementPreview.entry.revisionLabel}.pdf`, agreementPreview.entry.signedName && agreementPreview.entry.signedAt ? { name: agreementPreview.entry.signedName, date: agreementPreview.entry.signedAt } : undefined)}>Download PDF</button></div></section></div>}
      {settlementPreview && <div className="backdrop"><section className="modal document-preview-modal"><ModalHead tag="ISSUED CHECK-OUT SETTLEMENT" title={settlementPreview.settlementNo} text="View the issued check-out settlement without leaving the resident profile." close={() => setSettlementPreview(null)} /><iframe src={`/api/v1/checkout-settlements/${settlementPreview.id}/pdf`} title={settlementPreview.settlementNo} /><div className="modalactions"><a className="button secondary" href={`/api/v1/checkout-settlements/${settlementPreview.id}/pdf`} download={`${settlementPreview.settlementNo}.pdf`}>Download PDF</a></div></section></div>}
    </div>
  );
}

function StaffProfile({
  member,
  designations,
  payroll,
  tab,
  setTab,
  close,
  staffUpdated,
  selfService = false,
  readOnly = false,
}: {
  member: Staff;
  designations: StaffDesignation[];
  payroll: StaffPayroll[];
  tab: string;
  setTab: (tab: string) => void;
  close: () => void;
  staffUpdated: (member: Staff) => void;
  selfService?: boolean;
  readOnly?: boolean;
}) {
  const [photoBusy, setPhotoBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [payslipPreview, setPayslipPreview] = useState<{
    url: string;
    entry: StaffPayroll;
  } | null>(null);
  const uploadPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const photo = event.target.files?.[0];
    if (!photo) return;
    setPhotoBusy(true);
    const form = new FormData();
    form.set("staffNo", member.staffNo);
    form.set("photo", photo);
    try {
      const response = await fetch("/api/staff/photo", {
        method: "POST",
        body: form,
      });
      const data = await response.json();
      if (response.ok && data.staff) staffUpdated(data.staff);
    } finally {
      setPhotoBusy(false);
      event.target.value = "";
    }
  };
  const orderedPayroll = [...payroll].sort(
    (a, b) =>
      b.month.localeCompare(a.month) ||
      b.paymentDate.localeCompare(a.paymentDate),
  );
  return (
    <div className="profile staff-profile">
      <header>
        {!selfService && !readOnly && <button onClick={close}>← Back to staff</button>}
        <div>
          {!readOnly && <button onClick={() => setEditing(true)}>{selfService ? "Update my details" : "Edit staff details"}</button>}
        </div>
      </header>
      <section className="profilehero">
        <div className="profile-photo-wrap">
          <div
            className={`profile-photo ${member.photoKey ? "has-photo" : ""}`}
            role="img"
            aria-label={`Photograph of ${member.firstName} ${member.lastName}`}
            style={
              member.photoKey
                ? {
                    backgroundImage: `url("/api/staff/photo?staffNo=${encodeURIComponent(member.staffNo)}&v=${encodeURIComponent(member.photoName || "photo")}")`,
                  }
                : undefined
            }
          >
            {!member.photoKey
              ? `${member.firstName[0]}${member.lastName[0]}`
              : null}
          </div>
          {!readOnly && <label className="photo-upload">
            {photoBusy
              ? "Uploading…"
              : member.photoKey
                ? "Change photo"
                : "Add photo"}
            <input
              type="file"
              accept="image/*"
              disabled={photoBusy}
              onChange={uploadPhoto}
            />
          </label>}
        </div>
        <div>
          <p>{member.staffNo}</p>
          <h2>
            {member.firstName} {member.lastName}
          </h2>
          <span className={`status ${member.status.toLowerCase()}`}>
            ● {member.status}
          </span>
        </div>
        <div>
          <small>DESIGNATION</small>
          <b>{member.designation}</b>
          <span>{cash.format(member.monthlySalary)} / month</span>
        </div>
      </section>
      <nav>
        {[
          "Personal details",
          "Emergency contacts",
          "Salary payment details",
        ].map((item) => (
          <button
            key={item}
            className={tab === item ? "active" : ""}
            onClick={() => setTab(item)}
          >
            {item}
          </button>
        ))}
      </nav>
      <div className="profilebody">
        {tab === "Personal details" && (
          <div className="detailgrid">
            <Detail
              title="IDENTIFICATION"
              rows={[
                ["Full name", `${member.firstName} ${member.lastName}`],
                ["National ID", member.idNo],
                ["Staff no.", member.staffNo],
              ]}
            />
            <Detail
              title="CONTACT"
              rows={[
                ["Mobile", member.mobile],
                ["WhatsApp", member.whatsapp || "—"],
                ["Email", member.email || "—"],
                ["Address", member.address || "—"],
              ]}
            />
            <Detail
              title="EMPLOYMENT"
              rows={[
                ["Designation", member.designation],
                ["Monthly salary", cash.format(member.monthlySalary)],
                ["Accommodation start date", fmtDate(member.startDate)],
                ["Finish date", member.finishDate ? fmtDate(member.finishDate) : "Not provided"],
                ["Status", member.status],
              ]}
            />
            <Detail
              title="BANK ACCOUNT"
              rows={[
                ["Account holder", member.accountHolderName || "Not provided"],
                ["Account no.", member.accountNo || "—"],
                ["Bank", member.bank || "—"],
                ["Branch", member.bankBranch || "—"],
              ]}
            />
          </div>
        )}
        {tab === "Emergency contacts" && (
          <div className="detailgrid">
            <Detail
              title="PRIMARY CONTACT"
              rows={[
                ["Name", member.emergency1Name],
                ["Contact", member.emergency1Contact],
                ["Relationship", member.emergency1Relationship || "—"],
                ["Address", member.emergency1Address || "—"],
              ]}
            />
            <Detail
              title="SECONDARY CONTACT"
              rows={[
                ["Name", member.emergency2Name || "Not provided"],
                ["Contact", member.emergency2Contact || "—"],
                ["Relationship", member.emergency2Relationship || "—"],
                ["Address", member.emergency2Address || "—"],
              ]}
            />
          </div>
        )}
        {tab === "Salary payment details" && (
          <section>
            <div className="section-title-row payroll-heading">
              <div>
                <p className="tag">STAFF PAYROLL</p>
                <h2>Salary payment details</h2>
                <p>Latest payments are shown first.</p>
              </div>
            </div>
            <div className="panel tablewrap">
              <table className="payroll-table">
                <thead>
                  <tr>
                    <th>MONTH</th>
                    <th>GROSS PAY<small>(LKR)</small></th>
                    <th>SALARY ADVANCE<small>(LKR)</small></th>
                    <th>OTHER DEDUCTIONS<small>(LKR)</small></th>
                    <th>NET PAYABLE<small>(LKR)</small></th>
                    <th>PAYMENT DATE</th>
                    <th>STATUS</th>
                    <th>PAYSLIP</th>
                  </tr>
                </thead>
                <tbody>
                  {orderedPayroll.map((entry) => (
                    <tr key={entry.id}>
                      <td>
                        <b>{fmtMonth(entry.month)}</b>
                      </td>
                      <td>{amountOnly.format(entry.amountPayable)}</td>
                      <td>{amountOnly.format(entry.salaryAdvance)}</td>
                      <td>
                        {amountOnly.format(
                          (entry.noPayDeduction || 0) +
                            entry.otherDeductions +
                            (entry.employeeEpf || 0),
                        )}
                      </td>
                      <td>
                        <b>{amountOnly.format(entry.totalPaid)}</b>
                      </td>
                      <td>
                        {entry.paymentDate
                          ? fmtDate(entry.paymentDate)
                          : "Pending"}
                      </td>
                      <td>
                        <span
                          className={`payroll-payment-status ${entry.paymentStatus === "Paid" ? "paid" : entry.paymentStatus === "Submitted" ? "submitted" : "outstanding"}`}
                        >
                          ● {entry.paymentStatus || "Prepared"}
                        </span>
                      </td>
                      <td>
                        <div className="payroll-actions">
                          <button
                            className="review-button"
                            onClick={async () => {
                              const url = await downloadPayslipPdf(
                                member,
                                entry,
                                "view",
                              );
                              if (url) setPayslipPreview({ url, entry });
                            }}
                          >
                            View
                          </button>
                          <button
                            className="review-button"
                            onClick={() => downloadPayslipPdf(member, entry)}
                          >
                            Download PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!orderedPayroll.length && (
                    <tr>
                      <td colSpan={8}>
                        No salary payments recorded for this staff member.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
      {editing && (
        <EditStaff
          member={member}
          selfService={selfService}
          designations={designations}
          close={() => setEditing(false)}
          save={(updated) => {
            staffUpdated(updated);
            setEditing(false);
          }}
        />
      )}
      {payslipPreview && (
        <PayslipPdfViewer
          url={payslipPreview.url}
          member={member}
          entry={payslipPreview.entry}
          close={() => {
            URL.revokeObjectURL(payslipPreview.url);
            setPayslipPreview(null);
          }}
        />
      )}
    </div>
  );
}

function StudentPaymentProfile({
  student,
  payments,
  adjustments,
}: {
  student: Student;
  payments: Payment[];
  adjustments: MonthlyAdjustment[];
}) {
  const [view, setView] = useState<"deposit" | "rent" | "outstanding" | "records">(
    "deposit",
  );
  const [printScope, setPrintScope] = useState<
    "all" | "period" | "deposit" | "outstanding"
  >("all");
  const [printFrom, setPrintFrom] = useState("");
  const [printTo, setPrintTo] = useState("");
  const [evidenceEntries, setEvidenceEntries] = useState<
    StudentPaymentEvidence[]
  >([]);
  const [invoiceEntries, setInvoiceEntries] = useState<StudentInvoice[]>([]);
  useEffect(() => {
    fetch("/api/payment-evidence")
      .then((response) => response.json())
      .then((result) =>
        setEvidenceEntries(
          (result.evidence || []).filter(
            (entry: StudentPaymentEvidence) =>
              entry.registrationNo === student.registrationNo,
          ),
        ),
      )
      .catch(() => setEvidenceEntries([]));
  }, [student.registrationNo]);
  useEffect(() => {
    fetch(`/api/v1/invoices?registrationNo=${encodeURIComponent(student.registrationNo)}&size=100`)
      .then((response) => response.json())
      .then((result) =>
        setInvoiceEntries(
          (result.items || []).filter(
            (entry: StudentInvoice) =>
              entry.registrationNo === student.registrationNo,
          ),
        ),
      )
      .catch(() => setInvoiceEntries([]));
  }, [student.registrationNo]);
  const deposits = payments
    .filter(
      (payment) =>
        canonicalPaymentType(payment.type) === "Deposit" &&
        payment.paidAmount > 0,
    )
    .sort((a, b) => transactionIdFor(b).localeCompare(transactionIdFor(a)));
  const rentReceipts = payments
    .filter(
      (payment) =>
        canonicalPaymentType(payment.type) === "Rent" && payment.paidAmount > 0,
    )
    .sort((a, b) => transactionIdFor(b).localeCompare(transactionIdFor(a)));
  const evidenceByPaymentId = new Map(
    evidenceEntries
      .filter((entry) => entry.linkedPaymentId)
      .map((entry) => [entry.linkedPaymentId, entry]),
  );
  const awaitingEvidence = evidenceEntries
    .filter((entry) => !entry.linkedPaymentId && entry.status !== "Approved")
    .sort((a, b) => b.submittedDate.localeCompare(a.submittedDate));
  const currentMonth = `${new Date().getFullYear()}-${String(
    new Date().getMonth() + 1,
  ).padStart(2, "0")}`;
  const lastCompletedMonth = addMonths(currentMonth, -1);
  const firstPayableMonth =
    student.startDate.slice(0, 7) < "2026-01"
      ? "2026-01"
      : student.startDate.slice(0, 7);
  const finalPayableMonth = student.vacatedDate
    ? student.vacatedDate.slice(0, 7) < lastCompletedMonth
      ? student.vacatedDate.slice(0, 7)
      : lastCompletedMonth
    : lastCompletedMonth;
  const outstandingRows = monthRange(firstPayableMonth, finalPayableMonth)
    .map((month) => {
      const payable = rentPayable(student, month, adjustments);
      const paid = rentPaid(payments, student.registrationNo, month);
      return { month, payable, paid, outstanding: Math.max(0, payable - paid) };
    })
    .filter((row) => row.outstanding > 0);
  const totalDeposit = deposits.reduce(
    (sum, payment) => sum + payment.paidAmount,
    0,
  );
  const depositPayable = student.depositPayable;
  const depositOutstanding = Math.max(0, depositPayable - totalDeposit);
  const totalRent = rentReceipts.reduce(
    (sum, payment) => sum + payment.paidAmount,
    0,
  );
  const totalOutstanding = outstandingRows.reduce(
    (sum, row) => sum + row.outstanding,
    0,
  );
  const paymentDueDate = (payment: Payment) => {
    if (canonicalPaymentType(payment.type) === "Deposit")
      return student.startDate;
    const [year, month] = payment.month.split("-").map(Number);
    return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
  };
  const studentReceiptAvailable = (payment: Payment) =>
    (payment.settlementMethod || "Bank Transfer") === "Cash"
      ? Boolean(payment.cashVerified)
      : Boolean(payment.receiptEmailStatus && !payment.receiptEmailStatus.toLowerCase().includes("pending"));
  type PaymentRecordRow = { invoice: StudentInvoice; payment: Payment | null; payable: number | null };
  const recordRows: PaymentRecordRow[] = [...invoiceEntries]
    .filter((invoice) => printScope !== "deposit" || invoice.invoiceType === "Deposit")
    .filter((invoice) => printScope !== "period" || ((!printFrom || invoice.dueDate >= printFrom) && (!printTo || invoice.dueDate <= printTo)))
    .filter((invoice) => printScope !== "outstanding" || (invoice.status !== "Paid" && invoice.status !== "Cancelled"))
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate) || left.invoiceNo.localeCompare(right.invoiceNo))
    .flatMap<PaymentRecordRow>((invoice) => {
      const invoicePayments = [...deposits, ...rentReceipts]
        .filter((payment) => payment.invoiceNo === invoice.invoiceNo)
        .sort((left, right) => left.paidDate.localeCompare(right.paidDate) || transactionIdFor(left).localeCompare(transactionIdFor(right)));
      if (!invoicePayments.length) return [{ invoice, payment: null, payable: invoice.amount }];
      return invoicePayments.map((payment, index) => ({ invoice, payment, payable: index === 0 ? invoice.amount : null }));
    });
  const downloadPaymentLog = async () => {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });
    try {
      const response = await fetch("/perkhaven-logo.png");
      if (response.ok)
        pdf.addImage(
          new Uint8Array(await response.arrayBuffer()),
          "PNG",
          14,
          8,
          22,
          21,
        );
    } catch {
      /* Keep the statement downloadable without the logo. */
    }
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(17);
    pdf.text("THE PERK HAVEN HOSTEL", 42, 16);
    pdf.setFontSize(11);
    pdf.text("RESIDENT PAYMENT LOG", 42, 23);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(
      `${student.firstName} ${student.lastName}  |  ${student.registrationNo}  |  hostel room ${student.roomNo}`,
      14,
      35,
    );
    const scopeLabel =
      printScope === "deposit"
        ? "Security Deposit payments"
        : printScope === "outstanding"
          ? "Outstanding hostel room payments"
          : printScope === "period"
            ? `Invoice due dates ${printFrom ? fmtDate(printFrom) : "Beginning"} to ${printTo ? fmtDate(printTo) : "Present"}`
            : "All payments";
    pdf.text(
      `Selection: ${scopeLabel}  |  Generated: ${fmtDate(new Date().toISOString().slice(0, 10))}`,
      14,
      41,
    );
    const widths = [36, 38, 23, 29, 30, 30, 32, 32],
      headers = [
        "TRANSACTION ID",
        "INVOICE NO.",
        "TYPE",
        "MONTH",
        "DUE DATE",
        "PAYMENT DATE",
        "PAYABLE",
        "AMOUNT PAID",
      ];
    let y = 51;
    const drawHeader = () => {
      pdf.setFillColor(27, 72, 111);
      pdf.rect(14, y - 6, 269, 9, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7.5);
      let x = 16;
      headers.forEach((header, index) => {
        pdf.text(header, x, y);
        x += widths[index];
      });
      pdf.setTextColor(20, 38, 56);
      pdf.setFont("helvetica", "normal");
      y += 7;
    };
    drawHeader();
    recordRows.forEach(({ invoice, payment, payable }) => {
      if (y > 194) {
        pdf.addPage("a4", "landscape");
        y = 18;
        drawHeader();
      }
      const values = [
        payment ? transactionIdFor(payment) : "—",
        invoice.invoiceNo,
        invoice.invoiceType,
        invoice.invoiceType === "Deposit" ? "—" : fmtMonth(invoice.month),
        fmtDate(invoice.dueDate),
        payment ? fmtDate(payment.paidDate) : "—",
        payable == null ? "Included Above" : amountOnly.format(payable),
        payment ? amountOnly.format(payment.paidAmount) : "—",
      ];
      let x = 16;
      values.forEach((value, index) => {
        pdf.text(String(value), x, y);
        x += widths[index];
      });
      pdf.setDrawColor(218, 226, 234);
      pdf.line(14, y + 2, 283, y + 2);
      y += 7;
    });
    if (!recordRows.length) {
      pdf.text("No payments match the selected filter.", 16, y);
      y += 7;
    }
    const total =
      printScope === "outstanding"
        ? recordRows.reduce((sum, row) => sum + (row.payable == null ? 0 : Math.max(0, row.invoice.amount - (row.invoice.paidAmount || 0))), 0)
        : recordRows.reduce((sum, row) => sum + (row.payment?.paidAmount || 0), 0);
    y += 4;
    pdf.setFont("helvetica", "bold");
    pdf.text(
      `${printScope === "outstanding" ? "TOTAL OUTSTANDING" : "TOTAL PAID"}: LKR ${amountOnly.format(total)}`,
      220,
      y,
      { align: "right" },
    );
    const totalPages = pdf.getNumberOfPages();
    for (let page = 1; page <= totalPages; page += 1) {
      pdf.setPage(page);
      pdf.setDrawColor(205, 216, 227);
      pdf.line(14, 198, 283, 198);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      pdf.setTextColor(70, 88, 106);
      pdf.text(
        "This is a system-generated payment log from The Perk Haven Hostel.",
        14,
        203,
      );
      pdf.text(`Page ${page} of ${totalPages}`, 283, 203, { align: "right" });
    }
    downloadBlob(
      pdf.output("blob"),
      `Perk-Haven-Payment-Log-${student.registrationNo}.pdf`,
    );
  };
  return (
    <section className="student-payment-profile">
      <div className="profile-payment-stats">
        <article>
          <small>SECURITY DEPOSIT PAYABLE</small>
          <b>{cash.format(depositPayable)}</b>
          <span>Set when the resident was registered</span>
        </article>
        <article>
          <small>TOTAL HOSTEL ROOM PAYMENTS</small>
          <b>{cash.format(totalRent)}</b>
          <span>{rentReceipts.length} transaction(s)</span>
        </article>
        <article className={totalOutstanding ? "attention" : "clear"}>
          <small>OUTSTANDING HOSTEL ROOM PAYMENTS</small>
          <b>{cash.format(totalOutstanding)}</b>
          <span>Through {fmtMonth(lastCompletedMonth)}</span>
        </article>
      </div>
      <div
        className="profile-payment-tabs"
        role="tablist"
        aria-label="Resident payment details"
      >
        <button
          className={view === "deposit" ? "active" : ""}
          onClick={() => setView("deposit")}
        >

          Security Deposit
        </button>
        <button
          className={view === "rent" ? "active" : ""}
          onClick={() => setView("rent")}
        >

          Hostel Room Payments
        </button>
        <button
          className={view === "outstanding" ? "active" : ""}
          onClick={() => setView("outstanding")}
        >

          Outstanding Hostel Room Payments
        </button>
        <button
          className={view === "records" ? "active" : ""}
          onClick={() => setView("records")}
        >
          Records & PDF
        </button>
      </div>
      {view === "records" && <><div className="payment-log-export">
        <div>
          <small>PRINT PAYMENT LOG</small>
          <b>Download approved payments as PDF</b>
        </div>
        <label>
          Records
          <select
            value={printScope}
            onChange={(event) =>
              setPrintScope(
                event.target.value as
                  | "all"
                  | "period"
                  | "deposit"
                  | "outstanding",
              )
            }
          >
            <option value="all">All payments</option>
            <option value="period">Particular period</option>
            <option value="deposit">Security Deposit only</option>
            <option value="outstanding">Outstanding payments</option>
          </select>
        </label>
        {printScope === "period" && (
          <>
            <label>
              From
              <input
                type="date"
                value={printFrom}
                onChange={(event) => setPrintFrom(event.target.value)}
              />
            </label>
            <label>
              To
              <input
                type="date"
                min={printFrom}
                value={printTo}
                onChange={(event) => setPrintTo(event.target.value)}
              />
            </label>
          </>
        )}
        <button className="primary compact" onClick={downloadPaymentLog}>
          ↓ Download PDF
        </button>
      </div>
      <div className="panel tablewrap payment-records-table">
        <table>
          <thead><tr><th>INVOICE NO.</th><th>TYPE</th><th>DUE DATE</th><th>TRANSACTION ID</th><th>PAYMENT DATE</th><th>PAYABLE<small>(LKR)</small></th><th>PAID<small>(LKR)</small></th><th>OUTSTANDING<small>(LKR)</small></th></tr></thead>
          <tbody>
            {recordRows.map(({ invoice, payment, payable }, index) => <tr key={`${invoice.id}-${payment?.id || "outstanding"}-${index}`}>
              <td><b className="transaction-id">{invoice.invoiceNo}</b></td>
              <td>{invoice.invoiceType}</td>
              <td>{fmtDate(invoice.dueDate)}</td>
              <td>{payment ? transactionIdFor(payment) : "—"}</td>
              <td>{payment ? fmtDate(payment.paidDate) : "—"}</td>
              <td>{payable == null ? "Included Above" : amountOnly.format(payable)}</td>
              <td>{payment ? amountOnly.format(payment.paidAmount) : "—"}</td>
              <td>{amountOnly.format(Math.max(0, invoice.amount - (invoice.paidAmount || 0)))}</td>
            </tr>)}
            {!recordRows.length && <tr><td colSpan={8}>No invoice or payment records match this filter.</td></tr>}
          </tbody>
        </table>
      </div></>}
      <div className="panel tablewrap">
        {view === "deposit" && (
          <>
            <div className="deposit-profile-summary">
              <span>
                <small>SECURITY DEPOSIT PAYABLE</small>
                <b>{cash.format(depositPayable)}</b>
              </span>
              <span>
                <small>SECURITY DEPOSIT PAID</small>
                <b>{cash.format(totalDeposit)}</b>
              </span>
              <span className={depositOutstanding ? "attention" : "clear"}>
                <small>OUTSTANDING AMOUNT</small>
                <b>{cash.format(depositOutstanding)}</b>
              </span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>TRANSACTION ID</th>
                  <th>INVOICE NO.</th>
                  <th>DUE DATE</th>
                  <th>PAYMENT DATE</th>
                  <th>CURRENT PAYMENT<small>(LKR)</small></th>
                  <th>EVIDENCE</th>
                  <th>PAYMENT RECEIPT</th>
                  <th>APPROVAL STATUS</th>
                </tr>
              </thead>
              <tbody>
                {deposits.map((payment) => (
                  <tr key={payment.id}>
                    <td>
                      <b className="transaction-id">
                        {transactionIdFor(payment)}
                      </b>
                    </td>
                    <td>{studentReceiptAvailable(payment) ? <a className="evidence-link" href={`/api/payments/receipt?id=${payment.id}&download=1`} download>⬇ Download receipt</a> : <span className="receipt-pending">Pending verification</span>}</td>
                    <td>
                      <b className="transaction-id">
                        {payment.invoiceNo || "—"}
                      </b>
                    </td>
                    <td>{fmtDate(paymentDueDate(payment))}</td>
                    <td>{fmtDate(payment.paidDate)}</td>
                    <td>
                      <b>{amountOnly.format(payment.paidAmount)}</b>
                    </td>
                    <td>
                      {payment.evidenceName ? (
                        <a
                          className="evidence-link"
                          href={`/api/payments/evidence?id=${payment.id}`}
                          download
                        >
                          ⬇ {payment.evidenceName}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <span className="approval-status approved">Approved</span>
                    </td>
                  </tr>
                ))}
                {!deposits.length && (
                  <tr>
                    <td colSpan={8}>No security deposit payments recorded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        )}
        {view === "rent" && (
          <table>
            <thead>
              <tr>
                <th>TRANSACTION ID</th>
                <th>INVOICE NO.</th>
                <th>MONTH</th>
                <th>PAYABLE<small>(LKR)</small></th>
                <th>PAID<small>(LKR)</small></th>
                <th>DUE DATE</th>
                <th>PAYMENT DATE</th>
                <th>EVIDENCE</th>
                <th>PAYMENT RECEIPT</th>
                <th>APPROVAL STATUS</th>
              </tr>
            </thead>
            <tbody>
              {rentReceipts.map((payment) => {
                const evidence = evidenceByPaymentId.get(payment.id);
                const status = evidence?.status || "Approved";
                return (
                  <tr key={payment.id}>
                    <td>
                      <b className="transaction-id">
                        {transactionIdFor(payment)}
                      </b>
                    </td>
                    <td>{studentReceiptAvailable(payment) ? <a className="evidence-link" href={`/api/payments/receipt?id=${payment.id}&download=1`} download>⬇ Download receipt</a> : <span className="receipt-pending">Pending verification</span>}</td>
                    <td>
                      <b className="transaction-id">
                        {payment.invoiceNo || "—"}
                      </b>
                    </td>
                    <td>{fmtMonth(payment.month)}</td>
                    <td>
                      {amountOnly.format(
                        rentPayable(student, payment.month, adjustments),
                      )}
                    </td>
                    <td>—</td>
                    <td>
                      <b>{amountOnly.format(payment.paidAmount)}</b>
                    </td>
                    <td>{fmtDate(paymentDueDate(payment))}</td>
                    <td>{fmtDate(payment.paidDate)}</td>
                    <td>
                      {payment.evidenceName ? (
                        <a
                          className="evidence-link"
                          href={`/api/payments/evidence?id=${payment.id}`}
                          download
                        >
                          ⬇ {payment.evidenceName}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <span
                        className={`approval-status ${status.toLowerCase()}`}
                      >
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {awaitingEvidence.map((entry) => {
                const dueDate = entry.month
                  ? paymentDueDate({
                      ...rentReceipts[0],
                      month: entry.month,
                      type: "Rent",
                    } as Payment)
                  : student.startDate;
                return (
                  <tr
                    key={`evidence-${entry.id}`}
                    className="unverified-payment-row"
                  >
                    <td>
                      <b>{entry.submissionId}</b>
                    </td>
                    <td>
                      <b className="transaction-id">{entry.invoiceNo}</b>
                    </td>
                    <td>{entry.month ? fmtMonth(entry.month) : "Security Deposit"}</td>
                    <td>{amountOnly.format(entry.amount)}</td>
                    <td>—</td>
                    <td>{fmtDate(dueDate)}</td>
                    <td>{fmtDate(entry.submittedDate)}</td>
                    <td>
                      <a
                        className="evidence-link"
                        href={`/api/payment-evidence/file?id=${entry.id}&download=1`}
                        download
                      >
                        ⬇ {entry.evidenceName}
                      </a>
                    </td>
                    <td>
                      <span
                        className={`approval-status ${entry.status.toLowerCase()}`}
                      >
                        {entry.status}
                      </span>
                      {entry.reviewNote && <small>{entry.reviewNote}</small>}
                    </td>
                  </tr>
                );
              })}
              {!rentReceipts.length && !awaitingEvidence.length && (
                <tr>
                  <td colSpan={10}>

                    No hostel room payments or submitted evidence recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
        {view === "outstanding" && (
          <table>
            <thead>
              <tr>
                <th>INVOICE NO.</th>
                <th>MONTH</th>
                <th>AMOUNT PAYABLE<small>(LKR)</small></th>
                <th>AMOUNT PAID<small>(LKR)</small></th>
                <th>OUTSTANDING<small>(LKR)</small></th>
              </tr>
            </thead>
            <tbody>
              {outstandingRows.map((row) => {
                const invoice = invoiceEntries.find(
                  (entry) =>
                    entry.invoiceType === "Rent" && entry.month === row.month,
                );
                return (
                  <tr key={row.month}>
                    <td>
                      <b className="transaction-id">
                        {invoice?.invoiceNo || "—"}
                      </b>
                    </td>
                    <td>
                      <b>{fmtMonth(row.month)}</b>
                    </td>
                    <td>{amountOnly.format(row.payable)}</td>
                    <td>{amountOnly.format(row.paid)}</td>
                    <td className="red">{amountOnly.format(row.outstanding)}</td>
                  </tr>
                );
              })}
              {!outstandingRows.length && (
                <tr>
                  <td colSpan={5} className="green">

                    No outstanding hostel room payments.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

function StayDatesModal({
  student,
  close,
  save,
}: {
  student: Student;
  close: () => void;
  save: (student: Student) => void;
}) {
  const [error, setError] = useState("");
  const [noticeDate, setNoticeDate] = useState(
    student.noticeToVacateDate || "",
  );
  const [vacatedDate, setVacatedDate] = useState(student.vacatedDate || "");
  const [allSettled, setAllSettled] = useState(Boolean(student.allSettled));
  const [contractAgreementStatus, setContractAgreementStatus] = useState<
    "Signed" | "Not signed"
  >(student.contractAgreementStatus === "Signed" ? "Signed" : "Not signed");
  const canSettle = Boolean(noticeDate && vacatedDate);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/students", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        registrationNo: student.registrationNo,
        noticeToVacateDate: noticeDate,
        vacatedDate,
        allSettled,
        contractAgreementStatus,
      }),
    });
    const result = await response.json();
    if (!response.ok)
      return setError(result.error || "Unable to update stay dates");
    save(result.student);
  };
  return (
    <div className="backdrop">
      <form className="modal paymentmodal" onSubmit={submit}>
        <ModalHead
          tag="RESIDENT PROFILE"
          title="Update stay dates"
          text={`${student.registrationNo} · ${student.firstName} ${student.lastName}`}
          close={close}
        />
        <FormSection title="Vacating details">
          <Field
            name="noticeToVacateDate"
            label="Notice to vacate date"
            type="date"
            value={noticeDate}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setNoticeDate(event.target.value);
              if (!event.target.value) setAllSettled(false);
            }}
          />
          <Field
            name="vacatedDate"
            label="Vacated date"
            type="date"
            value={vacatedDate}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setVacatedDate(event.target.value);
              if (!event.target.value) setAllSettled(false);
            }}
          />
          <label>
            Contract agreement status
            <select
              value={contractAgreementStatus}
              onChange={(event) =>
                setContractAgreementStatus(
                  event.target.value as "Signed" | "Not signed",
                )
              }
            >
              <option value="Not signed">Not signed</option>
              <option value="Signed">Signed</option>
            </select>
          </label>
          <label className="settlement-check">
            <input
              type="checkbox"
              checked={allSettled}
              disabled={!canSettle}
              onChange={(event) => setAllSettled(event.target.checked)}
            />
            <span>
              <b>All settled</b>
              <small>
                Confirm only after the resident has vacated and every account is
                settled.
              </small>
            </span>
          </label>
          <div className="departure-preview">
            <small>STATUS AFTER SAVING</small>
            <span
              className={`status ${
                allSettled && canSettle
                  ? "inactive"
                  : noticeDate
                    ? "notice"
                    : "active"
              }`}
            >
              ● {allSettled && canSettle ? "Inactive" : "Active"}
            </span>
          </div>
          {error && <p className="form-error">{error}</p>}
        </FormSection>
        <Actions close={close} text="Save departure status" />
      </form>
    </div>
  );
}
function Detail({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <article className="detail">
      <p className="tag">{title}</p>
      {rows.map((r) => (
        <div key={r[0]}>
          <small>{r[0]}</small>
          <b>{r[1]}</b>
        </div>
      ))}
    </article>
  );
}
