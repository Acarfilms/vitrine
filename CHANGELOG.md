# Changelog

## 1.2.0 (2026-10-08)

- A featured card shows one of your repositories the way GitHub lists it: name, description, main language, stars and forks. It links to the repository from the README.
- Three more accents: `red`, `yellow` and `mint`.

## 1.1.1 (2026-10-07)

- The action no longer fails when the branch gets a new commit while it runs, for example when GitHub starts two runs for the same push. It puts its cards on top of the new commits and pushes again.

## 1.1.0 (2026-10-07)

- The CLI supports `--version` (or `-v`) to print the package version and exit.
- Link buttons accept `mailto:` URLs for email links.
- Hero widgets and link buttons can use the `mail` symbol.
- A `language` option translates the activity card and the default card titles into Spanish, French, German or Portuguese, and formats numbers the local way.

## 1.0.1 (2026-10-02)

- The action is listed as "Vitrine Profile Cards", since GitHub Marketplace names can't match an existing GitHub account.

## 1.0.0 (2026-10-02)

First release.

- Hero, expertise, tech specs, activity and link cards. The themed ones come in light and dark.
- Three wallpapers (`tide`, `dusk`, `graphite`) and seven accent colors.
- A GitHub Action that renders the cards, removes stale ones, commits the result and writes the README markup to the run summary.
- A `vitrine` command for rendering locally.
