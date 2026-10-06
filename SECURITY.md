# Security policy

## Supported versions

Security fixes go into the latest release, and the `v1` tag moves with it. If you pin a specific version such as `v1.0.1`, update to the latest one to get them.

## Reporting a vulnerability

Please report vulnerabilities privately, not in a public issue. Use **[Report a vulnerability](https://github.com/Acarfilms/vitrine/security/advisories/new)** in the Security tab.

Include what you found, how to reproduce it and what an attacker could do with it. You'll get a reply within a week. Once a fix is released, the advisory is published with credit to you, unless you'd rather stay anonymous.

## What's in scope

Vitrine runs in its users' repositories with a token that can write to them, so these matter most:

- Anything that lets a `vitrine.yml` write files outside the output folder, or commit something other than the cards.
- Ways for config content to inject markup or scripts into the SVG files or the README snippet.
- Leaks of the workflow token in logs, files or commits.
- Problems in the published bundle (`dist/`) or its dependencies.
