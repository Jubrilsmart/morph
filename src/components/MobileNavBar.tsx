'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Clock, Home, LayoutGrid, Settings } from 'lucide-react'
import React from 'react'

const mobileNav = [
  { title: "Home", href: "/", icon: Home },
  { title: "Tools", href: "/tools", icon: LayoutGrid },
  { title: "Recent", href: "", icon: Clock, disabled: true },
  { title: "Settings", href: "", icon: Settings, disabled: true },
]

export default function MobileNav() {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/')

  return (
    <div className='w-screen px-6 py-4 border-t border-accent bg-background'>
      <div className='h-14 w-full flex justify-between'>
        {mobileNav.map((item) => {
          const Icon = item.icon
          const active = !item.disabled && isActive(item.href)
          if (item.disabled) {
            return (
              <div
                className='flex flex-col justify-center items-center cursor-not-allowed text-muted-foreground/50'
                key={item.title}
                aria-disabled
                title="Coming soon"
              >
                <Icon size={24} />
                <p className=''>{item.title}</p>
              </div>
            )
          }
          return (
            <Link
              className={`flex flex-col justify-center items-center cursor-pointer transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`}
              key={item.title}
              href={item.href}
            >
              <Icon size={24} />
              <p className=''>{item.title}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
