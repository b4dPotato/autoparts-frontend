import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  BadgeCheck,
  BusFront,
  Car,
  CreditCard,
  PhoneCall,
  ShoppingBag,
  Sparkles,
  Truck,
  Van,
  type LucideIcon,
} from "lucide-react";
import brakesImage from "@/assets/categories/brakes.webp";
import filtersOilsImage from "@/assets/categories/filters-oils.webp";
import suspensionImage from "@/assets/categories/suspension.webp";
import engineImage from "@/assets/categories/engine.webp";
import bodyPartsImage from "@/assets/categories/body-parts.webp";
import headlightsImage from "@/assets/categories/headlights.webp";
import electricsImage from "@/assets/categories/electrics.webp";
import serviceKitsImage from "@/assets/categories/service-kits.webp";
import { ContactProvider, ContactTrigger } from "@/components/contact-dialog";
import { ContactLink } from "@/components/contact-link";
import { FaqAccordionItem } from "@/components/faq-accordion-item";
import { LanguageSwitcher } from "@/components/language-switcher";
import { SmoothScrollLink } from "@/components/smooth-scroll-link";
import { businessInfo } from "@/config/business";
import { contacts } from "@/config/contacts";
import { locales, type Locale } from "@/i18n/routing";
import type { AppMessages } from "@/i18n/messages";

type LandingPageProps = {
  locale: Locale;
  messages: AppMessages;
};

const trustIcons = [BadgeCheck, Truck, CreditCard, Sparkles];
const vehicleTypeIcons: LucideIcon[] = [Car, Truck, Van, BusFront];
const brandLogo = "/assets/logo/logo-full-dark-transparent.png";
const categoryImages: StaticImageData[] = [
  brakesImage,
  filtersOilsImage,
  suspensionImage,
  engineImage,
  bodyPartsImage,
  headlightsImage,
  electricsImage,
  serviceKitsImage,
];

export function LandingPage({ locale, messages }: LandingPageProps) {
  const t = messages;

  return (
    <ContactProvider>
      <div className="min-h-screen overflow-hidden bg-ink text-white">
        <Header locale={locale} messages={t} />
        <main>
          <Hero messages={t} />
          <TrustStrip messages={t} />
          <Categories messages={t} />
          <BudgetOptions messages={t} />
          <HowItWorks messages={t} />
          <Faq messages={t} />
          <FinalCta messages={t} />
        </main>
        <Footer locale={locale} messages={t} />
      </div>
    </ContactProvider>
  );
}

function Header({ locale, messages }: LandingPageProps) {
  return (
    <header className="scroll-lock-compensated fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-[#05080d]/82 shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur-md">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
        <Link
          href={`/${locale}`}
          className="flex items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          aria-label={messages.header.logoAria}
        >
          <Image
            src={brandLogo}
            alt=""
            width={210}
            height={52}
            priority
            sizes="(min-width: 1024px) 210px, (min-width: 640px) 190px, 150px"
            style={{ width: "clamp(150px, 16vw, 210px)", height: "auto" }}
            className="object-contain"
          />
        </Link>

        <nav
          className="hidden items-center gap-7 text-sm font-medium text-slate-200 lg:flex"
          aria-label={messages.header.navAria}
        >
          {messages.header.nav
            .filter((item) => item.href !== "#delivery")
            .map((item) => (
              <SmoothScrollLink
                key={item.href}
                href={item.href}
                className="transition duration-200 ease-out hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                {item.label}
              </SmoothScrollLink>
            ))}
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher
            key={locale}
            ariaLabel={messages.header.languageAria}
            locale={locale}
          />
          <ContactTrigger className="hidden rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink transition-colors duration-200 ease-out hover:bg-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold md:inline-flex">
            {messages.header.cta}
          </ContactTrigger>
        </div>
      </div>
    </header>
  );
}

function Hero({ messages }: { messages: AppMessages }) {
  return (
    <section
      className="relative flex min-h-[100dvh] items-center overflow-hidden"
      aria-labelledby="hero-title"
    >
      <div className="absolute inset-0 bg-ink" aria-hidden="true">
        <HeroMotionLayer
          src="/assets/hero/hero-bg.png"
          className="hero-motion-layer--base"
          priority
        />
        <HeroMotionLayer
          src="/assets/hero/hero-bg-2.png"
          className="hero-motion-layer--alternate"
        />
        <HeroMotionLayer
          src="/assets/hero/hero-bg.png"
          className="hero-motion-layer--return"
        />
        <span className="hero-premium-scan" aria-hidden="true" />
        <span className="hero-premium-depth" aria-hidden="true" />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,8,13,0.95)_0%,rgba(5,8,13,0.78)_36%,rgba(5,8,13,0.28)_72%,rgba(5,8,13,0.08)_100%)] md:bg-[linear-gradient(90deg,rgba(5,8,13,0.96)_0%,rgba(5,8,13,0.82)_34%,rgba(5,8,13,0.2)_70%,rgba(5,8,13,0.05)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-20 pt-32 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h1
            id="hero-title"
            className="text-4xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl"
          >
            {messages.hero.title}
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-slate-200 sm:text-lg">
            {messages.hero.subtitle}
          </p>

          <div className="mt-7 max-w-[560px]">
            <p className="text-base font-semibold text-white">
              {messages.hero.vehicleIntro}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2.5 min-[520px]:grid-cols-4">
              {messages.hero.vehicleTypes.map((item, index) => {
                const Icon = vehicleTypeIcons[index];

                return (
                  <ContactTrigger
                    key={item}
                    aria-label={item}
                    className="group flex min-h-[92px] flex-col items-center justify-center rounded-lg border border-white/15 bg-white/[0.055] px-3 py-3 text-center text-sm font-medium text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_16px_44px_rgba(0,0,0,0.22)] backdrop-blur-md transition duration-300 ease-out hover:-translate-y-1 hover:border-gold/55 hover:bg-white/[0.09] hover:text-white hover:shadow-[0_18px_52px_rgba(242,184,75,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  >
                    <Icon
                      aria-hidden="true"
                      className="mb-3 h-7 w-7 text-gold transition duration-300 group-hover:text-[#ffd06d]"
                      strokeWidth={1.9}
                    />
                    <span>{item}</span>
                  </ContactTrigger>
                );
              })}
            </div>
          </div>

          <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <ContactTrigger className="cta-pulse-glow inline-flex items-center justify-center rounded-full bg-gold px-7 py-4 text-base font-semibold text-ink transition-colors duration-300 ease-out hover:bg-[#ffd06d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              <ContactButtonContent label={messages.hero.primaryCta} />
            </ContactTrigger>
            <SmoothScrollLink
              href="#how-it-works"
              className="rounded-full px-2 py-3 text-sm font-semibold text-slate-200 transition duration-200 ease-out hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              {messages.hero.secondaryAction}
            </SmoothScrollLink>
          </div>
        </div>
      </div>
      <SmoothScrollLink
        href="#categories"
        aria-label={messages.categories.title}
        className="absolute bottom-6 left-1/2 z-20 flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white shadow-[0_16px_48px_rgba(0,0,0,0.34)] backdrop-blur-md transition duration-300 ease-out hover:-translate-y-1 hover:border-gold/55 hover:bg-gold/15 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
      >
        <ArrowDown aria-hidden="true" className="h-5 w-5" />
      </SmoothScrollLink>
    </section>
  );
}

function HeroMotionLayer({
  src,
  className,
  priority = false,
}: {
  src: string;
  className: string;
  priority?: boolean;
}) {
  return (
    <div className={`hero-motion-layer ${className}`}>
      <Image
        src={src}
        alt=""
        fill
        priority={priority}
        sizes="100vw"
        className="hero-motion-image object-cover"
      />
    </div>
  );
}

function ContactButtonContent({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center justify-center gap-2.5">
      <PhoneCall aria-hidden="true" className="h-5 w-5 shrink-0" />
      <span>{label}</span>
    </span>
  );
}

function TrustStrip({ messages }: { messages: AppMessages }) {
  return (
    <section
      className="relative z-10 px-5 pb-8 pt-6 sm:px-6 md:pt-8 lg:px-8"
      aria-label={messages.trust.aria}
    >
      <div
        className="absolute inset-x-0 top-6 -z-10 h-32 bg-[linear-gradient(180deg,rgba(242,184,75,0.08),rgba(5,8,13,0))]"
        aria-hidden="true"
      />
      <div className="mx-auto grid max-w-7xl gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
        {messages.trust.items.map((item, index) => {
          const Icon = trustIcons[index];
          return (
            <div
              key={item.title}
              className="trust-badge-card group relative overflow-hidden rounded-2xl border border-white/15 p-4 shadow-premium backdrop-blur-xl transition duration-300 ease-out hover:-translate-y-1 hover:border-gold/55 hover:shadow-[0_22px_70px_rgba(242,184,75,0.2)] sm:p-5"
            >
              <div className="trust-badge-card__icon flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/35 text-gold transition duration-300 group-hover:border-gold/65 group-hover:bg-gold/20 group-hover:text-[#ffd882]">
                <Icon
                  aria-hidden="true"
                  className="h-7 w-7"
                  strokeWidth={1.9}
                />
              </div>
              <h2 className="mt-4 text-base font-semibold tracking-tight text-white">
                {item.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-300/80">
                {item.text}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SectionHeader({
  id,
  eyelessTitle,
  text,
}: {
  id: string;
  eyelessTitle: string;
  text: string;
}) {
  return (
    <div className="max-w-2xl">
      <h2
        id={id}
        className="text-3xl font-semibold tracking-tight text-white sm:text-4xl"
      >
        {eyelessTitle}
      </h2>
      <p className="mt-4 text-base leading-7 text-slate-400">{text}</p>
    </div>
  );
}

function Categories({ messages }: { messages: AppMessages }) {
  return (
    <section
      id="categories"
      className="scroll-mt-24 px-5 py-16 sm:px-6 lg:px-8"
      aria-labelledby="categories-title"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          id="categories-title"
          eyelessTitle={messages.categories.title}
          text={messages.categories.text}
        />
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 lg:gap-4">
          {messages.categories.items.map((item, index) => {
            const image = categoryImages[index];
            return (
              <ContactTrigger
                key={item.title}
                className="category-catalog-card group overflow-hidden rounded-2xl border border-white/10 bg-[#0a111a] text-left transition duration-300 ease-out hover:-translate-y-1 hover:border-gold/45 hover:shadow-[0_22px_60px_rgba(242,184,75,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                aria-label={item.aria}
              >
                <span className="relative block aspect-[16/10] overflow-hidden bg-[#05080d]">
                  <Image
                    src={image}
                    alt=""
                    fill
                    loading={index < 4 ? "eager" : "lazy"}
                    sizes="(min-width: 1024px) 25vw, (min-width: 430px) 50vw, 100vw"
                    className="category-catalog-card__image object-cover transition duration-500 ease-out group-hover:scale-105"
                  />
                  <span className="absolute inset-0 bg-[linear-gradient(180deg,transparent_52%,rgba(5,8,13,0.54)_100%)]" />
                </span>
                <span className="block p-3 sm:p-4">
                  <span className="block text-sm font-semibold tracking-tight text-white sm:text-base">
                    {item.title}
                  </span>
                  <span className="category-catalog-card__description mt-1.5 block text-xs leading-5 text-slate-400 sm:text-sm sm:leading-6">
                    {item.text}
                  </span>
                </span>
              </ContactTrigger>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function HowItWorks({ messages }: { messages: AppMessages }) {
  return (
    <section
      id="how-it-works"
      className="border-y border-white/10 bg-[#080e16] px-5 py-24 sm:px-6 lg:px-8"
      aria-labelledby="how-title"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          id="how-title"
          eyelessTitle={messages.how.title}
          text={messages.how.text}
        />
        <ol className="mt-12 grid gap-4 lg:grid-cols-4">
          {messages.how.steps.map((step, index) => (
            <li
              key={step.title}
              className="relative rounded-2xl border border-white/10 bg-ink/60 p-6"
            >
              <span className="text-sm font-semibold text-gold">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-5 text-xl font-semibold text-white">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                {step.text}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function BudgetOptions({ messages }: { messages: AppMessages }) {
  return (
    <section
      id="budget"
      className="relative overflow-hidden px-5 py-24 sm:px-6 lg:px-8"
      aria-labelledby="budget-title"
    >
      <div
        className="absolute inset-x-0 top-8 -z-10 h-72 bg-[radial-gradient(circle_at_68%_18%,rgba(242,184,75,0.12),transparent_36%)]"
        aria-hidden="true"
      />
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
          <div className="lg:pr-8">
            <SectionHeader
              id="budget-title"
              eyelessTitle={messages.budget.title}
              text={messages.budget.text}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3 md:items-center">
            {messages.budget.items.map((item, index) => {
              const isRecommended = index === 1;

              return (
                <div
                  key={item.title}
                  className={`budget-option-card group relative flex min-h-[280px] flex-col overflow-hidden rounded-2xl border p-6 transition duration-300 ease-out hover:-translate-y-1 ${
                    isRecommended
                      ? "budget-option-card--featured z-10 border-gold/55 p-7 shadow-[0_28px_90px_rgba(242,184,75,0.2)] md:min-h-[326px] lg:scale-[1.04] lg:hover:scale-[1.06]"
                      : "border-white/10 bg-white/[0.035] hover:border-gold/35 hover:bg-white/[0.055] hover:shadow-[0_18px_60px_rgba(242,184,75,0.1)]"
                  }`}
                >
                  {isRecommended ? (
                    <span className="mb-6 inline-flex w-fit rounded-full border border-gold/35 bg-gold/15 px-3 py-1 text-xs font-semibold tracking-[0.08em] text-gold">
                      {messages.budget.recommendedBadge}
                    </span>
                  ) : null}
                  <div className="budget-option-card__icon flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/30 text-gold transition duration-300 group-hover:border-gold/60 group-hover:bg-gold/20">
                    <ShoppingBag
                      aria-hidden="true"
                      className="h-7 w-7"
                      strokeWidth={1.8}
                    />
                  </div>
                  <h3 className="mt-6 text-2xl font-semibold tracking-tight text-white">
                    {item.title}
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-slate-300/80">
                    {item.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function Faq({ messages }: { messages: AppMessages }) {
  return (
    <section
      id="faq"
      className="px-5 py-24 sm:px-6 lg:px-8"
      aria-labelledby="faq-title"
    >
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionHeader
          id="faq-title"
          eyelessTitle={messages.faq.title}
          text={messages.faq.text}
        />
        <div className="grid gap-3">
          {messages.faq.items.map((item) => (
            <FaqAccordionItem
              key={item.question}
              question={item.question}
              answer={item.answer}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta({ messages }: { messages: AppMessages }) {
  return (
    <section
      className="px-5 pb-24 sm:px-6 lg:px-8"
      aria-labelledby="final-cta-title"
    >
      <div className="mx-auto max-w-7xl rounded-3xl border border-gold/25 bg-[linear-gradient(135deg,rgba(242,184,75,0.16),rgba(255,255,255,0.04))] p-8 shadow-premium sm:p-12 lg:flex lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <h2
            id="final-cta-title"
            className="text-3xl font-semibold tracking-tight text-white sm:text-4xl"
          >
            {messages.finalCta.title}
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-300">
            {messages.finalCta.text}
          </p>
        </div>
        <ContactTrigger className="cta-pulse-glow mt-8 inline-flex items-center justify-center rounded-full bg-gold px-7 py-4 text-base font-semibold text-ink transition-colors duration-300 ease-out hover:bg-[#ffd06d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white lg:mt-0">
          <ContactButtonContent label={messages.finalCta.button} />
        </ContactTrigger>
      </div>
    </section>
  );
}

function Footer({ locale, messages }: LandingPageProps) {
  return (
    <footer className="border-t border-white/10 px-5 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_0.9fr_0.9fr_0.9fr]">
        <div>
          <div className="flex items-center gap-3">
            <Image
              src={brandLogo}
              alt={messages.header.logo}
              width={220}
              height={55}
              sizes="220px"
              className="object-contain"
            />
          </div>
          <p className="mt-5 max-w-sm text-sm leading-6 text-slate-400">
            {messages.footer.description}
          </p>
          <address className="mt-5 max-w-sm border-l border-white/10 pl-3 text-xs not-italic leading-5 text-slate-500 sm:mt-6">
            <span className="block text-slate-400">
              {messages.footer.business.owner}
            </span>
            <span className="block">
              {messages.footer.business.taxIdLabel}: {businessInfo.taxId}
            </span>
            <span className="block">
              {messages.footer.business.phoneLabel}:{" "}
              <ContactLink
                href={`tel:${businessInfo.phone.international}`}
                className="rounded-sm underline decoration-white/20 underline-offset-2 transition duration-200 hover:text-gold hover:decoration-gold/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                {businessInfo.phone.display}
              </ContactLink>
            </span>
          </address>
        </div>
        <FooterList
          title={messages.footer.navTitle}
          items={messages.header.nav
            .filter((item) => item.href !== "#delivery")
            .map((item) => ({
              label: item.label,
              href: item.href,
            }))}
        />
        <FooterList
          title={messages.footer.languageTitle}
          items={locales.map((item) => ({
            label: messages.footer.languages[item],
            href: `/${item}`,
          }))}
          currentHref={`/${locale}`}
        />
        <div>
          <h2 className="text-sm font-semibold text-white">
            {messages.footer.contactsTitle}
          </h2>
          <div className="mt-4 grid gap-2 text-sm text-slate-400">
            {contacts.map((contact) => (
              <ContactLink
                key={contact.key}
                href={contact.href}
                className="transition duration-200 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                {messages.contact.options[contact.key].label}
              </ContactLink>
            ))}
          </div>
        </div>
      </div>
      <p className="mx-auto mt-10 max-w-7xl text-sm text-slate-500">
        {messages.footer.copyright}
      </p>
    </footer>
  );
}

function FooterList({
  title,
  items,
  currentHref,
}: {
  title: string;
  items: Array<{ label: string; href: string }>;
  currentHref?: string;
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      <div className="mt-4 grid gap-2 text-sm text-slate-400">
        {items.map((item) =>
          item.href.startsWith("#") ? (
            <SmoothScrollLink
              key={`${item.href}-${item.label}`}
              href={item.href}
              aria-current={item.href === currentHref ? "page" : undefined}
              className="transition duration-200 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              {item.label}
            </SmoothScrollLink>
          ) : (
            <a
              key={`${item.href}-${item.label}`}
              href={item.href}
              aria-current={item.href === currentHref ? "page" : undefined}
              className="transition duration-200 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              {item.label}
            </a>
          ),
        )}
      </div>
    </div>
  );
}
