import type { PublishDiagnosticsParams } from 'vscode-languageserver';

import type { ConfigScopeVScode, ConfigTarget } from '../config/configTargets.mjs';
import type { CSpellUserAndExtensionSettings } from '../config/cspellConfig/index.mjs';
import type { CheckDocumentIssue } from './models/Diagnostic.mjs';
import type { Suggestion } from './models/Suggestion.mjs';
import type { ExtensionId } from './models/types.mjs';

export type {
    ConfigKind,
    ConfigScope,
    ConfigTarget,
    ConfigTargetCSpell,
    ConfigTargetDictionary,
    ConfigTargetVSCode,
} from '../config/configTargets.mjs';
export type { CheckDocumentIssue } from './models/Diagnostic.mjs';
export type { Position, Range } from 'vscode-languageserver-types';

export interface BlockedFileReason {
    code: string;
    message: string;
    documentationRefUri: UriString;
    settingsUri: UriString;
    settingsID: string;
    notificationMessage: string;
}

export type UriString = string;
export type DocumentUri = UriString;

export type StartIndex = number;
export type EndIndex = number;

export type RangeTuple = [StartIndex, EndIndex];

export interface ExcludeRef {
    glob: string;
    id: string | undefined;
    name: string | undefined;
    configUri: string | undefined;
}

export interface GitignoreInfo {
    gitIgnoreFile: string;
    glob: string | undefined;
    line: number | undefined;
    matched: boolean;
    root: string | undefined;
}

export interface IsSpellCheckEnabledResult {
    /** The Uri used to determine the settings. */
    uriUsed: DocumentUri | undefined;
    workspaceFolderUri: UriString | undefined;
    languageIdEnabled: boolean | undefined;
    languageId: string | undefined;
    /**
     * Is the spell checker enabled for the file.
     * If false, the file is excluded from spell checking.
     * It might be disabled for multiple reasons.
     */
    enabled: boolean | undefined;
    /**
     * Is the spell checker enabled in VS Code.
     */
    enabledVSCode: boolean | undefined;
    fileEnabled: boolean;
    fileIsIncluded: boolean;
    fileIsExcluded: boolean;
    schemeIsAllowed: boolean | undefined;
    schemeIsKnown: boolean | undefined;
    excludedBy: ExcludeRef[] | undefined;
    gitignored: boolean | undefined;
    gitignoreInfo: GitignoreInfo | undefined;
    blockedReason: BlockedFileReason | undefined;
}

export interface SplitTextIntoWordsResult {
    words: string[];
}

export interface SpellingSuggestionsResult {
    suggestions: Suggestion[];
}

export interface GetSpellCheckingOffsetsResult {
    /**
     * The text offsets of the text in the document that should be spell checked.
     * The offsets are start/end pairs.
     */
    offsets: number[];
}

export type ConfigurationFields = keyof CSpellUserAndExtensionSettings;
export type ConfigFieldSelector<T extends ConfigurationFields> = Readonly<Record<T, true>>;

export type AllowUndefined<T> = {
    [P in keyof T]: T[P] | undefined;
};

export type PartialCSpellUserSettings<T extends ConfigurationFields> = Pick<CSpellUserAndExtensionSettings, T> & {
    _fields?: ConfigFieldSelector<T>;
};

export interface GetConfigurationForDocumentRequest<Fields extends ConfigurationFields> extends Partial<TextDocumentInfo> {
    /** used to calculate configTargets, configTargets will be empty if undefined. */
    workspaceConfig?: WorkspaceConfigForDocument;
    /** List of Settings fields to return. */
    fields: ConfigFieldSelector<Fields>;
}

export interface GetConfigurationForDocumentResult<T extends ConfigurationFields> extends IsSpellCheckEnabledResult {
    /** Merged configuration settings. Does NOT include in-document directives. */
    settings: PartialCSpellUserSettings<T> | undefined;
    /** Merged configuration settings, including in-document directives. */
    docSettings: PartialCSpellUserSettings<T> | undefined;
    /** Configuration files used. */
    configFiles: UriString[];
    /** Possible configuration targets. */
    configTargets: ConfigTarget[];
}

export interface GetConfigurationTargetsRequest extends Partial<TextDocumentInfo> {
    /** used to calculate configTargets, configTargets will be empty if undefined. */
    workspaceConfig?: WorkspaceConfigForDocument;
}

export interface GetConfigurationTargetsResult {
    /** Possible configuration targets. */
    configTargets: ConfigTarget[];
}

export interface TextDocumentRef {
    readonly uri: DocumentUri;
}

export interface TextDocumentInfo extends TextDocumentRef {
    readonly languageId?: string;
    readonly text?: string;
    readonly version?: number;
}

export interface TextDocumentInfoWithText extends TextDocumentInfo {
    readonly text: string;
}

export interface NamedPattern {
    name: string;
    pattern: string | string[];
}

export interface MatchPatternsToDocumentRequest extends TextDocumentRef {
    readonly patterns: (string | NamedPattern)[];
}

export interface RegExpMatch {
    regexp: string;
    matches: RangeTuple[];
    elapsedTime: number;
    errorMessage?: string;
}

export type RegExpMatchResults = RegExpMatch;

export interface PatternMatch {
    name: string;
    defs: RegExpMatch[];
}

export interface MatchPatternsToDocumentResult {
    uri: UriString;
    version: number;
    patternMatches: PatternMatch[];
    message?: string;
}

export interface OnSpellCheckDocumentStep extends NotificationInfo {
    /**
     * uri of the text document
     */
    uri: DocumentUri;

    /**
     *
     */
    version: number;

    /**
     * name of step.
     */
    step: string;

    /**
     * Number of issues found
     */
    numIssues?: number;

    /**
     * true if it is finished
     */
    done?: boolean;
}

export interface NotificationInfo {
    /**
     * Sequence number.
     * Notifications can be sorted based upon the sequence number to give the order
     * in which the Notification was generated.
     * It should be unique between Notifications of the same type.
     */
    seq: number;

    /**
     * timestamp in ms.
     */
    ts: number;
}

export interface WorkspaceConfigForDocumentRequest {
    uri: DocumentUri;
}

export interface WorkspaceConfigForDocument {
    uri: DocumentUri | undefined;
    workspaceFile: UriString | undefined;
    workspaceFolder: UriString | undefined;
    words: FieldExistsInTarget;
    ignoreWords: FieldExistsInTarget;
}

export type WorkspaceConfigForDocumentResponse = WorkspaceConfigForDocument;

export type FieldExistsInTarget = Partial<Record<ConfigurationTarget, boolean>>;

export type ConfigurationTarget = ConfigScopeVScode;

export type {
    CSpellUserAndExtensionSettings as CSpellUserSettings,
    CustomDictionaries,
    CustomDictionary,
    CustomDictionaryEntry,
    CustomDictionaryScope,
    CustomDictionaryWithScope,
    DictionaryDefinition,
    DictionaryDefinitionCustom,
    DictionaryFileTypes,
    LanguageSetting,
    SpellCheckerSettings,
    SpellCheckerSettingsProperties,
} from '../config/cspellConfig/index.mjs';

export type VSCodeSettingsCspell = Partial<Record<ExtensionId, CSpellUserAndExtensionSettings>>;

export type PublishDiagnostics = Required<PublishDiagnosticsParams>;

export interface TraceWordRequest {
    /**
     * URL to a document or directory.
     * The configuration is determined by the languageId and configuration files relative to the uri.
     */
    uri: DocumentUri;
    /**
     * The word to look up in the dictionaries.
     */
    word: string;
    /**
     * The languageId to use if the uri is a directory.
     * @default document languageId or 'plaintext'
     */
    languageId?: string | undefined;
    /**
     * Search all known dictionaries for the word.
     * @default false
     */
    searchAllDictionaries?: boolean | undefined;
    /**
     * Search for compound words.
     */
    allowCompoundWords?: boolean | undefined;
}

export interface Trace {
    /**
     * The word searched for in the dictionary.
     */
    word: string;
    /**
     * true if found in the dictionary.
     */
    found: boolean;
    /**
     * The actual word found in the dictionary.
     */
    foundWord: string | undefined;
    /**
     * true if the word is forbidden.
     */
    forbidden: boolean;
    /**
     * true if it is a no-suggest word.
     */
    noSuggest: boolean;
    /**
     * name of the dictionary
     */
    dictName: string;
    /**
     * Path or URL to the dictionary.
     */
    dictSource: string;
    /**
     * true if the dictionary is enabled for the languageId (file type).
     */
    dictEnabled: boolean;
    /**
     * The errors found while looking up the word.
     */
    errors: string | undefined;
}

export interface TraceWordFound {
    word: string;
    found: boolean;
}

export interface WordTrace extends TraceWordFound {
    traces: readonly Trace[];
}

export interface TraceWordResult {
    word: string;
    /** the word traces. */
    traces?: readonly WordTrace[] | undefined;
    /** The split word results */
    splits?: readonly TraceWordFound[];
    errors?: string | undefined;
}

export interface CheckDocumentOptions {
    /**
     * Force a check even if the document would normally be excluded.
     */
    forceCheck?: boolean;
}

export interface CheckDocumentResult {
    uri: DocumentUri;
    errors?: string;
    skipped?: boolean;
    issues?: CheckDocumentIssue[];
}

export interface IsSpellCheckingEnabledForUrisRequest {
    /**
     * The current workspace folder, used to determine the settings.
     * If undefined, the settings will be determined by the uris with respect to the workspace folders.
     * If no workspace folders are defined, the settings will be determined by the uris.
     */
    cwd?: DocumentUri;
    uris: DocumentUri[];
}

export interface IsSpellCheckingEnabledForUri {
    uri: DocumentUri;
    shouldCheck: boolean;
}

export interface IsSpellCheckingEnabledForUrisResponse {
    uris: DocumentUri[];
    shouldCheck: boolean[];
}

export interface OnDocumentConfigChange {
    uris: DocumentUri[];
}

/**
 * Notify the client that a file is blocked from being spell checked.
 */
export interface OnBlockFile {
    /** the uri of the document being blocked */
    uri: DocumentUri;
    /** the reason the file is blocked. */
    reason: BlockedFileReason;
}
