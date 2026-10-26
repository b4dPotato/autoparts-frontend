import {z} from 'zod';

export const promotionTextSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    vehicle: z.string().trim().min(1).max(160),
    condition: z.string().trim().min(1).max(240),
    transmission: z.string().trim().min(1).max(240),
    included: z.string().trim().min(1).max(2000),
    engine: z.string().trim().min(1).max(120),
    terms: z.string().trim().min(1).max(500),
  })
  .strict();
export const promotionSchema = z
  .object({
    id: z.literal('featured-parts'),
    enabled: z.boolean(),
    mileage: z.string().trim().min(1).max(40),
    ecu: z.string().trim().min(1).max(120),
    image: z
      .string()
      .max(700000)
      .refine(
        (value) =>
          !value ||
          /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value),
        'Use a PNG, JPEG or WebP image',
      ),
    content: z
      .object({
        uk: promotionTextSchema,
        ru: promotionTextSchema,
        en: promotionTextSchema,
      })
      .strict(),
  })
  .strict();
export type Promotion = z.infer<typeof promotionSchema>;
