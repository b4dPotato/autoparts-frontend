'use client';
import Image from 'next/image';
import {useFormState, useFormStatus} from 'react-dom';
import type {Promotion} from '@/lib/promotions/contracts';
import {updatePromotionAction} from '@/app/admin/(protected)/settings/actions';

function SaveButton() {
  const {pending} = useFormStatus();
  return (
    <button
      disabled={pending}
      className="rounded-xl bg-gold px-5 py-3 font-semibold text-ink disabled:opacity-50"
    >
      {pending ? 'Saving…' : 'Save promotion'}
    </button>
  );
}

export function PromotionEditor({promotion}: {promotion: Promotion}) {
  const [state, action] = useFormState(updatePromotionAction, {
    ok: false,
    message: '',
  });
  const fieldClass =
    'mt-1 w-full rounded-lg border border-white/15 bg-black/25 p-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-gold';
  const fields = {
    title: 120,
    vehicle: 160,
    condition: 240,
    engine: 120,
    transmission: 240,
    included: 2000,
    terms: 500,
  } as const;
  return (
    <section className="mt-6 max-w-3xl rounded-2xl border border-white/10 bg-[#0d131e] p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-white">
        Featured parts promotion
      </h2>
      <p className="mt-2 text-sm text-slate-400">
        One active Hero offer. Add only a verified product photo. Each included
        item goes on a separate line.
      </p>
      <form action={action} className="mt-5 space-y-5">
        <label className="flex items-center gap-3 text-sm text-white">
          <input
            type="checkbox"
            name="enabled"
            defaultChecked={promotion.enabled}
            className="size-4 accent-amber-400"
          />
          Enable promotion banner
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-slate-300">
            Mileage (without unit)
            <input
              required
              name="mileage"
              maxLength={40}
              defaultValue={promotion.mileage}
              className={fieldClass}
            />
          </label>
          <label className="text-sm text-slate-300">
            ECU
            <input
              required
              name="ecu"
              maxLength={120}
              defaultValue={promotion.ecu}
              className={fieldClass}
            />
          </label>
        </div>
        <label className="block text-sm text-slate-300">
          Product image (PNG, JPEG, WebP; up to 500 KB)
          <input
            type="file"
            name="image"
            accept="image/png,image/jpeg,image/webp"
            className={fieldClass}
          />
        </label>
        {promotion.image && (
          <div>
            <Image
              unoptimized
              width={640}
              height={480}
              src={promotion.image}
              alt="Current promotion photo"
              className="mb-2 h-24 rounded-lg object-contain"
            />
            <label className="text-sm text-slate-300">
              <input name="removeImage" type="checkbox" /> Remove current image
            </label>
          </div>
        )}
        {(['uk', 'ru', 'en'] as const).map((locale) => (
          <details
            key={locale}
            open={locale === 'uk'}
            className="rounded-xl border border-white/10 p-4"
          >
            <summary className="cursor-pointer font-semibold text-white">
              {{uk: 'Українська', ru: 'Русский', en: 'English'}[locale]}
            </summary>
            <div className="mt-4 grid gap-4">
              {Object.entries(fields).map(([field, max]) => (
                <label
                  key={field}
                  className="text-sm capitalize text-slate-300"
                >
                  {field}
                  <textarea
                    required
                    name={`${locale}.${field}`}
                    maxLength={max}
                    rows={field === 'included' ? 7 : 2}
                    defaultValue={
                      promotion.content[locale][field as keyof typeof fields]
                    }
                    className={fieldClass}
                  />
                </label>
              ))}
            </div>
          </details>
        ))}
        <SaveButton />
        <p
          role="status"
          className={
            state.ok ? 'text-sm text-emerald-300' : 'text-sm text-amber-300'
          }
        >
          {state.message}
        </p>
      </form>
    </section>
  );
}
