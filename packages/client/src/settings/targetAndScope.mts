import { ConfigurationTarget } from 'vscode';

import type { ConfigTargetVSCode, CustomDictionaryScope } from '../client/index.mjs';
import type { ClientConfigScope } from './clientConfigTarget.js';

type ConfigScopeVScode = ConfigTargetVSCode['scope'];

type TargetToConfigScope = Record<ConfigurationTarget, ConfigScopeVScode>;

type ConfigScopeToTarget = Record<ConfigScopeVScode, ConfigurationTarget>;

const targetToScope: TargetToConfigScope = {
    [ConfigurationTarget.Global]: 'user',
    [ConfigurationTarget.Workspace]: 'workspace',
    [ConfigurationTarget.WorkspaceFolder]: 'folder',
} as const;

const ScopeToTarget: ConfigScopeToTarget = {
    user: ConfigurationTarget.Global,
    workspace: ConfigurationTarget.Workspace,
    folder: ConfigurationTarget.WorkspaceFolder,
} as const;

const ScopeOrder = [ConfigurationTarget.Global, ConfigurationTarget.Workspace, ConfigurationTarget.WorkspaceFolder] as const;

export function configurationTargetToDictionaryScope(target: ConfigurationTarget): CustomDictionaryScope {
    return targetToScope[target];
}

export function dictionaryScopeToConfigurationTarget(scope: ConfigScopeVScode): ConfigurationTarget {
    return clientConfigScopeToConfigurationTarget(scope);
}

export function clientConfigScopeToConfigurationTarget(scope: ConfigScopeVScode): ConfigurationTarget {
    return ScopeToTarget[scope];
}

export function configurationTargetToClientConfigScope(target: ConfigurationTarget): ClientConfigScope {
    return targetToScope[target];
}

export function configurationTargetToClientConfigScopeInfluenceRange(target: ConfigurationTarget): ClientConfigScope[] {
    const scopes: ClientConfigScope[] = [];
    const start = ScopeOrder.indexOf(target);
    if (start < 0) return scopes;
    for (let i = start; i < ScopeOrder.length; ++i) {
        scopes.push(configurationTargetToClientConfigScope(ScopeOrder[i]));
    }
    scopes.push('unknown');
    return scopes;
}
