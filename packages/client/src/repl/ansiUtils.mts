import type { Direction } from 'node:tty';

import ansiEscapes from 'ansi-escapes';
import type { ColorName, ModifierName } from 'ansi-styles';
import styles, { colorNames, modifierNames } from 'ansi-styles';

const colorFns = [...colorNames, ...modifierNames].map((name) => [name, (text: string) => styles[name].open + text + styles[name].close]);

type ColorMethods = Record<ColorName | ModifierName, (t: string) => string>;

export const colors: ColorMethods = Object.fromEntries(colorFns) as ColorMethods;

export function green(text: string): string {
    return styles.green.open + text + styles.green.close;
}

export function red(text: string): string {
    return styles.red.open + text + styles.red.close;
}

export function yellow(text: string): string {
    return styles.yellow.open + text + styles.yellow.close;
}

export function crlf(text: string): string {
    return text.replace(/\n/g, '\r\n').replace(/\r+\r/g, '\r');
}

export function dim(text: string): string {
    return styles.dim.open + text + styles.dim.close;
}

export type ColorFn = (text: string) => string;

export function combine(fn: ColorFn, ...fns: ColorFn[]): ColorFn {
    return (text) => fns.reduce((acc, f) => f(acc), fn(text));
}

export function clearScreen() {
    return ansiEscapes.clearScreen;
}

export function clearLine(dir: Direction) {
    return dir > 0 ? ansiEscapes.eraseEndLine : dir < 0 ? ansiEscapes.eraseStartLine : ansiEscapes.eraseLine;
}

export function clearDown() {
    return ansiEscapes.eraseDown;
}

export function moveCursor(dx: number, dy?: number | undefined) {
    return ansiEscapes.cursorMove(dx, dy);
}

export function cursorTo(x: number, y?: number | undefined) {
    return ansiEscapes.cursorTo(x, y);
}

export function eraseLines(n: number) {
    return ansiEscapes.eraseLines(n);
}

export function eraseLine() {
    return ansiEscapes.eraseLine + '\r';
}
