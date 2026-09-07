import type {Metadata} from 'next';
import {NextIntlClientProvider} from 'next-intl';
import {notFound} from 'next/navigation';
import Script from 'next/script';
import '../globals.css';
import {siteConfig} from '@/config/site';
import {TrackingProvider} from '@/components/tracking-provider';
import {getLocaleMessages} from '@/i18n/messages';
import {isLocale, locales, type Locale} from '@/i18n/routing';

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({locale}));
}

export async function generateMetadata({params}: LocaleLayoutProps): Promise<Metadata> {
  const {locale} = await params;

  if (!isLocale(locale)) {
    return {};
  }

  const messages = getLocaleMessages(locale);
  const canonical = `${siteConfig.url}/${locale}`;

  return {
    metadataBase: new URL(siteConfig.url),
    title: messages.metadata.title,
    description: messages.metadata.description,
    icons: {
      icon: [
        {url: '/favicon.ico', sizes: 'any'},
        {url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32'}
      ],
      apple: [{url: '/apple-touch-icon.png', type: 'image/png', sizes: '180x180'}],
      other: [
        {rel: 'icon', url: '/icon-192.png', type: 'image/png', sizes: '192x192'},
        {rel: 'icon', url: '/icon-512.png', type: 'image/png', sizes: '512x512'}
      ]
    },
    alternates: {
      canonical,
      languages: Object.fromEntries(locales.map((item) => [item, `${siteConfig.url}/${item}`]))
    },
    openGraph: {
      type: 'website',
      url: canonical,
      title: messages.metadata.ogTitle,
      description: messages.metadata.ogDescription,
      locale,
      alternateLocale: locales.filter((item) => item !== locale),
      images: [
        {
          url: '/assets/hero/hero-bg.png',
          width: 1680,
          height: 945,
          alt: messages.metadata.ogImageAlt
        }
      ]
    }
  };
}

export default async function LocaleLayout({children, params}: LocaleLayoutProps) {
  const {locale} = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const messages = getLocaleMessages(locale as Locale);

  return (
    <html lang={locale} data-scroll-behavior="smooth">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-Q38XFFSC6K"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-Q38XFFSC6K');
            gtag('config', 'AW-18266849083');
          `}
        </Script>
        <Script id="gtag-contact-conversion" strategy="afterInteractive">
          {`
            function gtag_report_conversion(url) {
              var navigated = false;
              var callback = function () {
                if (!navigated && typeof url !== 'undefined') {
                  navigated = true;
                  window.location.href = url;
                }
              };

              if (typeof gtag !== 'function') {
                callback();
                return false;
              }

              gtag('event', 'conversion', {
                'send_to': 'AW-18266849083/VFvmCKCq8swcELv-p4ZE',
                'event_callback': callback,
                'event_timeout': 2000
              });

              window.setTimeout(callback, 2100);
              return false;
            }
          `}
        </Script>
      </head>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <TrackingProvider />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
