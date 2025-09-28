export type SortMode = 'A_TO_Z' | 'Z_TO_A' | 'LATEST';
export type FilterMode = 'ALL' | 'ENTERED' | 'NOT_ENTERED';

export interface Guest {
  id: string;
  fullName: string;
  createdAt: string;
  entered: boolean;
  enteredAt?: string;
  ticketCode?: string;
  qrPayload?: string;
  qrSignature?: string;
  qrIssuedAt?: string;
}

export interface EventConfig {
  eventId: string;
  eventName: string;
  hmacSecret: string;
  keyVersion: number;
}

export interface ImportPreviewRow {
  name: string;
  duplicate: boolean;
}

export interface ImportSummary {
  added: number;
  duplicates: number;
}
