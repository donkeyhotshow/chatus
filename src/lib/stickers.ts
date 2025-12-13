import data from './stickers.json';

export type Sticker = {
  src: string;
};

export const stickers: Sticker[] = data.stickers;
