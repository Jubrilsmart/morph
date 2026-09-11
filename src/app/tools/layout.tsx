import Breadcrumb from '@/components/Breadcrumb'
import MobileNva from '@/components/MobileNavBar'
import { AppSidebar } from '@/components/SideBar'
import { ModeToggle } from '@/components/toggle-button'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import React from 'react'

export default function Toolslayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className='flex-1 flex flex-col min-h-svh min-w-0'>
        <header className='sticky top-0 z-40 flex items-center gap-3 px-4 py-3 border-b border-border bg-background/80 backdrop-blur'>
          <SidebarTrigger className='md:hidden' />
          <Breadcrumb />
          <div className='ml-auto'>
            <ModeToggle size={'icon'} />
          </div>
        </header>
        <div className='flex-1 pb-24 md:pb-0'>
          {children}
        </div>
        <div className='fixed bottom-0 left-0 right-0 md:hidden z-40'>
          <MobileNva />
        </div>
      </main>
    </SidebarProvider>
  )
}
