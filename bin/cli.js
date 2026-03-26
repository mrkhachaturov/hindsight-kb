#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8'));
const program = new Command();

program
  .name('hindsight-kb')
  .description('Self-updating vector knowledge base for Hindsight')
  .version(pkg.version);

// Commands will be registered here in Task 12

program.parse();
