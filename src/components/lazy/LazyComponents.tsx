/**
 * Lazy-loaded components for bundle optimization (Requirements: 16.3)
 * These components are loaded only when needed to reduce initial bundle size
 */

import { lazy, Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingStates';

// Lazy load heavy components
export const LazyDoodlePad = lazy(() => import('@/components/chat/DoodlePad'));
export const LazyPixelAvatarEditor = lazy(() => import('@/components/avatar/PixelAvatarEditor').then(m => ({ default: m.PixelAvatarEditor })));
export const LazyGameLobby = lazy(() => import('@/components/games/GameLobby').then(m => ({ default: m.GameLobby })));
export const LazyTicTacToe = lazy(() => import('@/components/games/TicTacToe').then(m => ({ default: m.TicTacToe })));
export const LazyRockPaperScissors = lazy(() => import('@/components/games/RockPaperScissors').then(m => ({ default: m.RockPaperScissors })));
export const LazyCollaborationSpace = lazy(() => import('@/components/chat/CollaborationSpace').then(m => ({ default: m.CollaborationSpace })));
export const LazySharedCanvas = lazy(() => import('@/components/canvas/SharedCanvas').then(m => ({ default: m.SharedCanvas })));
export const LazyMessageSearch = lazy(() => import('@/components/chat/MessageSearch').then(m => ({ default: m.MessageSearch })));

// Additional game components for lazy loading
export const LazyClickWar = lazy(() => import('@/components/games/ClickWar').then(m => ({ default: m.ClickWar })));
export const LazyDiceRoll = lazy(() => import('@/components/games/DiceRoll').then(m => ({ default: m.DiceRoll })));
export const LazyPhysicsWorld = lazy(() => import('@/components/games/PhysicsWorld').then(m => ({ default: m.PhysicsWorld })));
export const LazyTowerDefense = lazy(() => import('@/components/games/TowerDefense').then(m => ({ default: m.TowerDefense })));

// Wrapper components with loading states
interface LazyWrapperProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

const LazyWrapper: React.FC<LazyWrapperProps> = ({
    children,
    fallback = <LoadingSpinner size="lg" className="mx-auto" />
}) => (
    <Suspense fallback={fallback}>
        {children}
    </Suspense>
);

// Wrapped lazy components with proper loading states
export const DoodlePad: React.FC<any> = (props) => (
    <LazyWrapper fallback={
        <div className="flex items-center justify-center p-8">
            <div className="text-center space-y-3">
                <LoadingSpinner size="lg" />
                <p className="text-sm text-neutral-400">Загрузка редактора рисования...</p>
            </div>
        </div>
    }>
        <LazyDoodlePad {...props} />
    </LazyWrapper>
);

export const PixelAvatarEditor: React.FC<any> = (props) => (
    <LazyWrapper fallback={
        <div className="flex items-center justify-center p-8">
            <div className="text-center space-y-3">
                <LoadingSpinner size="lg" />
                <p className="text-sm text-neutral-400">Загрузка редактора аватара...</p>
            </div>
        </div>
    }>
        <LazyPixelAvatarEditor {...props} />
    </LazyWrapper>
);

export const GameLobby: React.FC<any> = (props) => (
    <LazyWrapper fallback={
        <div className="flex items-center justify-center p-8">
            <div className="text-center space-y-3">
                <LoadingSpinner size="lg" />
                <p className="text-sm text-neutral-400">Загрузка игр...</p>
            </div>
        </div>
    }>
        <LazyGameLobby {...props} />
    </LazyWrapper>
);

export const TicTacToe: React.FC<any> = (props) => (
    <LazyWrapper fallback={
        <div className="flex items-center justify-center p-4">
            <div className="text-center space-y-2">
                <LoadingSpinner />
                <p className="text-xs text-neutral-400">Загрузка крестиков-ноликов...</p>
            </div>
        </div>
    }>
        <LazyTicTacToe {...props} />
    </LazyWrapper>
);

export const RockPaperScissors: React.FC<any> = (props) => (
    <LazyWrapper fallback={
        <div className="flex items-center justify-center p-4">
            <div className="text-center space-y-2">
                <LoadingSpinner />
                <p className="text-xs text-neutral-400">Загрузка камень-ножницы-бумага...</p>
            </div>
        </div>
    }>
        <LazyRockPaperScissors {...props} />
    </LazyWrapper>
);

export const CollaborationSpace: React.FC<any> = (props) => (
    <LazyWrapper fallback={
        <div className="flex items-center justify-center p-8">
            <div className="text-center space-y-3">
                <LoadingSpinner size="lg" />
                <p className="text-sm text-neutral-400">Загрузка пространства совместной работы...</p>
            </div>
        </div>
    }>
        <LazyCollaborationSpace {...props} />
    </LazyWrapper>
);

export const SharedCanvas: React.FC<any> = (props) => (
    <LazyWrapper fallback={
        <div className="flex items-center justify-center p-8">
            <div className="text-center space-y-3">
                <LoadingSpinner size="lg" />
                <p className="text-sm text-neutral-400">Загрузка редактора холста...</p>
            </div>
        </div>
    }>
        <LazySharedCanvas {...props} />
    </LazyWrapper>
);

export const MessageSearch: React.FC<any> = (props) => (
    <LazyWrapper fallback={
        <div className="flex items-center justify-center p-4">
            <div className="text-center space-y-2">
                <LoadingSpinner />
                <p className="text-xs text-neutral-400">Загрузка поиска...</p>
            </div>
        </div>
    }>
        <LazyMessageSearch {...props} />
    </LazyWrapper>
);

// Preload functions for better UX
export const preloadDoodlePad = () => import('@/components/chat/DoodlePad');
export const preloadPixelAvatarEditor = () => import('@/components/avatar/PixelAvatarEditor');
export const preloadGameLobby = () => import('@/components/games/GameLobby');
export const preloadCollaborationSpace = () => import('@/components/chat/CollaborationSpace');

// Preload on user interaction
export const preloadOnHover = (componentName: string) => {
    switch (componentName) {
        case 'doodle':
            return preloadDoodlePad;
        case 'avatar':
            return preloadPixelAvatarEditor;
        case 'games':
            return preloadGameLobby;
        case 'collaboration':
            return preloadCollaborationSpace;
        default:
            return () => Promise.resolve();
    }
};
