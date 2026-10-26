import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Check, ChevronDown } from "lucide-react";

import "./ChopsSelect.css";

type SelectOption = {
  value: string;
  label: string;
};

type ChopsSelectProps = {
  id?: string;
  ariaLabel: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  compact?: boolean;
};

export default function ChopsSelect({
  id,
  ariaLabel,
  value,
  options,
  onChange,
  compact = false,
}: ChopsSelectProps) {
  const [open, setOpen] = useState(false);
  const [openAbove, setOpenAbove] = useState(false);
  const [focusIndex, setFocusIndex] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const generatedId = useId();
  const listId = `chops-options-${generatedId}`;

  const selectedIndex = options.findIndex(
    (option) => option.value === value
  );
  const selected = options[selectedIndex];

  // Close the menu when the user clicks outside of this component.
  useEffect(() => {
    if (!open) return;

    function closeOnOutsideClick(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [open]);

  useEffect(() => {
    if (open) {
      optionRefs.current[focusIndex]?.focus();
    }
  }, [open, focusIndex]);

  function showOptions() {
    if (options.length === 0) return;

    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const spaceBelow = window.innerHeight - rect.bottom;
      const estimatedMenuHeight = Math.min(
        options.length * (window.innerWidth <= 767 ? 44 : 38) + 12,
        window.innerWidth <= 767
          ? Math.min(270, window.innerHeight * 0.42)
          : 220
      );
      setOpenAbove(
        spaceBelow < estimatedMenuHeight && rect.top > spaceBelow
      );
    }

    setFocusIndex(Math.max(0, selectedIndex));
    setOpen(true);
  }

  function choose(nextValue: string) {
    onChange(nextValue);
    setOpen(false);
    buttonRef.current?.focus();
  }

  function handleTriggerKey(event: KeyboardEvent<HTMLButtonElement>) {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      if (!open) showOptions();
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
    }
  }

  function handleOptionKey(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number
  ) {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
    } else if (event.key === "Tab") {
      setOpen(false);
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const increment = event.key === "ArrowDown" ? 1 : -1;
      setFocusIndex((index + increment + options.length) % options.length);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      setFocusIndex(event.key === "Home" ? 0 : options.length - 1);
    }
  }

  return (
    <div
      className={`chops-select${compact ? " chops-select--compact" : ""}`}
      ref={rootRef}
    >
      <button
        id={id}
        ref={buttonRef}
        type="button"
        className={`chops-select__trigger${open ? " is-open" : ""}`}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => (open ? setOpen(false) : showOptions())}
        onKeyDown={handleTriggerKey}
      >
        <span className="chops-select__value">
          {selected?.label ?? "—"}
        </span>
        <ChevronDown
          size={15}
          className="chops-select__chevron"
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          id={listId}
          className={`chops-select__menu${
            openAbove ? " chops-select__menu--above" : ""
          }`}
          role="listbox"
          aria-label={ariaLabel}
        >
          {options.map((option, index) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              className={`chops-select__option${
                option.value === value ? " is-selected" : ""
              }`}
              ref={(node) => {
                optionRefs.current[index] = node;
              }}
              tabIndex={index === focusIndex ? 0 : -1}
              onFocus={() => setFocusIndex(index)}
              onKeyDown={(event) => handleOptionKey(event, index)}
              onClick={() => choose(option.value)}
            >
              <span>{option.label}</span>
              {option.value === value && (
                <Check size={15} aria-hidden="true" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
