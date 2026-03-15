'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

type SelectOption = {
  value: string;
  label: string;
};

type FormSelectProps = {
  label: string;
  name: string;
  defaultValue: string;
  options: SelectOption[];
  required?: boolean;
  className?: string;
};

export function FormSelect({
  label,
  name,
  defaultValue,
  options,
  required,
  className = '',
}: FormSelectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState(defaultValue);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value],
  );

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <label className={`space-y-2 ${className}`}>
      <span className="text-sm font-semibold text-slate-700">{label}</span>

      <div ref={containerRef} className="relative">
        <input name={name} type="hidden" value={value} />

        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={label}
          onClick={() => setIsOpen((current) => !current)}
          className={`flex h-[50px] w-full items-center justify-between rounded-2xl border px-4 text-left text-sm font-medium outline-none transition ${
            isOpen
              ? 'border-primary bg-white ring-4 ring-primary/10'
              : 'border-slate-200 bg-[linear-gradient(180deg,_#f8fafc_0%,_#f1f5f9_100%)] hover:border-slate-300'
          } ${selectedOption ? 'text-slate-900' : 'text-slate-400'}`}
        >
          <span>{selectedOption?.label ?? 'Selecione'}</span>
          <span
            className={`ml-3 flex size-8 shrink-0 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm transition ${
              isOpen ? 'rotate-180 text-primary' : ''
            }`}
          >
            <ChevronDown className="size-4" />
          </span>
        </button>

        {isOpen ? (
          <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
            <div className="max-h-64 overflow-y-auto p-2">
              {!required ? (
                <OptionButton
                  label="Selecione"
                  selected={!value}
                  onSelect={() => {
                    setValue('');
                    setIsOpen(false);
                  }}
                />
              ) : null}

              {options.map((option) => (
                <OptionButton
                  key={option.value}
                  label={option.label}
                  selected={value === option.value}
                  onSelect={() => {
                    setValue(option.value);
                    setIsOpen(false);
                  }}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </label>
  );
}

function OptionButton({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm transition ${
        selected
          ? 'bg-primary text-white shadow-lg shadow-primary/20'
          : 'text-slate-700 hover:bg-slate-50'
      }`}
    >
      <span>{label}</span>
      {selected ? <Check className="size-4" /> : null}
    </button>
  );
}
