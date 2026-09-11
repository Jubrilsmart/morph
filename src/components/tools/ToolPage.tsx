import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Wifi } from 'lucide-react'
import type { Tool } from '@/lib/tools'

export default function ToolPage({
  tool,
  children,
}: {
  tool: Tool
  children: React.ReactNode
}) {
  const Icon = tool.icon
  return (
    <div className='container px-4 md:px-6 pb-10 w-full mt-2 md:mt-6'>
      <div className='flex flex-col gap-6 max-w-4xl mx-auto'>
        <div className='w-full'>
          <h1 className='text-2xl font-black md:text-3xl p-2 flex items-center gap-3'>
            <Icon className='text-primary size-7 md:size-8' />
            {tool.title}
          </h1>
          <div className='flex flex-wrap items-center gap-2 px-2'>
            <p className='text-xs md:text-sm font-light text-muted-foreground'>{tool.description}</p>
            {tool.status === 'scaffold' && (
              <Badge variant='secondary' className='text-muted-foreground'>Coming soon</Badge>
            )}
            {tool.requiresNetwork ? (
              <Badge variant='secondary' className='text-muted-foreground gap-1'>
                <Wifi className='size-3' />
                Requires internet
              </Badge>
            ) : (
              <Badge variant='secondary' className='bg-primary/10 text-primary'>100% offline</Badge>
            )}
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
