'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { OptionsPanel, OptionSelect } from '@/components/tools/OptionControls'
import { HardDrive, ShieldCheck, Trash2 } from 'lucide-react'
import { formatBytes } from '@/lib/format'
import {
  clearHistory,
  DEFAULT_SETTINGS,
  getSettings,
  MAX_BYTES_CHOICES,
  MAX_ENTRIES_CHOICES,
  requestPersistentStorage,
  saveSettings,
  storageUsage,
  type MorphSettings,
  type StorageUsage,
} from '@/lib/history'

export default function SettingsPage() {
  const [settings, setSettings] = useState<MorphSettings>(DEFAULT_SETTINGS)
  const [usage, setUsage] = useState<StorageUsage | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const [loaded, usage] = await Promise.all([getSettings(), storageUsage()])
      if (cancelled) return
      setSettings(loaded)
      setUsage(usage)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const update = useCallback((patch: Partial<MorphSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      saveSettings(next)
      return next
    })
  }, [])

  const clearRecent = useCallback(async () => {
    await clearHistory()
    setUsage(await storageUsage())
    toast.success('Recent history cleared.')
  }, [])

  const persist = useCallback(async () => {
    const ok = await requestPersistentStorage()
    setUsage(await storageUsage())
    if (ok) toast.success('Storage marked persistent — the browser will not evict your files.')
    else toast.error('The browser declined persistent storage.')
  }, [])

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <h1 className='text-2xl font-black p-2'>Settings</h1>
        <p className='text-xs md:text-sm text-muted-foreground px-2'>
          Everything here lives on your device — Morph has no server to sync with.
        </p>
      </div>

      <OptionsPanel>
        <OptionSelect
          label='Keep converted outputs'
          description='Store results in your browser so the Recent page can re-open them.'
          value={settings.keepOutputs ? 'yes' : 'no'}
          onChange={(value) => update({ keepOutputs: value === 'yes' })}
          options={[
            { value: 'yes', label: 'Yes — keep outputs on this device' },
            { value: 'no', label: 'No — history only, no stored files' },
          ]}
        />
        <OptionSelect
          label='Recent entries'
          description='Oldest conversions are removed first when the limit is hit.'
          value={String(settings.maxEntries)}
          onChange={(value) => update({ maxEntries: Number(value) })}
          options={MAX_ENTRIES_CHOICES.map((n) => ({
            value: String(n),
            label: `Last ${n} conversions`,
          }))}
        />
        <OptionSelect
          label='Storage budget'
          description='Total size of stored outputs before old ones are evicted.'
          value={String(settings.maxBytes)}
          onChange={(value) => update({ maxBytes: Number(value) })}
          options={MAX_BYTES_CHOICES.map((c) => ({
            value: String(c.value),
            label: c.label,
          }))}
        />
      </OptionsPanel>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base'>
            <HardDrive className='size-4 text-primary' />
            Storage
          </CardTitle>
        </CardHeader>
        <CardContent className='flex flex-col gap-3 text-sm'>
          {usage ? (
            <>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Used by this site</span>
                <span className='font-medium tabular-nums'>{formatBytes(usage.usage)}</span>
              </div>
              {usage.quota > 0 && (
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Available</span>
                  <span className='font-medium tabular-nums'>{formatBytes(usage.quota)}</span>
                </div>
              )}
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Persistent storage</span>
                <span className='font-medium'>
                  {usage.persisted ? 'Enabled' : 'Not enabled'}
                </span>
              </div>
              {!usage.persisted && (
                <Button variant='outline' size='sm' onClick={() => void persist()} className='self-start'>
                  <ShieldCheck className='size-3.5' />
                  Make storage persistent
                </Button>
              )}
              <p className='text-xs text-muted-foreground'>
                Persistent storage tells the browser not to clear Morph&apos;s data under disk
                pressure. Outputs stay in this browser&apos;s private storage —{' '}
                <Link href='/tools/recent' className='underline underline-offset-2'>
                  manage them in Recent
                </Link>
                .
              </p>
            </>
          ) : (
            <p className='text-muted-foreground'>Reading storage usage…</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Trash2 className='size-4 text-primary' />
            Data
          </CardTitle>
        </CardHeader>
        <CardContent className='flex flex-col gap-3 text-sm'>
          <p className='text-muted-foreground'>
            Clears the Recent list and deletes every stored output from this device. Your
            downloads on disk are not touched.
          </p>
          <Button variant='destructive' size='sm' onClick={() => void clearRecent()} className='self-start'>
            <Trash2 className='size-3.5' />
            Clear recent files
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
