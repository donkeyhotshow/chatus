/**
 * Lazy-loaded components for bundle optimization (Requirements: 16.3)
 * These components are loaded only when needed to reduce initial bundle size
 *
 * P2 Fix: Добавлены skeleton-загрузчики для улучшения UX при загрузке
 * Этап 8: Улучшенная предзагрузка с метриками и приоритетами
 */

import { lazy, Suspense, useEffect } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingStates';
import { ChatSkeleton } from '@/components/chat/ChatSkeleton';
import { GamesSkeleton, TicTacToeSkeleton } from '@/components/ui/skeletons/GamesSkeleton';
import { CanvasSkeleton } from '@/components/ui/skeletons/CanvasSkeleton';
import { isSlowConnection } from '@/lib/performance-config';

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
export const LazyPhysicsWorld = lazy(() => import('@/components/games/PhysicsWorld'));
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
    <LazyWrapper fallback={<GamesSkeleton />}>
        <LazyGameLobby {...props} />
    </LazyWrapper>
);

export const TicTacToe: React.FC<any> = (props) => (
    <LazyWrapper fallback={<TicTacToeSkeleton />}>
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
    <LazyWrapper fallback={<ChatSkeleton />}>
        <LazyCollaborationSpace {...props} />
    </LazyWrapper>
);

export const SharedCanvas: React.FC<any> = (props) => (
    <LazyWrapper fallback={<CanvasSkeleton />}>
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

// Preload functions for better UX - P2 Fix
export const preloadDoodlePad = () => import('@/components/chat/DoodlePad');
export const preloadPixelAvatarEditor = () => import('@/components/avatar/PixelAvatarEditor');
export const preloadGameLobby = () => import('@/components/games/GameLobby');
export const preloadCollaborationSpace = () => import('@/components/chat/CollaborationSpace');
export const preloadSharedCanvas = () => import('@/components/canvas/SharedCanvas');
export const preloadTicTacToe = () => import('@/components/games/TicTacToe');

/**
 * P2 Fix: Предзагрузка компонентов при наведении для ускорения переключения вкладок
 * Этап 8: Улучшенная предзагрузка с учётом скорости соединения
 */
export const preloadOnHover = (componentName: string) => {
    // Не предзагружаем на медленном соединении
    if (isSlowConnection()) {
        return () => Promise.resolve();
    }

    switch (componentName) {
        case 'doodle':
            return preloadDoodlePad;
        case 'avatar':
            return preloadPixelAvatarEditor;
        case 'games':
            // Предзагружаем и лобби игр и TicTacToe
            return () => Promise.all([preloadGameLobby(), preloadTicTacToe()]);
        case 'collaboration':
            // Предзагружаем CollaborationSpace и SharedCanvas
            return () => Promise.all([preloadCollaborationSpace(), preloadSharedCanvas()]);
        case 'canvas':
            return () => Promise.all([preloadCollaborationSpace(), preloadSharedCanvas()]);
        default:
            return () => Promise.resolve();
    }
};

/**
 * Этап 8: Предзагрузка критических компонентов при idle
 */
export function useIdlePreload() {
    useEffect(() => {
        if (isSlowConnection()) return;

        const preloadCritical = () => {
            // Предзагружаем Firebase модули
            import('firebase/firestore');
            import('firebase/database');
        };

        if ('requestIdleCallback' in window) {
            const id = requestIdleCallback(preloadCritical, { timeout: 3000 });
            return () => cancelIdleCallback(id);
        } else {
            const id = setTimeout(preloadCritical, 2000);
            return () => clearTimeout(id);
        }
    }, []);
}

/**
 * Этап 8: Компонент для предзагрузки при intersection
 */
export function PreloadOnVisible({
    children,
    preloadFn
}: {
    children: React.ReactNode;
    preloadFn: () => Promise<any>;
}) {
    useEffect(() => {
        if (isSlowConnection()) return;

        const timer = setTimeout(() => {
            preloadFn().catch(() => {});
        }, 500);

        return () => clearTimeout(timer);
    }, [preloadFn]);

    return <>{children}</>;
}
