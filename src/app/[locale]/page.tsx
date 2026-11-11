import {LandingPage} from '@/components/landing-page';
import {contactPhone} from '@/config/contacts';
import {siteConfig} from '@/config/site';
import {getLocaleMessages} from '@/i18n/messages';
import {isLocale, type Locale} from '@/i18n/routing';
import {isLeadEmailNotificationsEnabled} from '@/server/settings/feature-flags';
import {notFound} from 'next/navigation';

type PageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function Page({params}: PageProps) {
  const {locale: paramLocale} = await params;

  if (!isLocale(paramLocale)) {
    notFound();
  }

  const locale = paramLocale as Locale;
  const messages = getLocaleMessages(locale);
  const showLeadForm = await getLeadFormVisibility();
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: messages.faq.items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer
      }
    }))
  };
  const businessJsonLd = {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'AutoPartsStore'],
    name: messages.header.logo,
    url: `${siteConfig.url}/${locale}`,
    logo: `${siteConfig.url}/assets/logo/logo-full-light.png`,
    description: messages.metadata.description,
    areaServed: {
      '@type': 'Country',
      name: messages.seo.areaServed
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: messages.seo.contactType,
      telephone: contactPhone.international,
      availableLanguage: ['uk', 'ru', 'en']
    }
  };

  return (
    <>
      <LandingPage
        locale={locale}
        messages={messages}
        showLeadForm={showLeadForm}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: JSON.stringify(businessJsonLd)}}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: JSON.stringify(faqJsonLd)}}
      />
    </>
  );
}

async function getLeadFormVisibility() {
  try {
    return await isLeadEmailNotificationsEnabled();
  } catch {
    console.error(
      'Lead request form was hidden because its feature flag could not be loaded.'
    );
    return false;
  }
}
