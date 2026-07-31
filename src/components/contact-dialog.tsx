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
import {contactPhone, contacts} from '@/config/contacts';

type ContactContextValue = {
  open: () => void;
};

type MessengerContact = Exclude<
  (typeof contacts)[number],
  {readonly key: 'phone'}
>;

const ContactContext = createContext<ContactContextValue | null>(null);
const messengerContacts = contacts.filter(
  (contact): contact is MessengerContact => contact.key !== 'phone'
);

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

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {messengerContacts.map((contact) => (
                <ContactLink
                  key={contact.key}
                  href={contact.href}
                  className="group flex min-h-28 flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-2 py-4 text-center transition duration-200 ease-out hover:-translate-y-0.5 hover:border-gold/50 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  aria-label={t(`options.${contact.key}.aria` as const)}
                >
                  <Image
                    src={contact.icon}
                    alt=""
                    width={44}
                    height={44}
                    className="h-11 w-11 shrink-0 transition duration-200 group-hover:scale-105"
                  />
                  <span className="text-sm font-semibold text-white">
                    {t(`options.${contact.key}.label` as const)}
                  </span>
                </ContactLink>
              ))}
              <ContactLink
                href={`tel:${contactPhone.international}`}
                className="col-span-3 flex min-h-14 items-center justify-center gap-3 rounded-2xl border border-gold/25 bg-gold/[0.08] px-4 py-3 text-center transition duration-200 ease-out hover:border-gold/55 hover:bg-gold/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                aria-label={t('options.phone.aria')}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold text-ink">
                  <PhoneCall aria-hidden="true" className="h-4 w-4" />
                </span>
                <span className="font-semibold text-white">
                  {contactPhone.display}
                </span>
              </ContactLink>
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
