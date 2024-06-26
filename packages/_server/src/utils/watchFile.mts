import type { FSWatcher } from 'node:fs';
import { watch as fsWatch } from 'node:fs';

import { toFileUri } from '@internal/common-utils/uriHelper';

// Note: Node documentation isn't very clear on the exact events that will be emitted.
export type KnownEvents = 'change' | 'error' | 'close';
export type EventType = KnownEvents | string;

export type Listener = (eventType?: EventType, filename?: string) => void;
export type Watcher = Pick<FSWatcher, 'close'>;

export function watchFile(filename: string, callback: (eventType?: EventType, filename?: string | null) => void): Watcher {
    const uri = toFileUri(filename);
    if (uri.scheme === 'file') {
        try {
            return fsWatch(filename, { persistent: false }, callback);
        } catch {
            // Watch is not supported
        }
    }

    return {
        close() {
            // callback('close', filename);
        },
    };
}
