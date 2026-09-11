'use client'

import React, { useState } from 'react'
import ToolPage from '@/components/tools/ToolPage'
import ToolWorkspace from '@/components/tools/ToolWorkspace'
import { OptionsPanel, OptionSelect, OptionSlider } from '@/components/tools/OptionControls'
import { Input } from '@/components/ui/input'
import { Field, FieldDescription, FieldTitle } from '@/components/ui/field'
import { toolByHref } from '@/lib/tools'
import { resizeImages, type ResizeOptions } from '@/lib/engines/image'

const tool = toolByHref('/tools/image/resize')

export default function ImageResizePage() {
  const [mode, setMode] = useState<ResizeOptions['mode']>('percent')
  const [percent, setPercent] = useState(50)
  const [width, setWidth] = useState(1280)
  const [height, setHeight] = useState(720)
  const [keepAspect, setKeepAspect] = useState(true)

  return (
    <ToolPage tool={tool}>
      <ToolWorkspace
        accept='image/*'
        run={(files, onProgress) =>
          resizeImages(files, { mode, percent, width, height, keepAspect }, onProgress)
        }
        runLabel='Resize images'
        options={
          <OptionsPanel>
            <OptionSelect
              label='Resize by'
              value={mode}
              onChange={(value) => setMode(value as ResizeOptions['mode'])}
              options={[
                { value: 'percent', label: 'Percentage' },
                { value: 'pixels', label: 'Exact pixels' },
              ]}
            />
            {mode === 'percent' ? (
              <OptionSlider
                label='Scale'
                value={percent}
                onChange={setPercent}
                min={5}
                max={200}
                step={5}
                format={(v) => `${v}%`}
                description='100% keeps the original size.'
              />
            ) : (
              <>
                <Field>
                  <FieldTitle>Width (px)</FieldTitle>
                  <Input
                    type='number'
                    min={1}
                    value={width}
                    onChange={(e) => setWidth(Math.max(1, Number(e.target.value) || 1))}
                  />
                </Field>
                <Field>
                  <FieldTitle>Height (px)</FieldTitle>
                  <Input
                    type='number'
                    min={1}
                    value={height}
                    onChange={(e) => setHeight(Math.max(1, Number(e.target.value) || 1))}
                  />
                </Field>
                <Field>
                  <FieldTitle>Aspect ratio</FieldTitle>
                  <FieldDescription>
                    <label className='flex items-center gap-2 hover:cursor-pointer'>
                      <input
                        type='checkbox'
                        checked={keepAspect}
                        onChange={(e) => setKeepAspect(e.target.checked)}
                        className='accent-primary size-4'
                      />
                      Keep original aspect ratio
                    </label>
                  </FieldDescription>
                </Field>
              </>
            )}
          </OptionsPanel>
        }
      />
    </ToolPage>
  )
}
