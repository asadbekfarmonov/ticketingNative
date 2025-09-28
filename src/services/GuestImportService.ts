import * as FileSystem from 'expo-file-system';
import XLSX from 'xlsx';
import {Guest} from '../models/Guest';
import {normalizeName} from './NameNormalizer';

export interface ParsedImport {
  names: string[];
  duplicates: string[];
}

export async function extractNamesFromFile(uri: string, columnIndex = 0): Promise<string[]> {
  const fileBase64 = await FileSystem.readAsStringAsync(uri, {encoding: FileSystem.EncodingType.Base64});
  const workbook = XLSX.read(fileBase64, {type: 'base64'});
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {header: 1});
  const column = json
    .map(row => row[columnIndex])
    .filter(Boolean)
    .map(value => String(value));
  return column;
}

export function dedupeAgainstGuests(names: string[], existing: Guest[]): ParsedImport {
  const existingMap = new Map(existing.map(guest => [normalizeName(guest.fullName), guest.id]));
  const unique: string[] = [];
  const duplicates: string[] = [];

  names.forEach(rawName => {
    const trimmed = rawName.trim();
    if (!trimmed) {
      return;
    }
    const normalized = normalizeName(trimmed);
    if (existingMap.has(normalized) || unique.some(value => normalizeName(value) === normalized)) {
      duplicates.push(trimmed);
      return;
    }
    unique.push(trimmed);
  });

  return {names: unique, duplicates};
}
