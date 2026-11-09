import type { DayOfWeek, Semester } from "@/generated/prisma/enums";

const dayNames: Record<number, DayOfWeek> = {
  1: "SENIN",
  2: "SELASA",
  3: "RABU",
  4: "KAMIS",
  5: "JUMAT",
  6: "SABTU",
};

export function toDateOnly(date: Date = new Date()) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function toDateInputValue(value: Date | string | null | undefined) {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);

  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

export function startOfDay(date: Date = new Date()) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function endOfDay(date: Date = new Date()) {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

export function startOfMonth(date: Date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function getDayOfWeek(date: Date = new Date()): DayOfWeek | null {
  return dayNames[date.getDay()] ?? null;
}

export function getCurrentSemester(date: Date = new Date()): Semester {
  return date.getMonth() >= 6 ? "GANJIL" : "GENAP";
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) {
    return "-";
  }

  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
  }).format(date);
}

export function formatTimeRange(startTime: string, endTime: string) {
  return `${startTime} - ${endTime}`;
}
