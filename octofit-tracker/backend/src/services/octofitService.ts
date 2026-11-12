import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

const RECENT_ACTIVITY_LIMIT = 10;
const enduranceTypes = new Set(['run', 'cycle', 'swim', 'walk', 'row']);

function httpError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

function asObjectId(value: unknown, field: string) {
  if (typeof value !== 'string' || !mongoose.isValidObjectId(value) || !/^[a-f\d]{24}$/i.test(value)) {
    throw httpError(400, `${field} must be a valid id`);
  }
  return new mongoose.Types.ObjectId(value);
}

function asRecord(input: unknown) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) throw httpError(400, 'Request body must be an object');
  return input as Record<string, unknown>;
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  const body = asRecord(input);
  const type = typeof body.type === 'string' ? body.type.trim() : '';
  const minutes = body.minutes;
  if (!type) throw httpError(400, 'type is required');
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) throw httpError(400, 'minutes must be a positive number');
  const userId = asObjectId(body.userId, 'userId');
  const teamId = asObjectId(body.teamId, 'teamId');
  const [user, team] = await Promise.all([User.exists({ _id: userId }), Team.exists({ _id: teamId })]);
  if (!user) throw httpError(404, 'User not found');
  if (!team) throw httpError(404, 'Team not found');
  const activity = await Activity.create({ user: userId, team: teamId, type, minutes, points: Math.round(minutes), occurredAt: new Date() });
  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  const body = asRecord(input);
  const members = body.members ?? [];
  if (!Array.isArray(members)) throw httpError(400, 'members must be an array');
  const team = new Team({
    name: body.name,
    mascot: body.mascot,
    members: members.map((member) => asObjectId(member, 'members')),
  });
  const error = team.validateSync();
  if (error) throw httpError(400, error.message);
  await team.save();
  return team.toObject();
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate<{ _id: mongoose.Types.ObjectId; totalPoints: number }>([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
  ]);
  const teams = await Team.find({ _id: { $in: totals.map((total) => total._id) } }).select('name').lean();
  const names = new Map(teams.map((team) => [team._id.toString(), team.name]));
  return totals
    .filter((total) => names.has(total._id.toString()))
    .map((total) => ({ teamName: names.get(total._id.toString()) as string, totalPoints: total.totalPoints }))
    .sort((a, b) => b.totalPoints - a.totalPoints || a.teamName.localeCompare(b.teamName))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

function focusForActivity(type: string) {
  return enduranceTypes.has(type.toLowerCase()) ? 'endurance' : type.toLowerCase();
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).lean();
  if (!user) throw httpError(404, 'User not found');
  const recent = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(RECENT_ACTIVITY_LIMIT).lean();

  const counts = new Map<string, number>();
  for (const activity of recent) counts.set(focusForActivity(activity.type), (counts.get(focusForActivity(activity.type)) ?? 0) + 1);
  const [topFocus] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];
  const focus = topFocus ?? user.fitnessGoal;
  const reason = topFocus
    ? `Your recent activity is mostly ${topFocus}, so this keeps that momentum.`
    : `Matches your ${user.fitnessGoal} goal; log an activity to personalize suggestions.`;

  const workouts = await Workout.find().sort({ title: 1 }).lean();
  const matching = workouts.filter((workout) => workout.focus === focus);
  const others = workouts.filter((workout) => workout.focus !== focus);
  return [
    ...matching.map((workout) => ({ ...workout, reason })),
    ...others.map((workout) => ({ ...workout, reason: `Adds variety beyond your ${focus} focus.` })),
  ];
}

export { User };
