'use client';

import { doc, getDoc, Firestore } from 'firebase/firestore';
import { Room, FirebaseError } from '@/lib/types';
import { logger } from '@/lib/logger';
import { isDemoMode } from '@/lib/demo-mode';

/**
 * Room validation and management service
 */
export class RoomService {
  constructor(private firestore: Firestore) {}

  /**
   * Validate that a room exists before joining
   * @returns Room data if exists, null otherwise
   */
  async validateRoom(roomId: string): Promise<Room | null> {
    // In demo mode, always return a mock room
    if (isDemoMode()) {
      return {
        id: roomId,
        participants: [],
        participantProfiles: [],
        createdAt: new Date(),
        lastUpdated: new Date(),
        settings: {}
      } as Room;
    }

    try {
      const roomRef = doc(this.firestore, 'rooms', roomId);
      const roomDoc = await getDoc(roomRef);
      
      if (!roomDoc.exists()) {
        return null;
      }
      
      return { id: roomId, ...roomDoc.data() } as Room;
    } catch (error) {
      const err = error as FirebaseError;
      // Suppress offline errors in demo mode or when client is offline
      if (isDemoMode() || 
          err.message?.includes('client is offline') ||
          err.message?.includes('Failed to get document') ||
          err.code === 'unavailable') {
        // Return mock room in demo mode or when offline
        if (isDemoMode()) {
          return {
            id: roomId,
            participants: [],
            participantProfiles: [],
            createdAt: new Date(),
            lastUpdated: new Date(),
            settings: {}
          } as Room;
        }
        return null;
      }
      logger.error('Error validating room', error as Error, { roomId });
      return null;
    }
  }

  /**
   * Check if room exists and is accessible
   */
  async roomExists(roomId: string): Promise<boolean> {
    const room = await this.validateRoom(roomId);
    return room !== null;
  }
}

