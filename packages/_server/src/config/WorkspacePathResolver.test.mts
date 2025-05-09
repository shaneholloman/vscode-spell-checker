import { homedir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { logError } from '@internal/common-utils/log';
import * as Path from 'path';
import { describe, expect, type Mock, test, vi } from 'vitest';
import type { WorkspaceFolder } from 'vscode-languageserver/node.js';
import { URI as Uri } from 'vscode-uri';

import type { CSpellUserAndExtensionSettings, CustomDictionaries } from './cspellConfig/index.mjs';
import { normalizeWindowsRoot, normalizeWindowsUrl, toDirURL, uriToGlobRoot } from './urlUtil.mjs';
import { createWorkspaceNamesResolver, debugExports, resolveSettings } from './WorkspacePathResolver.mjs';

vi.mock('vscode-languageserver/node');
vi.mock('./vscode.config');
vi.mock('@internal/common-utils/log');

const mockLogError = logError as Mock;

const cspellConfigInVsCode: CSpellUserAndExtensionSettings = {
    ignorePaths: ['${workspaceFolder:_server}/**/*.json'],
    import: [
        '${workspaceFolder:_server}/sampleSourceFiles/overrides/cspell.json',
        '${workspaceFolder:_server}/sampleSourceFiles/cSpell.json',
    ],
    enabledLanguageIds: ['typescript', 'javascript', 'php', 'json', 'jsonc'],
};

const cspellConfigCustomUserDictionary: CSpellUserAndExtensionSettings = {
    customUserDictionaries: [
        {
            name: 'Global Dictionary',
            path: '~/words.txt',
            addWords: true,
        },
    ],
};

const cspellConfigCustomWorkspaceDictionary: CSpellUserAndExtensionSettings = {
    customWorkspaceDictionaries: [
        {
            name: 'Workspace Dictionary',
            path: '${workspaceFolder:Server}/sampleSourceFiles/words.txt',
            addWords: true,
        },
        {
            name: 'Project Dictionary',
            addWords: true,
        },
    ],
};

const cspellConfigCustomFolderDictionary: CSpellUserAndExtensionSettings = {
    customFolderDictionaries: [
        {
            name: 'Folder Dictionary',
            path: './packages/_server/words.txt',
            addWords: true,
        },
        {
            name: 'Root Dictionary',
            path: '${workspaceRoot}/words2.txt',
        },
        {
            name: 'Workspace Dictionary 2',
            path: '${workspaceFolder}/words3.txt',
        },
    ],
};

describe('Validate WorkspacePathResolver', () => {
    test('shallowCleanObject', () => {
        const clean = debugExports.shallowCleanObject;
        expect(clean('hello')).toBe('hello');
        expect(clean(42)).toBe(42);
        expect([1, 2, 3, 4]).toEqual([1, 2, 3, 4]);
        expect({}).toEqual({});
        expect({ name: 'name' }).toEqual({ name: 'name' });
        expect({ name: 'name', age: undefined }).toEqual({ name: 'name' });
    });
});

describe('Validate workspace substitution resolver', () => {
    const rootPath = '/path to root/root';
    const clientPath = Path.join(rootPath, 'client');
    const serverPath = Path.join(rootPath, '_server');
    const clientTestPath = Path.join(clientPath, 'test');
    const rootFolderUrl = pathToFileURL(rootPath);
    const clientUrl = pathToFileURL(clientPath);
    const serverUrl = pathToFileURL(serverPath);
    const testUrl = pathToFileURL(clientTestPath);
    const rootFolderUri = Uri.parse(rootFolderUrl.href);
    const clientUri = Uri.parse(clientUrl.href);
    const serverUri = Uri.parse(serverUrl.href);
    const testUri = Uri.parse(testUrl.href);
    const workspaceFolders = {
        root: {
            name: 'Root Folder',
            uri: rootFolderUri.toString(),
        },
        client: {
            name: 'Client',
            uri: clientUri.toString(),
        },
        server: {
            name: 'Server',
            uri: serverUri.toString(),
        },
        test: {
            name: 'client-test',
            uri: testUri.toString(),
        },
    };

    const paths = {
        root: uriToRoot(workspaceFolders.root.uri),
        client: uriToRoot(workspaceFolders.client.uri),
        server: uriToRoot(workspaceFolders.server.uri),
        test: uriToRoot(workspaceFolders.test.uri),
    };

    const workspaces: WorkspaceFolder[] = [workspaceFolders.root, workspaceFolders.client, workspaceFolders.server, workspaceFolders.test];

    const settingsImports: CSpellUserAndExtensionSettings = Object.freeze({
        import: [
            'cspell.json',
            '${workspaceFolder}/cspell.json',
            '${workspaceFolder:Client}/cspell.json',
            '${workspaceFolder:Server}/cspell.json',
            '${workspaceRoot}/cspell.json',
            '${workspaceFolder:Failed}/cspell.json',
            'path/${workspaceFolder:Client}/cspell.json',
        ],
    });

    const settingsIgnorePaths: CSpellUserAndExtensionSettings = Object.freeze({
        ignorePaths: [
            '**/node_modules/**',
            '${workspaceFolder}/node_modules/**',
            '${workspaceFolder:Server}/samples/**',
            '${workspaceFolder:client-test}/**/*.json',
            {
                glob: 'dist/**',
                root: '${workspaceFolder:Server}',
            },
        ],
    });

    const settingsDictionaryDefinitions: CSpellUserAndExtensionSettings = Object.freeze({
        dictionaryDefinitions: [
            {
                name: 'My Dictionary',
                path: '${workspaceFolder:Root Folder}/words.txt',
            },
            {
                name: 'Company Dictionary',
                path: '${root}/node_modules/@company/terms/terms.txt',
            },
            {
                name: 'Project Dictionary',
                path: `${rootPath}/terms/terms.txt`,
            },
        ].map((f) => Object.freeze(f)),
    });

    const settingsDictionaryDefinitions2: CSpellUserAndExtensionSettings = Object.freeze({
        dictionaryDefinitions: (settingsDictionaryDefinitions.dictionaryDefinitions || [])
            .concat([
                {
                    name: 'python-terms',
                    path: '${workspaceFolder:Root Folder}/python-words.txt',
                },
                {
                    name: 'legacy-definition',
                    file: 'legacy-words.txt',
                    path: '${workspaceFolder:Root Folder}',
                },
                {
                    name: 'legacy-definition-file',
                    file: '${workspaceFolder:Root Folder}/legacy-words-2.txt',
                },
            ])
            .map((f) => Object.freeze(f)),
    });

    const settingsLanguageSettings: CSpellUserAndExtensionSettings = Object.freeze({
        languageSettings: [
            {
                languageId: 'typescript',
                dictionaryDefinitions: settingsDictionaryDefinitions.dictionaryDefinitions,
            },
        ].map((f) => Object.freeze(f)),
    });

    const overrides: CSpellUserAndExtensionSettings['overrides'] = [
        {
            filename: ['*.md', '**/*.ts', '**/*.js'],
            languageSettings: settingsLanguageSettings.languageSettings,
            dictionaryDefinitions: settingsDictionaryDefinitions.dictionaryDefinitions,
        },
        {
            filename: '${workspaceFolder:Client}/docs/nl_NL/**',
            language: 'nl',
        },
        {
            filename: ['${workspaceFolder:Client}/**/*.config.json', { glob: '**/*.config.json', root: '${workspaceFolder:Server}' }],
            languageId: 'jsonc',
        },
    ];

    const customDictionaries: CustomDictionaries = {
        'company-terms': {
            description: 'Company Wide Terms',
            path: '${root}/node_modules/@company/terms/company-terms.txt',
            addWords: false,
        },
        'ignore-words': {
            path: '${root}/node_modules/@company/terms/ignored-terms.txt',
            noSuggest: true,
        },
        'Project Dictionary': {
            addWords: true,
        },
        'python-terms': true,
        html: false,
    } as const;

    const settingsOverride: CSpellUserAndExtensionSettings = {
        overrides: overrides.map((f) => Object.freeze(f)),
    };

    test('testUri assumptions', () => {
        const u = Uri.file('relative/to/current/dir/file.txt');
        // vscode-uri does not support relative paths.
        expect(u.path).toBe('/relative/to/current/dir/file.txt');
    });

    test('resolveSettings Imports', () => {
        const resolver = createWorkspaceNamesResolver(workspaces[1], workspaces, undefined);
        const result = resolveSettings(settingsImports, resolver);
        const imports = Array.isArray(result.import) ? pp(result.import) : result.import;
        expect(imports).toEqual([
            p('cspell.json'),
            p(`${clientUri.fsPath}/cspell.json`),
            p(`${clientUri.fsPath}/cspell.json`),
            p(`${serverUri.fsPath}/cspell.json`),
            p(`${rootFolderUri.fsPath}/cspell.json`),
            p('${workspaceFolder:Failed}/cspell.json'),
            p('path/${workspaceFolder:Client}/cspell.json'),
        ]);
    });

    test('resolveSettings ignorePaths', () => {
        const root = '/config root';
        const resolver = createWorkspaceNamesResolver(workspaceFolders.client, workspaces, root);
        const result = resolveSettings(settingsIgnorePaths, resolver);
        // '**/node_modules/**',
        // '${workspaceFolder}/node_modules/**',
        // '${workspaceFolder:Server}/samples/**',
        // '${workspaceFolder:client-test}/**/*.json',
        expect(result.ignorePaths).toEqual([
            { glob: '**/node_modules/**', root: uriToRoot(workspaceFolders.client.uri) },
            { glob: '/node_modules/**', root: uriToRoot(workspaceFolders.client.uri) },
            { glob: '/samples/**', root: uriToRoot(workspaceFolders.server.uri) },
            { glob: '/**/*.json', root: uriToRoot(workspaceFolders.test.uri) },
            { glob: 'dist/**', root: uriToRoot(workspaceFolders.server.uri) },
        ]);
    });

    test.each`
        files                               | globRoot                   | expected
        ${undefined}                        | ${undefined}               | ${undefined}
        ${['**']}                           | ${undefined}               | ${[{ glob: '**', root: paths.client }]}
        ${['**']}                           | ${'~/glob-root'}           | ${[{ glob: '**', root: normalizeWindowsUrl(new URL('glob-root/', pathToFileURL(homedir() + '/'))).href }]}
        ${['**']}                           | ${'${workspaceFolder}/..'} | ${[{ glob: '**', root: paths.root }]}
        ${['${workspaceFolder}/**']}        | ${''}                      | ${[{ glob: '/**', root: paths.client }]}
        ${['${workspaceFolder}/**']}        | ${undefined}               | ${[{ glob: '/**', root: paths.client }]}
        ${['${workspaceFolder}/**']}        | ${'~/glob-root'}           | ${[{ glob: '/**', root: paths.client }]}
        ${['${workspaceFolder:Server}/**']} | ${'~/glob-root'}           | ${[{ glob: '/**', root: paths.server }]}
    `('resolveSettings files $files $globRoot', ({ files, globRoot, expected }) => {
        const root = '/config root';
        const resolver = createWorkspaceNamesResolver(workspaceFolders.client, workspaces, root);
        const settings: CSpellUserAndExtensionSettings = { globRoot, files };
        const result = resolveSettings(settings, resolver);
        expect(result.files).toEqual(expected);
    });

    test('resolveSettings dictionaryDefinitions', () => {
        const resolver = createWorkspaceNamesResolver(workspaces[1], workspaces, undefined);
        const result = resolveSettings(settingsDictionaryDefinitions, resolver);
        expect(normalizePath(result.dictionaryDefinitions)).toEqual([
            expect.objectContaining({ name: 'My Dictionary', path: p(`${rootFolderUri.fsPath}/words.txt`) }),
            expect.objectContaining({
                name: 'Company Dictionary',
                path: p(`${rootFolderUri.fsPath}/node_modules/@company/terms/terms.txt`),
            }),
            expect.objectContaining({ name: 'Project Dictionary', path: p(`${rootFolderUri.fsPath}/terms/terms.txt`) }),
        ]);
    });

    test('resolveSettings languageSettings', () => {
        const resolver = createWorkspaceNamesResolver(workspaces[1], workspaces, undefined);
        const result = resolveSettings(settingsLanguageSettings, resolver);
        expect(result?.languageSettings?.[0].languageId).toEqual('typescript');
        expect(normalizePath(result?.languageSettings?.[0].dictionaryDefinitions)).toEqual([
            { name: 'My Dictionary', path: p(`${rootFolderUri.fsPath}/words.txt`) },
            { name: 'Company Dictionary', path: p(`${rootFolderUri.fsPath}/node_modules/@company/terms/terms.txt`) },
            { name: 'Project Dictionary', path: p(`${rootFolderUri.fsPath}/terms/terms.txt`) },
        ]);
    });

    test('resolveSettings overrides', () => {
        const resolver = createWorkspaceNamesResolver(workspaces[1], workspaces, undefined);
        const result = resolveSettings(settingsOverride, resolver);
        expect(result?.overrides?.[0]?.languageSettings?.[0].languageId).toEqual('typescript');
        expect(normalizePath(result?.overrides?.[0].dictionaryDefinitions)).toEqual([
            { name: 'My Dictionary', path: p(`${rootFolderUri.fsPath}/words.txt`) },
            { name: 'Company Dictionary', path: p(`${rootFolderUri.fsPath}/node_modules/@company/terms/terms.txt`) },
            { name: 'Project Dictionary', path: p(`${rootFolderUri.fsPath}/terms/terms.txt`) },
        ]);
        expect(normalizePath(result?.overrides?.[0]?.dictionaryDefinitions)).toEqual([
            { name: 'My Dictionary', path: p(`${rootFolderUri.fsPath}/words.txt`) },
            { name: 'Company Dictionary', path: p(`${rootFolderUri.fsPath}/node_modules/@company/terms/terms.txt`) },
            { name: 'Project Dictionary', path: p(`${rootFolderUri.fsPath}/terms/terms.txt`) },
        ]);
        // @todo need to test changes to filename glob patterns.
        expect(result?.overrides?.map((o) => o.filename)).toEqual([
            [
                {
                    glob: '*.md',
                    root: uriToGlobRoot(workspaceFolders.client.uri),
                },
                {
                    glob: '**/*.ts',
                    root: uriToGlobRoot(workspaceFolders.client.uri),
                },
                {
                    glob: '**/*.js',
                    root: uriToGlobRoot(workspaceFolders.client.uri),
                },
            ],
            {
                glob: '/docs/nl_NL/**',
                root: uriToGlobRoot(workspaceFolders.client.uri),
            },
            [
                {
                    glob: '/**/*.config.json',
                    root: uriToGlobRoot(workspaceFolders.client.uri),
                },
                {
                    glob: '**/*.config.json',
                    root: uriToGlobRoot(workspaceFolders.server.uri),
                },
            ],
        ]);
    });

    test('resolve custom dictionaries', () => {
        const settings: CSpellUserAndExtensionSettings = {
            ...cspellConfigInVsCode,
            ...settingsDictionaryDefinitions2,
            ...cspellConfigCustomFolderDictionary,
            ...cspellConfigCustomUserDictionary,
            ...cspellConfigCustomWorkspaceDictionary,
            customDictionaries,
            dictionaries: ['typescript'],
        };
        const resolver = createWorkspaceNamesResolver(workspaces[1], workspaces, 'custom root');
        const result = resolveSettings(settings, resolver);
        const dictDefs = new Map(result.dictionaryDefinitions?.map((d) => [d.name, d]) || []);
        expect(new Set(result.dictionaries)).toEqual(
            new Set([
                '!html',
                'Global Dictionary',
                'Workspace Dictionary',
                'Project Dictionary',
                'Folder Dictionary',
                'Root Dictionary',
                'Workspace Dictionary 2',
                'company-terms',
                'ignore-words',
                'python-terms',
                'typescript',
            ]),
        );
        expect(new Set(dictDefs.keys())).toEqual(
            new Set([
                'Global Dictionary',
                'My Dictionary',
                'Company Dictionary',
                'Project Dictionary',
                'Workspace Dictionary',
                'Folder Dictionary',
                'Root Dictionary',
                'Workspace Dictionary 2',
                'company-terms',
                'python-terms',
                'ignore-words',
                'legacy-definition',
                'legacy-definition-file',
            ]),
        );
        expect(normalizePath(result.dictionaryDefinitions)).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    name: 'Folder Dictionary',
                    path: p(`${clientUri.fsPath}/packages/_server/words.txt`),
                }),
                expect.objectContaining({
                    name: 'Root Dictionary',
                    path: p('custom root/words2.txt'),
                }),
                expect.objectContaining({
                    name: 'Workspace Dictionary 2',
                    path: p(`${clientUri.fsPath}/words3.txt`),
                }),
            ]),
        );
        expect(dictDefs.get('legacy-definition-file')?.path).toEqual(expect.stringMatching(/legacy-words-2\.txt$/));
    });

    test('resolve custom dictionaries by name', () => {
        const settings: CSpellUserAndExtensionSettings = {
            ...cspellConfigInVsCode,
            ...settingsDictionaryDefinitions,
            customWorkspaceDictionaries: ['Project Dictionary'],
            customFolderDictionaries: ['Folder Dictionary'], // This dictionary doesn't exist.
            dictionaries: ['typescript'],
        };
        const resolver = createWorkspaceNamesResolver(workspaces[1], workspaces, 'custom root');
        const result = resolveSettings(settings, resolver);
        expect(new Set(result.dictionaries)).toEqual(new Set(['Project Dictionary', 'Folder Dictionary', 'typescript']));
        expect(result.dictionaryDefinitions?.map((d) => d.name)).toEqual(['My Dictionary', 'Company Dictionary', 'Project Dictionary']);
        expect(normalizePath(result.dictionaryDefinitions)).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    name: 'Project Dictionary',
                    path: p('/path to root/root/terms/terms.txt'),
                }),
            ]),
        );
        expect(result.dictionaryDefinitions).not.toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    name: 'Folder Dictionary',
                }),
            ]),
        );
    });

    test('Unresolved workspaceFolder', () => {
        mockLogError.mockReset();
        const settings: CSpellUserAndExtensionSettings = {
            ...cspellConfigInVsCode,
            ...settingsDictionaryDefinitions,
            customWorkspaceDictionaries: [{ name: 'Unknown Dictionary' }],
            dictionaries: ['typescript'],
        };
        const resolver = createWorkspaceNamesResolver(workspaces[1], workspaces, 'custom root');
        const result = resolveSettings(settings, resolver);

        expect(result.dictionaryDefinitions).not.toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    name: 'Unknown Dictionary',
                }),
            ]),
        );
        expect(mockLogError).toHaveBeenCalledWith('Failed to resolve ${workspaceFolder:_server}');
    });

    function uriToRoot(u: string | Uri): string {
        if (typeof u === 'string') {
            u = Uri.parse(u);
        }
        return toDirURL(u).href;
    }

    function normalizePath<T extends { path?: string }>(values?: T[]): T[] | undefined {
        function m(v: T): T {
            const r: T = { ...v };
            r.path = p(v.path || '');
            return r;
        }
        return values?.map(m);
    }

    function pp(paths: string[] | undefined): string[] | undefined {
        return paths?.map(p);
    }

    function p(path: string): string {
        return normalizeWindowsRoot(fileURLToPath(pathToFileURL(path)));
    }
});
