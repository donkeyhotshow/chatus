import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileNavigation } from '@/components/mobile/MobileNavigation';

// Mock hooks
vi.mock('@/hooks/use-sound-design', () => ({
    useSoundDesign: () => ({
        playSound: vi.fn(),
        triggerHaptic: vi.fn()
    })
}));

vi.mock('@/hooks/use-mobile', () => ({
    useIsMobile: () => true
}));

describe('MobileNavigation', () => {
    const defaultProps = {
        activeTab: 'chat' as const,
        onTabChange: vi.fn(),
        isCollabSpaceVisible: false,
        onToggleCollabSpace: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders all navigation tabs', () => {
        render(<MobileNavigation {...defaultProps} />);

        expect(screen.getByText('Чат')).toBeInTheDocument();
        expect(screen.getByText('Игры')).toBeInTheDocument();
        expect(screen.getByText('Холст')).toBeInTheDocument();
        expect(screen.getByText('Люди')).toBeInTheDocument();
    });

    it('calls onTabChange when tab is clicked', () => {
        const onTabChange = vi.fn();
        render(<MobileNavigation {...defaultProps} onTabChange={onTabChange} />);

        fireEvent.click(screen.getByText('Игры'));
        expect(onTabChange).toHaveBeenCalledWith('games');
    });

    it('shows notification badge when unreadCount > 0', () => {
        render(<MobileNavigation {...defaultProps} unreadCount={5} />);

        expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('shows 99+ for unread count over 99', () => {
        render(<MobileNavigation {...defaultProps} unreadCount={150} />);

        expect(screen.getByText('99+')).toBeInTheDocument();
    });

    it('highlights active tab', () => {
        render(<MobileNavigation {...defaultProps} activeTab="games" />);

        const gamesTab = screen.getByText('Игры').closest('button');
        expect(gamesTab).toHaveClass('text-cyan-300');
    });

    it('shows typing indicator when isTyping is true', () => {
        render(<MobileNavigation {...defaultProps} isTyping={true} />);

        // Check for typing indicator (green dot)
        const typingIndicator = document.querySelector('.bg-green-400');
        expect(typingIndicator).toBeInTheDocument();
    });
});
