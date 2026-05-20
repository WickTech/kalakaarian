import { adminClient } from '../config/supabase';
import type { Job } from './types';

// Supabase DAO for the job queue.

export interface NewJobRow {
  type: string;
  payload: Record<string, unknown>;
  run_after: string;
  max_attempts: number;
  idempotency_key: string | null;
}

export async function enqueue(row: NewJobRow): Promise<void> {
  if (row.idempotency_key) {
    // Second enqueue with the same key is silently ignored.
    const { error } = await adminClient
      .from('jobs')
      .upsert(row, { onConflict: 'idempotency_key', ignoreDuplicates: true });
    if (error) throw error;
    return;
  }
  const { error } = await adminClient.from('jobs').insert(row);
  if (error) throw error;
}

// Atomically claims up to `limit` due jobs (status -> 'processing', attempts++).
export async function claimJobs(limit: number): Promise<Job[]> {
  const { data, error } = await adminClient.rpc('claim_jobs', { p_limit: limit });
  if (error) throw error;
  return (data ?? []) as Job[];
}

export async function completeJob(id: string): Promise<void> {
  await adminClient
    .from('jobs')
    .update({ status: 'completed', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id);
}

// Returns the job to the queue for a later retry.
export async function rescheduleJob(id: string, runAfter: Date, error: string): Promise<void> {
  await adminClient
    .from('jobs')
    .update({
      status: 'pending',
      run_after: runAfter.toISOString(),
      last_error: error,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
}

// Marks the job permanently failed (max attempts exhausted, or no handler).
export async function failJob(id: string, error: string): Promise<void> {
  await adminClient
    .from('jobs')
    .update({ status: 'failed', last_error: error, updated_at: new Date().toISOString() })
    .eq('id', id);
}
