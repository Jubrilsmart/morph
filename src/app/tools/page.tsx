import ToolCard from '@/components/tools/ToolCard'
import { categories, toolsByCategory } from '@/lib/tools'
import React from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tools — Morph',
  description: 'Offline micro engines for video, image and document conversion. Every tool runs entirely on your device.',
}

export default function Tools() {
  const time = new Date().getHours()
  return (
    <div className='container px-6 pb-10 w-screen mt-6'>
      <div className='flex flex-col gap-6'>
        <div className='py-6 pr-2 md:pb-0 w-full'>
          <h1 className='text-2xl font-black md:text-3xl p-2'>{time < 12 ? 'Good Morning' : time < 18 ? 'Good Afternoon' : 'Good Evening'}</h1>
          <p className='text-xs md:text-sm font-light text-muted-foreground'>Choose an offline micro engine to begin transforming your media assets.</p>
        </div>
        <div>
          {categories.map((category) => (
            <div key={category.id}>
              <h2 className='hidden md:block uppercase text-sm font-bold mt-4 text-muted-foreground'>{category.name}</h2>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mt-4'>
                {toolsByCategory(category.id).map((tool) => (
                  <ToolCard key={tool.id} tool={tool} category={category} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
