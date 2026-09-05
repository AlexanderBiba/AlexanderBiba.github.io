/** Own all game keys while a dialog is open; never let them reach the scene. */
export function handleDialogKey(
  event: { key: string; repeat: boolean; preventDefault(): void; stopPropagation(): void },
  dialog: HTMLElement,
  advance: () => void,
) {
  const key = event.key.toLowerCase()
  if (key === 'escape') {
    event.preventDefault(); event.stopPropagation()
    if (!event.repeat) dialog.querySelector<HTMLButtonElement>('[aria-label="Close dialog"]')?.click()
    return
  }
  const selectionKeys = ['arrowdown', 'arrowup']
  const actionKeys = ['e', 'enter', ' ']
  if (![...selectionKeys, ...actionKeys, 'arrowleft', 'arrowright'].includes(key)) return
  event.preventDefault()
  event.stopPropagation()
  if (event.repeat && actionKeys.includes(key)) return
  const options = Array.from(dialog.querySelectorAll<HTMLElement>('a[href], button:not([aria-label="Close dialog"])'))
  const focused = dialog.ownerDocument.activeElement as HTMLElement | null
  if (selectionKeys.includes(key) && options.length) {
    const index = options.indexOf(focused!)
    const next = index < 0 ? (key === 'arrowdown' ? 0 : options.length - 1)
      : (index + (key === 'arrowdown' ? 1 : -1) + options.length) % options.length
    options[next].focus()
    options[next].scrollIntoView?.({ block: 'nearest' })
  } else if (actionKeys.includes(key)) {
    if (focused && dialog.contains(focused) && focused.matches('a[href], button')) focused.click()
    else advance()
  }
}

/** Only dismiss for a complete gesture that began on the open backdrop. */
export function createBackdropDismiss() {
  let startedOnBackdrop = false
  return {
    pointerDown(event: { target: EventTarget | null; currentTarget: HTMLElement; clientX: number; clientY: number }) {
      const rect = event.currentTarget.getBoundingClientRect()
      startedOnBackdrop = event.target === event.currentTarget &&
        (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)
    },
    click(event: { target: EventTarget | null; currentTarget: HTMLElement }, close: () => void) {
      const dismiss = startedOnBackdrop && event.target === event.currentTarget
      startedOnBackdrop = false
      if (dismiss) close()
    },
    cancel() { startedOnBackdrop = false },
  }
}
