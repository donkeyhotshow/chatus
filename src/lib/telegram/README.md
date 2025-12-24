# Telegram Sticker Integration Module

This module allows users to import Telegram sticker packs into ChatUs by simply pasting a link.

## Features
- Parse Telegram sticker pack URLs (`https://t.me/addstickers/<name>`)
- Fetch sticker set details via Telegram Bot API
- Download sticker files locally (to `public/stickers`)
- API endpoints for importing and retrieving packs

## Setup

1. Add `TELEGRAM_BOT_TOKEN` to your `.env.local` file.
   ```
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   ```

## API Usage

### Import Sticker Pack
**POST** `/api/stickers/import`
```json
{
  "url": "https://t.me/addstickers/Animals"
}
```

**Response:**
```json
{
  "success": true,
  "pack": {
    "shortName": "Animals",
    "title": "Animals",
    "stickerCount": 20,
    "stickers": [
      {
        "fileId": "...",
        "localPath": "/stickers/Animals/sticker_0.webp",
        "emoji": "🐱"
      }
    ]
  }
}
```

### Get Sticker Pack
**GET** `/api/stickers/<shortName>`

## Frontend Integration Guide

To integrate this into the frontend:

1. **Detect Link**: In `ChatArea` or `MessageInput`, listen for pasted links matching `https://t.me/addstickers/`.
2. **Call Import API**:
   ```typescript
   const response = await fetch('/api/stickers/import', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ url: pastedUrl })
   });
   const data = await response.json();
   ```
3. **Show Preview**: Display the first few stickers from `data.pack.stickers`.
4. **Sticker Picker**: Add a UI component that lists available packs (fetched from backend) and allows selecting a sticker to send as an image message.

## Notes
- Stickers are currently saved to the local filesystem (`public/stickers`). In a production serverless environment (like Vercel), this filesystem is ephemeral. For production, update `TelegramStickerService.ts` to upload to Firebase Storage or S3.
- Only the first 20 stickers are downloaded to prevent timeouts.
