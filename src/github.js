const CALENDAR = `query ($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount } }
      }
    }
  }
}`;

const REPOSITORY = `query ($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    nameWithOwner
    description
    stargazerCount
    forkCount
    isPrivate
    primaryLanguage { name color }
  }
}`;

async function graphql(query, variables, token) {
  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'vitrine',
    },
    body: JSON.stringify({ query, variables }),
  });
  const payload = await response.json().catch(() => ({}));
  const notFound = payload.errors?.some((error) => error.type === 'NOT_FOUND') ?? false;
  const reason = payload.errors?.map((error) => error.message).join('; ') ?? `HTTP ${response.status}`;
  return { ok: response.ok, data: payload.data, notFound, reason };
}

// The calendar is the same one drawn on the profile page, so private contributions are
// included (as plain counts) only when the user has turned that on in their settings.
export async function fetchCalendar(login, token) {
  const { ok, data, notFound, reason } = await graphql(CALENDAR, { login }, token);
  if (notFound) {
    throw new Error(`"${login}" is not a personal GitHub account. The activity card only works for people, not organizations.`);
  }
  const calendar = data?.user?.contributionsCollection?.contributionCalendar;
  if (!ok || !calendar) throw new Error(`Could not read the contribution calendar for "${login}": ${reason}`);
  return calendar;
}

// A private repository is refused rather than shown: the card would put its name and
// description on a public profile, which is easy to do by accident with a broad token.
export async function fetchRepository(fullName, token) {
  const [owner, name] = fullName.split('/');
  const { ok, data, notFound, reason } = await graphql(REPOSITORY, { owner, name }, token);
  if (notFound) {
    throw new Error(`Could not find the repository "${fullName}". Check its name. The workflow's token can read public repositories and its own.`);
  }
  const repository = data?.repository;
  if (!ok || !repository) throw new Error(`Could not read the repository "${fullName}": ${reason}`);
  if (repository.isPrivate) {
    throw new Error(`"${fullName}" is private. The featured card would show its name and description on your profile, so only public repositories can be featured.`);
  }
  return {
    name: repository.nameWithOwner,
    description: repository.description?.trim() || null,
    stars: repository.stargazerCount,
    forks: repository.forkCount,
    language: repository.primaryLanguage,
  };
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
