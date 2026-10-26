import {promotionSchema} from '../src/lib/promotions/contracts';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {defaultPromotion} from '../src/lib/promotions/default';

vi.mock('server-only', () => ({}));
vi.mock('@/server/settings/feature-flags', () => ({
  setLeadEmailNotificationsEnabled: vi.fn(),
}));
vi.mock('@/lib/promotions/contracts', () => ({promotionSchema}));
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  read: vi.fn(),
  save: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock('@/server/admin/auth', () => ({requireAdminSession: mocks.auth}));
vi.mock('@/server/settings/promotion', () => ({
  getPromotion: mocks.read,
  savePromotion: mocks.save,
}));
vi.mock('next/cache', () => ({revalidatePath: mocks.revalidate}));
import {updatePromotionAction} from '../src/app/admin/(protected)/settings/actions';

const state = {ok: false, message: ''};
function form() {
  const data = new FormData();
  data.set('mileage', defaultPromotion.mileage);
  data.set('ecu', defaultPromotion.ecu);
  data.set('enabled', 'on');
  for (const [locale, content] of Object.entries(defaultPromotion.content)) {
    for (const [key, value] of Object.entries(content))
      data.set(`${locale}.${key}`, value);
  }
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue(undefined);
  mocks.read.mockResolvedValue(defaultPromotion);
  mocks.save.mockResolvedValue(undefined);
});

describe('promotion settings action', () => {
  it('requires authentication before reading or writing promotion settings', async () => {
    mocks.auth.mockRejectedValue(new Error('Unauthorized'));
    await expect(updatePromotionAction(state, form())).rejects.toThrow(
      'Unauthorized',
    );
    expect(mocks.read).not.toHaveBeenCalled();
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it('saves a disabled promotion and revalidates all public locales', async () => {
    const data = form();
    data.delete('enabled');
    expect((await updatePromotionAction(state, data)).ok).toBe(true);
    expect(mocks.save).toHaveBeenCalledWith({
      ...defaultPromotion,
      enabled: false,
    });
    expect(mocks.revalidate).toHaveBeenCalledWith('/[locale]', 'page');
  });
  it('rejects incomplete translations and forged image formats before saving', async () => {
    const incomplete = form();
    incomplete.delete('en.title');
    expect((await updatePromotionAction(state, incomplete)).ok).toBe(false);
    const forged = form();
    forged.set(
      'image',
      new File(['not a PNG'], 'photo.png', {type: 'image/png'}),
    );
    expect((await updatePromotionAction(state, forged)).ok).toBe(false);
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it('preserves an existing image unless explicitly removed', async () => {
    const image = 'data:image/png;base64,YQ==';
    mocks.read.mockResolvedValue({...defaultPromotion, image});
    await updatePromotionAction(state, form());
    expect(mocks.save).toHaveBeenLastCalledWith({...defaultPromotion, image});
    const data = form();
    data.set('removeImage', 'on');
    await updatePromotionAction(state, data);
    expect(mocks.save).toHaveBeenLastCalledWith(defaultPromotion);
  });
});
