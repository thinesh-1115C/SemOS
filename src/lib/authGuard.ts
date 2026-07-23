/**
 * Email Allowlist & Authorization Guard Module
 * Manages approved email lists, invite-only access verification,
 * access request tracking, and admin management functions.
 */

// Initial default approved emails (can be updated via Admin Panel or LocalStorage)
const DEFAULT_ALLOWED_EMAILS: string[] = [];

const STORAGE_KEY_ALLOWED_EMAILS = 'semos_allowed_emails';
const STORAGE_KEY_ALLOWLIST_ENABLED = 'semos_allowlist_enabled';
const STORAGE_KEY_ACCESS_REQUESTS = 'semos_access_requests';

export interface AccessRequest {
  id: string;
  email: string;
  name?: string;
  reason?: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

/**
 * Check if the email allowlist guard is currently enabled.
 * Defaults to false for public multi-tenant mode, but can be enabled for invite-only mode.
 */
export function isAllowlistEnabled(): boolean {
  const saved = localStorage.getItem(STORAGE_KEY_ALLOWLIST_ENABLED);
  return saved !== null ? JSON.parse(saved) : false;
}

export function setAllowlistEnabled(enabled: boolean): void {
  localStorage.setItem(STORAGE_KEY_ALLOWLIST_ENABLED, JSON.stringify(enabled));
}

/**
 * Retrieve current array of approved email addresses
 */
export function getAllowedEmails(): string[] {
  const saved = localStorage.getItem(STORAGE_KEY_ALLOWED_EMAILS);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return DEFAULT_ALLOWED_EMAILS;
    }
  }
  return DEFAULT_ALLOWED_EMAILS;
}

/**
 * Save updated list of allowed emails
 */
export function setAllowedEmails(emails: string[]): void {
  const sanitized = emails.map(e => e.trim().toLowerCase()).filter(Boolean);
  localStorage.setItem(STORAGE_KEY_ALLOWED_EMAILS, JSON.stringify(Array.from(new Set(sanitized))));
}

/**
 * Verifies if a given user email is authorized
 */
export function isEmailAllowed(email: string | null | undefined): boolean {
  if (!isAllowlistEnabled()) return true; // If allowlist is disabled, anyone can sign in
  if (!email) return false;
  const allowed = getAllowedEmails();
  return allowed.includes(email.trim().toLowerCase());
}

/**
 * Add a new email to the approved list
 */
export function addAllowedEmail(email: string): boolean {
  if (!email || !email.includes('@')) return false;
  const current = getAllowedEmails();
  const lower = email.trim().toLowerCase();
  if (!current.includes(lower)) {
    const updated = [...current, lower];
    setAllowedEmails(updated);
    return true;
  }
  return false;
}

/**
 * Remove an email from the approved list
 */
export function removeAllowedEmail(email: string): boolean {
  const current = getAllowedEmails();
  const lower = email.trim().toLowerCase();
  const updated = current.filter(e => e !== lower);
  if (updated.length !== current.length) {
    setAllowedEmails(updated);
    return true;
  }
  return false;
}

/**
 * Submit an access request for an unapproved user
 */
export function submitAccessRequest(email: string, name?: string, reason?: string): AccessRequest {
  const requests = getAccessRequests();
  const newReq: AccessRequest = {
    id: `req_${Date.now()}`,
    email: email.trim().toLowerCase(),
    name: name || email.split('@')[0],
    reason: reason || 'Academic student seeking study tools',
    requestedAt: new Date().toISOString(),
    status: 'pending',
  };

  localStorage.setItem(STORAGE_KEY_ACCESS_REQUESTS, JSON.stringify([newReq, ...requests]));
  return newReq;
}

export function getAccessRequests(): AccessRequest[] {
  const saved = localStorage.getItem(STORAGE_KEY_ACCESS_REQUESTS);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }
  return [];
}

export function updateAccessRequestStatus(requestId: string, status: 'approved' | 'rejected'): void {
  const requests = getAccessRequests();
  const req = requests.find(r => r.id === requestId);
  if (req) {
    req.status = status;
    if (status === 'approved') {
      addAllowedEmail(req.email);
    }
    localStorage.setItem(STORAGE_KEY_ACCESS_REQUESTS, JSON.stringify(requests));
  }
}
