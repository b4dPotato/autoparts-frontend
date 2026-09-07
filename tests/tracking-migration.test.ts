import {readdir, readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {PGlite} from '@electric-sql/pglite';
import {afterAll, beforeAll, describe, expect, it} from 'vitest';

describe('tracking migration', () => {
  const database = new PGlite();

  beforeAll(async () => {
    const migrationDirectory = resolve(process.cwd(), 'drizzle');
    const migrations = (await readdir(migrationDirectory))
      .filter((name) => name.endsWith('.sql'))
      .sort();
    for (const migrationName of migrations) {
      const migration = await readFile(resolve(migrationDirectory, migrationName), 'utf8');
      await database.exec(migration.replaceAll('--> statement-breakpoint', ''));
    }
  });

  afterAll(async () => {
    await database.close();
  });

  it('creates the three tracking tables on a clean PostgreSQL database', async () => {
    const result = await database.query<{table_name: string}>(`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_name like 'tracking_%'
      order by table_name
    `);

    expect(result.rows.map((row) => row.table_name)).toEqual([
      'tracking_events',
      'tracking_sessions',
      'tracking_visitors'
    ]);
  });

  it('creates the leads table', async () => {
    const result = await database.query<{table_name: string}>(`
      select table_name
      from information_schema.tables
      where table_schema = 'public' and table_name = 'leads'
    `);

    expect(result.rows.map((row) => row.table_name)).toEqual([
      'leads'
    ]);
  });

  it('creates and seeds the persistent lead email feature flag as disabled', async () => {
    const result = await database.query<{name: string; enabled: boolean}>(`
      select name, enabled from feature_flags
      where name = 'leadEmailNotifications'
    `);

    expect(result.rows).toEqual([
      {name: 'leadEmailNotifications', enabled: false}
    ]);
  });

  it('stores lead attribution, relations, and email delivery state', async () => {
    const result = await database.query<{column_name: string}>(`
      select column_name
      from information_schema.columns
      where table_schema = 'public' and table_name = 'leads'
    `);
    const columns = result.rows.map((row) => row.column_name);

    expect(columns).toEqual(
      expect.arrayContaining([
        'visitor_id',
        'session_id',
        'contact_method',
        'gclid',
        'gbraid',
        'wbraid',
        'email_status',
        'email_provider_message_id',
        'email_error',
        'email_attempted_at',
        'email_sent_at'
      ])
    );
  });

  it('enforces visitor and session cascade relationships', async () => {
    const visitorId = '10000000-0000-4000-8000-000000000001';
    const sessionId = '20000000-0000-4000-8000-000000000002';
    const eventId = '30000000-0000-4000-8000-000000000003';

    await database.query('insert into tracking_visitors (id) values ($1)', [
      visitorId
    ]);
    await database.query(
      'insert into tracking_sessions (id, visitor_id, landing_page) values ($1, $2, $3)',
      [sessionId, visitorId, '/uk']
    );
    await database.query(
      'insert into tracking_events (id, session_id, type, path) values ($1, $2, $3, $4)',
      [eventId, sessionId, 'page_view', '/uk']
    );
    await database.query('delete from tracking_visitors where id = $1', [visitorId]);

    const sessions = await database.query<{count: number}>(
      'select count(*)::int as count from tracking_sessions'
    );
    const events = await database.query<{count: number}>(
      'select count(*)::int as count from tracking_events'
    );

    expect(sessions.rows[0]?.count).toBe(0);
    expect(events.rows[0]?.count).toBe(0);
  });

  it('creates the composite dashboard indexes', async () => {
    const result = await database.query<{indexname: string}>(`
      select indexname from pg_indexes
      where indexname in (
        'tracking_sessions_started_at_id_idx',
        'tracking_sessions_visitor_started_at_idx',
        'tracking_sessions_ip_started_at_idx',
        'tracking_events_session_created_at_idx',
        'tracking_events_type_created_at_idx'
      )
      order by indexname
    `);
    expect(result.rows).toHaveLength(5);
  });
});
