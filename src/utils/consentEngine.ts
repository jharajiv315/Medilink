import type { AccessGrant, AccessCategory, GrantStatus } from '../types/medilink.ts';

/**
 * Access Control Engine enforcing granular category gating, time-bound tokens,
 * and immutable instant revocation.
 */
export function evaluateGrantStatus(grant: AccessGrant, now: Date = new Date()): GrantStatus {
  if (grant.status === 'revoked') return 'revoked';
  if (grant.status === 'rejected') return 'rejected';
  if (grant.status === 'pending') return 'pending';

  if (grant.expiresAt) {
    const expiry = new Date(grant.expiresAt);
    if (now.getTime() > expiry.getTime()) {
      return 'expired';
    }
  }

  return 'active';
}

export function canAccessCategory(
  grant: AccessGrant,
  category: AccessCategory,
  now: Date = new Date()
): { allowed: boolean; reason?: string } {
  const currentStatus = evaluateGrantStatus(grant, now);

  if (currentStatus === 'revoked') {
    return { allowed: false, reason: 'Grant was revoked by the patient.' };
  }

  if (currentStatus === 'expired') {
    return { allowed: false, reason: 'Access token has expired.' };
  }

  if (currentStatus !== 'active') {
    return { allowed: false, reason: `Grant is currently in '${currentStatus}' state.` };
  }

  const hasCategory = grant.approvedCategories.includes(category);
  if (!hasCategory) {
    return { allowed: false, reason: `Category '${category}' is not authorized in patient grant.` };
  }

  return { allowed: true };
}

export function filterRecordsByScopes<T extends { category: AccessCategory }>(
  records: T[],
  grant: AccessGrant,
  now: Date = new Date()
): { allowedRecords: T[]; deniedCount: number; isAuthorized: boolean; rejectionReason?: string } {
  const status = evaluateGrantStatus(grant, now);
  if (status !== 'active') {
    return {
      allowedRecords: [],
      deniedCount: records.length,
      isAuthorized: false,
      rejectionReason: `Access Denied: Grant status is '${status}'`
    };
  }

  const allowed = records.filter(r => grant.approvedCategories.includes(r.category));
  const deniedCount = records.length - allowed.length;

  return {
    allowedRecords: allowed,
    deniedCount,
    isAuthorized: true
  };
}
