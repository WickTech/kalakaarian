// Domain types for the admin module.

export interface ListUsersQuery {
  role?: string;
  suspended?: string;
  search?: string;
  limit?: string;
  offset?: string;
}

export interface AuditEntry {
  adminId: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: object;
  ip: string | undefined;
}
