import { describe, expect, test, vi } from 'vitest';
import { Uri } from 'vscode';

import type { ClientConfigTargetCSpell, ClientConfigTargetDictionary, ClientConfigTargetVSCode } from './clientConfigTarget.js';
import {
    isClientConfigTargetCSpell,
    isClientConfigTargetDictionary,
    isClientConfigTargetOfKind,
    isClientConfigTargetVSCode,
} from './clientConfigTarget.js';

vi.mock('vscode');
vi.mock('vscode-languageclient/node');

describe('clientConfigTarget', () => {
    const tCSpell: ClientConfigTargetCSpell = {
        name: 'cspell.json',
        kind: 'cspell',
        scope: 'unknown',
        configUri: Uri.parse(import.meta.url),
    };
    const tDict: ClientConfigTargetDictionary = {
        name: 'words.txt',
        kind: 'dictionary',
        scope: 'unknown',
        dictionaryUri: Uri.parse(import.meta.url),
    };
    const tVSCode: ClientConfigTargetVSCode = {
        name: 'user',
        kind: 'vscode',
        scope: 'user',
        docUri: Uri.parse(import.meta.url),
        configScope: undefined,
    };

    test('isClientConfigTargetCSpell', () => {
        expect(isClientConfigTargetCSpell(tCSpell)).toBe(true);
        expect(isClientConfigTargetCSpell(tDict)).toBe(false);
        expect(isClientConfigTargetCSpell(tVSCode)).toBe(false);
    });

    test('isClientConfigTargetDictionary', () => {
        expect(isClientConfigTargetDictionary(tCSpell)).toBe(false);
        expect(isClientConfigTargetDictionary(tDict)).toBe(true);
        expect(isClientConfigTargetDictionary(tVSCode)).toBe(false);
    });

    test('isClientConfigTargetVSCode', () => {
        expect(isClientConfigTargetVSCode(tCSpell)).toBe(false);
        expect(isClientConfigTargetVSCode(tDict)).toBe(false);
        expect(isClientConfigTargetVSCode(tVSCode)).toBe(true);
    });

    test.each`
        kind            | cfg        | expected
        ${'cspell'}     | ${tCSpell} | ${true}
        ${'vscode'}     | ${tCSpell} | ${false}
        ${'dictionary'} | ${tCSpell} | ${false}
        ${'vscode'}     | ${tDict}   | ${false}
        ${'dictionary'} | ${tDict}   | ${true}
        ${'vscode'}     | ${tVSCode} | ${true}
        ${'dictionary'} | ${tVSCode} | ${false}
    `('isClientConfigTargetOfKind $kind $cfg', ({ kind, cfg, expected }) => {
        expect(isClientConfigTargetOfKind(cfg, kind)).toBe(expected);
    });
});
