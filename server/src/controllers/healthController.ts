import { Request, Response } from 'express';
import { adminClient } from '../config/supabase';

interface Check {
  name: string;
  ok: boolean;
  detail?: string;
}

export async function platformIntegrationHealth(_req: Request, res: Response): Promise<void> {
  const checks: Check[] = [];

  const raw = process.env.TOKEN_ENCRYPTION_KEY;
  if (!raw) {
    checks.push({ name: 'TOKEN_ENCRYPTION_KEY', ok: false, detail: 'unset' });
  } else {
    const len = Buffer.from(raw, 'base64').length;
    checks.push({ name: 'TOKEN_ENCRYPTION_KEY', ok: len === 32, detail: `${len} bytes` });
  }

  const counts: Record<string, number | string> = {};
  for (const table of ['creator_platform_accounts', 'creator_platform_metrics', 'creator_platform_metric_history']) {
    const { error, count } = await adminClient
      .from(table)
      .select('*', { count: 'exact', head: true });
    if (error) {
      checks.push({ name: `table:${table}`, ok: false, detail: error.message });
      counts[table] = 'error';
    } else {
      checks.push({ name: `table:${table}`, ok: true });
      counts[table] = count ?? 0;
    }
  }

  const { data: byPlatform, error: bpErr } = await adminClient
    .from('creator_platform_accounts')
    .select('platform')
    .is('deleted_at', null);
  const accountsByPlatform: Record<string, number> = { instagram: 0, youtube: 0 };
  if (!bpErr && byPlatform) {
    for (const row of byPlatform as Array<{ platform: string }>) {
      accountsByPlatform[row.platform] = (accountsByPlatform[row.platform] ?? 0) + 1;
    }
  }

  const allOk = checks.every((c) => c.ok);
  res.status(allOk ? 200 : 503).json({
    ok: allOk,
    checks,
    counts,
    accountsByPlatform,
    timestamp: new Date().toISOString(),
  });
}
