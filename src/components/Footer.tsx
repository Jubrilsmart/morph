import React from 'react'
import Logo from './Logo'
import Link from 'next/link'

const footer = [
  {
    name: 'Product',
    items: [
      { title: 'Features', link: '/#features' },
      { title: 'All Tools', link: '/tools' },
      { title: 'Formats', link: '/#formats' },
      { title: 'FAQ', link: '/#faq' }
    ]
  },
  {
    name: 'Security',
    items: [
      { title: 'Privacy Policy', link: '/' },
      { title: 'Terms of service', link: '/' },
      { title: 'Offline Architecture', link: '/#workflow' },
      { title: 'MIT License', link: '/' }
    ]
  },
  {
    name: 'Company',
    items: [
      { title: 'About', link: '/' },
      { title: 'Enterprise', link: '/' },
      { title: 'Changelog', link: '/' },
      { title: 'GitHub', link: 'https://github.com/jubrilsmart' }
    ]
  },
  {
    name: 'Community',
    items: [
      { title: 'Report an Issue', link: 'https://github.com/jubrilsmart' },
      { title: 'Share Feedback', link: 'https://github.com/jubrilsmart' },
      { title: 'Roadmap', link: '/' },
      { title: 'GitHub', link: 'https://github.com/jubrilsmart' }
    ]
  }
]

const footer2 = [
  {
    text: 'Privacy Policy.',
    href: '/'
  },
  {
    text: 'Terms of service',
    href: '/'
  }
]

export default function Footer() {
  return (
    <footer className='w-full p-5 lg:p-24 bg-background text-foreground border-t border-muted-foreground'>
      <div className='container hidden sm:block'>
        <div className='flex flex-col gap-16'>
          <div className='flex justify-between gap-6'>
            <div className='h-24 w-80 flex flex-col gap-4'>
              <Logo />
              <p className='text-sm text-muted-foreground'>
                The zero-overhead offline media compiler built strictly for WebAssembly and secure browser environments.</p>
            </div>
            <div className='flex gap-16'>
              {footer.map((item) => (
                <div key={item.name}
                  className='flex flex-col gap-4'
                >
                  <h3 className='text-xl font-bold'>{item.name}</h3>
                  {item.items.map((i, idx) => (
                    <Link href={i.link} key={idx}
                      className='text-sm font-light text-muted-foreground'
                      >
                      {i.title}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className='flex justify-between text-xs text-muted-foreground pt-4'>
            <p>© 2026 Morph Media. Processed 100% locally.</p>
            <div className='flex gap-4'>
              {footer2.map((item) => (
                <Link href={item.href} key={item.text}>{item.text}</Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile footer */}
      <div className='sm:hidden flex flex-col gap-4 text-muted-foreground text-sm justify-center items-center py-4'>
        <p>Morph v1.0.0 · Local WASM engine</p>
        <p>MIT Licensed · Secured in sandbox</p>
      </div>
    </footer>
  )
}
