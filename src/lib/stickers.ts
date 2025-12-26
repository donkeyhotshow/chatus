import data from './stickers.json';

export type Sticker = {
  localPath: string;
  emoji: string;
};

export type StickerPack = {
  shortName: string;
  title: string;
  stickerCount: number;
  stickers: Sticker[];
};

export const stickerPacks: StickerPack[] = data.packs;

// Flatten all stickers for backward compatibility
export const stickers: Sticker[] = data.packs.flatMap(pack => pack.stickers);
