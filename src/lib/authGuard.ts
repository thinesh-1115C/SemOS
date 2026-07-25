/**
 * Email Allowlist & Authorization Guard Module
 * Manages approved email lists, invite-only access verification,
 * access request tracking, and admin management functions.
 */

// Initial default approved emails (can be updated via Admin Panel or LocalStorage)
const DEFAULT_ALLOWED_EMAILS: string[] = ['thinesh10048@gmail.com'];
const DEFAULT_ADMIN_EMAILS: string[] = ['thinesh10048@gmail.com'];

const STORAGE_KEY_ALLOWED_EMAILS = 'semos_allowed_emails';
const STORAGE_KEY_ALLOWLIST_ENABLED = 'semos_allowlist_enabled';
const STORAGE_KEY_ACCESS_REQUESTS = 'semos_access_requests';
const STORAGE_KEY_ADMIN_EMAILS = 'semos_admin_emails';

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const lower = email.trim().toLowerCase();
  if (lower === 'thinesh10048@gmail.com') return true;
  const saved = localStorage.getItem(STORAGE_KEY_ADMIN_EMAILS);
  const list = saved ? JSON.parse(saved) : DEFAULT_ADMIN_EMAILS;
  return list.includes(lower);
}

export interface AccessRequest {
  id: string;
  email: string;
  name?: string;
  reason?: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

import { 
  submitFirestoreAccessRequest, 
  getFirestoreAccessRequests, 
  updateFirestoreAccessRequestStatus,
  getFirestoreAllowlistConfig,
  updateFirestoreAllowlistConfig,
  subscribeToAllowlistConfig
} from './firebase';

/**
 * Check if the email allowlist guard is currently enabled.
 * Defaults to true so only authorized accounts can sign in.
 */
export function isAllowlistEnabled(): boolean {
  const saved = localStorage.getItem(STORAGE_KEY_ALLOWLIST_ENABLED);
  return saved !== null ? JSON.parse(saved) : true;
}

export function setAllowlistEnabled(enabled: boolean): void {
  localStorage.setItem(STORAGE_KEY_ALLOWLIST_ENABLED, JSON.stringify(enabled));
  updateFirestoreAllowlistConfig(enabled, getAllowedEmails()).catch(err => console.error(err));
}

/**
 * Retrieve current array of approved email addresses
 */
export function getAllowedEmails(): string[] {
  const saved = localStorage.getItem(STORAGE_KEY_ALLOWED_EMAILS);
  let list = DEFAULT_ALLOWED_EMAILS;
  if (saved) {
    try {
      list = JSON.parse(saved);
    } catch (e) {
      list = DEFAULT_ALLOWED_EMAILS;
    }
  }
  const lowerDefault = 'thinesh10048@gmail.com';
  if (!list.includes(lowerDefault)) {
    list = [lowerDefault, ...list];
  }
  return list;
}

/**
 * Save updated list of allowed emails
 */
export function setAllowedEmails(emails: string[]): void {
  const sanitized = emails.map(e => e.trim().toLowerCase()).filter(Boolean);
  const lowerDefault = 'thinesh10048@gmail.com';
  if (!sanitized.includes(lowerDefault)) {
    sanitized.unshift(lowerDefault);
  }
  const unique = Array.from(new Set(sanitized));
  localStorage.setItem(STORAGE_KEY_ALLOWED_EMAILS, JSON.stringify(unique));
  updateFirestoreAllowlistConfig(isAllowlistEnabled(), unique).catch(err => console.error(err));
}

/**
 * Sync allowlist settings directly from Firestore
 */
export async function syncAllowlistFromCloud(): Promise<void> {
  try {
    const config = await getFirestoreAllowlistConfig();
    if (config) {
      localStorage.setItem(STORAGE_KEY_ALLOWLIST_ENABLED, JSON.stringify(config.enabled));
      if (Array.isArray(config.allowedEmails) && config.allowedEmails.length > 0) {
        const sanitized = config.allowedEmails.map(e => e.trim().toLowerCase()).filter(Boolean);
        const lowerDefault = 'thinesh10048@gmail.com';
        if (!sanitized.includes(lowerDefault)) {
          sanitized.unshift(lowerDefault);
        }
        localStorage.setItem(STORAGE_KEY_ALLOWED_EMAILS, JSON.stringify(Array.from(new Set(sanitized))));
      }
    }
  } catch (err) {
    console.error("Error syncing allowlist from cloud:", err);
  }
}

/**
 * Subscribe to real-time updates for allowlist configuration across devices
 */
export function subscribeToAllowlistSync(): () => void {
  return subscribeToAllowlistConfig((config) => {
    localStorage.setItem(STORAGE_KEY_ALLOWLIST_ENABLED, JSON.stringify(config.enabled));
    if (Array.isArray(config.allowedEmails)) {
      const sanitized = config.allowedEmails.map(e => e.trim().toLowerCase()).filter(Boolean);
      const lowerDefault = 'thinesh10048@gmail.com';
      if (!sanitized.includes(lowerDefault)) {
        sanitized.unshift(lowerDefault);
      }
      localStorage.setItem(STORAGE_KEY_ALLOWED_EMAILS, JSON.stringify(Array.from(new Set(sanitized))));
    }
  });
}

/**
 * Verifies if a given user email is authorized
 */
export function isEmailAllowed(email: string | null | undefined): boolean {
  if (!isAllowlistEnabled()) return true; // If allowlist is disabled, anyone can sign in
  if (!email) return false;
  const lowerEmail = email.trim().toLowerCase();
  
  // Admin is always allowed
  if (lowerEmail === 'thinesh10048@gmail.com') return true;

  const allowed = getAllowedEmails();
  if (allowed.includes(lowerEmail)) return true;

  // Check if there is an approved access request for this user
  const requests = getAccessRequests();
  const req = requests.find(r => r.email === lowerEmail && r.status === 'approved');
  if (req) {
    // Auto-grant and add to allowed
    addAllowedEmail(lowerEmail);
    return true;
  }

  return false;
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
    id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    email: email.trim().toLowerCase(),
    name: name || email.split('@')[0],
    reason: reason || 'Academic student seeking study tools',
    requestedAt: new Date().toISOString(),
    status: 'pending',
  };

  const updated = [newReq, ...requests.filter(r => r.email !== newReq.email)];
  localStorage.setItem(STORAGE_KEY_ACCESS_REQUESTS, JSON.stringify(updated));
  
  // Also push to Firestore asynchronously
  submitFirestoreAccessRequest(newReq).catch(err => console.error(err));

  return newReq;
}

export function getAccessRequests(): AccessRequest[] {
  const saved = localStorage.getItem(STORAGE_KEY_ACCESS_REQUESTS);
  let local: AccessRequest[] = [];
  if (saved) {
    try {
      local = JSON.parse(saved);
    } catch {
      local = [];
    }
  }
  return local;
}

export async function syncAccessRequestsFromCloud(): Promise<AccessRequest[]> {
  try {
    const cloudRequests = await getFirestoreAccessRequests();
    if (cloudRequests && cloudRequests.length > 0) {
      const local = getAccessRequests();
      const mergedMap = new Map<string, AccessRequest>();
      for (const r of [...local, ...cloudRequests]) {
        mergedMap.set(r.id || r.email, r);
      }
      const statusOrder: Record<string, number> = { pending: 0, approved: 1, rejected: 2 };
      const merged = Array.from(mergedMap.values()).sort((a, b) => {
        if ((statusOrder[a.status] ?? 99) !== (statusOrder[b.status] ?? 99)) {
          return (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
        }
        return new Date(b.requestedAt || 0).getTime() - new Date(a.requestedAt || 0).getTime();
      });

      // Automatically grant allowlist access for any approved requests
      for (const req of merged) {
        if (req.status === 'approved') {
          addAllowedEmail(req.email);
        }
      }

      localStorage.setItem(STORAGE_KEY_ACCESS_REQUESTS, JSON.stringify(merged));
      return merged;
    }
    return getAccessRequests();
  } catch (err) {
    console.error("Error syncing access requests:", err);
    return getAccessRequests();
  }
}

export function updateAccessRequestStatus(requestId: string, status: 'approved' | 'rejected'): void {
  const requests = getAccessRequests();
  const req = requests.find(r => r.id === requestId || r.email === requestId);
  if (req) {
    req.status = status;
    if (status === 'approved') {
      addAllowedEmail(req.email);
    }
    localStorage.setItem(STORAGE_KEY_ACCESS_REQUESTS, JSON.stringify(requests));
    updateFirestoreAccessRequestStatus(req.id || requestId, status).catch(err => console.error(err));
  }
}

