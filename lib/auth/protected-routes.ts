export const PROTECTED_ROUTE_RULES = [
  { prefix: '/admin', requiredRole: 'admin' as const },
  { prefix: '/dashboard', requiredRole: null },
];
