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

export interface RequesterContext {
  userId: string;
  role: string;
  organizationId?: string;
  organizationName?: string;
  patientId?: string;
}

export function authorizeClinicianHandoffAccess(
  grant: AccessGrant,
  requester: RequesterContext,
  now: Date = new Date()
): { authorized: boolean; httpStatus: number; errorCode: string; message: string } {
  if (requester.role !== 'clinician' && requester.role !== 'admin') {
    return {
      authorized: false,
      httpStatus: 403,
      errorCode: 'ROLE_UNAUTHORIZED',
      message: 'Access Denied: Only authenticated clinicians with an active clinical grant may access this handoff.'
    };
  }

  // Check requesting organization binding if provided
  if (
    requester.organizationId &&
    grant.requestingOrgId &&
    requester.organizationId !== grant.requestingOrgId &&
    requester.role !== 'admin'
  ) {
    return {
      authorized: false,
      httpStatus: 403,
      errorCode: 'ORG_MISMATCH',
      message: `Access Denied: Grant was issued specifically for '${grant.requestingOrgName}', but caller belongs to a different organization.`
    };
  }

  const status = evaluateGrantStatus(grant, now);
  if (status === 'revoked') {
    return {
      authorized: false,
      httpStatus: 403,
      errorCode: 'GRANT_REVOKED',
      message: 'Access Denied: Patient explicitly revoked clinical authorization for this handoff.'
    };
  }

  if (status === 'expired') {
    return {
      authorized: false,
      httpStatus: 403,
      errorCode: 'GRANT_EXPIRED',
      message: 'Access Denied: The time-bound cryptographic access grant has expired.'
    };
  }

  if (status === 'pending') {
    return {
      authorized: false,
      httpStatus: 403,
      errorCode: 'GRANT_PENDING',
      message: 'Access Denied: Grant request is pending patient review and has not yet been approved.'
    };
  }

  if (status !== 'active') {
    return {
      authorized: false,
      httpStatus: 403,
      errorCode: 'GRANT_INACTIVE',
      message: `Access Denied: Grant is in '${status}' state.`
    };
  }

  return {
    authorized: true,
    httpStatus: 200,
    errorCode: 'AUTHORIZED',
    message: 'Authorized'
  };
}
