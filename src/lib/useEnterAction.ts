import { useEffect } from 'react'

/**
 * Fires `action` when the user presses Enter outside a form/textarea,
 * so screens with a primary CTA work without a click.
 */
export function useEnterAction(action: (() => void) | null, enabled = true) {
  useEffect(() => {
    if (!enabled || !action) return

    const run = action

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Enter' || e.defaultPrevented) return
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return

      const target = e.target
      if (!(target instanceof HTMLElement)) return

      const tag = target.tagName
      if (tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON' || tag === 'A') return
      if (target.isContentEditable) return
      if (target.closest('form')) return
      if (target.closest('[data-no-enter-action]')) return

      e.preventDefault()
      run()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [action, enabled])
}
