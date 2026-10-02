import 'server-only';
import type { AuthenticatedUser } from '@/lib/auth';
import { userHasActivePropertyAccess } from './information-access';
import { userHasActiveMonthlySubscription } from './subscriptions';

export async function canAccessPropertyInformation(user: AuthenticatedUser | null, propertyId: string) {
  if (!user) return false;
  if (user.tipo_usuario === 'admin') return true;
  return await userHasActiveMonthlySubscription(user.id) || await userHasActivePropertyAccess(user.id, propertyId);
}
