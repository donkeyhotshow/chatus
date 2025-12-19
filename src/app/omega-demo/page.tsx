"use client";

import { useState, useCallback } from 'react';
import { OmegaBottomNav, OmegaTab } from '@/components/layout/OmegaBottomNav';
import { OmegaChatBubble } from '@/components/chat/OmegaChatBubble';
import { OmegaChatSkeleton } from '@/components/chat/OmegaChatSkeleton';
import { OmegaMessageInput } from '@/components/chat/OmegaMessageInput';
import { OmegaDrawingToolbar, DrawingTool, BrushSize } from '@/components/canvas/OmegaDrawingToolbar';
import { OmegaTicTacToeHUD } from '@/components/games/OmegaTicTacToeHUD';
import { OmegaGlassCard } from '@/components/ui/OmegaGlassCard';
import { User, Bell, Moon, Shield, HelpCircle, LogOut } from 'lucide-react';

const demoMessages = [
  { id: 1, message: "Hey! How's it going? 👋", timestamp: "14:32", isOwn: false },
  { id: 2,"Pretty good! Just finished the new design", timestamp: "14:33", isOwn: true, status: 'read' as const },
  { id: 3, message: "Oh nice! Can't wait to see it", timestamp: "14:33", isOwn: false },
  { id: 4, message: "Check out the drawing mode ✨", timestamp: "14:35", isOwn: true, status: 'delivered' as const },
  { id: 5, message: "The glassmorphism looks amazing!", timestamp: "14:36", isOwn: false },
];

export default function OmegaDemoPage() {
  const [activeTab, setActiveTab] = useState<OmegaTab>('chat');
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const [activeTool, setActiveTool] = useState<DrawingTool>('brush');
  const [activeColor, setActiveColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState<BrushSize>('medium');

  const handleSendMessage = useCallback((message: string) => {
    console.log('Send:', message);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <header
        className="fixed top-0 left-0 right-0 z-50 safe-top"
        style={{
          background: 'rgba(10, 10, 10, 0.9)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex      -center justify-center"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
            >
              <span className="text-white font-bold text-sm">CU</span>
            </div>
            <div>
              <h1 className="text-white font-semibold text-base">ChatUs-Omega</h1>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: '#8b5cf6', boxShadow: '0 0 8px rgba(139, 92, 246, 0.6)' }}
                />
                <span className="text-xs text-[#6b7280]">Partner online</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-14 pb-[166px]">
        {activeTab === 'chat' && (
          <div className="flex flex-col p-4">
            {showSkeleton ? (
              <OmegaChatSkeleton count={6} />
            ) : (
              demoMessages.map((msg) => (
                <OmegaChatBubble key={msg.id} {...msg} />
              ))
            )}
            <OmegaGlassCard variant="mobile" className="mt-6 p-4">
              <p className="text-sm text-[#6b7280] mb-3">Demo Controls:</p>
              <button
                onClick={() => setShowSkeleton(!showSkeleton)}
                className="px-4 py-2 rounded-lg text-sm"
                style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}
              >
                {showSkeleton ? 'Show Messages' : 'Show Skeleton'}
              </button>
            </OmegaGlassCard>
          </div>
        )}

        {activeTab === 'draw' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
            <OmegaGlassCard variant="deep" accentColor="amber" className="p-6 text-center">
              <h2 className="text-xl font-semibold text-white mb-2">Drawing Canvas</h2>
              <p className="text-[#6b7280] text-sm mb-4">Infinite collaborative whiteboard</p>
              <div
                className="w-full h-48 rounded-xl mb-4"
                style={{ background: 'rgba(10, 10, 10, 0.5)', border: '1px dashed rgba(245, 158, 11, 0.3)' }}
              />
            </OmegaGlassCard>
            <OmegaDrawingToolbar
              activeTool={activeTool}
              activeColor={activeColor}
              brushSize={brushSize}
              onToolChange={setActiveTool}
              onColorChange={setActiveColor}
              onBrushSizeChange={setBrushSize}
              onUndo={() => {}}
              onRedo={() => {}}
              onClear={() => {}}
            />
          </div>
        )}

        {activeTab === 'games' && (
          <div className="flex flex-col gap-4 p-4">
            <h2 className="text-lg font-semibold text-white">Games</h2>
            <OmegaGlassCard variant="neon" accentColor="violet" hover className="p-4" onClick={() => setShowGame(true)}>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(139, 92, 246, 0.2)' }}>
                  <span className="text-2xl">⭕</span
                </div>
                <div>
                  <h3 className="text-white font-medium">Tic Tac Toe</h3>
                  <p className="text-sm text-[#6b7280]">Classic game for two</p>
                </div>
              </div>
            </OmegaGlassCard>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="flex flex-col gap-4 p-4">
            <OmegaGlassCard variant="deep" className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-white font-semibold text-lg">Your Profile</h2>
                  <p className="text-sm text-[#6b7280]">Tap to edit</p>
                </div>
              </div>
            </OmegaGlassCard>
            <OmegaGlassCard variant="mobile" className="divide-y divide-white/5">
              {[
                { icon: Bell, label: 'Notifications', color: '#10b981' },
                { icon: Moon, label: 'Appearance', color: '#8b5cf6' },
                { icon: Shield, label: 'Privacy', color: '#f59e0b' },
              ].map((item) => (
                <button key={item.label} className="flex items-center gap-4 w-full p-4 hover:bg-white/5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${item.color}20` }}>
                    <item.icon className="w-5 h-5" style={{ color: item.color }} />
                  </div>
                  <span className="text-white">{item.label}</span>
                </button>
              ))}
            </OmegaGlassCard>
          </div>
        )}
      </main>

      {activeTab === 'chat' && (
        <OmegaMessageInput onSend={handleSendMessage} onAttachment={() => {}} onVoice={() => {}} onEmoji={() => {}} />
      )}

      <OmegaBottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      <OmegaTicTacToeHUD isVisible={showGame} onClose={() => setShowGame(false)} />
    </div>
  );
}
