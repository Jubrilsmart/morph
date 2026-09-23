'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Clock, Home, LayoutGrid, Settings } from 'lucide-react'
import React from 'react'

const mobileNav = [
  { title: "Home", href: "/", icon: Home },
  { title: "Tools", href: "/tools", icon: LayoutGrid },
  { title: "Recent", href: "/tools/recent", icon: Clock },
  { title: "Settings", href: "/tools/settings", icon: Settings },
]

export default function MobileNav() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    return pathname === href
  };

  return (
    <div className='w-screen px-6 py-4 border-t border-accent bg-background'>
      <div className='h-14 w-full flex justify-between'>
        {mobileNav.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
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
