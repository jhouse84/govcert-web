// ---------------------------------------------------------------------------
// Shared formatting utilities for GovCert
// ---------------------------------------------------------------------------

/**
 * Format a number as US currency: $1,234,567
 * Accepts string or number. Returns empty string for null/undefined/empty.
 */
export function fmtCurrency(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  const num = typeof value === "string" ? parseFloat(value.replace(/[^0-9.-]/g, "")) : value;
  if (isNaN(num)) return "";
  return "$" + num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

/**
 * Format a currency input value: strips non-numeric, adds commas.
 * Returns the DISPLAY string (with $ and commas) for the input field.
 * Use parseCurrencyRaw() to get the raw number for storage.
 */
export function fmtCurrencyInput(value: string): string {
  if (!value) return "";
  // Strip everything except digits and decimal point
  const raw = value.replace(/[^0-9.]/g, "");
  if (!raw) return "";
  // Split on decimal
  const parts = raw.split(".");
  const intPart = parts[0] ? parseInt(parts[0], 10).toLocaleString("en-US") : "0";
  if (parts.length > 1) {
    return "$" + intPart + "." + parts[1].slice(0, 2);
  }
  return "$" + intPart;
}

/**
 * Parse a formatted currency string back to raw number string for storage.
 */
export function parseCurrencyRaw(value: string): string {
  if (!value) return "";
  return value.replace(/[^0-9.-]/g, "");
}

/**
 * Format a phone number: (202) 555-0100
 */
export function fmtPhone(value: string | null | undefined): string {
  if (!value) return "";
  const digits = value.replace(/\D/g, "");
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

/**
 * Parse a formatted phone back to digits only for storage.
 */
export function parsePhoneRaw(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10);
}

/**
 * Format an EIN: 12-3456789
 */
export function fmtEIN(value: string | null | undefined): string {
  if (!value) return "";
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 2) return digits;
  return digits.slice(0, 2) + "-" + digits.slice(2, 9);
}

/**
 * Parse a formatted EIN back to digits for storage.
 */
export function parseEINRaw(value: string): string {
  return value.replace(/\D/g, "").slice(0, 9);
}

/**
 * Format a percentage value: "51" → "51%"
 */
export function fmtPercent(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  return `${value}%`;
}

/**
 * Format an ISO date string to readable: "2020-05-15" → "May 15, 2020"
 */
export function fmtDate(value: string | null | undefined): string {
  if (!value) return "";
  try {
    const d = new Date(value + "T00:00:00");
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return value;
  }
}

/**
 * Format a ZIP code: "200011234" → "20001-1234", or just "20001"
 */
export function fmtZip(value: string | null | undefined): string {
  if (!value) return "";
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 5) return digits;
  return digits.slice(0, 5) + "-" + digits.slice(5, 9);
}

/**
 * Parse a ZIP back to digits for storage.
 */
export function parseZipRaw(value: string): string {
  return value.replace(/\D/g, "").slice(0, 9);
}
