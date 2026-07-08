'use client';

import * as Dialog from '@radix-ui/react-dialog';
import Image from 'next/image';
import {
  createContext,
  type ButtonHTMLAttributes,
  type ReactNode,
  useContext,
  useState
} from 'react';
import {PhoneCall, X} from 'lucide-react';
import {useTranslations} from 'next-intl';
import {ContactLink} from '@/components/contact-link';
import {contacts} from '@/config/contacts';

type ContactContextValue = {
  open: () => void;
};

const ContactContext = createContext<ContactContextValue | null>(null);

export function ContactProvider({children}: {children: ReactNode}) {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations('contact');

  return (
    <ContactContext.Provider value={{open: () => setIsOpen(true)}}>
      {children}
      <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="contact-dialog-overlay fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
          <Dialog.Content className="contact-dialog-content fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border border-white/10 bg-[#08111b] p-5 shadow-premium outline-none sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-[min(92vw,460px)] sm:rounded-2xl sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <Dialog.Title className="text-xl font-semibold tracking-tight text-white">
                  {t('title')}
                </Dialog.Title>
                <Dialog.Description className="mt-2 text-sm leading-6 text-slate-300">
                  {t('subtitle')}
                </Dialog.Description>
              </div>
              <Dialog.Close
                className="rounded-full border border-white/10 p-2 text-slate-300 transition duration-200 ease-out hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                aria-label={t('close')}
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </Dialog.Close>
            </div>

            <div className="grid gap-3">
              {contacts.map((contact) => (
                <ContactLink
                  key={contact.key}
                  href={contact.href}
                  className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition-colors duration-200 ease-out hover:border-gold/50 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  aria-label={t(`options.${contact.key}.aria` as const)}
                >
                  {contact.icon ? (
                    <Image
                      src={contact.icon}
                      alt=""
                      width={44}
                      height={44}
                      className="h-11 w-11 shrink-0"
                    />
                  ) : (
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold text-ink">
                      <PhoneCall aria-hidden="true" className="h-5 w-5" />
                    </span>
                  )}
                  <span>
                    <span className="block font-semibold text-white">
                      {t(`options.${contact.key}.label` as const)}
                    </span>
                    <span className="mt-1 block text-sm text-slate-400 transition duration-200 group-hover:text-slate-300">
                      {t(`options.${contact.key}.hint` as const)}
                    </span>
                  </span>
                </ContactLink>
              ))}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </ContactContext.Provider>
  );
}

type ContactTriggerProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export function ContactTrigger({
  children,
  onClick,
  type = 'button',
  ...props
}: ContactTriggerProps) {
  const context = useContext(ContactContext);

  function openContact() {
    context?.open();
  }

  return (
    <button
      {...props}
      type={type}
      onClick={(event) => {
        onClick?.(event);

        if (!event.defaultPrevented) {
          openContact();
        }
      }}
    >
      {children}
    </button>
  );
}
