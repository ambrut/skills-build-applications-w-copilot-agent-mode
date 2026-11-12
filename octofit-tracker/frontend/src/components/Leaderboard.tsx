import { useApiResource } from '../hooks/useApiResource.js';
import { CapabilityCard } from './CapabilityCard.js';

type Entry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const state = useApiResource<{ leaderboard: Entry[] }>('/api/leaderboard');
  return (
    <CapabilityCard
      title="Leaderboard"
      description="Compare team point totals."
      state={state}
      emptyText="No leaderboard scores yet."
      items={({ leaderboard }) => leaderboard.map((e) => `#${e.rank} ${e.teamName}: ${e.totalPoints} points`)}
    />
  );
}
