import { test } from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import { handleDialogKey, createBackdropDismiss } from '../src/house/dialogControls.ts'

test('E activates the focused dialogue choice and never bubbles to room controls', () => {
  const dom = new JSDOM('<dialog open><button aria-label="Close dialog">Close</button><a href="https://example.com">Project</a><button data-advance>Continue</button></dialog>')
  const { document, KeyboardEvent } = dom.window
  const dialog = document.querySelector('dialog'), link = dialog.querySelector('a'), next = dialog.querySelector('[data-advance]')
  let choices = 0, continues = 0, worldKeys = 0
  link.addEventListener('click', event => { event.preventDefault(); choices++ })
  next.addEventListener('click', () => continues++)
  dom.window.addEventListener('keydown', () => worldKeys++)
  dialog.addEventListener('keydown', event => handleDialogKey(event, dialog, () => continues++))
  const press = (key, repeat = false) => document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key, repeat, bubbles: true, cancelable: true }))
  link.focus(); press('e')
  assert.equal(choices, 1)
  assert.equal(continues, 0)
  press('e', true)
  assert.equal(choices, 1, 'holding E does not open multiple tabs')
  press('ArrowDown')
  assert.equal(document.activeElement, next, 'Continue participates in arrow navigation')
  press('E')
  assert.equal(continues, 1)
  press('ArrowDown')
  assert.equal(document.activeElement, link, 'choices wrap back to the first link')
  assert.equal(worldKeys, 0)
  dom.window.close()
})

test('E also selects house menu buttons; Enter and Space use the same focused action', () => {
  const dom = new JSDOM('<dialog open><button>Baby</button><button>Car</button></dialog>')
  const { document, KeyboardEvent } = dom.window, dialog = document.querySelector('dialog')
  const buttons = dialog.querySelectorAll('button')
  let selected = 0, worldKeys = 0
  buttons[1].addEventListener('click', () => selected++)
  dom.window.addEventListener('keydown', () => worldKeys++)
  dialog.addEventListener('keydown', event => handleDialogKey(event, dialog, () => {}))
  buttons[1].focus()
  for (const key of ['e', 'Enter', ' ']) buttons[1].dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
  assert.equal(selected, 3)
  assert.equal(worldKeys, 0)
  dom.window.close()
})

test('Escape runs the exact X-button action and does not activate a choice', () => {
  const dom = new JSDOM('<dialog open><button aria-label="Close dialog">X</button><a href="https://example.com">Project</a></dialog>')
  const { document, KeyboardEvent } = dom.window, dialog = document.querySelector('dialog')
  let closes = 0, choices = 0, leakedKeys = 0
  dialog.querySelector('button').addEventListener('click', () => closes++)
  dialog.querySelector('a').addEventListener('click', event => { event.preventDefault(); choices++ })
  dom.window.addEventListener('keydown', () => leakedKeys++)
  dialog.addEventListener('keydown', event => handleDialogKey(event, dialog, () => choices++))
  const link = dialog.querySelector('a'); link.focus()
  const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
  link.dispatchEvent(escape)
  assert.equal(closes, 1)
  assert.equal(choices, 0)
  assert.equal(leakedKeys, 0)
  assert.ok(escape.defaultPrevented, 'native dialog cancellation cannot diverge from X')
  dom.window.close()
})

test('the gesture opening a dialogue cannot also dismiss it', () => {
  const dom = new JSDOM('<canvas></canvas><dialog><button>Continue</button></dialog>')
  const dialog = dom.window.document.querySelector('dialog'), button = dialog.querySelector('button')
  dialog.getBoundingClientRect = () => ({ left: 10, right: 200, top: 100, bottom: 200 })
  const backdrop = createBackdropDismiss()
  let closes = 0
  const click = target => backdrop.click({ target, currentTarget: dialog }, () => closes++)
  // A click retargeted to a newly opened dialog has no backdrop pointer-down.
  click(dialog)
  assert.equal(closes, 0)
  backdrop.pointerDown({ target: dialog, currentTarget: dialog, clientX: 50, clientY: 150 })
  click(dialog)
  assert.equal(closes, 0, 'clicking dialog padding keeps it open')
  backdrop.pointerDown({ target: button, currentTarget: dialog, clientX: 50, clientY: 150 })
  click(dialog)
  assert.equal(closes, 0, 'dragging out of dialogue content does not dismiss')
  backdrop.pointerDown({ target: dialog, currentTarget: dialog, clientX: 0, clientY: 0 })
  click(dialog)
  assert.equal(closes, 1, 'a fresh backdrop tap closes normally')
  click(dialog)
  assert.equal(closes, 1, 'the completed gesture is cleared')
  dom.window.close()
})
