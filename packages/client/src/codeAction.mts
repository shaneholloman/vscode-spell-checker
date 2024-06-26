import type { Suggestion } from 'code-spell-checker-server/api';
import type { CodeActionContext, CodeActionProvider, Command, Range, Selection, TextDocument } from 'vscode';
import { CodeAction, CodeActionKind, languages } from 'vscode';

import { requestSpellingSuggestions } from './codeActions/actionSuggestSpellingCorrections.mjs';
import { createTextEditCommand } from './commands.mjs';
import { filterDiags } from './diags.mjs';
import type { IssueTracker, SpellingCheckerIssue } from './issueTracker.mjs';

export class SpellCheckerCodeActionProvider implements CodeActionProvider {
    public static readonly providedCodeActionKinds = [CodeActionKind.QuickFix];

    constructor(readonly issueTracker: IssueTracker) {}

    async provideCodeActions(
        document: TextDocument,
        range: Range | Selection,
        context: CodeActionContext,
        // token: CancellationToken,
    ): Promise<(CodeAction | Command)[]> {
        const contextDiags = filterDiags(context.diagnostics);
        if (contextDiags.length) {
            // Already handled by the language server.
            return [];
        }

        const diags = this.issueTracker.getSpellingIssues(document.uri)?.filter((diag) => diag.range.contains(range));
        if (diags?.length !== 1) return [];
        const pendingDiags = diags.map((diag) => this.diagToAction(document, diag));
        return (await Promise.all(pendingDiags)).flatMap((action) => action);
    }

    private async diagToAction(doc: TextDocument, issue: SpellingCheckerIssue): Promise<(CodeAction | Command)[]> {
        const suggestions = issue.providedSuggestions();
        if (!suggestions?.length) {
            // fetch the result from the server.
            const actionsFromServer = await requestSpellingSuggestions(doc, issue.range, [issue.diag]);
            return actionsFromServer;
        }
        return suggestions.map((sug) => suggestionToAction(doc, issue.range, sug));
    }
}

function suggestionToAction(doc: TextDocument, range: Range, sug: Suggestion): CodeAction {
    const title = `Replace with: ${sug.word}`;
    const action = new CodeAction(title, CodeActionKind.QuickFix);
    action.isPreferred = sug.isPreferred;
    action.command = createTextEditCommand(title, doc.uri, doc.version, [{ range, newText: sug.word }]);
    return action;
}

export function registerSpellCheckerCodeActionProvider(issueTracker: IssueTracker) {
    return languages.registerCodeActionsProvider('*', new SpellCheckerCodeActionProvider(issueTracker), {
        providedCodeActionKinds: SpellCheckerCodeActionProvider.providedCodeActionKinds,
    });
}
