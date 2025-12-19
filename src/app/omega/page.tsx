"use client";

import { useState, useCallback } from 'react';
import { OmegaChat } from '@/components/omega/screens/OmegaChat';
import { OmegaDraw } from '@/components/omega/screens/OmegaDraw';
import { OmegaGames } from '@/components/omega/screens/OmegaGames';
import { OmegaSettings } from '@/components/omega/screens/OmegaSettings';
import { OmegaBottomNav, OmegaTab } from '@/components/omega/OmegaBottomNav';
import '@/components/omega/omega.css';

export default function OmegaPage() {
  const [activeTab, setActiveTab] = useState<OmegaTab>('chat');
  const [showGame, setShowGame] = useState<string | null>(null);

  const handleTabChange = useCallback((tab: OmegaTab) => {
    setActiveTab(tab);
    setShowGame(null);
  }, []);

  const handleStartGame = useCallback((game: string) => {
    setShowGame(game);
  }, []);

  const handleCloseGame = useCallback(() => {
    setShowGame(null);
  }, []);

  return (
    <div className="omega-app">
      <div className="omega-container">
        <div className="omega-screen-container">
          {activeTab === 'chat' && <OmegaChat />}
          {activeTab === 'draw' && <OmegaDraw />}
          {activeTab === 'games' && (
            <OmegaGames
              activeGame={showGame}
              onStartGame={handleStartGame}
              onCloseGame={handleCloseGame}
            />
          )}
          {activeTab === 'settings' && <OmegaSettings />}
        </div>
        <OmegaBottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    </div>
  );
}
