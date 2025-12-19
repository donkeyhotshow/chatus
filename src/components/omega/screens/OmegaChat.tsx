"use

import { memo, useState, useCallback } from 'react';
import { OmegaHeader } from '../OmegaHeader';
import { OmegaMessage, OmegaMessageSkeleton } from '../OmegaMessage';
import { OmegaInput } from '../OmegaInput';

const initialMessages = [
  { id: 1, text: "Привет! Как дела?", time: "10:30", isSent: false },
  { id: 2, text: "Отлично! Давай рисовать?", time: "10:32", isSent: true },
  { id: 3, text: "Конечно! Запускаю холст", time: "10:33", isSent: false },
  { id: 4, text: "Отлично, я уже подключился", time: "10:35", isSent: true },
];

export const OmegaChat = memo(function OmegaChat() {
  const [messages, setMessages] = useState(initialMessages);

  const handleSend = useCallback((text: string) => {
    const now = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
    setMessages(prev => [...prev, {
      id: Date.now(),
      text,
      time,
      isSent: true
    }]);
  }, []);

  return (
    <div className="omega-screen">
      <OmegaHeader
        title="Алексей"
        subtitle="В сети"
        showAvatar
        avatarLetter="А"
        showInfoButton
      />
      <div className="omega-content">
        <div className="omega-messages">
          {messages.map(msg => (
            <OmegaMessage key={msg.id} {...msg} />
          ))}
          <OmegaMessageSkeleton isSent={false} />
          <OmegaMessageSkeleton isSent={true} />
        </div>
      </div>
      <OmegaInput onSend={handleSend} />
      <style jsx>{`
        .omega-screen {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--omega-bg-primary);
        }
        .omega-content {
          flex: 1;
          overflow-y: auto;
        }
        .omega-messages {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
      `}</style>
    </div>
  );
});

export default OmegaChat;
