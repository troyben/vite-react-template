import type { StaffIdentity as Identity } from '@/services/staffIdentity';

interface StaffIdentityProps { user?: Identity | null; userId?: number | null; fallback?: string }
export const StaffIdentity: React.FC<StaffIdentityProps> = ({ user, userId, fallback = 'User unavailable' }) => (
  <div className="min-w-0 leading-snug">
    <div className="flex flex-wrap items-baseline gap-x-2"><span className="text-sm font-medium">{user?.name || fallback}</span>
      {(userId ?? user?.id) != null && <span className="text-[10px] font-normal text-muted-foreground/60">User #{userId ?? user?.id}</span>}</div>
    {user?.email && <div className="break-all text-xs text-muted-foreground">{user.email}</div>}
  </div>
);
