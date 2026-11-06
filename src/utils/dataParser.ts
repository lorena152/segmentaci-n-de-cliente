/**
 * Data Parser: reads TXT, CSV, TSV, XLSX, XLS
 * and performs automated type detection for continuous numeric variables
 */

import * as XLSX from 'xlsx';
import { ColumnMetadata, VariableType } from '../types';

export async function parseFile(file: File): Promise<{ data: Record<string, any>[]; columns: ColumnMetadata[] }> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'xlsx' || extension === 'xls') {
    return parseExcelFile(file);
  } else {
    return parseTextFile(file);
  }
}

async function parseExcelFile(file: File): Promise<{ data: Record<string, any>[]; columns: ColumnMetadata[] }> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: null });

  if (!rawRows || rawRows.length === 0) {
    throw new Error('El archivo Excel no contiene filas de datos.');
  }

  const columns = analyzeColumns(rawRows);
  return { data: rawRows, columns };
}

async function parseTextFile(file: File): Promise<{ data: Record<string, any>[]; columns: ColumnMetadata[] }> {
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    throw new Error('El archivo de texto/CSV debe contener al menos un encabezado y una fila de datos.');
  }

  // Detect delimiter
  const firstLine = lines[0];
  const delimiters = [',', ';', '\t', '|'];
  let bestDelimiter = ',';
  let maxCount = 0;

  for (const delim of delimiters) {
    const count = (firstLine.match(new RegExp(`\\${delim}`, 'g')) || []).length;
    if (count > maxCount) {
      maxCount = count;
      bestDelimiter = delim;
    }
  }

  const workbook = XLSX.read(text, { type: 'string' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: null });

  if (!rawRows || rawRows.length === 0) {
    // Fallback manual CSV parse if XLSX string parser didn't catch header
    const headers = splitDelimited(firstLine, bestDelimiter).map((h) => h.replace(/^["']|["']$/g, '').trim());
    const manualRows: Record<string, any>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = splitDelimited(lines[i], bestDelimiter);
      if (parts.length === 0 || (parts.length === 1 && !parts[0])) continue;
      const row: Record<string, any> = {};
      headers.forEach((header, idx) => {
        let val: any = parts[idx] !== undefined ? parts[idx].trim().replace(/^["']|["']$/g, '') : null;
        if (val !== null && val !== '') {
          // Check if numeric (replace comma decimal if semicolon-delimited)
          const normalizedVal = bestDelimiter === ';' ? val.replace(',', '.') : val;
          const num = Number(normalizedVal);
          if (!isNaN(num) && normalizedVal !== '') {
            val = num;
          }
        } else {
          val = null;
        }
        row[header || `Columna_${idx + 1}`] = val;
      });
      manualRows.push(row);
    }
    const columns = analyzeColumns(manualRows);
    return { data: manualRows, columns };
  }

  const columns = analyzeColumns(rawRows);
  return { data: rawRows, columns };
}

function splitDelimited(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export function analyzeColumns(rows: Record<string, any>[]): ColumnMetadata[] {
  if (rows.length === 0) return [];
  const keys = Object.keys(rows[0]);
  const totalCount = rows.length;

  return keys.map((key) => {
    let nullCount = 0;
    const values: any[] = [];
    const uniqueSet = new Set<any>();

    for (const row of rows) {
      const val = row[key];
      if (val === null || val === undefined || val === '' || Number.isNaN(val)) {
        nullCount++;
      } else {
        values.push(val);
        uniqueSet.add(val);
      }
    }

    const uniqueCount = uniqueSet.size;
    const sampleValues = values.slice(0, 5);

    // Numeric check
    let numericCount = 0;
    let hasFloatingPoints = false;

    for (const v of values) {
      const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'));
      if (!isNaN(n)) {
        numericCount++;
        if (!Number.isInteger(n)) {
          hasFloatingPoints = true;
        }
      }
    }

    const isMostlyNumeric = values.length > 0 && numericCount / values.length >= 0.85;

    // Detect if column is an ID / identifier
    const lowerKey = key.toLowerCase();
    const isIdName =
      lowerKey.includes('id') ||
      lowerKey.includes('codigo') ||
      lowerKey.includes('código') ||
      lowerKey.includes('key') ||
      lowerKey.includes('rut') ||
      lowerKey.includes('dni') ||
      lowerKey.includes('uuid');

    const isHighCardinalityUnique = uniqueCount >= totalCount * 0.95 && totalCount > 20;

    let type: VariableType = 'categorical';
    let isContinuousNumeric = false;

    if (isMostlyNumeric) {
      if (isIdName && isHighCardinalityUnique) {
        type = 'identifier';
        isContinuousNumeric = false;
      } else if (hasFloatingPoints || uniqueCount > 8 || uniqueCount / totalCount > 0.08) {
        type = 'continuous_numeric';
        isContinuousNumeric = true;
      } else {
        type = 'discrete_numeric';
        isContinuousNumeric = false;
      }
    } else {
      if (isIdName || isHighCardinalityUnique) {
        type = 'identifier';
      } else {
        type = 'categorical';
      }
    }

    return {
      name: key,
      type,
      isContinuousNumeric,
      sampleValues,
      nullCount,
      uniqueCount,
      totalCount,
    };
  });
}
