'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { restaurantsApi } from '@/lib/api/restaurants';

interface Member {
  id: string;
  userId: string;
  role: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

const ROLES = ['MANAGER', 'WAITER', 'CASHIER', 'KITCHEN', 'STAFF'] as const;

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Owner',
  MANAGER: 'Manager',
  WAITER: 'Waiter',
  CASHIER: 'Cashier',
  KITCHEN: 'Kitchen',
  STAFF: 'Staff',
};

const ROLE_COLORS: Record<string, string> = {
  OWNER: 'bg-purple-100 text-purple-700',
  MANAGER: 'bg-blue-100 text-blue-700',
  WAITER: 'bg-green-100 text-green-700',
  CASHIER: 'bg-yellow-100 text-yellow-700',
  KITCHEN: 'bg-orange-100 text-orange-700',
  STAFF: 'bg-gray-100 text-gray-700',
};

export default function MembersPage() {
  const activeRestaurantId = useAuthStore((s) => s.activeRestaurantId);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<string>('WAITER');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (activeRestaurantId) loadMembers();
  }, [activeRestaurantId]);

  const loadMembers = async () => {
    try {
      const res: any = await restaurantsApi.getRestaurant(activeRestaurantId!);
      setMembers(res.data?.members || []);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await restaurantsApi.inviteMember(activeRestaurantId!, {
        email: inviteEmail,
        role: inviteRole,
      });
      setShowInvite(false);
      setInviteEmail('');
      loadMembers();
    } catch (e: any) {
      alert(e.response?.data?.error?.message || 'Failed to invite member');
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm('Remove this member from the restaurant?')) return;
    try {
      await restaurantsApi.removeMember(activeRestaurantId!, memberId);
      loadMembers();
    } catch (e: any) {
      alert(e.response?.data?.error?.message || 'Failed to remove member');
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      await restaurantsApi.updateMemberRole(activeRestaurantId!, memberId, newRole);
      loadMembers();
    } catch (e: any) {
      alert(e.response?.data?.error?.message || 'Failed to update role');
    }
  };

  if (loading) return <div className="p-6">Loading members...</div>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team Members</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage who has access to your restaurant dashboard.
          </p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          + Invite Member
        </button>
      </div>

      {/* Members list */}
      <div className="mt-6 space-y-3">
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-bold">
                {member.user.firstName[0]}{member.user.lastName?.[0] || ''}
              </div>
              <div>
                <p className="font-medium">
                  {member.user.firstName} {member.user.lastName}
                </p>
                <p className="text-sm text-muted-foreground">{member.user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {member.role === 'OWNER' ? (
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${ROLE_COLORS.OWNER}`}>
                  {ROLE_LABELS.OWNER}
                </span>
              ) : (
                <>
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.id, e.target.value)}
                    className="rounded-md border px-2 py-1 text-sm"
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleRemove(member.id)}
                    className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg bg-background p-6">
            <h3 className="text-lg font-bold">Invite Team Member</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              They must have a registered account.
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="team@example.com"
                  className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleInvite}
                disabled={inviting}
                className="flex-1 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
              >
                {inviting ? 'Inviting...' : 'Send Invite'}
              </button>
              <button
                onClick={() => setShowInvite(false)}
                className="flex-1 rounded-md border px-3 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
