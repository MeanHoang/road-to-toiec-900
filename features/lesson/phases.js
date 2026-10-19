/** Older lessons predate phases and belong to Phase 1. */
export const phaseOf = (day) => day.phase ?? 1;

export function lessonPhases(days) {
  const groups = new Map();
  for (const day of days) {
    const phase = phaseOf(day);
    if (!groups.has(phase)) groups.set(phase, []);
    groups.get(phase).push(day);
  }
  return [...groups].sort(([a], [b]) => a - b).map(([phase, lessons]) => ({
    phase,
    days: [...lessons].sort((a, b) => a.no - b.no),
  }));
}
