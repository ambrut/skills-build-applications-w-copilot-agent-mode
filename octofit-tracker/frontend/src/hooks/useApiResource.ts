import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

export type ResourceState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: T };

export function useApiResource<T>(path: string): ResourceState<T> {
  const [state, setState] = useState<ResourceState<T>>({ status: 'loading' });
  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    getJson<T>(path)
      .then((data) => { if (!cancelled) setState({ status: 'success', data }); })
      .catch((error: unknown) => {
        if (!cancelled) setState({ status: 'error', message: error instanceof Error ? error.message : 'Unknown error' });
      });
    return () => { cancelled = true; };
  }, [path]);
  return state;
}
