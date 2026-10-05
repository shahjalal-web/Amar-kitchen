import type { AuthUser } from '../store/authStore';

// ব্যাকএন্ডের utils/permissions.ts-এর সাথে মিল রেখে। আসল যাচাই সার্ভারে; এখানে শুধু মেনু/পেজ লুকানো।
export type Permission =
  | 'dashboard.view' | 'orders.view' | 'orders.manage'
  | 'users.view' | 'users.manage' | 'approvals.manage'
  | 'foods.manage' | 'packages.manage' | 'locations.manage'
  | 'finance.view' | 'finance.manage' | 'config.manage';

export const isSuperAdmin = (user?: AuthUser | null) => user?.role === 'admin' && !user.staffRole;

// যেকোনো একটি পারমিশন থাকলেই true
export const can = (user: AuthUser | null | undefined, ...perms: Permission[]) => {
  if (!user || user.role !== 'admin') return false;
  if (!user.staffRole) return true;
  if (!user.staffRole.isActive) return false;
  return perms.length === 0 || perms.some((p) => user.staffRole!.permissions.includes(p));
};

// অ্যাডমিন পেজ → দরকারি পারমিশন (যেকোনো একটি)। 'super' = শুধু সুপার অ্যাডমিন
export const ADMIN_PAGE_PERMS: Record<string, Permission[] | 'super'> = {
  '/admin': ['dashboard.view'],
  '/admin/orders': ['orders.view', 'orders.manage'],
  '/admin/users': ['users.view', 'users.manage'],
  '/admin/foods': ['foods.manage'],
  '/admin/packages': ['packages.manage'],
  '/admin/approvals': ['approvals.manage'],
  '/admin/locations': ['locations.manage'],
  '/admin/config': ['config.manage'],
  '/admin/finance': ['finance.view', 'finance.manage'],
  '/admin/staff': 'super',
};

export const canSeeAdminPage = (user: AuthUser | null | undefined, href: string) => {
  const need = ADMIN_PAGE_PERMS[href];
  if (need === undefined) return true;
  if (need === 'super') return isSuperAdmin(user);
  return can(user, ...need);
};
