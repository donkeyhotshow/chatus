import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MessageItem from '@/components/chat/MessageItem';
import type { Message } from '@/lib/types';

function createMessage(text: string): Message {
  return {
    id: 'm1',
    text,
    createdAt: { seconds: 1710000000 } as Message['createdAt'],
    user: { id: 'u1', name: 'User', avatar: '' },
    senderId: 'u1',
    reactions: [],
    delivered: true,
    seen: false,
    type: 'text',
  };
}

describe('MessageItem sanitization', () => {
  it('removes script tags from rendered message text', () => {
    render(
      <MessageItem
        message={createMessage('<script>alert(1)</script>safe')}
        isOwn={true}
        onReaction={vi.fn()}
        onDelete={vi.fn()}
        onImageClick={vi.fn()}
        onReply={vi.fn()}
      />
    );

    expect(screen.getByText('safe')).toBeInTheDocument();
    expect(document.querySelector('script')).toBeNull();
  });

  it('sanitizes javascript links in markdown', () => {
    const { container } = render(
      <MessageItem
        message={createMessage('[click](javascript:alert(1))')}
        isOwn={true}
        onReaction={vi.fn()}
        onDelete={vi.fn()}
        onImageClick={vi.fn()}
        onReply={vi.fn()}
      />
    );

    const link = container.querySelector('a');
    if (link) {
      const href = link.getAttribute('href')?.toLowerCase();
      expect(href ?? '').not.toMatch(/^\s*(javascript|data|vbscript):/i);
    }
  });
});
