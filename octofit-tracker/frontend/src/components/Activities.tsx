import { useApiResource } from '../hooks/useApiResource.js';
import { CapabilityCard } from './CapabilityCard.js';

type Activity = { type: string; minutes: number; points: number };

export default function Activities() {
  const state = useApiResource<{ activities: Activity[] }>('/api/activities');
  return (
    <CapabilityCard
      title="Activities"
      description="Track student activity minutes and points."
      state={state}
      emptyText="No activities have been logged yet."
      items={({ activities }) => activities.map((a) => `${a.type}: ${a.minutes} minutes, ${a.points} points`)}
    />
  );
}
