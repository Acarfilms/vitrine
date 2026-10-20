const ACTIVITY = `query ($login: String!, $since: GitTimestamp) {
  repositoryOwner(login: $login) {
    __typename
    ... on User {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks { contributionDays { date contributionCount } }
        }
      }
    }
    ... on Organization {
      membersWithRole {
        totalCount
      }
      repositories(first: 20, isFork: false, privacy: PUBLIC, orderBy: {field: PUSHED_AT, direction: DESC}) {
        nodes {
          defaultBranchRef {
            target {
              ... on Commit {
                history(since: $since) {
                  totalCount
                }
              }
            }
          }
          releases {
            totalCount
          }
          pullRequests(states: MERGED) {
            totalCount
          }
        }
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

// Auto-detects whether the account is a personal User or an Organization:
// - A User returns their personal contribution calendar.
// - An Organization aggregates commits, releases, members and merged PRs across top 20 public repos.
export async function fetchActivity(login, token) {
  const since = new Date(Date.now() - 365 * 86_400_000).toISOString();
  const { ok, data, notFound, reason } = await graphql(ACTIVITY, { login, since }, token);
  const owner = data?.repositoryOwner;
  if (notFound || (ok && !owner)) {
    throw new Error(`Could not find the account "${login}". Check that the user or organization exists.`);
  }
  if (!ok || !owner) throw new Error(`Could not read activity for "${login}": ${reason}`);

  if (owner.__typename === 'Organization') {
    const repos = owner.repositories?.nodes ?? [];
    return {
      type: 'organization',
      commits: repos.reduce((sum, r) => sum + (r.defaultBranchRef?.target?.history?.totalCount ?? 0), 0),
      releases: repos.reduce((sum, r) => sum + (r.releases?.totalCount ?? 0), 0),
      contributors: owner.membersWithRole?.totalCount ?? 0,
      mergedPRs: repos.reduce((sum, r) => sum + (r.pullRequests?.totalCount ?? 0), 0),
    };
  }

  const calendar = owner.contributionsCollection?.contributionCalendar;
  if (!calendar) throw new Error(`Could not read the contribution calendar for "${login}": ${reason}`);
  return {
    type: 'user',
    ...calendar,
  };
}

export const fetchCalendar = fetchActivity;

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

export function summarize(activity) {
  if (activity.type === 'organization') {
    return activity;
  }

  const calendar = activity;
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
    type: 'user',
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
