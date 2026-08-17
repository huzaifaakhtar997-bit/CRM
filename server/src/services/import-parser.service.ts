/**
 * import-parser.service.ts
 *
 * Handles real file parsing for CSV and XLSX uploads.
 * All parsing is synchronous/in-memory (the file buffer is already in RAM
 * from multer's memoryStorage).
 *
 * Responsibilities:
 *  - Detect file type from extension
 *  - Parse raw rows from the buffer
 *  - Normalise headers using alias maps
 *  - Validate + coerce each row independently
 *  - Return { valid, errors } so that one bad row never aborts the import
 */

import * as XLSX from "xlsx";
import {
  ImportType,
  CONTACT_HEADER_ALIASES,
  COMPANY_HEADER_ALIASES,
} from "../validators/import.validator";

// ─── Row-level types ──────────────────────────────────────────────────────────

export interface RowError {
  row: number;      // 1-indexed row number (header = 0, first data row = 1)
  field?: string;   // Which field caused the error, if applicable
  message: string;
  rawData?: Record<string, unknown>;
}

export interface ParsedContactRow {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
}

export interface ParsedCompanyRow {
  name: string;
  website?: string;
  industry?: string;
  phone?: string;
  email?: string;
  address?: string;
  size?: string;
  annualRevenue?: number;
  description?: string;
}

export interface ParseResult<T> {
  valid: Array<{ rowIndex: number; data: T }>;
  errors: RowError[];
  totalRows: number;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Normalise a raw header string: lowercase, trim whitespace.
 */
function normaliseKey(key: string): string {
  return key.toLowerCase().trim();
}

/**
 * Resolve a raw spreadsheet/CSV row (with original headers) into
 * a canonical-field record using the provided alias map.
 */
function resolveRow(
  rawRow: Record<string, unknown>,
  aliasMap: Record<string, string>
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};
  for (const [rawKey, value] of Object.entries(rawRow)) {
    const canonical = aliasMap[normaliseKey(rawKey)];
    if (canonical) {
      resolved[canonical] = value;
    }
  }
  return resolved;
}

/**
 * Parse a raw buffer into an array of plain JS objects (one per data row).
 * Handles both CSV and XLSX via SheetJS.
 */
function parseBufferToRows(
  buffer: Buffer,
  extension: string
): Record<string, unknown>[] {
  // SheetJS handles both .csv and .xlsx transparently.
  // For CSV we force the csv parser; for xlsx the default is fine.
  const workbook = XLSX.read(buffer, {
    type: "buffer",
    raw: false,
    // dateNF is set so dates come out as strings rather than serial numbers
    dateNF: "yyyy-mm-dd",
  });

  // Always use the first sheet
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("The uploaded file contains no sheets.");
  }
  const sheet = workbook.Sheets[sheetName];

  // sheet_to_json with header:1 gives us raw arrays; using defVal:""
  // so empty cells are "" not undefined.
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    blankrows: false,
  });

  return rows;
}

/**
 * Safely coerce a raw cell value to a trimmed string or undefined.
 */
function toStr(v: unknown): string | undefined {
  if (v === null || v === undefined || v === "") return undefined;
  return String(v).trim() || undefined;
}

/**
 * Safely coerce a raw cell value to a number or undefined.
 */
function toNum(v: unknown): number | undefined {
  if (v === null || v === undefined || v === "") return undefined;
  const n = parseFloat(String(v).replace(/[,$\s]/g, ""));
  return isNaN(n) ? undefined : n;
}

/**
 * Validate a string as an email address (simple RFC-5322 subset).
 */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─── Public parse functions ───────────────────────────────────────────────────

/**
 * Parse a contact CSV/XLSX buffer.
 * Required fields: firstName, lastName
 * Optional: email, phone, jobTitle
 */
export function parseContactFile(
  buffer: Buffer,
  extension: string
): ParseResult<ParsedContactRow> {
  const rawRows = parseBufferToRows(buffer, extension);
  const valid: ParseResult<ParsedContactRow>["valid"] = [];
  const errors: RowError[] = [];

  if (rawRows.length === 0) {
    errors.push({ row: 0, message: "The file contains no data rows." });
    return { valid, errors, totalRows: 0 };
  }

  // Check that at least one recognised header exists in the first row
  const firstRowKeys = Object.keys(rawRows[0]).map(normaliseKey);
  const hasAnyKnownField = firstRowKeys.some(
    (k) => k in CONTACT_HEADER_ALIASES
  );
  if (!hasAnyKnownField) {
    errors.push({
      row: 0,
      message:
        "No recognised contact columns found. Expected at least one of: " +
        "firstName, lastName, email, phone, jobTitle (flexible casing accepted).",
    });
    return { valid, errors, totalRows: rawRows.length };
  }

  for (let i = 0; i < rawRows.length; i++) {
    const rowNumber = i + 1; // 1-indexed for human-readable error messages
    const raw = rawRows[i];
    const resolved = resolveRow(raw, CONTACT_HEADER_ALIASES);

    const firstName = toStr(resolved.firstName);
    const lastName = toStr(resolved.lastName);
    const email = toStr(resolved.email);
    const phone = toStr(resolved.phone);
    const jobTitle = toStr(resolved.jobTitle);

    // Required field validation
    if (!firstName) {
      errors.push({
        row: rowNumber,
        field: "firstName",
        message: "firstName is required.",
        rawData: raw as Record<string, unknown>,
      });
      continue;
    }
    if (!lastName) {
      errors.push({
        row: rowNumber,
        field: "lastName",
        message: "lastName is required.",
        rawData: raw as Record<string, unknown>,
      });
      continue;
    }

    // Email format validation (only if provided)
    if (email && !isValidEmail(email)) {
      errors.push({
        row: rowNumber,
        field: "email",
        message: `Invalid email format: "${email}".`,
        rawData: raw as Record<string, unknown>,
      });
      continue;
    }

    valid.push({
      rowIndex: rowNumber,
      data: {
        firstName,
        lastName,
        email: email ? email.toLowerCase() : undefined,
        phone,
        jobTitle,
      },
    });
  }

  return { valid, errors, totalRows: rawRows.length };
}

/**
 * Parse a company CSV/XLSX buffer.
 * Required fields: name
 * Optional: website, industry, phone, email, address, size, annualRevenue, description
 */
export function parseCompanyFile(
  buffer: Buffer,
  extension: string
): ParseResult<ParsedCompanyRow> {
  const rawRows = parseBufferToRows(buffer, extension);
  const valid: ParseResult<ParsedCompanyRow>["valid"] = [];
  const errors: RowError[] = [];

  if (rawRows.length === 0) {
    errors.push({ row: 0, message: "The file contains no data rows." });
    return { valid, errors, totalRows: 0 };
  }

  // Check at least one recognised header exists
  const firstRowKeys = Object.keys(rawRows[0]).map(normaliseKey);
  const hasAnyKnownField = firstRowKeys.some(
    (k) => k in COMPANY_HEADER_ALIASES
  );
  if (!hasAnyKnownField) {
    errors.push({
      row: 0,
      message:
        "No recognised company columns found. Expected at least one of: " +
        "name, website, industry, phone, email, address, size, annualRevenue, description.",
    });
    return { valid, errors, totalRows: rawRows.length };
  }

  for (let i = 0; i < rawRows.length; i++) {
    const rowNumber = i + 1;
    const raw = rawRows[i];
    const resolved = resolveRow(raw, COMPANY_HEADER_ALIASES);

    const name = toStr(resolved.name);
    const website = toStr(resolved.website);
    const industry = toStr(resolved.industry);
    const phone = toStr(resolved.phone);
    const email = toStr(resolved.email);
    const address = toStr(resolved.address);
    const size = toStr(resolved.size);
    const annualRevenue = toNum(resolved.annualRevenue);
    const description = toStr(resolved.description);

    // Required field
    if (!name) {
      errors.push({
        row: rowNumber,
        field: "name",
        message: "Company name is required.",
        rawData: raw as Record<string, unknown>,
      });
      continue;
    }

    // Optional email format validation
    if (email && !isValidEmail(email)) {
      errors.push({
        row: rowNumber,
        field: "email",
        message: `Invalid email format: "${email}".`,
        rawData: raw as Record<string, unknown>,
      });
      continue;
    }

    valid.push({
      rowIndex: rowNumber,
      data: {
        name,
        website,
        industry,
        phone,
        email: email ? email.toLowerCase() : undefined,
        address,
        size,
        annualRevenue,
        description,
      },
    });
  }

  return { valid, errors, totalRows: rawRows.length };
}
