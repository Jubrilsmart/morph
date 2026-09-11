import React from 'react'
import { Badge } from './ui/badge'

const format = ['MP4', 'MOV', 'MKV', 'WEBM', 'PNG', 'JPEG', 'WEBP', 'AVIF', 'PDF', 'SVG']

export default function Formats() {
  return (
    <section id='formats' className='hidden md:block lg:p-24 bg-background text-foreground scroll-mt-20'>
      <div className='container flex flex-col gap-6'>
        <h2 className='text-center text-2xl'>Broad format ecosystem out of the box</h2>
        <div className='flex flex-wrap gap-6'>
          {format.map((f, idx) => (
            <Badge key={idx}
              variant={'outline'}
              className='px-4 py-2'>
              {f}
            </Badge>
          ))}
        </div>
      </div>

    </section>
  )
}
