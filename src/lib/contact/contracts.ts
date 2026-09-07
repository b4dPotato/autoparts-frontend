import {z} from 'zod';

export const contactMethods = [
  'phone',
  'telegram',
  'viber',
  'whatsapp'
] as const;

export type ContactMethod = (typeof contactMethods)[number];

const vinSchema = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .pipe(
    z
      .string()
      .length(17)
      .regex(/^[A-HJ-NPR-Z0-9]+$/)
  );

const pagePathSchema = z
  .string()
  .trim()
  .min(1)
  .max(2048)
  .refine((value) => value.startsWith('/') && !value.startsWith('//'));

export const contactRequestSchema = z
  .object({
    vin: vinSchema,
    preferredContact: z.enum(contactMethods),
    contactValue: z.string().trim().min(3).max(128),
    description: z.string().trim().max(1000).nullable(),
    locale: z.enum(['uk', 'ru', 'en']),
    path: pagePathSchema
  })
  .strict()
  .superRefine((value, context) => {
    if (value.preferredContact !== 'phone') return;

    const digits = value.contactValue.replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 15) {
      context.addIssue({
        code: 'custom',
        path: ['contactValue'],
        message: 'Invalid phone number'
      });
    }
  });

export type ContactRequestInput = z.infer<typeof contactRequestSchema>;
