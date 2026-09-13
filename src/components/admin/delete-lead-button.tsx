'use client';

import {LoaderCircle, Trash2} from 'lucide-react';
import {useTransition} from 'react';
import {deleteLeadAction} from '@/app/admin/(protected)/leads/actions';

export function DeleteLeadButton({
  leadId,
  requestNumber
}: {
  leadId: string;
  requestNumber: number;
}) {
  const [pending, startTransition] = useTransition();

  function requestDeletion() {
    const confirmed = window.confirm(
      `Delete test request #${requestNumber}? This cannot be undone.`
    );
    if (!confirmed) return;

    startTransition(async () => {
      await deleteLeadAction(leadId);
    });
  }

  return (
    <button
      type="button"
      onClick={requestDeletion}
      disabled={pending}
      className="inline-flex size-9 items-center justify-center rounded-lg border border-red-400/15 bg-red-400/[0.055] text-red-300 transition hover:border-red-300/30 hover:bg-red-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/60 disabled:cursor-wait disabled:opacity-50"
      aria-label={`Delete request #${requestNumber}`}
      title={`Delete request #${requestNumber}`}
    >
      {pending ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <Trash2 className="size-4" aria-hidden="true" />
      )}
    </button>
  );
}
