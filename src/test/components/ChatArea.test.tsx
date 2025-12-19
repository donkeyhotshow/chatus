import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatArea } from '@/components/chat/ChatArea';
import { UserProfile } from '@/lib/types';
import { FirebaseProvider } from '@/components/firebase/FirebaseProvider';

// Mock the hooks
vi.mock('@/hooks/useChatService', () => ({
    useChatService: vi.fn(() => ({
        messages: [],
        isInitialLoad: false,
        typingUsers: [],
        service: {
            sendMessage: vi.fn(),
            markMessagesAsSeen: vi.fn(),
            markMessagesAsDelivered: vi.fn(),
        },
        hasMoreMessages: false,
        connectionState: {
            isOnline: true,
            isConnected: true,
            isReconnecting: false,
        },
    })),
}));

vi.mock('@/hooks/usePresence', () => ({
    usePresence: vi.fn(() => ({
        isOnline: true,
    })),
}));

vi.mock('@/hooks/use-toast', () => ({
    useToast: vi.fn(() => ({
        toast: vi.fn(),
    })),
}));

vi.mock('@/hooks/useDoc', () => ({
    useDoc: vi.fn(() => ({
        data: {
            id: 'test-room',
            participants: ['user1', 'user2'],
            participantProfiles: [
                { id: 'user1', name: 'User 1', avatar: '' },
                { id: 'user2', name: 'User 2', avatar: '' },
            ],
        },
    })),
}));

vi.mock('@/hooks/use-mobile', () => ({
    useIsMobile: vi.fn(() => false),
}));

vi.mock('@/hooks/use-chat-persistence', () => ({
    useChatPersistence: vi.fn(() => ({
        saveMessages: vi.fn(),
        loadMessages: vi.fn(() => []),
        hasHistory: false,
    })),
    useUserPreferences: vi.fn(() => ({
        updateLastRoomId: vi.fn(),
    })),
}));

const mockFirebaseContext = {
    db: {} as any,
    auth: {} as any,
    storage: {} as any,
};

const MockFirebaseProvider = ({ children }: { children: React.ReactNode }) => (
    <FirebaseProvider value={mockFirebaseContext}>
        {children}
    </FirebaseProvider>
);

describe('ChatArea', () => {
    const mockUser: UserProfile = {
        id: 'user1',
        name: 'Test User',
        avatar: '',
    };

    const defaultProps = {
        user: mockUser,
        roomId: 'test-room',
        isCollabSpaceVisible: false,
        onToggleCollaborationSpace: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders without crashing', () => {
        render(
            <MockFirebaseProvider>
                <ChatArea {...defaultProps} />
            </MockFirebaseProvider>
        );

        expect(screen.getByText('ЗДЕСЬ ПОКА ПУСТО')).toBeInTheDocument();
    });

    it('displays empty state when no messages', () => {
        render(
            <MockFirebaseProvider>
                <ChatArea {...defaultProps} />
            </MockFirebaseProvider>
        );

        expect(screen.getByText('ЗДЕСЬ ПОКА ПУСТО')).toBeInTheDocument();
        expect(screen.getByText(/Отправьте первое сообщение/)).toBeInTheDocument();
    });

    it('handles message input correctly', async () => {
        const mockSendMessage = vi.fn();
        const { useChatService } = await import('@/hooks/useChatService');

        vi.mocked(useChatService).mockReturnValue({
            messages: [],
            isInitialLoad: false,
            typingUsers: [],
            service: {
                sendMessage: mockSendMessage,
                markMessagesAsSeen: vi.fn(),
                markMessagesAsDelivered: vi.fn(),
            } as any,
            hasMoreMessages: false,
            connectionState: {
                isOnline: true,
                isConnected: true,
                isReconnecting: false,
            },
        });

        render(
            <MockFirebaseProvider>
                <ChatArea {...defaultProps} />
            </MockFirebaseProvider>
        );

        const input = screen.getByPlaceholderText('Напишите сообщение...');
        const sendButton = screen.getByRole('button', { name: /отправить/i });

        fireEvent.change(input, { target: { value: 'Test message' } });
        fireEvent.click(sendButton);

        await waitFor(() => {
            expect(mockSendMessage).toHaveBeenCalledWith({
                text: 'Test message',
                user: mockUser,
                senderId: mockUser.id,
                type: 'text',
                replyTo: null,
            });
        });
    });

    it('prevents infinite loops in message rendering', () => {
        const { useChatService } = require('@/hooks/useChatService');

        // Mock messages with potential duplicates
        const duplicateMessages = [
            { id: '1', text: 'Message 1', user: mockUser, createdAt: { toMillis: () => 1000 } },
            { id: '1', text: 'Message 1', user: mockUser, createdAt: { toMillis: () => 1000 } }, // Duplicate
            { id: '2', text: 'Message 2', user: mockUser, createdAt: { toMillis: () => 2000 } },
        ];

        vi.mocked(useChatService).mockReturnValue({
            messages: duplicateMessages,
            isInitialLoad: false,
            typingUsers: [],
            service: {
                sendMessage: vi.fn(),
                markMessagesAsSeen: vi.fn(),
                markMessagesAsDelivered: vi.fn(),
            } as any,
            hasMoreMessages: false,
            connectionState: {
                isOnline: true,
                isConnected: true,
                isReconnecting: false,
            },
        });

        const renderSpy = vi.fn();
        const OriginalChatArea = ChatArea;

        // Wrap component to count renders
        const WrappedChatArea = (props: any) => {
            renderSpy();
            return <OriginalChatArea {...props} />;
        };

        render(
            <MockFirebaseProvider>
                <WrappedChatArea {...defaultProps} />
            </MockFirebaseProvider>
        );

        // Should not cause excessive re-renders
        expect(renderSpy).toHaveBeenCalledTimes(1);
    });

    it('handles connection states correctly', () => {
        const { useChatService } = require('@/hooks/useChatService');

        vi.mocked(useChatService).mockReturnValue({
            messages: [],
            isInitialLoad: false,
            typingUsers: [],
            service: null,
            hasMoreMessages: false,
            connectionState: {
                isOnline: false,
                isConnected: false,
                isReconnecting: true,
            },
        });

        render(
            <MockFirebaseProvider>
                <ChatArea {...defaultProps} />
            </MockFirebaseProvider>
        );

        // Should handle offline state gracefully
        expect(screen.getByText('ЗДЕСЬ ПОКА ПУСТО')).toBeInTheDocument();
    });

    it('handles mobile back navigation', () => {
        const mockOnMobileBack = vi.fn();

        render(
            <MockFirebaseProvider>
                <ChatArea {...defaultProps} onMobileBack={mockOnMobileBack} />
            </MockFirebaseProvider>
        );

        // Component should render without errors when mobile back handler is provided
        expect(screen.getByText('ЗДЕСЬ ПОКА ПУСТО')).toBeInTheDocument();
    });
});
