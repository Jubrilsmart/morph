'use client'

import React from 'react'
import ToolPage from '@/components/tools/ToolPage'
import ToolWorkspace from '@/components/tools/ToolWorkspace'
import { OptionsPanel } from '@/components/tools/OptionControls'
import { toolByHref } from '@/lib/tools'
import { EngineError } from '@/lib/engines/types'

const tool = toolByHref('/tools/image/background-remove')

export default function BackgroundRemovePage() {
  return (
    <ToolPage tool={tool}>
      <ToolWorkspace
        accept='image/*'
        scaffold
        run={async () => {
          throw new EngineError('The background removal engine is not docked yet.')
        }}
        options={
          <OptionsPanel className='opacity-60 pointer-events-none'>
            <p className='text-sm text-muted-foreground col-span-full'>
              Options will appear once the background removal engine ships.
            </p>
          </OptionsPanel>
        }
      />
    </ToolPage>
  )
}
