import * as React from 'react';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'input-history' });
const HISTORY_KEY = 'input-history';
const MAX_HISTORY_SIZE = 100;

// Hook to manage input history with up/down arrow navigation
// Stores history in MMKV for persistence across sessions
export function useInputHistory(sessionId: string) {
    const historyKey = `${HISTORY_KEY}-${sessionId}`;

    // Load history from storage
    const [history, setHistory] = React.useState<string[]>(() => {
        const stored = storage.getString(historyKey);
        return stored ? JSON.parse(stored) : [];
    });

    // Current position in history (-1 means not navigating)
    const [historyIndex, setHistoryIndex] = React.useState(-1);

    // Store the current input before navigating history
    const [savedInput, setSavedInput] = React.useState('');

    // Add new entry to history
    const addToHistory = React.useCallback((text: string) => {
        if (!text.trim()) return;

        setHistory(prev => {
            // Don't add duplicates at the top
            if (prev[0] === text) return prev;

            const newHistory = [text, ...prev.filter(h => h !== text)].slice(0, MAX_HISTORY_SIZE);
            storage.set(historyKey, JSON.stringify(newHistory));
            return newHistory;
        });

        // Reset navigation state
        setHistoryIndex(-1);
        setSavedInput('');
    }, [historyKey]);

    // Navigate up in history (older entries)
    const navigateUp = React.useCallback((currentInput: string): string | null => {
        if (history.length === 0) return null;

        // Save current input when starting navigation
        if (historyIndex === -1) {
            setSavedInput(currentInput);
        }

        const newIndex = Math.min(historyIndex + 1, history.length - 1);
        if (newIndex === historyIndex) return null; // Already at oldest

        setHistoryIndex(newIndex);
        return history[newIndex];
    }, [history, historyIndex]);

    // Navigate down in history (newer entries)
    const navigateDown = React.useCallback((): string | null => {
        if (historyIndex === -1) return null; // Not in history navigation

        const newIndex = historyIndex - 1;

        if (newIndex < 0) {
            // Return to current input
            setHistoryIndex(-1);
            return savedInput;
        }

        setHistoryIndex(newIndex);
        return history[newIndex];
    }, [history, historyIndex, savedInput]);

    // Reset navigation state (call when user types)
    const resetNavigation = React.useCallback(() => {
        if (historyIndex !== -1) {
            setHistoryIndex(-1);
            setSavedInput('');
        }
    }, [historyIndex]);

    return {
        history,
        historyIndex,
        addToHistory,
        navigateUp,
        navigateDown,
        resetNavigation,
        isNavigating: historyIndex !== -1,
    };
}
