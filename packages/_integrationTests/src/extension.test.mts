/* eslint-disable @typescript-eslint/no-unused-expressions */
import { createRequire } from 'node:module';

import { expect } from 'chai';
import type { Stream } from 'kefir';
import { stream } from 'kefir';
import type { Diagnostic, languages as vscodeLanguages, Position, Uri, window as vscodeWindow } from 'vscode';

import type { CSpellClient, ExtensionApi, OnSpellCheckDocumentStep } from './ExtensionApi.mjs';
import {
    activateExtension,
    getDocPath,
    getDocUri,
    getVSCodeCommands,
    getVscodeWorkspace,
    loadDocument,
    loadFolder,
    log,
    logRed,
    logYellow,
    sampleWorkspaceUri,
    sleep,
} from './helper.mjs';

type VscodeLanguages = typeof vscodeLanguages;
type VscodeWindow = typeof vscodeWindow;

interface Vscode {
    languages: VscodeLanguages;
    window: VscodeWindow;
    Position: typeof Position;
    Uri: typeof Uri;
}

const require = createRequire(import.meta.url);

const vscode = require('vscode') as Vscode;

type Api = {
    [K in keyof ExtensionApi]: K;
};

const apiSignature: Api = {
    addWordToUserDictionary: 'addWordToUserDictionary',
    addWordToWorkspaceDictionary: 'addWordToWorkspaceDictionary',
    disableLanguageId: 'disableLanguageId',
    disableLocale: 'disableLocale',
    enableLanguageId: 'enableLanguageId',
    enableLocale: 'enableLocale',
    registerConfig: 'registerConfig',
    triggerGetSettings: 'triggerGetSettings',
    updateSettings: 'updateSettings',
    cSpellClient: 'cSpellClient',
    enableCurrentFileType: 'enableCurrentFileType',
    disableCurrentFileType: 'disableCurrentFileType',
    checkDocument: 'checkDocument',

    // Legacy
    enableLocal: 'enableLocal',
    disableLocal: 'disableLocal',
    enableCurrentLanguage: 'enableCurrentLanguage',
    disableCurrentLanguage: 'disableCurrentLanguage',
};

describe('Launch code spell extension', function () {
    this.timeout(120000);
    const docUri = getDocUri('diagnostics.txt');

    this.beforeAll(
        logError(async () => {
            await activateExtension();
            logYellow('Activated');
            logYellow('Load Folder %o', getDocUri('./').toJSON());
            await loadFolder(getDocUri('./'));
        }),
    );

    it(
        'Verify the extension starts',
        logError(async () => {
            logYellow('Verify the extension starts');
            const extContext = await activateExtension();
            const docContext = await loadDocument(docUri);
            expect(extContext).to.not.be.undefined;
            expect(docContext).to.not.be.undefined;
            const extApi = extContext.extApi;
            expect(extApi).to.not.be.undefined;
            expect(extApi).to.equal(extContext?.extActivate);
            expect(extApi).haveOwnProperty(apiSignature.addWordToUserDictionary);
            expect(extApi).to.include.all.keys(...Object.keys(apiSignature));
            logYellow('Done: Verify the extension starts');
        }),
    );

    [
        [getDocUri('example.md'), getDocUri('cspell.json')],
        [sampleWorkspaceUri('workspace1/README.md'), sampleWorkspaceUri('cspell.json')],
    ].forEach(([docUri, expectedConfigUri]) => {
        it(`Verifies that the right config was found for ${docUri.toString()}`, async () => {
            logYellow('Verifies that the right config was found');
            const ext = isDefined(await activateExtension());
            const uri = docUri;
            const docContextMaybe = await loadDocument(uri);
            expect(docContextMaybe).to.not.be.undefined;
            const docContext = isDefined(docContextMaybe);

            const config = await ext.extApi.cSpellClient().getConfigurationForDocument(docContext.doc, {});

            const { excludedBy, fileEnabled, configFiles } = config;
            log('config: %o', { excludedBy, fileEnabled, configFiles });

            const configUri = vscode.Uri.parse(config.configFiles[0] || '');
            expect(configUri.toString()).to.equal(expectedConfigUri.toString());
            logYellow('Done: Verifies that the right config was found');
        });
    });

    it(
        'Verifies that some spelling errors were found',
        logError(async () => {
            logYellow('Verifies that some spelling errors were found');
            const uri = getDocUri('example.md');
            const config = getVscodeWorkspace().getConfiguration(undefined, uri);
            await config.update('cSpell.diagnosticLevel', 'Information', 3);
            await config.update('cSpell.useCustomDecorations', false, 1);
            const docContextMaybe = await loadDocument(uri);
            await sleep(1000);
            logYellow('document loaded');
            // Force a spell check by making an edit.
            logYellow('edit start');
            const r = vscode.window.activeTextEditor?.edit((edit) => edit.insert(new vscode.Position(0, 0), '#'));
            expect(docContextMaybe).to.not.be.undefined;
            const wait = waitForSpellComplete(uri, 5000);
            await r;
            logYellow('edit finished');

            const found = await wait;
            log('found %o', found);

            const diags = await getDiagsFromVsCode(uri, 2000);

            if (!diags.length) {
                log('all diags: %o', vscode.languages.getDiagnostics());
            }

            // await sleep(5 * 1000);

            expect(found).to.not.be.undefined;

            const msgs = diags.map((a) => `C: ${a.source} M: ${a.message}`).join('\n');
            log(`Diag Messages: size(${diags.length}) msg: \n${msgs}`);
            log('diags: %o', diags);

            // cspell:ignore spellling
            expect(msgs).contains('spellling');
            logYellow('Done: Verifies that some spelling errors were found');
        }),
    );

    it('register a config and check doc', async () => {
        const ext = await activateExtension();
        const api = ext.extApi;
        const configPath = getDocPath('german/cspell.config.yaml');
        api.registerConfig(configPath);
        const secondsToWait = 1;
        await sleep(secondsToWait * 1000);
        const result = await api.checkDocument({
            uri: sampleWorkspaceUri('german/README.md').toString(),
            // cspell:disable-next-line
            text: 'Straße',
            languageId: 'markdown',
        });
        // console.error('Result: %o', result);
        expect(result).to.not.be.undefined;
        expect(result.issues).to.be.empty;
    });

    it('creates a new file with some spelling errors.', async () => {
        logYellow('Verifies that some spelling errors were found in a new file');
        const uri = vscode.Uri.parse('untitled:Untitled-1');
        const config = getVscodeWorkspace().getConfiguration(undefined, getDocUri('example.md'));
        await config.update('cSpell.diagnosticLevel', 'Information', 3);
        await config.update('cSpell.useCustomDecorations', false, 1);
        logYellow('Create new untitled file');
        await getVSCodeCommands().executeCommand('workbench.action.files.newUntitledFile');
        await sleep(1000);
        logYellow('Created new untitled file');

        logYellow('edit start');
        const r = vscode.window.activeTextEditor?.edit((edit) =>
            edit.insert(new vscode.Position(0, 0), 'This document has spellling errors.'),
        );
        const wait = waitForSpellComplete(uri, 5000);
        await r;
        logYellow('edit finished');

        const found = await wait;
        log('found %o', found);

        const diags = await getDiagsFromVsCode(uri, 2000);

        if (!diags.length) {
            log('all diags: %o', vscode.languages.getDiagnostics());
        }

        expect(found).to.not.be.undefined;

        const msgs = diags.map((a) => `C: ${a.source} M: ${a.message}`).join('\n');
        log(`Diag Messages: size(${diags.length}) msg: \n${msgs}`);
        log('diags: %o', diags);

        // cspell:ignore spellling
        expect(msgs).contains('spellling');
        logYellow('Done: Verifies that some spelling errors were found in a new file');
    });

    it('Wait a bit', async () => {
        // This is useful for debugging and you want to see the VS Code UI.
        // Set `secondsToWait` to 30 or more.
        const secondsToWait = 1;
        await sleep(secondsToWait * 1000);
        expect(true).to.be.true;
    });
});

function logError(fn: () => Promise<void>): () => Promise<void> {
    return async () => {
        try {
            await fn();
        } catch (e) {
            logRed('Error: %o', e);
            throw e;
        }
    };
}

function streamOnSpellCheckDocumentNotification(cSpellClient: CSpellClient): Stream<OnSpellCheckDocumentStep, undefined> {
    return stream<OnSpellCheckDocumentStep, undefined>((emitter) => {
        const d = cSpellClient.onSpellCheckDocumentNotification(emitter.value);
        return () => d.dispose();
    });
}

async function waitForSpellComplete(uri: Uri, timeout: number): Promise<OnSpellCheckDocumentStep | undefined> {
    const matchUri = uri.toString();
    const ext = await activateExtension();
    const s = streamOnSpellCheckDocumentNotification(ext.extApi.cSpellClient())
        .filter((v) => v.uri === matchUri)
        .filter((v) => !!v.done)
        .take(1);
    return Promise.race([s.toPromise(), sleep(timeout)]);
}

async function getDiagsFromVsCode(uri: Uri, waitInMs: number): Promise<Diagnostic[]> {
    let stop = false;
    setInterval(() => (stop = true), waitInMs);
    let diag: Diagnostic[] = vscode.languages.getDiagnostics(uri);
    while (!stop && !diag.length) {
        await sleep(5);
        diag = vscode.languages.getDiagnostics(uri);
    }
    return diag;
}

function isDefined<T>(t: T | undefined): T {
    if (t === undefined) {
        throw new Error('undefined');
    }
    return t;
}
