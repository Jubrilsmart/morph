'use client'

import React, { useState } from 'react'
import ToolPage from '@/components/tools/ToolPage'
import ToolWorkspace from '@/components/tools/ToolWorkspace'
import { OptionsPanel, OptionSelect } from '@/components/tools/OptionControls'
import { Input } from '@/components/ui/input'
import { Field, FieldDescription, FieldTitle } from '@/components/ui/field'
import { toolByHref } from '@/lib/tools'
import { rotatePdf, type RotateOptions } from '@/lib/engines/pdf'

const tool = toolByHref('/tools/pdf/rotate')

type PageSelection = 'all' | 'odd' | 'even' | 'custom'

export default function RotatePdfPage() {
  const [angle, setAngle] = useState<90 | 180 | 270>(90)
  const [selection, setSelection] = useState<PageSelection>('all')
  const [pages, setPages] = useState('1,3')

  const rotateOptions: RotateOptions = {
    angle,
    pages: selection === 'custom' ? pages.split(',').map((p) => Number(p.trim())).filter((p) => p > 0) : selection,
  }

  return (
    <ToolPage tool={tool}>
      <ToolWorkspace
        accept='application/pdf,.pdf'
        multiple={false}
        run={(files, onProgress) => rotatePdf(files, rotateOptions, onProgress)}
        runLabel='Rotate PDF'
        hint='One PDF at a time'
        options={
          <OptionsPanel>
            <OptionSelect
              label='Rotation'
              value={String(angle)}
              onChange={(value) => setAngle(Number(value) as 90 | 180 | 270)}
              options={[
                { value: '90', label: '90° clockwise' },
                { value: '180', label: '180°' },
                { value: '270', label: '90° counter-clockwise' },
              ]}
            />
            <OptionSelect
              label='Pages'
              value={selection}
              onChange={(value) => setSelection(value as PageSelection)}
              options={[
                { value: 'all', label: 'All pages' },
                { value: 'odd', label: 'Odd pages' },
                { value: 'even', label: 'Even pages' },
                { value: 'custom', label: 'Custom selection' },
              ]}
            />
            {selection === 'custom' && (
              <Field>
                <FieldTitle>Page numbers</FieldTitle>
                <Input
                  placeholder='e.g. 1, 3, 5'
                  value={pages}
                  onChange={(e) => setPages(e.target.value)}
                />
                <FieldDescription>Comma-separated page numbers.</FieldDescription>
              </Field>
            )}
          </OptionsPanel>
        }
      />
    </ToolPage>
  )
}
