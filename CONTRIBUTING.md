# Contributing to Vitrine

Thanks for taking the time. Bug reports, ideas and pull requests are all welcome. If you're not sure where to start, look for issues labeled [`good first issue`](https://github.com/Acarfilms/vitrine/labels/good%20first%20issue). For questions or to show off your profile, use [Discussions](https://github.com/Acarfilms/vitrine/discussions).

## Setup

You need Node 22 or later.

```sh
git clone https://github.com/<you>/vitrine.git
cd vitrine
npm ci
npm test
```

## Seeing your changes

Render the example config into a scratch folder and open the SVG files in a browser:

```sh
node src/cli.js --config examples/vitrine.yml --out out
```

Without a token, the activity card is skipped with a warning. To include it, pass one:

```sh
GITHUB_TOKEN=$(gh auth token) node src/cli.js --config examples/vitrine.yml --out out
```

Check both themes when you touch a themed card. Open the `-light` and `-dark` files side by side, or switch your system appearance.

## Where things live

| Path | |
| --- | --- |
| `src/config.js` | Reads `vitrine.yml`, validates it and fills in defaults. Every error message points at the exact key. |
| `src/render/cards/` | One file per card. |
| `src/render/glass.js` | The glass panes. The README explains how they work. |
| `src/render/icons.js` | Simple Icons lookup and the built-in line symbols. |
| `src/render/theme.js` | Light and dark colors, and the accents. |
| `src/render/wallpaper.js` | The wallpapers. |
| `src/run.js` | Renders the cards, writes the files and removes stale ones. Shared by the CLI and the action. |
| `src/action.js`, `src/cli.js` | The two entry points. |
| `src/commit.js` | Commits and pushes the cards from the action, and tries again if the branch moved. |
| `test/` | Tests, run with `node --test`. |

## Before you open a pull request

- **Add or update a test** for any change in behavior.
- **Rebuild the bundle.** The action runs from `dist/index.js`, so run `npm run build` and commit `dist/`. CI fails if the bundle doesn't match the source.
- **Update the docs.** If you change how something looks, run `npm run docs` to refresh the images in `docs/`. If you add an option, document it in the README. Add a line to `CHANGELOG.md` under an `Unreleased` heading.
- **Keep it small.** One change per pull request is easier to review and quicker to merge.
- **Ask before adding a dependency.** Every runtime dependency ends up in the bundle that users download on each run.

Pull requests are squash-merged, so don't worry about tidying up your commits.

## Reporting bugs

Open an issue with the bug report template. The most useful thing you can include is the smallest `vitrine.yml` that shows the problem.

## Security

Please don't report vulnerabilities in public issues. See [SECURITY.md](SECURITY.md).

## Code of conduct

This project follows a [code of conduct](CODE_OF_CONDUCT.md). By taking part, you agree to it.
