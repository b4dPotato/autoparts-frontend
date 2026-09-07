import type {ReactNode} from 'react';
import {AdminShell} from '@/components/admin/admin-shell';
import {requireAdminSession} from '@/server/admin/auth';

export const dynamic = 'force-dynamic';

export default async function ProtectedAdminLayout({
  children
}: {
  children: ReactNode;
}) {
  await requireAdminSession();

  return <AdminShell>{children}</AdminShell>;
}
