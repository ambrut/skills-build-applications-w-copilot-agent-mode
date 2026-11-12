import type { ReactNode } from 'react';
import type { ResourceState } from '../hooks/useApiResource.js';

type Props<T> = {
  title: string;
  description: string;
  state: ResourceState<T>;
  emptyText: string;
  items: (data: T) => ReactNode[];
};

export function CapabilityCard<T>({ title, description, state, emptyText, items }: Props<T>) {
  const rows = state.status === 'success' ? items(state.data) : [];
  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {state.status === 'loading' && <p role="status">Loading {title.toLowerCase()}…</p>}
        {state.status === 'error' && <p role="alert" className="text-danger">Unable to load {title.toLowerCase()}: {state.message}</p>}
        {state.status === 'success' && rows.length === 0 && <p>{emptyText}</p>}
        {rows.length > 0 && <ul className="list-group">{rows.map((row, index) => <li className="list-group-item" key={index}>{row}</li>)}</ul>}
      </div>
    </section>
  );
}
