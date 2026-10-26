'use client';

import Image from 'next/image';
import * as Dialog from '@radix-ui/react-dialog';
import {ArrowRight, Flame, PhoneCall, X} from 'lucide-react';
import {useEffect, useRef, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {ContactLink} from '@/components/contact-link';
import {contacts, contactPhone} from '@/config/contacts';
import type {Promotion} from '@/lib/promotions/contracts';
import type {Locale} from '@/i18n/routing';
import {trackEvent} from '@/lib/tracking/client';

export function FeaturedPromotion({promotion}: {promotion: Promotion}) {
  const locale = useLocale() as Locale;
  const t = useTranslations('promotion');
  const contact = useTranslations('contact');
  const content = promotion.content[locale];
  const banner = useRef<HTMLElement>(null);
  const seen = useRef(new Set<string>());
  const [showContacts, setShowContacts] = useState(false);
  useEffect(() => {
    const impressionKey = `${promotion.id}:${locale}`;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || seen.current.has(impressionKey)) return;
        seen.current.add(impressionKey);
        trackEvent({
          type: 'promotion_impression',
          metadata: {promotionId: promotion.id, locale, placement: 'hero'},
        });
        observer.disconnect();
      },
      {threshold: 0.5},
    );
    if (banner.current) observer.observe(banner.current);
    return () => observer.disconnect();
  }, [promotion.id, locale]);

  return (
    <Dialog.Root
      onOpenChange={(open) => {
        if (open)
          trackEvent({
            type: 'promotion_details_open',
            metadata: {promotionId: promotion.id, locale, placement: 'hero'},
          });
        else setShowContacts(false);
      }}
    >
      <aside
        ref={banner}
        data-promotion-id={promotion.id}
        data-promotion-placement="hero"
        aria-label={t('badge')}
        className="mt-6 grid max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 rounded-2xl border border-gold/75 bg-[#050a10]/90 p-3 shadow-[0_0_28px_rgba(242,184,75,0.12)] backdrop-blur-md sm:mt-7 sm:flex sm:gap-5 sm:p-4"
      >
        <div className="col-span-2 min-w-0 flex-1 sm:col-span-1">
          <span className="mb-1 inline-flex items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[11px] font-semibold text-gold">
            <Flame className="size-3" aria-hidden="true" />
            {t('badge')}
          </span>
          <h2 className="line-clamp-2 text-sm font-semibold text-white sm:text-base">
            {content.title}
          </h2>
          <p className="mt-0.5 line-clamp-1 text-xs text-slate-300">
            {content.vehicle}
          </p>
        </div>
        {promotion.image && (
          <Image
            unoptimized
            width={640}
            height={480}
            src={promotion.image}
            alt={t('image')}
            className="hidden size-20 rounded-lg object-contain sm:block"
          />
        )}
        <div className="min-w-0 sm:max-w-56 sm:flex-1">
          <p className="text-xl font-bold tracking-tight text-gold sm:text-2xl">
            {promotion.mileage} <span className="text-sm">{t('unit')}</span>
          </p>
          <p className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-slate-300 sm:text-xs">
            {content.condition}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:shrink-0 sm:border-l sm:border-white/15 sm:pl-5">
          <ContactLink
            href={`tel:${contactPhone.international}`}
            className="hidden items-center gap-2 text-sm text-white sm:inline-flex"
          >
            <PhoneCall className="size-4 text-gold" aria-hidden="true" />
            {contactPhone.display}
          </ContactLink>
          <Dialog.Trigger className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gold px-4 py-2 text-xs font-semibold text-ink transition hover:bg-[#ffd06d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:text-sm">
            {t('details')}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Dialog.Trigger>
        </div>
      </aside>
      <Dialog.Portal>
        <Dialog.Overlay className="contact-dialog-overlay fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content
          data-promotion-id={promotion.id}
          data-promotion-placement="details"
          className="promotion-dialog fixed inset-x-0 bottom-0 z-50 max-h-[calc(100dvh-0.75rem)] overflow-y-auto overscroll-contain rounded-t-3xl border border-white/10 bg-[#08111b] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-premium outline-none sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-[min(92vw,680px)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:p-6"
        >
          <div className="sticky -top-5 z-10 -mx-5 -mt-5 mb-5 flex items-start justify-between gap-3 border-b border-white/10 bg-[#08111b] p-5 sm:-top-6 sm:-mx-6 sm:-mt-6 sm:p-6">
            <div>
              <p className="mb-1 text-xs font-semibold text-gold">
                {t('badge')}
              </p>
              <Dialog.Title className="text-xl font-semibold text-white">
                {content.title}
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-slate-300">
                {content.condition}
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label={t('close')}
              className="shrink-0 rounded-full border border-white/15 p-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <X className="size-5" />
            </Dialog.Close>
          </div>
          {promotion.image && (
            <Image
              unoptimized
              width={640}
              height={480}
              src={promotion.image}
              alt={t('image')}
              className="mb-4 max-h-52 w-full rounded-xl object-contain"
            />
          )}
          <div className="mb-5 rounded-xl border border-gold/30 bg-gold/10 p-4">
            <p className="text-xs text-slate-300">{t('mileage')}</p>
            <p className="mt-1 text-3xl font-bold text-gold">
              {promotion.mileage} {t('unit')}
            </p>
          </div>
          <dl className="space-y-4 text-sm">
            {(
              ['vehicle', 'engine', 'transmission', 'ecu', 'terms'] as const
            ).map((key) => (
              <div key={key} className="grid gap-1 sm:grid-cols-[140px_1fr]">
                <dt className="text-slate-400">{t(key)}</dt>
                <dd className="break-words text-white">
                  {key === 'ecu' ? promotion.ecu : content[key]}
                </dd>
              </div>
            ))}
            <div>
              <dt className="mb-2 text-slate-400">{t('included')}</dt>
              <dd>
                <ul className="list-disc space-y-1 pl-5 text-white">
                  {content.included
                    .split('\n')
                    .filter(Boolean)
                    .map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                </ul>
              </dd>
            </div>
          </dl>
          <button
            type="button"
            aria-expanded={showContacts}
            aria-controls="promotion-contacts"
            onClick={(event) => {
              if (!showContacts)
                trackEvent({
                  type: 'contact_open',
                  targetType: 'button',
                  targetText: event.currentTarget.textContent,
                  metadata: {
                    promotionId: promotion.id,
                    placement: 'details',
                    locale,
                  },
                });
              setShowContacts(!showContacts);
            }}
            className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-gold px-4 py-3 text-sm font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <PhoneCall className="size-4" />
            {t('contact')}
          </button>
          {showContacts && (
            <div
              id="promotion-contacts"
              className="mt-3 grid grid-cols-2 gap-2"
            >
              {contacts.map((item) => (
                <ContactLink
                  key={item.key}
                  href={item.href}
                  className="flex min-h-12 items-center justify-center rounded-xl border border-white/15 px-2 py-3 text-sm text-white transition hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  {item.key === 'phone'
                    ? contactPhone.display
                    : contact(`options.${item.key}.label`)}
                </ContactLink>
              ))}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
