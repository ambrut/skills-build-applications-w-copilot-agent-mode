import { useApiResource } from '../hooks/useApiResource.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = { name: string; mascot?: string; members: unknown[] };

export default function Teams() {
  const state = useApiResource<{ teams: Team[] }>('/api/teams');
  return (
    <CapabilityCard
      title="Teams"
      description="Manage teams and members."
      state={state}
      emptyText="No teams have been created yet."
      items={({ teams }) => teams.map((t) => `${t.name}${t.mascot ? ` (${t.mascot})` : ''}: ${t.members.length} members`)}
    />
  );
}
