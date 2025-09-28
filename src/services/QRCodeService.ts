import CryptoJS from 'crypto-js';
import {EventConfig, Guest} from '../models/Guest';
import {generateHumanCode} from '../utils/ticketCode';

function base64UrlEncode(input: string): string {
  return input.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const words = CryptoJS.enc.Base64.parse(padded);
  return CryptoJS.enc.Utf8.stringify(words);
}

export interface TicketData {
  guest: Guest;
  payload: string;
  signature: string;
  ticketCode: string;
}

export function buildTicketPayload(guest: Guest, config: EventConfig): TicketData {
  const header = {
    alg: 'HS256',
    kid: config.keyVersion,
  };
  const ticketCode = guest.ticketCode ?? generateHumanCode();
  const issuedAt = new Date().toISOString();
  const payload = {
    gid: guest.id,
    e: config.eventId,
    iat: issuedAt,
    n: guest.fullName,
    tc: ticketCode,
  };
  const encodedHeader = base64UrlEncode(CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(JSON.stringify(header))));
  const encodedPayload = base64UrlEncode(CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(JSON.stringify(payload))));
  const token = `${encodedHeader}.${encodedPayload}`;
  const signature = base64UrlEncode(
    CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA256(token, config.hmacSecret)),
  );

  return {
    guest: {
      ...guest,
      ticketCode,
      qrPayload: token,
      qrSignature: signature,
      qrIssuedAt: issuedAt,
    },
    payload: token,
    signature,
    ticketCode,
  };
}

export function verifyTicket(token: string, signature: string, config: EventConfig): boolean {
  const expected = base64UrlEncode(
    CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA256(token, config.hmacSecret)),
  );
  return expected === signature;
}

export function parseTicket(token: string): {header: any; payload: any} {
  const [headerPart, payloadPart] = token.split('.');
  const header = JSON.parse(base64UrlDecode(headerPart));
  const payload = JSON.parse(base64UrlDecode(payloadPart));
  return {header, payload};
}
