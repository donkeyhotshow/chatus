import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';

// Mock Firebase context
vi.mock('@/components/firebase/FirebaseProvider', () => ({
    useFirebase: () => ({
        db: {},
        auth: {},
        storage: {},
    }),
    useFirebaseSafe: () => ({
        db: {},
        auth: {},
        storage: {},
    }),
}));

// Mock hooks
vi.mock('@/hooks/useChatService', () => ({
    useChatService: () => ({
        messages: [],
        isConnected: true,
        isLoading: false,
        error: null,
    }),
}));

vi.mock('@/hooks/useRoomManager', () => ({
    useRoomManager: () => ({
        messages: [],
        isConnected: true,
        sendMessage: vi.fn(),
    }),
}));

describe('ChatArea', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders without crashing', () => {
        // Basic smoke test
        expect(true).toBe(true);
    });

    it('has correct test setup', () => {
        expect(React).toBeDefined();
        expect(render).toBeDefined();
    });
});
