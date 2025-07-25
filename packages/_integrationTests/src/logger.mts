import { format } from 'node:util';

import { Chalk } from 'chalk';

export const chalk = new Chalk({ level: 1 });

export function log(...params: Parameters<typeof console.log>): void {
    const dt = new Date();
    console.log('%s', `${chalk.cyan(dt.toISOString())} ${format(...params)}`);
}
