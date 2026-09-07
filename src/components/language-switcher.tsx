'use client';

import Link from 'next/link';
import {useState, type CSSProperties} from 'react';
import {localeLabels, locales, type Locale} from '@/i18n/routing';

type LanguageSwitcherProps = {
  ariaLabel: string;
  locale: Locale;
};

export function LanguageSwitcher({ariaLabel, locale}: LanguageSwitcherProps) {
  const currentIndex = Math.max(locales.indexOf(locale), 0);
  const [activeIndex, setActiveIndex] = useState(currentIndex);

  return (
    <nav
      className="language-switcher"
      style={{'--language-offset': `${activeIndex * 100}%`} as CSSProperties}
      aria-label={ariaLabel}
    >
      <span className="language-switcher__indicator" aria-hidden="true" />
      {locales.map((item, index) => (
        <Link
          key={item}
          href={`/${item}`}
          className={`language-switcher__item ${index === activeIndex ? 'language-switcher__item--active' : ''}`}
          aria-current={item === locale ? 'page' : undefined}
          data-track="navigation_click"
          data-track-label={`locale:${item}`}
          onClick={() => setActiveIndex(index)}
          onBlur={() => setActiveIndex(currentIndex)}
          onFocus={() => setActiveIndex(index)}
          onMouseEnter={() => setActiveIndex(index)}
          onMouseLeave={() => setActiveIndex(currentIndex)}
        >
          {localeLabels[item]}
        </Link>
      ))}
    </nav>
  );
}
