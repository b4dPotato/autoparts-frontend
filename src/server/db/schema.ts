import {
  bigint,
  bigserial,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  timestamp,
  uuid,
  varchar
} from 'drizzle-orm/pg-core';

export type TrackingMetadataValue = string | number | boolean | null;
export type TrackingMetadata = Record<string, TrackingMetadataValue>;

export const visitors = pgTable(
  'tracking_visitors',
  {
    id: uuid('id').primaryKey(),
    createdAt: timestamp('created_at', {withTimezone: true}).notNull().defaultNow(),
    lastSeenAt: timestamp('last_seen_at', {withTimezone: true}).notNull().defaultNow(),
    sessionsCount: integer('sessions_count').notNull().default(0)
  },
  (table) => [index('tracking_visitors_created_at_idx').on(table.createdAt)]
);

export const sessions = pgTable(
  'tracking_sessions',
  {
    id: uuid('id').primaryKey(),
    visitorId: uuid('visitor_id')
      .notNull()
      .references(() => visitors.id, {onDelete: 'cascade'}),
    startedAt: timestamp('started_at', {withTimezone: true}).notNull().defaultNow(),
    lastActivityAt: timestamp('last_activity_at', {withTimezone: true})
      .notNull()
      .defaultNow(),
    endedAt: timestamp('ended_at', {withTimezone: true}),
    durationMs: bigint('duration_ms', {mode: 'number'}).notNull().default(0),
    activeDurationMs: bigint('active_duration_ms', {mode: 'number'})
      .notNull()
      .default(0),
    ip: varchar('ip', {length: 64}),
    userAgent: varchar('user_agent', {length: 512}),
    acceptLanguage: varchar('accept_language', {length: 256}),
    landingPage: varchar('landing_page', {length: 2048}).notNull(),
    referrer: varchar('referrer', {length: 2048}),
    gclid: varchar('gclid', {length: 255}),
    gbraid: varchar('gbraid', {length: 255}),
    wbraid: varchar('wbraid', {length: 255}),
    utmSource: varchar('utm_source', {length: 255}),
    utmMedium: varchar('utm_medium', {length: 255}),
    utmCampaign: varchar('utm_campaign', {length: 512}),
    utmTerm: varchar('utm_term', {length: 512}),
    utmContent: varchar('utm_content', {length: 512}),
    pageViews: integer('page_views').notNull().default(0),
    clickCount: integer('click_count').notNull().default(0),
    eventCount: integer('event_count').notNull().default(0),
    converted: boolean('converted').notNull().default(false),
    conversionType: varchar('conversion_type', {length: 64}),
    botStatus: varchar('bot_status', {length: 32}),
    botScore: real('bot_score'),
    botReasons: jsonb('bot_reasons').$type<string[]>(),
    createdAt: timestamp('created_at', {withTimezone: true}).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', {withTimezone: true}).notNull().defaultNow()
  },
  (table) => [
    index('tracking_sessions_visitor_id_idx').on(table.visitorId),
    index('tracking_sessions_created_at_idx').on(table.createdAt),
    index('tracking_sessions_last_activity_at_idx').on(table.lastActivityAt),
    index('tracking_sessions_ip_idx').on(table.ip),
    index('tracking_sessions_gclid_idx').on(table.gclid),
    index('tracking_sessions_started_at_id_idx').on(
      table.startedAt.desc(),
      table.id
    ),
    index('tracking_sessions_visitor_started_at_idx').on(
      table.visitorId,
      table.startedAt.desc()
    ),
    index('tracking_sessions_ip_started_at_idx').on(
      table.ip,
      table.startedAt.desc()
    )
  ]
);

export const trackingEvents = pgTable(
  'tracking_events',
  {
    id: uuid('id').primaryKey(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => sessions.id, {onDelete: 'cascade'}),
    type: varchar('type', {length: 64}).notNull(),
    path: varchar('path', {length: 2048}).notNull(),
    targetType: varchar('target_type', {length: 64}),
    targetText: varchar('target_text', {length: 256}),
    targetHref: varchar('target_href', {length: 2048}),
    targetId: varchar('target_id', {length: 128}),
    metadata: jsonb('metadata').$type<TrackingMetadata>(),
    createdAt: timestamp('created_at', {withTimezone: true}).notNull().defaultNow()
  },
  (table) => [
    index('tracking_events_session_id_idx').on(table.sessionId),
    index('tracking_events_created_at_idx').on(table.createdAt),
    index('tracking_events_type_idx').on(table.type),
    index('tracking_events_session_created_at_idx').on(
      table.sessionId,
      table.createdAt
    ),
    index('tracking_events_type_created_at_idx').on(
      table.type,
      table.createdAt
    )
  ]
);

export const leads = pgTable(
  'leads',
  {
    id: uuid('id').primaryKey(),
    requestNumber: bigserial('request_number', {mode: 'number'})
      .notNull()
      .unique(),
    visitorId: uuid('visitor_id').references(() => visitors.id, {
      onDelete: 'set null'
    }),
    sessionId: uuid('session_id').references(() => sessions.id, {
      onDelete: 'set null'
    }),
    vin: varchar('vin', {length: 17}).notNull(),
    contactMethod: varchar('contact_method', {length: 16}).notNull(),
    contactValue: varchar('contact_value', {length: 128}).notNull(),
    description: varchar('description', {length: 1000}),
    locale: varchar('locale', {length: 5}).notNull(),
    pagePath: varchar('page_path', {length: 2048}).notNull(),
    attributionSource: varchar('attribution_source', {length: 32})
      .notNull()
      .default('direct'),
    gclid: varchar('gclid', {length: 255}),
    gbraid: varchar('gbraid', {length: 255}),
    wbraid: varchar('wbraid', {length: 255}),
    status: varchar('status', {length: 32}).notNull().default('new'),
    emailStatus: varchar('email_status', {length: 32})
      .notNull()
      .default('disabled'),
    emailProviderMessageId: varchar('email_provider_message_id', {length: 255}),
    emailError: varchar('email_error', {length: 512}),
    emailAttemptedAt: timestamp('email_attempted_at', {withTimezone: true}),
    emailSentAt: timestamp('email_sent_at', {withTimezone: true}),
    createdAt: timestamp('created_at', {withTimezone: true}).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', {withTimezone: true}).notNull().defaultNow()
  },
  (table) => [
    index('leads_visitor_id_idx').on(table.visitorId),
    index('leads_session_id_idx').on(table.sessionId),
    index('leads_created_at_idx').on(table.createdAt),
    index('leads_status_created_at_idx').on(
      table.status,
      table.createdAt.desc()
    ),
    index('leads_email_status_created_at_idx').on(
      table.emailStatus,
      table.createdAt.desc()
    ),
    index('leads_gclid_idx').on(table.gclid)
  ]
);

export const featureFlags = pgTable('feature_flags', {
  name: varchar('name', {length: 64}).primaryKey(),
  enabled: boolean('enabled').notNull().default(false),
  updatedAt: timestamp('updated_at', {withTimezone: true}).notNull().defaultNow()
});

export type Visitor = typeof visitors.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type TrackingEvent = typeof trackingEvents.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type FeatureFlag = typeof featureFlags.$inferSelect;
