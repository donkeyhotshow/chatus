"use client";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { X } from "lucide-react";
import Image from "next/image";
import { stickers } from "@/lib/stickers";

interface StickerPickerProps {
    onSelect: (stickerUrl: string) => void;
    onClose: () => void;
}

export function StickerPicker({ onSelect, onClose }: StickerPickerProps) {
  return (
    <div className="absolute bottom-20 left-4 right-4 md:left-6 md:w-96 z-50 bg-neutral-950 border border-white/10 rounded-xl shadow-2xl p-2 animate-in slide-in-from-bottom-5 duration-200">
       <div className="flex justify-end">
         <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white">
            <X className="w-4 h-4"/>
         </button>
       </div>
       <ScrollArea className="h-64 w-full">
            <div className="grid grid-cols-4 gap-2 p-4">
                {stickers.map((sticker, index) => (
                    <button 
                        key={index}
                        onClick={() => onSelect(sticker.src)}
                        className="p-1 rounded-lg hover:bg-white/20 transition-colors"
                    >
                        <Image src={sticker.src} alt={`Sticker ${index + 1}`} width={80} height={80} unoptimized />
                    </button>
                ))}
            </div>
            <ScrollBar orientation="vertical" />
       </ScrollArea>
    </div>
  );
}
