import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const DEFAULT_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "short",
  year: "numeric",
};

export type TrendDirection = "up" | "down" | "equal";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(fullName: string): string {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function calculateAge(
  birthDate: string | Date | null | undefined,
): number | null {
  if (!birthDate) {
    return null;
  }

  const dateValue = typeof birthDate === "string" ? new Date(birthDate) : birthDate;
  if (Number.isNaN(dateValue.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - dateValue.getFullYear();
  const hasBirthdayPassed =
    today.getMonth() > dateValue.getMonth() ||
    (today.getMonth() === dateValue.getMonth() && today.getDate() >= dateValue.getDate());

  if (!hasBirthdayPassed) {
    age -= 1;
  }

  return Math.max(age, 0);
}

export function formatDatePt(
  value: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions,
): string | null {
  if (!value) {
    return null;
  }

  const dateValue = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(dateValue.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("pt-PT", options ?? DEFAULT_DATE_FORMAT).format(
    dateValue,
  );
}

export function formatNumberPt(
  value: string | number | null | undefined,
  minimumFractionDigits = 1,
  maximumFractionDigits = 1,
): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numericValue = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(numericValue)) {
    return null;
  }

  return new Intl.NumberFormat("pt-PT", {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(numericValue);
}

export function calculateTrend(
  initialValue: number | null | undefined,
  currentValue: number | null | undefined,
): { direction: TrendDirection; difference: number } {
  if (
    initialValue === null ||
    initialValue === undefined ||
    currentValue === null ||
    currentValue === undefined
  ) {
    return {
      direction: "equal",
      difference: 0,
    };
  }

  const difference = Number(currentValue) - Number(initialValue);
  if (Math.abs(difference) < Number.EPSILON) {
    return {
      direction: "equal",
      difference: 0,
    };
  }

  return {
    direction: difference > 0 ? "up" : "down",
    difference,
  };
}

