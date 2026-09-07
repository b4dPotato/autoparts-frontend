import {z} from 'zod';

export const trackingEventTypes = [
  'page_view',
  'contact_open',
  'phone_click',
  'telegram_click',
  'viber_click',
  'whatsapp_click',
  'form_submit',
  'navigation_click',
  'outbound_click'
] as const;

export type TrackingEventType = (typeof trackingEventTypes)[number];

export const directContactEventTypes = [
  'phone_click',
  'telegram_click',
  'viber_click',
  'whatsapp_click'
] as const satisfies readonly TrackingEventType[];

export const contactEventTypes = [
  ...directContactEventTypes,
  'form_submit'
] as const satisfies readonly TrackingEventType[];

const nullableString = (maximum: number) =>
  z.string().trim().max(maximum).nullable().optional();

const pathSchema = z
  .string()
  .trim()
  .min(1)
  .max(2048)
  .refine((value) => value.startsWith('/'), 'Path must be relative');

export const sessionRequestSchema = z
  .object({
    landingPage: pathSchema,
    referrer: nullableString(2048),
    gclid: nullableString(255),
    gbraid: nullableString(255),
    wbraid: nullableString(255),
    utmSource: nullableString(255),
    utmMedium: nullableString(255),
    utmCampaign: nullableString(512),
    utmTerm: nullableString(512),
    utmContent: nullableString(512)
  })
  .strict();

export const heartbeatRequestSchema = z
  .object({
    activeDurationMs: z.number().int().min(0).max(1000 * 60 * 60 * 24 * 90)
  })
  .strict();

const metadataValueSchema = z.union([
  z.string().max(256),
  z.number().finite(),
  z.boolean(),
  z.null()
]);

const metadataSchema = z
  .record(z.string().min(1).max(64), metadataValueSchema)
  .refine((value) => Object.keys(value).length <= 10, 'Too many metadata keys')
  .refine(
    (value) => JSON.stringify(value).length <= 2048,
    'Metadata is too large'
  );

export const eventRequestSchema = z
  .object({
    type: z.enum(trackingEventTypes),
    path: pathSchema,
    targetType: nullableString(64),
    targetText: nullableString(256),
    targetHref: nullableString(2048),
    targetId: nullableString(128),
    metadata: metadataSchema.nullable().optional()
  })
  .strict();

export type SessionRequest = z.infer<typeof sessionRequestSchema>;
export type HeartbeatRequest = z.infer<typeof heartbeatRequestSchema>;
export type EventRequest = z.infer<typeof eventRequestSchema>;
