"use client";

import { useState, useEffect, useCallback } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Smile, Loader2 } from 'lucide-react';
import { StickerPack } from '@/lib/telegram/types';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';

interface StickerPickerProps {
  onSelect: (imageUrl: string) => void;
  onClose?: () => void;
}

export function StickerPicker({ onSelect, onClose }: StickerPickerProps) {
  const [packs, setPacks] = useState<StickerPack[]>([]);
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

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

  const currentPack = packs.find(p => p.shortName === selectedPack);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-[var(--text-muted)] hover:text-[var(--accent-primary)]"
          title="Стикеры"
          aria-label="Стикеры"
        >
          <Smile className="w-5 h-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        className="w-80 p-0 bg-[var(--bg-secondary)] border-[var(--border-primary)] shadow-xl"
      >
        <div className="p-3 border-b border-[var(--border-primary)] flex justify-between items-center">
          <span className="text-sm font-semibold text-[var(--text-primary)]">Стикеры</span>
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-primary)]" />}
        </div>

        {packs.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--text-muted)]">
            {isLoading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--accent-primary)]" />
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
            <ScrollArea className="h-72">
              <div className="p-2">
                {currentPack && (
                  <div className="grid grid-cols-4 gap-2">
                    {currentPack.stickers.map((sticker, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          onSelect(sticker.localPath);
                          setIsOpen(false);
                          onClose?.();
                        }}
                        className="relative aspect-square hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors p-1"
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
            </ScrollArea>

            {packs.length > 1 && (
              <div className="border-t border-[var(--border-primary)] p-1 bg-[var(--bg-tertiary)]">
                <div className="flex gap-1 overflow-x-auto">
                  {packs.map(pack => (
                    <button
                      key={pack.shortName}
                      type="button"
                      onClick={() => setSelectedPack(pack.shortName)}
                      className={`px-2 py-1 rounded ${
                        selectedPack === pack.shortName
                          ? 'bg-[var(--bg-secondary)]'
                          : 'hover:bg-[var(--bg-secondary)]/50'
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
      </PopoverContent>
    </Popover>
  );
}
