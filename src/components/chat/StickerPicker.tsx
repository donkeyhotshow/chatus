"use client";

import { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Smile, Loader2 } from 'lucide-react';
import { StickerPack } from '@/lib/telegram/types';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface StickerPickerProps {
  onSelect: (imageUrl: string) => void;
}

export function StickerPicker({ onSelect }: StickerPickerProps) {
  const [packs, setPacks] = useState<StickerPack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPacks();
    }
  }, [isOpen]);

  const fetchPacks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stickers');
      const data = await response.json();
      if (Array.isArray(data)) {
        setPacks(data);
      }
    } catch (error) {
      console.error('Failed to fetch sticker packs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-[var(--text-muted)] hover:text-[var(--accent-primary)]"
          title="Стикеры"
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

        {packs.length === 0 && !isLoading ? (
          <div className="p-8 text-center text-sm text-[var(--text-muted)]">
            Нет загруженных стикеров.<br/>
            Вставьте ссылку на пак в чат!
          </div>
        ) : (
          <Tabs defaultValue={packs[0]?.shortName} className="w-full">
            <ScrollArea className="h-72">
              {packs.map(pack => (
                <TabsContent key={pack.shortName} value={pack.shortName} className="m-0 p-2">
                  <div className="grid grid-cols-4 gap-2">
                    {pack.stickers.map((sticker, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          onSelect(sticker.localPath);
                          setIsOpen(false);
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
                </TabsContent>
              ))}
            </ScrollArea>
            
            <div className="border-t border-[var(--border-primary)] p-1 bg-[var(--bg-tertiary)]">
              <ScrollArea className="w-full" orientation="horizontal">
                <TabsList className="bg-transparent h-10 justify-start">
                  {packs.map(pack => (
                    <TabsTrigger 
                      key={pack.shortName} 
                      value={pack.shortName}
                      className="px-2 py-1 data-[state=active]:bg-[var(--bg-secondary)]"
                    >
                      <div className="relative w-6 h-6">
                        <Image
                          src={pack.stickers[0]?.localPath}
                          alt={pack.title}
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </ScrollArea>
            </div>
          </Tabs>
        )}
      </PopoverContent>
    </Popover>
  );
}
