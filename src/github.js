const QUERY = `query ($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount } }
      }
    }
  }
}`;

// The calendar is the same one drawn on the profile page, so private contributions are
// included (as plain counts) only when the user has turned that on in their settings.
export async function fetchCalendar(login, token) {
  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'vitrine',
    },
    body: JSON.stringify({ query: QUERY, variables: { login } }),
  });

  const payload = await response.json().catch(() => ({}));
  if (payload.errors?.some((error) => error.type === 'NOT_FOUND')) {
    throw new Error(`"${login}" is not a personal GitHub account. The activity card only works for people, not organizations.`);
  }
  const calendar = payload.data?.user?.contributionsCollection?.contributionCalendar;
  if (!response.ok || !calendar) {
    const reason = payload.errors?.map((error) => error.message).join('; ') ?? `HTTP ${response.status}`;
    throw new Error(`Could not read the contribution calendar for "${login}": ${reason}`);
  }
  return calendar;
}

export function summarize(calendar) {
  const days = calendar.weeks.flatMap((week) => week.contributionDays);

  let longestStreak = 0;
  let run = 0;
  for (const day of days) {
    run = day.contributionCount > 0 ? run + 1 : 0;
    longestStreak = Math.max(longestStreak, run);
  }

  // The last day is today and may still get contributions, so a streak that ended yesterday still counts.
  let currentStreak = 0;
  let i = days.length - 1;
  if (days[i]?.contributionCount === 0) i -= 1;
  for (; i >= 0 && days[i].contributionCount > 0; i -= 1) currentStreak += 1;

  return {
    total: calendar.totalContributions,
    activeDays: days.filter((day) => day.contributionCount > 0).length,
    currentStreak,
    longestStreak,
    weeks: calendar.weeks.map((week) => ({
      start: week.contributionDays[0].date,
      count: week.contributionDays.reduce((sum, day) => sum + day.contributionCount, 0),
    })),
  };
}
