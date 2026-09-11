import React from 'react'
import Link from 'next/link'
import { Button } from './ui/button'
import { Compass, Film } from 'lucide-react'

export default function Hero() {
  return (
    <section className='w-full h-fit lg:h-169 pt-24 px-5 pb-5 md:pt-30 lg:pt-45 lg:px-24 md:pb-12 lg:pb-24 bg-background text-foreground' >
      <div className='container flex flex-col gap-12'>
        <div className="flex justify-center items-center gap-16" >
          <div className='flex flex-col gap-8'>
            <div className='hidden md:block text-xs font-light uppercase text-primary bg-accent w-fit py-0.5 px-1 rounded-xs'>
              <p>Local processing engine v1.0</p>
            </div>
            <div className='text-5xl font-black'>
              Convert. Compress. <span>Create.</span>
              <span className='block text-primary'>Completely Offline.</span>
            </div>
            <div className='text-sm text-muted-foreground'>
              Every conversion happens right on your device. No cloud uploads. No endless waiting. Full enterprise privacy by design.
            </div>
            <div className='flex flex-col gap-4 w-full sm:flex-row sm:items-center sm:justify-center md:justify-start'>
              <Button className='py-6 hover:cursor-pointer' render={<Link href={'/tools'} />}>
                Start Converting
              </Button>
              <Button variant={'outline'} className='py-6 hover:cursor-pointer' render={<Link href={'/#categories'} />}>
                <Compass />
                Explore Tools</Button>
            </div>
          </div>
          <div className='w-1/2 bg-accent/80 p-6 rounded-xl hidden md:block'>
            <div className='flex justify-between'>
              <div className='flex gap-2'>
                <div className='w-2.5 h-2.5 rounded-full bg-red-400'></div>
                <div className='w-2.5 h-2.5 rounded-full bg-yellow-400'></div>
                <div className='w-2.5 h-2.5 rounded-full bg-green-500'></div>
              </div>
              <div className='text-xs text-green-500 uppercase bg-accent px-1 py-0.5 rounded-xs'>
                100% offline active
              </div>
            </div>
            <div className='w-full h-77.75 bg-background mt-4 rounded-xl border-2 border-primary border-dashed flex justify-center item-center'>
              <div className='flex flex-col justify-center items-center gap-2 h-full'>
                <div className='p-3.75 bg-primary/20 rounded-full'>
                  <Film className='h-4.5 w-4.5' />
                </div>
                <p>Drag video or files here</p>
                <p className='text-xs text-muted-foreground'>Local execution up to 4GB files</p>
              </div>
            </div>
          </div>
        </div>

      </div >
    </section>
  )
}
