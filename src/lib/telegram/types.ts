export interface TelegramSticker {
  file_id: string;
  file_unique_id: string;
  type: 'regular' | 'mask' | 'custom_emoji';
  width: number;
  height: number;
  is_animated: boolean;
  is_video: boolean;
  thumbnail?: TelegramPhotoSize;
  emoji?: string;
  set_name?: string;
  file_size?: number;
}

export interface TelegramPhotoSize {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  file_size?: number;
}

export interface TelegramStickerSet {
  name: string;
  title: string;
  sticker_type: 'regular' | 'mask' | 'custom_emoji';
  is_animated: boolean;
  is_video: boolean;
  stickers: TelegramSticker[];
  thumbnail?: TelegramPhotoSize;
}

export interface TelegramFile {
  file_id: string;
  file_unique_id: string;
  file_size?: number;
  file_path?: string;
}

export interface StickerPack {
  shortName: string;
  title: string;
  stickerCount: number;
  stickers: {
    fileId: string;
    localPath: string;
    emoji?: string;
  }[];
}

export interface ImportStickerPackRequest {
  url: string;
}

export interface ImportStickerPackResponse {
  success: boolean;
  pack?: StickerPack;
  error?: string;
}
