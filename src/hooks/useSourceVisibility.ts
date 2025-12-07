import type { SourceID } from "@shared/types"
import { currentSourcesAtom, hiddenSourcesAtom } from "~/atoms"

/**
 * Hook for managing source visibility in the current column
 * All changes are automatically persisted via the atom system
 */
export function useSourceVisibility() {
  const [currentSources, setCurrentSources] = useAtom(currentSourcesAtom)
  const [hiddenSources, setHiddenSources] = useAtom(hiddenSourcesAtom)

  const hideSource = useCallback((id: SourceID) => {
    // Remove from current sources
    setCurrentSources(currentSources.filter(s => s !== id))
    // Add to hidden sources if not already there
    if (!hiddenSources.includes(id)) {
      setHiddenSources([...hiddenSources, id])
    }
  }, [currentSources, setCurrentSources, hiddenSources, setHiddenSources])

  const showSource = useCallback((id: SourceID) => {
    // Add back to current sources if not already there
    if (!currentSources.includes(id)) {
      setCurrentSources([...currentSources, id])
    }
    // Remove from hidden sources
    setHiddenSources(hiddenSources.filter(s => s !== id))
  }, [currentSources, setCurrentSources, hiddenSources, setHiddenSources])

  const isHidden = useCallback((id: SourceID) => hiddenSources.includes(id), [hiddenSources])

  return {
    hideSource,
    showSource,
    isHidden,
    hiddenSources,
  }
}

/**
 * Hook for hiding a specific source from the current column
 */
export function useHideSource(id: SourceID) {
  const [currentSources, setCurrentSources] = useAtom(currentSourcesAtom)
  const [hiddenSources, setHiddenSources] = useAtom(hiddenSourcesAtom)

  const removeSource = useCallback(() => {
    // Remove from current sources
    setCurrentSources(currentSources.filter(s => s !== id))
    // Track as hidden
    if (!hiddenSources.includes(id)) {
      setHiddenSources([...hiddenSources, id])
    }
  }, [currentSources, setCurrentSources, id, hiddenSources, setHiddenSources])

  return { removeSource }
}
