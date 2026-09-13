'use client';

import {CheckCircle2, LoaderCircle, Send} from 'lucide-react';
import {useLocale, useTranslations} from 'next-intl';
import {type FormEvent, useState} from 'react';
import {initializeTracking} from '@/lib/tracking/client';

type FieldErrors = Partial<
  Record<'vin' | 'contactValue' | 'description', string>
>;

const inputClassName =
  'mt-1.5 w-full rounded-xl border border-white/10 bg-black/20 px-3.5 py-3 text-base text-white outline-none transition placeholder:text-slate-600 hover:border-white/20 focus:border-gold/70 focus:ring-2 focus:ring-gold/15 disabled:cursor-not-allowed disabled:opacity-60';

type ContactRequestFormProps = {
  idPrefix?: string;
};

export function ContactRequestForm({
  idPrefix = 'contact'
}: ContactRequestFormProps = {}) {
  const t = useTranslations('contact.form');
  const locale = useLocale();
  const formId = `${idPrefix}-request-form`;
  const vinId = `${idPrefix}-vin`;
  const vinErrorId = `${idPrefix}-vin-error`;
  const contactId = `${idPrefix}-value`;
  const contactErrorId = `${idPrefix}-value-error`;
  const descriptionId = `${idPrefix}-description`;
  const descriptionErrorId = `${idPrefix}-description-error`;
  const [status, setStatus] = useState<
    'idle' | 'submitting' | 'success' | 'error'
  >('idle');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function validate(formData: FormData) {
    const vin = String(formData.get('vin') ?? '')
      .trim()
      .toUpperCase();
    const contactValue = String(formData.get('contactValue') ?? '').trim();
    const description = String(formData.get('description') ?? '').trim();
    const errors: FieldErrors = {};

    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
      errors.vin = t('errors.vin');
    }

    const phoneDigits = contactValue.replace(/\D/g, '');
    if (
      contactValue.length < 3 ||
      contactValue.length > 128 ||
      phoneDigits.length < 7 ||
      phoneDigits.length > 15
    ) {
      errors.contactValue = t('errors.contactValue');
    }

    if (description.length > 1000) {
      errors.description = t('errors.description');
    }

    return {vin, contactValue, description, errors};
  }

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'submitting') return;

    const form = event.currentTarget;
    const values = validate(new FormData(form));

    if (Object.keys(values.errors).length > 0) {
      setFieldErrors(values.errors);
      setStatus('idle');
      return;
    }

    setFieldErrors({});
    setStatus('submitting');

    try {
      await initializeTracking();
      const response = await fetch('/api/contact', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({
          vin: values.vin,
          preferredContact: 'phone',
          contactValue: values.contactValue,
          description: values.description || null,
          locale,
          path: window.location.pathname
        })
      });

      if (!response.ok) throw new Error('Contact request failed');

      setStatus('success');
      try {
        window.gtag_report_conversion?.();
      } catch {
        // Analytics must never turn a successfully stored request into an error.
      }
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div
        className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.07] px-5 py-7 text-center"
        role="status"
      >
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
          <CheckCircle2 aria-hidden="true" className="h-6 w-6" />
        </span>
        <h3 className="mt-4 text-lg font-semibold text-white">
          {t('successTitle')}
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-300">
          {t('successText')}
        </p>
      </div>
    );
  }

  const isSubmitting = status === 'submitting';

  return (
    <form id={formId} noValidate onSubmit={submitRequest}>
      <div>
        <label htmlFor={vinId} className="text-sm font-semibold text-white">
          {t('vinLabel')}
        </label>
        <input
          id={vinId}
          name="vin"
          type="text"
          autoComplete="off"
          autoCapitalize="characters"
          maxLength={17}
          disabled={isSubmitting}
          aria-invalid={Boolean(fieldErrors.vin)}
          aria-describedby={fieldErrors.vin ? vinErrorId : undefined}
          className={`${inputClassName} font-mono uppercase tracking-[0.08em]`}
          placeholder={t('vinPlaceholder')}
          onInput={(event) => {
            event.currentTarget.value = event.currentTarget.value.toUpperCase();
            if (fieldErrors.vin) {
              setFieldErrors((current) => ({...current, vin: undefined}));
            }
          }}
        />
        {fieldErrors.vin ? (
          <p id={vinErrorId} className="mt-1.5 text-sm text-rose-300">
            {fieldErrors.vin}
          </p>
        ) : null}
      </div>

      <div className="mt-4">
        <label
          htmlFor={contactId}
          className="text-sm font-semibold text-white"
        >
          {t('contactLabel')}
        </label>
        <input
          id={contactId}
          name="contactValue"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={128}
          disabled={isSubmitting}
          aria-invalid={Boolean(fieldErrors.contactValue)}
          aria-describedby={
            fieldErrors.contactValue ? contactErrorId : undefined
          }
          className={inputClassName}
          placeholder={t('contactPlaceholder')}
          onInput={() => {
            if (fieldErrors.contactValue) {
              setFieldErrors((current) => ({
                ...current,
                contactValue: undefined
              }));
            }
          }}
        />
        {fieldErrors.contactValue ? (
          <p id={contactErrorId} className="mt-1.5 text-sm text-rose-300">
            {fieldErrors.contactValue}
          </p>
        ) : null}
      </div>

      <div className="mt-4">
        <div className="flex items-baseline justify-between gap-3">
          <label
            htmlFor={descriptionId}
            className="text-sm font-semibold text-white"
          >
            {t('descriptionLabel')}
          </label>
          <span className="text-xs text-slate-500">{t('optional')}</span>
        </div>
        <textarea
          id={descriptionId}
          name="description"
          rows={3}
          maxLength={1000}
          disabled={isSubmitting}
          aria-invalid={Boolean(fieldErrors.description)}
          aria-describedby={
            fieldErrors.description ? descriptionErrorId : undefined
          }
          className={`${inputClassName} resize-y`}
          placeholder={t('descriptionPlaceholder')}
          onInput={() => {
            if (fieldErrors.description) {
              setFieldErrors((current) => ({
                ...current,
                description: undefined
              }));
            }
          }}
        />
        {fieldErrors.description ? (
          <p
            id={descriptionErrorId}
            className="mt-1.5 text-sm text-rose-300"
          >
            {fieldErrors.description}
          </p>
        ) : null}
      </div>

      {status === 'error' ? (
        <p
          className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/[0.07] px-3.5 py-3 text-sm leading-5 text-rose-200"
          role="alert"
        >
          {t('errors.submit')}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 text-base font-semibold text-ink shadow-[0_16px_38px_rgba(242,184,75,0.2)] transition hover:bg-[#ffd06d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-wait disabled:opacity-70"
      >
        {isSubmitting ? (
          <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" />
        ) : (
          <Send aria-hidden="true" className="h-5 w-5" />
        )}
        {isSubmitting ? t('submitting') : t('submit')}
      </button>
    </form>
  );
}
