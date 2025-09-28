import deburr from 'lodash/deburr';

export function normalizeName(name: string): string {
  return deburr(name)
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
}
