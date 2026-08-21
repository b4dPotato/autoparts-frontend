import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  BadgeCheck,
  BusFront,
  Camera,
  Car,
  PhoneCall,
  ShieldCheck,
  ShoppingBag,
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
import gearboxClutchImage from "@/assets/categories/gearbox-clutch.webp";
import steeringImage from "@/assets/categories/steering.webp";
import coolingImage from "@/assets/categories/cooling.webp";
import airConditioningImage from "@/assets/categories/air-conditioning.webp";
import fuelSystemImage from "@/assets/categories/fuel-system.webp";
import exhaustImage from "@/assets/categories/exhaust.webp";
import interiorImage from "@/assets/categories/interior.webp";
import otherPartsImage from "@/assets/categories/other-parts.webp";
import { BrandGrid } from "@/components/brand-grid";
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

const trustIcons: LucideIcon[] = [
  BadgeCheck,
  Camera,
  ShieldCheck,
  Truck,
];
const trustIconStyle =
  "text-gold drop-shadow-[0_0_12px_rgba(242,184,75,0.55)]";
const trustStepConnectorStyle =
  "from-gold/90 via-gold/65 to-gold/25";
const vehicleTypeIcons: LucideIcon[] = [Car, Truck, Van, BusFront];
const vehicleTypeIconStyles = [
  "text-sky-400 drop-shadow-[0_0_10px_rgba(56,189,248,0.42)]",
  "text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.42)]",
  "text-violet-400 drop-shadow-[0_0_10px_rgba(167,139,250,0.42)]",
  "text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.42)]",
];
const newAndUsedIconStyles = [
  "border-sky-400/25 bg-sky-400/10 text-sky-300",
  "border-violet-400/25 bg-violet-400/10 text-violet-300",
];
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
  gearboxClutchImage,
  steeringImage,
  coolingImage,
  airConditioningImage,
  fuelSystemImage,
  exhaustImage,
  interiorImage,
  otherPartsImage,
];

export function LandingPage({ locale, messages }: LandingPageProps) {
  const t = messages;

  return (
    <ContactProvider>
      <div className="mobile-contact-bar-space min-h-screen overflow-hidden bg-ink text-white">
        <Header locale={locale} messages={t} />
        <main>
          <Hero messages={t} />
          <TrustStrip messages={t} />
          <Brands messages={t} />
          <Categories messages={t} />
          <NewAndUsedParts messages={t} />
          <BudgetOptions messages={t} />
          <HowItWorks messages={t} />
          <Faq messages={t} />
          <FinalCta messages={t} />
        </main>
        <Footer locale={locale} messages={t} />
        <MobileContactBar messages={t} />
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
      className="relative flex min-h-[100dvh] items-start overflow-hidden sm:items-center"
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
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_18%_30%,rgba(5,8,13,0.78)_0%,rgba(5,8,13,0.52)_40%,rgba(5,8,13,0)_72%)] md:hidden"
        aria-hidden="true"
      />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-20 pt-28 sm:px-6 sm:pt-32 lg:px-8">
        <div className="max-w-2xl">
          <h1
            id="hero-title"
            className="hero-title-shadow text-4xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl"
          >
            {messages.hero.title}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-8 text-slate-200 sm:mt-6 sm:text-lg">
            {messages.hero.subtitle}
          </p>

          <div className="mt-5 max-w-[560px] sm:mt-7">
            <p className="text-base font-semibold text-white">
              {messages.hero.vehicleIntro}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 min-[520px]:grid-cols-4 sm:gap-2.5">
              {messages.hero.vehicleTypes.map((item, index) => {
                const Icon = vehicleTypeIcons[index];

                return (
                  <ContactTrigger
                    key={item}
                    aria-label={item}
                    className="group flex min-h-[78px] flex-col items-center justify-center rounded-lg border border-white/15 bg-white/[0.055] px-2 py-2.5 text-center text-xs font-medium text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_16px_44px_rgba(0,0,0,0.22)] backdrop-blur-md transition duration-300 ease-out hover:-translate-y-1 hover:border-gold/55 hover:bg-white/[0.09] hover:text-white hover:shadow-[0_18px_52px_rgba(242,184,75,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:min-h-[92px] sm:px-3 sm:py-3 sm:text-sm"
                  >
                    <Icon
                      aria-hidden="true"
                      className={`mb-2 h-6 w-6 transition duration-300 group-hover:scale-110 group-hover:brightness-125 sm:mb-3 sm:h-7 sm:w-7 ${vehicleTypeIconStyles[index]}`}
                      strokeWidth={1.9}
                    />
                    <span>{item}</span>
                  </ContactTrigger>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex flex-col items-start gap-3 sm:mt-8 sm:flex-row sm:items-center sm:gap-4">
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

function MobileContactBar({ messages }: { messages: AppMessages }) {
  const directContactKeys = ["phone", "viber", "telegram", "whatsapp"] as const;

  return (
    <nav
      className="mobile-contact-bar fixed inset-x-2 z-40 grid grid-cols-4 rounded-2xl border border-white/10 bg-[#05080d]/88 px-2 py-2 shadow-[0_18px_60px_rgba(0,0,0,0.3)] backdrop-blur-md md:hidden"
      aria-label={messages.mobileContact.aria}
    >
      {directContactKeys.map((key) => {
        const contact = contacts.find((item) => item.key === key);

        if (!contact) {
          return null;
        }

        return (
          <ContactLink
            key={key}
            href={contact.href}
            className="flex min-h-16 min-w-0 flex-col items-center justify-center gap-1.5 rounded-xl px-0.5 py-1 text-center text-[11px] font-semibold leading-none text-slate-200 transition-colors duration-200 hover:bg-white/[0.06] hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold"
            aria-label={messages.contact.options[key].aria}
          >
            {contact.icon ? (
              <Image
                src={contact.icon}
                alt=""
                width={30}
                height={30}
                className="h-[30px] w-[30px] shrink-0"
              />
            ) : (
              <PhoneCall aria-hidden="true" className="h-[30px] w-[30px] text-gold" />
            )}
            <span className="max-w-full truncate px-0.5">
              {messages.mobileContact.labels[key]}
            </span>
          </ContactLink>
        );
      })}
    </nav>
  );
}

function TrustStrip({ messages }: { messages: AppMessages }) {
  return (
    <section
      className="relative z-10 overflow-hidden px-5 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
      aria-labelledby="trust-title"
    >
      <div
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_40%,rgba(10,44,72,0.2),transparent_58%),linear-gradient(180deg,rgba(5,8,13,0.96),rgba(3,7,12,1))]"
        aria-hidden="true"
      />
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="flex items-center justify-center gap-3 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-gold sm:text-xs">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-gold/80" aria-hidden="true" />
            <span>{messages.trust.eyebrow}</span>
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-gold/80" aria-hidden="true" />
          </div>
          <h2 id="trust-title" className="mt-5 text-[2.15rem] font-semibold leading-[1.08] tracking-tight text-white sm:text-4xl lg:text-5xl">
            {messages.trust.title}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-300/85 sm:text-lg sm:leading-8">
            {messages.trust.text}
          </p>
        </div>
        <ol className="mx-auto mt-14 grid max-w-2xl lg:mt-20 lg:max-w-none lg:grid-cols-4 lg:gap-8">
          {messages.trust.items.map((item, index) => {
            const Icon = trustIcons[index];
            return (
              <li
                key={item.title}
                className="relative grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-5 pb-12 last:pb-0 lg:block lg:pb-0 lg:text-center"
              >
                {index < messages.trust.items.length - 1 ? (
                  <>
                    <span
                      className={`absolute bottom-0 left-9 top-16 w-px bg-gradient-to-b opacity-90 lg:hidden ${trustStepConnectorStyle}`}
                      aria-hidden="true"
                    />
                    <span
                      className={`absolute left-[calc(50%+2rem)] right-[calc(-50%-2rem)] top-8 hidden h-px bg-gradient-to-r opacity-80 lg:block ${trustStepConnectorStyle}`}
                      aria-hidden="true"
                    />
                  </>
                ) : null}
                <div className="relative z-10 flex h-16 w-[4.5rem] items-center justify-center lg:mx-auto lg:w-16">
                  <Icon
                    aria-hidden="true"
                    className={`h-14 w-14 transition duration-300 hover:scale-105 ${trustIconStyle}`}
                    strokeWidth={1.55}
                  />
                </div>
                <div className="pt-1 lg:pt-0">
                  <h3 className="text-xl font-semibold leading-tight tracking-tight text-white lg:mt-7 lg:text-lg">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-base leading-7 text-slate-300/80 lg:mx-auto lg:max-w-[17rem] lg:text-sm lg:leading-6">
                    {item.text}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

function Brands({ messages }: { messages: AppMessages }) {
  return (
    <section
      id="brands"
      className="scroll-mt-24 relative overflow-hidden border-y border-white/10 bg-[#080e16] px-5 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
      aria-labelledby="brands-title"
    >
      <div
        className="absolute inset-x-0 top-0 -z-0 h-72 bg-[radial-gradient(circle_at_50%_0%,rgba(242,184,75,0.1),transparent_62%)]"
        aria-hidden="true"
      />
      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <h2
            id="brands-title"
            className="text-3xl font-semibold tracking-tight text-white sm:text-4xl"
          >
            {messages.brands.title}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-400">
            {messages.brands.text}
          </p>
        </div>

        <BrandGrid
          passengerLabel={messages.brands.passengerLabel}
          commercialLabel={messages.brands.commercialLabel}
          showMore={messages.brands.showMore}
          showLess={messages.brands.showLess}
        />

        <div className="mt-10 rounded-2xl border border-gold/30 bg-[linear-gradient(135deg,rgba(242,184,75,0.13),rgba(255,255,255,0.035))] px-5 py-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_60px_rgba(242,184,75,0.08)] sm:px-8 sm:py-7">
          <h3 className="text-xl font-semibold tracking-tight text-gold sm:text-2xl">
            {messages.brands.allMakesTitle}
          </h3>
          <p className="mx-auto mt-3 max-w-3xl text-sm leading-6 text-slate-200 sm:text-base sm:leading-7">
            {messages.brands.allMakesText}
          </p>
        </div>
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
                <span className="relative block aspect-[4/3] overflow-hidden bg-[#05080d]">
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

function NewAndUsedParts({ messages }: { messages: AppMessages }) {
  return (
    <section
      id="new-and-used"
      className="scroll-mt-24 border-y border-white/10 bg-[#080e16] px-5 py-24 sm:px-6 lg:px-8"
      aria-labelledby="new-and-used-title"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          id="new-and-used-title"
          eyelessTitle={messages.newAndUsed.title}
          text={messages.newAndUsed.text}
        />

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          {messages.newAndUsed.options.map((option, index) => {
            const Icon = index === 0 ? ShoppingBag : Camera;

            return (
              <div
                key={option.title}
                className="rounded-2xl border border-white/10 bg-ink/60 p-6 sm:p-7"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${newAndUsedIconStyles[index]}`}>
                  <Icon aria-hidden="true" className="h-6 w-6" strokeWidth={1.9} />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-white">
                  {option.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-300/80">
                  {option.text}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap gap-2.5">
          {messages.newAndUsed.groups.map((group) => (
            <span
              key={group}
              className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300"
            >
              {group}
            </span>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-gold/25 bg-gold/[0.07] p-6 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-7">
          <div className="flex max-w-3xl gap-4">
            <ShieldCheck
              aria-hidden="true"
              className="mt-0.5 h-6 w-6 shrink-0 text-gold"
              strokeWidth={1.9}
            />
            <p className="text-sm leading-7 text-slate-200">
              {messages.newAndUsed.usedPartDetails}
            </p>
          </div>
          <ContactTrigger className="cta-pulse-glow mt-6 inline-flex shrink-0 items-center justify-center rounded-full bg-gold px-6 py-3.5 text-sm font-semibold text-ink transition-colors duration-300 ease-out hover:bg-[#ffd06d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:mt-0">
            <ContactButtonContent label={messages.newAndUsed.cta} />
          </ContactTrigger>
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
