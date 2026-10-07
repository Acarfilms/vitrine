#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { ConfigError } from './config.js';
import { run } from './run.js';

const HELP = `Liquid Glass cards for your GitHub profile README.

Usage
  vitrine [--config <file>] [--out <folder>] [--readme <file>] [--snippet]

Options
  -c, --config   Config file. Default: vitrine.yml
  -o, --out      Folder the SVG files are written to. Default: vitrine
  -r, --readme   README the cards go in, used to work out image paths. Default: README.md
  -s, --snippet  Print the README markup instead of the list of files
  -h, --help     Show this message
  -v, --version  Print the version

The activity card needs GITHUB_TOKEN. Outside GitHub Actions, also set
"login" in the config so Vitrine knows whose calendar to read.`;

const OPTIONS = {
  config: { type: 'string', short: 'c', default: 'vitrine.yml' },
  out: { type: 'string', short: 'o', default: 'vitrine' },
  readme: { type: 'string', short: 'r', default: 'README.md' },
  snippet: { type: 'boolean', short: 's', default: false },
  help: { type: 'boolean', short: 'h', default: false },
  version: { type: 'boolean', short: 'v', default: false },
};

async function main() {
  const { values: options } = parseArgs({ options: OPTIONS });
  if (options.version) {
    const { version } = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
    console.log(version);
    return;
  }
  if (options.help) {
    console.log(HELP);
    return;
  }

  const { cards, removed, markup } = await run({
    config: options.config,
    out: options.out,
    readme: options.readme,
    token: process.env.GITHUB_TOKEN,
    owner: process.env.GITHUB_REPOSITORY_OWNER,
  });

  if (options.snippet) {
    process.stdout.write(markup);
    return;
  }
  for (const { file, svg } of cards) console.log(`${join(options.out, file)}  ${Math.ceil(Buffer.byteLength(svg) / 1024)} KB`);
  for (const file of removed) console.log(`${join(options.out, file)}  removed`);
}

main().catch((error) => {
  if (error.code?.startsWith('ERR_PARSE_ARGS')) {
    console.error(`${error.message}\nRun vitrine --help to see the options.`);
  } else {
    console.error(error instanceof ConfigError ? error.message : error);
  }
  process.exitCode = 1;
});
