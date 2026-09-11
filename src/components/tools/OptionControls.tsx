'use client'

import React from 'react'
import { Field, FieldDescription, FieldTitle } from '@/components/ui/field'
import { cn } from '@/lib/utils'

interface OptionSelectProps {
  label: string
  description?: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string; disabled?: boolean }[]
  disabled?: boolean
}

export function OptionSelect({ label, description, value, onChange, options, disabled }: OptionSelectProps) {
  return (
    <Field>
      <FieldTitle>{label}</FieldTitle>
      {description && <FieldDescription>{description}</FieldDescription>}
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className='h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/50 disabled:opacity-50 hover:cursor-pointer'
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  )
}

interface OptionSliderProps {
  label: string
  description?: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  format?: (value: number) => string
  disabled?: boolean
}

export function OptionSlider({ label, description, value, onChange, min, max, step = 1, format, disabled }: OptionSliderProps) {
  return (
    <Field>
      <FieldTitle className='w-full justify-between'>
        {label}
        <span className='text-muted-foreground font-normal'>{format ? format(value) : value}</span>
      </FieldTitle>
      {description && <FieldDescription>{description}</FieldDescription>}
      <input
        type='range'
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn('w-full accent-primary hover:cursor-pointer disabled:opacity-50')}
      />
    </Field>
  )
}

export function OptionsPanel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 rounded-xl border border-border bg-card', className)}>
      {children}
    </div>
  )
}
