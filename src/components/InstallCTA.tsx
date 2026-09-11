import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import InstallButton from './InstallButton'

export default function InstallCTACard() {
  return (
    <section className='p-4 sm:p-6 lg:p-24 bg-background text-foreground'>
      <div className='container flex justify-center items-center'>
        <Card className='grid grid-cols-[70%_30%] gap-4 p-2 md:p-4 bg-linear-to-r from-background/90% to-primary/20'>
          <div className='flex flex-col gap-4 py-4'>
            <CardHeader>
              <CardTitle className='text-2xl font-black'>
                <span className='hidden md:inline'>Install Morph Desktop PWA</span>
                <span className='md:hidden'>Install Morph App</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className='hidden md:block'>
                Unlock a native desktop app sensation. Operates flawlessly without an active internet connection. Access lightning fast compilers right from your dock.
              </CardDescription>
              <CardDescription className='md:hidden'>
                Add to your home screen for rapid offline launching.
              </CardDescription>
            </CardContent>
          </div>
          <div className='flex justify-center items-center'>
            <InstallButton variant={'default'} size={'lg'} className='hidden md:flex' desktopLabel='Install Desktop App' />
            <InstallButton variant={'default'} size={'lg'} className='flex md:hidden' desktopLabel='Install' />
          </div>

        </Card>
      </div>
    </section>
  )
}
