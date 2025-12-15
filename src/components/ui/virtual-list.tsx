'use client'

import { memo, useMemo, useCallback } from 'react'
import { Virtuoso, VirtuosoGrid } from 'react-virtuoso'
import { cn } from '@/lib/utils'

interface VirtualListProps<T> {
    items: T[]
    renderItem: (item: T, index: number) => React.ReactNode
    className?: string
    height?: number
    itemHeight?: number
    overscan?: number
    onEndReached?: () => void
    loading?: boolean
    loadingComponent?: React.ReactNode
}

// Виртуализированный список для больших данных
export const VirtualList = memo(<T,>({
    items,
    renderItem,
    className,
    height = 400,
    itemHeight,
    overscan = 5,
    onEndReached,
    loading = false,
    loadingComponent
}: VirtualListProps<T>) => {
    const itemRenderer = useCallback((index: number) => {
        const item = items[index]
        if (!item) return null
        return renderItem(item, index)
    }, [items, renderItem])

    const endReached = useCallback(() => {
        if (!loading && onEndReached) {
            onEndReached()
        }
    }, [loading, onEndReached])

    const footer = useMemo(() => {
        if (loading && loadingComponent) {
            return () => loadingComponent
        }
        return undefined
    }, [loading, loadingComponent])

    return (
        <div className={cn('w-full', className)} style={{ height }}>
            <Virtuoso
                totalCount={items.length}
                itemContent={itemRenderer}
                overscan={overscan}
                endReached={endReached}
                footer={footer}
                {...(itemHeight && { fixedItemHeight: itemHeight })}
            />
        </div>
    )
})

VirtualList.displayName = 'VirtualList'

interface VirtualGridProps<T> {
    items: T[]
    renderItem: (item: T, index: number) => React.ReactNode
    className?: string
    height?: number
    itemWidth?: number
    itemHeight?: number
    columns?: number
    gap?: number
    onEndReached?: () => void
    loading?: boolean
}

// Виртуализированная сетка
export const VirtualGrid = memo(<T,>({
    items,
    renderItem,
    className,
    height = 400,
    itemWidth = 200,
    itemHeight = 200,
    columns = 3,
    gap = 16,
    onEndReached,
    loading = false
}: VirtualGridProps<T>) => {
    const itemRenderer = useCallback((index: number) => {
        const item = items[index]
        if (!item) return null
        return (
            <div
                style={{
                    width: itemWidth,
                    height: itemHeight,
                    margin: gap / 2
                }}
            >
                {renderItem(item, index)}
            </div>
        )
    }, [items, renderItem, itemWidth, itemHeight, gap])

    const endReached = useCallback(() => {
        if (!loading && onEndReached) {
            onEndReached()
        }
    }, [loading, onEndReached])

    return (
        <div className={cn('w-full', className)} style={{ height }}>
            <VirtuosoGrid
                totalCount={items.length}
                itemContent={itemRenderer}
                endReached={endReached}
                overscan={200}
                listClassName="grid"
                style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${columns}, 1fr)`,
                    gap: `${gap}px`,
                    padding: `${gap}px`
                }}
            />
        </div>
    )
})

VirtualGrid.displayName = 'VirtualGrid'
