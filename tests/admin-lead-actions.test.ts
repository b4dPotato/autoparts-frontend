import {beforeEach, describe, expect, it, vi} from 'vitest';

vi.mock('server-only', () => ({}));

const mocks = vi.hoisted(() => ({
  requireAdminSession: vi.fn(),
  deleteLeadById: vi.fn(),
  revalidatePath: vi.fn()
}));

vi.mock('@/server/admin/auth', () => ({
  requireAdminSession: mocks.requireAdminSession
}));

vi.mock('@/server/leads/repository', () => ({
  deleteLeadById: mocks.deleteLeadById
}));

vi.mock('next/cache', () => ({
  revalidatePath: mocks.revalidatePath
}));

import {deleteLeadAction} from '../src/app/admin/(protected)/leads/actions';

const leadId = '10000000-0000-4000-8000-000000000001';

describe('admin lead deletion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminSession.mockResolvedValue(undefined);
    mocks.deleteLeadById.mockResolvedValue(true);
  });

  it('authenticates before deleting one validated lead', async () => {
    await deleteLeadAction(leadId);

    expect(mocks.requireAdminSession).toHaveBeenCalledOnce();
    expect(mocks.deleteLeadById).toHaveBeenCalledWith(leadId);
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/admin/leads');
    expect(
      mocks.requireAdminSession.mock.invocationCallOrder[0]
    ).toBeLessThan(mocks.deleteLeadById.mock.invocationCallOrder[0]!);
  });

  it('rejects malformed identifiers without touching the database', async () => {
    await expect(
      deleteLeadAction('not-a-lead-id')
    ).rejects.toThrow('Invalid lead identifier');

    expect(mocks.requireAdminSession).toHaveBeenCalledOnce();
    expect(mocks.deleteLeadById).not.toHaveBeenCalled();
  });

  it('does not delete when authentication fails', async () => {
    mocks.requireAdminSession.mockRejectedValue(new Error('Unauthorized'));

    await expect(deleteLeadAction(leadId)).rejects.toThrow(
      'Unauthorized'
    );

    expect(mocks.deleteLeadById).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});
