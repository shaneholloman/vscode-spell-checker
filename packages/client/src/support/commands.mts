import { commands, Uri } from 'vscode';

import { getExtensionContext } from '../di.mjs';
import { openExternalUrl } from '../util/openUrl.mjs';

export async function about(): Promise<void> {
    const uriReadme = Uri.joinPath(getExtensionContext().extensionUri, 'resources/pages/About the Spell Checker.md');
    return commands.executeCommand('markdown.showPreview', null, [uriReadme], { lock: true });
}

export function supportRequest(): Promise<void> {
    return openMarkdown('resources/pages/Spell Checker Support Request.md');
}

export function reportIssue(): Promise<void> {
    return openMarkdown('resources/pages/Spell Checker Report Issue.md');
}

export function sponsor(): Promise<boolean> {
    return openExternalUrl('https://streetsidesoftware.com/sponsor/');
}

export function releaseNotes(): Promise<void> {
    return openMarkdown('resources/pages/Spell Checker Release Notes.md');
}

async function openMarkdown(uri: Uri | string): Promise<void> {
    if (typeof uri === 'string') {
        uri = Uri.joinPath(getExtensionContext().extensionUri, uri);
    }
    return commands.executeCommand('markdown.showPreview', null, [uri], { lock: true });
}
