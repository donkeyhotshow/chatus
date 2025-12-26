"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Smile, Loader2, X } from 'lucide-react';
import { StickerPack } from '@/lib/telegram/types';
import Image from 'next/image';

interface StickerPickerProps {
  onSelect: (imageUrl: string) => void;
  onClose?: () => void;
}

export function StickerPicker({ onSelect, onClose }: StickerPickerProps) {
  const [packs, setPacks] = useState<StickerPack[]>([]);
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchPacks = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/stickers');
      const data = await response.json();
      if (Array.isArray(data)) {
        setPacks(data);
        if (data.length > 0 && !selectedPack) {
          setSelectedPack(data[0].shortName);
        }
      }
    } catch (error) {
      console.error('Failed to fetch sticker packs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, selectedPack]);

  useEffect(() => {
    if (isOpen && packs.length === 0) {
      fetchPacks();
    }
  }, [isOpen, packs.length, fetchPacks]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const currentPack = packs.find(p => p.shortName === selectedPack);

  const handleToggle = () => {
    setIsOpen(prev => !prev);
  };

  const handleSelect = (url: string) => {
    onSelect(url);
    setIsOpen(false);
    onClose?.();
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        className="p-2.5 rounded-xl text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-all duration-200 min-w-[44px] min-h-[44px]"
        title="Стикеры"
        aria-label="Стикеры"
        aria-expanded={isOpen}
      >
        <Smile className="w-5 h-5" />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 w-80 bg-black/95 border border-white/10 rounded-2xl shadow-2xl z-50 backdrop-blur-2xl overflow-hidden">
          {/* Header */}
          <div className="p-3 border-b border-white/10 flex justify-between items-center">
            <span className="text-sm font-semibold text-white">Стикеры</span>
            <div className="flex items-center gap-2">
              {isLoading && <Loader2 className="w-4 h-4 animate-spin text-violet-400" />}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          {packs.length === 0 ? (
            <div className="p-8 text-center text-sm text-white/50">
              {isLoading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
                  <span>Загрузка стикеров...</span>
                </div>
              ) : (
                <>
                  Нет загруженных стикеров.<br/>
                  Вставьте ссылку на пак в чат!
                </>
              )}
            </div>
          ) : (
            <div className="w-full">
              {/* Stickers Grid */}
              <div className="h-72 overflow-y-auto p-2">
                {currentPack && (
                  <div className="grid grid-cols-4 gap-2">
                    {currentPack.stickers.map((sticker, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelect(sticker.localPath)}
                        className="relative aspect-square hover:bg-white/10 rounded-lg transition-colors p-1"
                      >
                        <Image
                          src={sticker.localPath}
                          alt={sticker.emoji || 'sticker'}
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Pack Selector */}
              {packs.length > 1 && (
                <div className="border-t border-white/10 p-1 bg-white/5">
                  <div className="flex gap-1 overflow-x-auto">
                    {packs.map(pack => (
                      <button
                        key={pack.shortName}
                        type="button"
                        onClick={() => setSelectedPack(pack.shortName)}
                        className={`px-2 py-1 rounded-lg transition-colors ${
                          selectedPack === pack.shortName
                            ? 'bg-violet-500/20'
                            : 'hover:bg-white/10'
                        }`}
                      >
                        <div className="relative w-6 h-6">
                          {pack.stickers[0]?.localPath && (
                            <Image
                              src={pack.stickers[0].localPath}
                              alt={pack.title}
                              fill
                              className="object-contain"
                              unoptimized
                            />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
