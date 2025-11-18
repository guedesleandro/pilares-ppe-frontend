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

export function parseDatePt(dateString: string): Date | null {
  if (!dateString || typeof dateString !== "string") {
    return null;
  }

  // Remove espaços em branco
  const cleanDate = dateString.trim();

  // Verifica formato dd/mm/yyyy
  const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const match = cleanDate.match(dateRegex);

  if (!match) {
    return null;
  }

  const [, dayStr, monthStr, yearStr] = match;
  const day = parseInt(dayStr, 10);
  const month = parseInt(monthStr, 10) - 1; // Mês é 0-indexed no Date
  const year = parseInt(yearStr, 10);

  // Validações básicas
  if (day < 1 || day > 31 || month < 0 || month > 11 || year < 1900 || year > new Date().getFullYear()) {
    return null;
  }

  const date = new Date(year, month, day);

  // Verifica se a data é válida (ex: 30/02 não existe)
  if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
    return null;
  }

  return date;
}

export function formatDateToPt(date: Date): string {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "";
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

export function applyDateMask(value: string): string {
  // Remove todos os caracteres não numéricos
  const numericValue = value.replace(/\D/g, "");

  // Limita a 8 dígitos (ddmmyyyy)
  const limitedValue = numericValue.slice(0, 8);

  // Aplica a máscara dd/mm/yyyy
  let maskedValue = limitedValue;

  if (limitedValue.length >= 3) {
    maskedValue = limitedValue.slice(0, 2) + "/" + limitedValue.slice(2);
  }

  if (limitedValue.length >= 5) {
    maskedValue = limitedValue.slice(0, 2) + "/" + limitedValue.slice(2, 4) + "/" + limitedValue.slice(4);
  }

  return maskedValue;
}

export function createMaskedInputHandler(
  onChange: (value: string) => void,
  maskFunction: (value: string) => string
) {
  return (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const maskedValue = maskFunction(inputValue);
    onChange(maskedValue);
  };
}

