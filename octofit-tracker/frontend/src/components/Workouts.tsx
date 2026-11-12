import { useApiResource } from '../hooks/useApiResource.js';
import { CapabilityCard } from './CapabilityCard.js';

type Suggestion = { title: string; reason: string };

// Demo user from the seed data; there is no authentication in this exercise.
const demoUserEmail = 'mona@example.com';

export default function Workouts() {
  const state = useApiResource<{ suggestions: Suggestion[] }>(`/api/workouts/suggestions/${encodeURIComponent(demoUserEmail)}`);
  return (
    <CapabilityCard
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      state={state}
      emptyText="No workout suggestions yet."
      items={({ suggestions }) => suggestions.map((s) => `${s.title}: ${s.reason}`)}
    />
  );
}
