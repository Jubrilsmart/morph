'use client'

import React, { useState } from 'react'
import ToolPage from '@/components/tools/ToolPage'
import ToolWorkspace from '@/components/tools/ToolWorkspace'
import { OptionsPanel, OptionSelect } from '@/components/tools/OptionControls'
import { Input } from '@/components/ui/input'
import { Field, FieldDescription, FieldTitle } from '@/components/ui/field'
import { toolByHref } from '@/lib/tools'
import { splitPdf } from '@/lib/engines/pdf'

const tool = toolByHref('/tools/pdf/split')

export default function SplitPdfPage() {
  const [mode, setMode] = useState<'each' | 'ranges'>('each')
  const [ranges, setRanges] = useState('1-3,4-6')

  return (
    <ToolPage tool={tool}>
      <ToolWorkspace
        accept='application/pdf,.pdf'
        multiple={false}
        run={(files, onProgress) => splitPdf(files, { mode, ranges }, onProgress)}
        runLabel='Split PDF'
        hint='One PDF at a time'
        options={
          <OptionsPanel>
            <OptionSelect
              label='Split mode'
              value={mode}
              onChange={(value) => setMode(value as 'each' | 'ranges')}
              options={[
                { value: 'each', label: 'One PDF per page' },
                { value: 'ranges', label: 'Custom ranges' },
              ]}
            />
            {mode === 'ranges' && (
              <Field>
                <FieldTitle>Page ranges</FieldTitle>
                <Input
                  placeholder='e.g. 1-3, 5, 8-10'
                  value={ranges}
                  onChange={(e) => setRanges(e.target.value)}
                />
                <FieldDescription>Each range becomes its own PDF, in the order listed.</FieldDescription>
              </Field>
            )}
          </OptionsPanel>
        }
      />
    </ToolPage>
  )
}
