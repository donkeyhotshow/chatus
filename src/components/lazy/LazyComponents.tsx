/**
 * Lazy-loaded components for bundle optimization
 * These components are loaded only when needed to reduce initial bundle size
 */

import { lazy, Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingStates';

// Lazy load heavy components
export const LazyDoodlePad = lazy(() => import('@/components/chat/DoodlePad'));
export const LazyPixelAvatarEditor = lazy(() => import('@/components/profile/PixelAvatarEditor'));
export const LazyGameArea = lazy(() => import('@/components/games/GameArea'));
export const LazyTicTacToe = lazy(() => import('@/components/games/TicTacToe'));
export const LazyDrawingGame = lazy(() => import('@/components/games/DrawingGame'));
export const LazyCollaborationSpace = lazy(() => import('@/components/collaboration/CollaborationSpace'));
export const LazyCanvasEditor = lazy(() => import('@/components/canvas/CanvasEditor'));
export const LazyMessageSearch = lazy(() => import('@/components/chat/MessageSearch'));

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

export const GameArea: React.FC<any> = (props) => (
    <LazyWrapper fallback={
        <div className="flex items-center justify-center p-8">
            <div className="text-center space-y-3">
                <LoadingSpinner size="lg" />
                <p className="text-sm text-neutral-400">Загрузка игр...</p>
            </div>
        </div>
    }>
        <LazyGameArea {...props} />
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

export const DrawingGame: React.FC<any> = (props) => (
    <LazyWrapper fallback={
        <div className="flex items-center justify-center p-4">
            <div className="text-center space-y-2">
                <LoadingSpinner />
                <p className="text-xs text-neutral-400">Загрузка игры рисования...</p>
            </div>
        </div>
    }>
        <LazyDrawingGame {...props} />
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

export const CanvasEditor: React.FC<any> = (props) => (
    <LazyWrapper fallback={
        <div className="flex items-center justify-center p-8">
            <div className="text-center space-y-3">
                <LoadingSpinner size="lg" />
                <p className="text-sm text-neutral-400">Загрузка редактора холста...</p>
            </div>
        </div>
    }>
        <LazyCanvasEditor {...props} />
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
export const preloadPixelAvatarEditor = () => import('@/components/profile/PixelAvatarEditor');
export const preloadGameArea = () => import('@/components/games/GameArea');
export const preloadCollaborationSpace = () => import('@/components/collaboration/CollaborationSpace');

// Preload on user interaction
export const preloadOnHover = (componentName: string) => {
    switch (componentName) {
        case 'doodle':
            return preloadDoodlePad;
        case 'avatar':
            return preloadPixelAvatarEditor;
        case 'games':
            return preloadGameArea;
        case 'collaboration':
            return preloadCollaborationSpace;
        default:
            return () => Promise.resolve();
    }
};
