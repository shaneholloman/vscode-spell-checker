import { describe, expect, test } from 'vitest';

import type * as server from './server.mjs';
import * as serverSettings from './serverSettings.mjs';

describe('Validate Server Settings', () => {
    test('Tests extracting dictionaries by locale', () => {
        const langSetting: server.LanguageSetting[] = [
            { local: 'en,en-US', languageId: '*', dictionaries: ['English'] },
            { local: 'en', languageId: '*', dictionaries: ['Misc'] },
            { local: 'fr', languageId: '*', dictionaries: ['French'] },
            { local: '*', languageId: 'java', dictionaries: ['Java'] },
        ];

        const locales = serverSettings.extractDictionariesByLocaleLanguageSettings(langSetting);

        expect(locales.get('en')).not.toBeNull();
        expect(locales.get('en-GB')).toBeUndefined();
        expect(locales.get('en-US')).not.toBeNull();
        expect(locales.get('fr')).not.toBeNull();
        expect(locales.get('*')).not.toBeNull();
        expect(locales.get('en')).toEqual(expect.arrayContaining(['English']));
        expect(locales.get('en')).toEqual(expect.arrayContaining(['Misc']));
        expect(locales.get('en-US')).toEqual(expect.not.arrayContaining(['Misc']));
    });
});
