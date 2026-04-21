import type { SupabaseUser, SupabaseUserSummary } from '../types';

export function normalizeSupabaseUser(raw: unknown): SupabaseUser {
  const r = raw as Record<string, unknown>;
  const firstName = ((r.firstName ?? r.first_name) as string | null) ?? null;
  const lastName = ((r.lastName ?? r.last_name) as string | null) ?? null;
  const fullName =
    [firstName, lastName].filter(Boolean).join(' ') || String(r.name ?? r.email ?? '');
  return {
    id: String(r.id ?? ''),
    email: String(r.email ?? ''),
    firstName,
    lastName,
    name: fullName,
    phoneNumber: ((r.phoneNumber ?? r.phone_number) as string | null) ?? null,
    lastSignInAt: ((r.lastSignInAt ?? r.last_sign_in_at) as string | null) ?? null,
    createdAt: String(r.createdAt ?? r.created_at ?? ''),
    emailVerified: (r.emailVerified ?? r.email_verified ?? null) as number | null,
    roleName: String(r.roleName ?? r.role_name ?? ''),
    totalOrders: Number(r.totalOrders ?? r.total_orders ?? 0),
    ltv: Number(r.ltv ?? 0),
    photoProfileUrl: ((r.photoProfileUrl ?? r.photo_profile_url) as string | null) ?? null,
  };
}

export function normalizeSupabaseUserSummary(raw: unknown): SupabaseUserSummary {
  const r = raw as Record<string, unknown>;
  return {
    totalUsers: Number(r.totalUsers ?? r.total_users ?? 0),
    totalTransactions: Number(r.totalTransactions ?? r.total_transactions ?? 0),
    totalRevenue: Number(r.totalRevenue ?? r.total_revenue ?? 0),
    averageLtv: Number(r.averageLtv ?? r.average_ltv ?? r.avg_ltv ?? 0),
  };
}
