import { useEffect, useState } from 'react';

export type GatewayStatus = 'loading' | 'ready' | 'offline';

export interface GatewayModels {
  models: Array<{ id: string }>;
  status: GatewayStatus;
}

/** Daftar model dinamis dari 9Router (endpoint & bentuk data sama seperti versi lama). */
export function useGatewayModels(): GatewayModels {
  const [models, setModels] = useState<Array<{ id: string }>>([]);
  const [status, setStatus] = useState<GatewayStatus>('loading');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/gateway/models')
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.models?.length) {
          setModels(data.models);
          setStatus('ready');
        } else {
          setStatus('offline');
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('offline');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { models, status };
}
