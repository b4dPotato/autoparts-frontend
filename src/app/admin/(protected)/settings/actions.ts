'use server';

import {revalidatePath} from 'next/cache';
import {requireAdminSession} from '@/server/admin/auth';
import {setLeadEmailNotificationsEnabled} from '@/server/settings/feature-flags';

export async function updateLeadEmailNotificationsAction(formData: FormData) {
  await requireAdminSession();

  const value = formData.get('enabled');
  if (value !== 'true' && value !== 'false') {
    throw new Error('Invalid feature flag value');
  }

  await setLeadEmailNotificationsEnabled(value === 'true');
  revalidatePath('/admin/settings');
  revalidatePath('/[locale]', 'page');
}

export async function updatePromotionAction(
  _previous: {ok: boolean; message: string},
  formData: FormData,
) {
  await requireAdminSession();
  const {promotionSchema} = await import('@/lib/promotions/contracts');
  const {getPromotion, savePromotion} =
    await import('@/server/settings/promotion');
  try {
    const current = await getPromotion();
    let image = formData.get('removeImage') === 'on' ? '' : current.image;
    const file = formData.get('image');
    if (file instanceof File && file.size > 0) {
      if (
        file.size > 500_000 ||
        !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)
      ) {
        return {
          ok: false,
          message: 'Choose a PNG, JPEG or WebP image up to 500 KB.',
        };
      }
      const bytes = Buffer.from(await file.arrayBuffer());
      const valid =
        file.type === 'image/png'
          ? bytes
              .subarray(0, 8)
              .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
          : file.type === 'image/jpeg'
            ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
            : bytes.toString('ascii', 0, 4) === 'RIFF' &&
              bytes.toString('ascii', 8, 12) === 'WEBP';
      if (!valid)
        return {
          ok: false,
          message: 'The image contents do not match its format.',
        };
      image = `data:${file.type};base64,${bytes.toString('base64')}`;
    }
    const content = Object.fromEntries(
      ['uk', 'ru', 'en'].map((locale) => [
        locale,
        Object.fromEntries(
          [
            'title',
            'vehicle',
            'condition',
            'engine',
            'transmission',
            'included',
            'terms',
          ].map((field) => [field, formData.get(`${locale}.${field}`)]),
        ),
      ]),
    );
    const result = promotionSchema.safeParse({
      id: 'featured-parts',
      enabled: formData.get('enabled') === 'on',
      mileage: formData.get('mileage'),
      ecu: formData.get('ecu'),
      image,
      content,
    });
    if (!result.success)
      return {
        ok: false,
        message:
          'Please complete all language fields and respect the field length limits.',
      };
    await savePromotion(result.data);
    revalidatePath('/admin/settings');
    revalidatePath('/[locale]', 'page');
    return {ok: true, message: 'Promotion saved.'};
  } catch {
    return {
      ok: false,
      message: 'Unable to save the promotion. Please try again.',
    };
  }
}
