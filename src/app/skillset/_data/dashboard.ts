export type MetricTrend = "up" | "down";

export type Metric = {
  id: string;
  label: string;
  value: string;
  trend: string;
  direction: MetricTrend;
  featured?: boolean;
};

export type RevenuePoint = {
  month: string;
  value: number;
  highlight?: boolean;
};

export type CalendarDay = {
  label: string;
  date: number;
};

export type PurchaseTone = "light" | "medium" | "dark";

export type Purchase = {
  id: string;
  course: string;
  initials: string;
  student: string;
  studentId: string;
  amount: string;
  status: string;
  tone: PurchaseTone;
};

export const metrics: Metric[] = [
  {
    id: "revenue",
    label: "Total Revenue",
    value: "$23,902",
    trend: "+4.2% from last month",
    direction: "up",
    featured: true,
  },
  {
    id: "active-users",
    label: "Active Users",
    value: "16,815",
    trend: "+1.7% from last month",
    direction: "up",
  },
  {
    id: "new-users",
    label: "New Users",
    value: "1,457",
    trend: "-2.9% from last month",
    direction: "down",
  },
  {
    id: "mentors",
    label: "Total Mentors",
    value: "2,023",
    trend: "+0.9% from last month",
    direction: "up",
  },
];

export const revenueData: RevenuePoint[] = [
  { month: "Jan", value: 4200 },
  { month: "Feb", value: 6800 },
  { month: "Mar", value: 8200, highlight: true },
  { month: "Apr", value: 5400 },
  { month: "May", value: 7600 },
  { month: "Jun", value: 9200 },
];

export const revenueTicks = [10_000, 7_500, 5_000, 2_500, 0];

export const communityBreakdown = [
  { label: "New students", value: "42" },
  { label: "Lessons booked", value: "128" },
  { label: "Mentor sessions", value: "36" },
];

export const calendarDays: CalendarDay[] = [
  { label: "Tue", date: 17 },
  { label: "Wed", date: 18 },
  { label: "Thu", date: 19 },
  { label: "Fri", date: 20 },
  { label: "Sat", date: 21 },
];

export const purchases: Purchase[] = [
  {
    id: "purchase-1",
    course: "Digital Marketing",
    initials: "DM",
    student: "Aria",
    studentId: "#3456791",
    amount: "$ 372,00",
    status: "Paid",
    tone: "dark",
  },
  {
    id: "purchase-2",
    course: "UI/UX Fundamentals",
    initials: "UX",
    student: "Noah",
    studentId: "#3456792",
    amount: "$ 248,00",
    status: "Paid",
    tone: "medium",
  },
  {
    id: "purchase-3",
    course: "Data Analytics",
    initials: "DA",
    student: "Mia",
    studentId: "#3456793",
    amount: "$ 415,00",
    status: "Paid",
    tone: "light",
  },
  {
    id: "purchase-4",
    course: "Product Strategy",
    initials: "PS",
    student: "Kai",
    studentId: "#3456794",
    amount: "$ 196,00",
    status: "Paid",
    tone: "medium",
  },
  {
    id: "purchase-5",
    course: "Growth Marketing",
    initials: "GM",
    student: "Lena",
    studentId: "#3456795",
    amount: "$ 325,00",
    status: "Paid",
    tone: "dark",
  },
];
