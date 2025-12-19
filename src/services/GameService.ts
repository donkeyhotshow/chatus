'use client';

import { Firestore, collection, onSnapshot, doc, setDoc, deleteDoc } from "firebase/firestore";
import { GameState } from "@/lib/types";
import { isDemoMode } from "@/lib/demo-mode";
import { logger } from "@/lib/logger";

export class GameService {
    private firestore: Firestore;
    private roomId: string;

    public gameStates: { [gameId: string]: GameState } = {};

    private gamesUnsub: (() => void) | null = null;
    private notifyCallback: () => void;

    constructor(roomId: string, firestore: Firestore, notifyCallback: () => void) {
        this.roomId = roomId;
        this.firestore = firestore;
        this.notifyCallback = notifyCallback;
    }

    initListeners() {
        if (isDemoMode()) {
            this.gameStates = {};
            this.notifyCallback();
            return;
        }

        const gamesCol = collection(this.firestore, 'rooms', this.roomId, 'games');
        this.gamesUnsub = onSnapshot(gamesCol, (snapshot) => {
            const games: { [gameId: string]: GameState } = {};
            snapshot.docs.forEach(doc => {
                games[doc.id] = doc.data() as GameState;
            });
            this.gameStates = games;
            this.notifyCallback();
        }, (error) => {
            logger.error("Games listener error", error);
        });
    }

    async updateGameState(gameId: string, newState: Partial<GameState>) {
        if (isDemoMode()) {
            this.gameStates[gameId] = { ...this.gameStates[gameId], ...newState } as GameState;
            this.notifyCallback();
            return;
        }

        const gameRef = doc(this.firestore, 'rooms', this.roomId, 'games', gameId);
        await setDoc(gameRef, newState, { merge: true });
    }

    async deleteGame(gameId: string) {
        if (isDemoMode()) {
            delete this.gameStates[gameId];
            this.notifyCallback();
            return;
        }

        await deleteDoc(doc(this.firestore, 'rooms', this.roomId, 'games', gameId));
    }

    disconnect() {
        if (this.gamesUnsub) {
            this.gamesUnsub();
            this.gamesUnsub = null;
        }
        this.gameStates = {};
    }
}
