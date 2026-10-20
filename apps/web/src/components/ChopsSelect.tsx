import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import './ChopsSelect.css'

type SelectOption = { value: string; label: string }

type ChopsSelectProps = {
  id?: string
  ariaLabel: string
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  compact?: boolean
}

export default function ChopsSelect({
  id, ariaLabel, value, options, onChange, compact = false,
}: ChopsSelectProps) {
  const [open, setOpen] = useState(false)
  const [focusIndex, setFocusIndex] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
  const generatedId = useId()
  const listId = `chops-options-${generatedId}`
  const selectedIndex = options.findIndex((option) => option.value === value)
  const selected = options[selectedIndex]

  useEffect(() => {
    if (!open) return
    function handleOutside(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', handleOutside)
    return () => document.removeEventListener('pointerdown', handleOutside)
  }, [open])

  useEffect(() => {
    if (open) optionRefs.current[focusIndex]?.focus()
  }, [open, focusIndex])

  function showOptions(index = Math.max(0, selectedIndex)) {
    setFocusIndex(index)
    setOpen(true)
  }

  function choose(nextValue: string) {
    onChange(nextValue)
    setOpen(false)
    buttonRef.current?.focus()
  }

  function onTriggerKey(event: KeyboardEvent<HTMLButtonElement>) {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault()
      const nextIndex = event.key === 'ArrowUp' ? Math.max(0, selectedIndex) : Math.max(0, selectedIndex)
      showOptions(nextIndex)
    }
  }

  function onOptionKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === 'Escape' || event.key === 'Tab') {
      setOpen(false)
      if (event.key === 'Escape') { event.preventDefault(); buttonRef.current?.focus() }
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setFocusIndex((index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length)
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      setFocusIndex(event.key === 'Home' ? 0 : options.length - 1)
    }
  }

  return (
    <div className={`chops-select${compact ? ' chops-select--compact' : ''}`} ref={rootRef}>
      <button
        id={id}
        ref={buttonRef}
        type="button"
        className={`chops-select__trigger${open ? ' is-open' : ''}`}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => open ? setOpen(false) : showOptions()}
        onKeyDown={onTriggerKey}
      >
        <span className="chops-select__value">{selected?.label ?? '—'}</span>
        <ChevronDown size={15} className="chops-select__chevron" aria-hidden="true" />
      </button>
      {open && (
        <div className="chops-select__menu" role="listbox" id={listId} aria-label={ariaLabel}>
          {options.map((option, index) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              className={`chops-select__option${option.value === value ? ' is-selected' : ''}`}
              ref={(node) => { optionRefs.current[index] = node }}
              tabIndex={index === focusIndex ? 0 : -1}
              onFocus={() => setFocusIndex(index)}
              onKeyDown={(event) => onOptionKey(event, index)}
              onClick={() => choose(option.value)}
            >
              <span>{option.label}</span>
              {option.value === value && <Check size={15} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
