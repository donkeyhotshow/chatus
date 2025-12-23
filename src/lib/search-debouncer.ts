/**
 * SearchDebouncer - Utility for debouncing search operat
 * Prevents UI freezing by debouncing input and canceling stale requests
 *
 * @module search-debouncer
 * Requirements: 21.1, 21.2, 21.3, 21.4
 */

export interface SearchState {
  query: string;
  isSearching: boolean;
  abortController: AbortController | null;
  lastRequestId: number;
}

export const SEARCH_DEBOUNCE_MS = 300;

/**
 * Creates a new search state object
 */
export function createSearchState(): SearchState {
  return {
    query: '',
    isSearching: false,
    abortController: null,
    lastRequestId: 0,
  };
}

/**
 * Cancels any pending search operation
 * @param state - Current search state
 * @returns Updated search state with canceled request
 */
export function cancelPendingSearch(state: SearchState): SearchState {
  if (state.abortController) {
    try {
      state.abortController.abort();
    } catch {
      // Ignore abort errors - controller may already be aborted
    }
  }
  return {
    ...state,
    abortController: null,
    isSearching: false,
  };
}

/**
 * Checks if a search request is stale (outdated)
 * @param requestId - The ID of the request to check
 * @param currentId - The current request ID
 * @returns true if the request is stale and should be ignored
 */
export function isSearchStale(requestId: number, currentId: number): boolean {
  return requestId !== currentId;
}

/**
 * Creates a debounced search function with automatic cancellation
 * @returns Object with search and cancel methods
 */
export function createSearchDebouncer<T>(): {
  search: (
    query: string,
    searchFn: (query: string, signal: AbortSignal) => T | Promise<T>,
    callback: (results: T | null, error?: Error) => void
  ) => void;
  cancel: () => void;
  getState: () => SearchState;
} {
  let state = createSearchState();
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const cancel = () => {
    // Clear any pending timeout
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    // Cancel any in-flight request
    state = cancelPendingSearch(state);
  };

  const search = <R extends T>(
    query: string,
    searchFn: (query: string, signal: AbortSignal) => R | Promise<R>,
    callback: (results: R | null, error?: Error) => void
  ) => {
    // Cancel any previous pending search
    cancel();

    // Update query in state
    state = { ...state, query };

    // If query is empty, return immediately with null results
    if (!query.trim()) {
      callback(null);
      return;
    }

    // Increment request ID for staleness checking
    const requestId = ++state.lastRequestId;

    // Create new AbortController for this request
    const abortController = new AbortController();
    state = {
      ...state,
      abortController,
      isSearching: true,
    };

    // Debounce the search execution
    timeoutId = setTimeout(async () => {
      // Check if this request is still current
      if (isSearchStale(requestId, state.lastRequestId)) {
        return;
      }

      try {
        const result = await Promise.resolve(searchFn(query, abortController.signal));

        // Check again after async operation
        if (isSearchStale(requestId, state.lastRequestId)) {
          return;
        }

        state = { ...state, isSearching: false };
        callback(result as R);
      } catch (error) {
        // Check if this was an abort error (expected when canceling)
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }

        // Check staleness before reporting error
        if (isSearchStale(requestId, state.lastRequestId)) {
          return;
        }

        state = { ...state, isSearching: false };
        callback(null, error instanceof Error ? error : new Error('Search failed'));
      }
    }, SEARCH_DEBOUNCE_MS);
  };

  const getState = () => state;

  return { search, cancel, getState };
}

/**
 * Type-safe wrapper for search results with error handling
 */
export interface SearchResult<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isStale: boolean;
}

/**
 * Creates an initial search result state
 */
export function createInitialSearchResult<T>(): SearchResult<T> {
  return {
    data: null,
    error: null,
    isLoading: false,
    isStale: false,
  };
}
