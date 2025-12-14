import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { soundService } from '@/services/games/GameSoundService';

type TutorialStep = {
  id: string;
  title: string;
  description: string;
  highlight?: any;
  action?: { type: string; validCells?: [number, number][] } | null;
  boardState?: (string | null)[][];
};

const tutorialSteps: TutorialStep[] = [
  {
    id: 'step1',
    title: 'Welcome to Tic-Tac-Toe!',
    description: 'The goal is to get 3 of your symbols in a row (horizontal, vertical, or diagonal).',
    highlight: null,
    action: null,
  },
  {
    id: 'step2',
    title: 'Make your first move',
    description: 'Click any cell to place your X',
    highlight: 'board',
    action: { type: 'click_cell', validCells: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]] },
  },
  {
    id: 'step3',
    title: 'Block your opponent',
    description: 'The opponent has 2 in a row. Block them!',
    highlight: [0, 1, 2],
    action: { type: 'click_cell', validCells: [[0, 2]] },
    boardState: [['O', 'O', null], [null, 'X', null], [null, null, null]],
  },
  {
    id: 'step4',
    title: 'Create a winning position',
    description: 'Set up a fork - two ways to win!',
    highlight: null,
    action: { type: 'click_cell', validCells: [[0, 0], [2, 2]] },
    boardState: [['X', 'O', 'O'], [null, 'X', null], [null, null, null]],
  },
  {
    id: 'step5',
    title: "You're ready!",
    description: 'Now try playing against a real opponent or AI.',
    highlight: null,
    action: null,
  },
];

export function TicTacToeTutorial({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [board, setBoard] = useState<(string | null)[][]>([[null, null, null], [null, null, null], [null, null, null]]);

  const step = tutorialSteps[currentStep];

  useEffect(() => {
    // If the next step has a boardState, set it
    if (tutorialSteps[currentStep]?.boardState) {
      setBoard(tutorialSteps[currentStep].boardState as (string | null)[][]);
    }
  }, [currentStep]);

  const hasValidCell = (row: number, col: number) => {
    if (!step.action || !step.action.validCells) return false;
    return step.action.validCells.some(([r, c]) => r === row && c === col);
  };

  const handleCellClick = (row: number, col: number) => {
    if (!step.action) return;

    const isValidMove = hasValidCell(row, col);

    if (isValidMove) {
      const newBoard = board.map((r) => [...r]);
      newBoard[row][col] = 'X';
      setBoard(newBoard);
      confetti({ particleCount: 50, spread: 50 });
      soundService.play('move');

      setTimeout(() => {
        if (currentStep < tutorialSteps.length - 1) {
          setCurrentStep((s) => s + 1);
        } else {
          onComplete();
        }
      }, 800);
    } else {
      soundService.play('error');
      // fallback: no-op
    }
  };

  return (
    <div className="tutorial-overlay fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="tutorial-content bg-white p-6 rounded-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-2">{step.title}</h2>
        <p className="mb-4">{step.description}</p>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {board.map((row, r) =>
            row.map((cell, c) => (
              <button
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                className="w-16 h-16 bg-gray-100 rounded text-2xl font-bold"
              >
                {cell}
              </button>
            ))
          )}
        </div>

        <div className="flex justify-between items-center">
          <div>Step {currentStep + 1} of {tutorialSteps.length}</div>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <button onClick={() => setCurrentStep((s) => s - 1)} className="px-3 py-1 bg-gray-200 rounded">Back</button>
            )}
            <button
              onClick={() => {
                if (currentStep === tutorialSteps.length - 1) onComplete();
                else setCurrentStep((s) => s + 1);
              }}
              className="px-3 py-1 bg-blue-500 text-white rounded"
            >
              {currentStep === tutorialSteps.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
 
