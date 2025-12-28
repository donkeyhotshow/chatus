"use client";

import { useState, useEffect, useCallback } from 're;

interface GameHighScores {
  vibeJet: number;
  snakeGame: number;
  carRace: number;
  clickWar: number;
  ticTacToe: { wins: number; losses: number };
}

const DEFAULT_SCORES: GameHighScores = {
  vibeJet: 0,
  snakeGame: 0,
  carRace: 0,
  clickWar: 0,
  ticTacToe: { wins: 0, losses: 0 },
};

const STORAGE_KEYS = {
  vibeJet: 'vibejet-highscore',
  snakeGame: 'snake-highscore',
  carRace: 'carrace-besttime',
  clickWar: 'clickwar-highscore',
  ticTacToe: 'tictactoe-stats',
};

/**
 * P2 FIX: Hook to get and manage game high scores from localStorage
 */
export function useGameHighScores() {
  const [scores, setScores] = useState<GameHighScores>(DEFAULT_SCORES);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load scores from localStorage
  useEffect(() => {
    try {
      const vibeJet = parseInt(localStorage.getItem(STORAGE_KEYS.vibeJet) || '0', 10);
      const snakeGame = parseInt(localStorage.getItem(STORAGE_KEYS.snakeGame) || '0', 10);
      const carRace = parseFloat(localStorage.getItem(STORAGE_KEYS.carRace) || '0');
      const clickWar = parseInt(localStorage.getItem(STORAGE_KEYS.clickWar) || '0', 10);

      let ticTacToe = DEFAULT_SCORES.ticTacToe;
      try {
        const tttStats = localStorage.getItem(STORAGE_KEYS.ticTacToe);
        if (tttStats) {
          ticTacToe = JSON.parse(tttStats);
        }
      } catch {
        // Ignore parse errors
      }

      setScores({
        vibeJet,
        snakeGame,
        carRace,
        clickWar,
        ticTacToe,
      });
    } catch {
      // Ignore storage errors
    }
    setIsLoaded(true);
  }, []);

  // Update a specific game score
  const updateScore = useCallback((game: keyof GameHighScores, score: number | { wins: number; losses: number }) => {
    try {
      if (game === 'ticTacToe' && typeof score === 'object') {
        localStorage.setItem(STORAGE_KEYS.ticTacToe, JSON.stringify(score));
        setScores(prev => ({ ...prev, ticTacToe: score }));
      } else if (typeof score === 'number') {
        const key = STORAGE_KEYS[game as keyof typeof STORAGE_KEYS];
        if (key) {
          localStorage.setItem(key, score.toString());
          setScores(prev => ({ ...prev, [game]: score }));
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Get formatted score for display
  const getFormattedScore = useCallback((game: keyof GameHighScores): string | null => {
    const score = scores[game];

    if (game === 'ticTacToe' && typeof score === 'object') {
      const { wins, losses } = score;
      if (wins === 0 && losses === 0) return null;
      return `${wins}W / ${losses}L`;
    }

    if (typeof score === 'number') {
      if (score === 0) return null;

      if (game === 'carRace') {
        return `${score.toFixed(2)}s`;
      }

      return score.toString();
    }

    return null;
  }, [scores]);

  // Check if a score is a new high score
  const isNewHighScore = useCallback((game: keyof GameHighScores, newScore: number): boolean => {
    const currentScore = scores[game];

    if (typeof currentScore === 'number') {
      // For car race, lower is better
      if (game === 'carRace') {
        return currentScore === 0 || newScore < currentScore;
      }
      // For other games, higher is better
      return newScore > currentScore;
    }

    return false;
  }, [scores]);

  return {
    scores,
    isLoaded,
    updateScore,
    getFormattedScore,
    isNewHighScore,
  };
}

export default useGameHighScores;
