'use client'

import React, { useState } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const faqs = [
  {
    question: 'Is Morph really 100% offline?',
    answer:
      'Yes. Every conversion runs inside your browser using WebAssembly engines. Your files never leave your device — there are no uploads, no servers, and no trackers. You can disconnect from the internet after the app loads and everything keeps working.'
  },
  {
    question: 'How large can my files be?',
    answer:
      'Morph handles files up to 4GB, limited only by your device memory. Because processing happens locally, large files are often faster than cloud converters — no upload or download round-trip.'
  },
  {
    question: 'Which formats are supported?',
    answer:
      'Video: MP4, MOV, MKV, WEBM and more. Images: PNG, JPEG, WEBP, AVIF and SVG. Documents: PDF, DOCX and image-to-PDF conversion. New formats are added as engines ship.'
  },
  {
    question: 'Does Morph upload my files anywhere?',
    answer:
      'Never. Morph has zero server-side processing. The app shell is cached on your device after first load, and from that point even the website itself works without a connection.'
  },
  {
    question: 'How do I install the desktop app?',
    answer:
      'On desktop, click the Install button in the navigation bar and confirm the prompt. On Android, use the install banner. On iPhone and iPad, tap the Share button in Safari and choose "Add to Home Screen" for the full app experience.'
  },
]

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id='faq' className='p-5 lg:p-24 bg-background text-foreground scroll-mt-20'>
      <div className='container mx-auto max-w-3xl'>
        <h2 className='uppercase text-sm text-primary text-center'>questions</h2>
        <div className='text-3xl text-center font-bold mt-2'>Frequently asked questions</div>
        <div className='flex flex-col gap-3 mt-12'>
          {faqs.map((faq, index) => {
            const open = openIndex === index
            return (
              <Collapsible key={faq.question} open={open} onOpenChange={(value) => setOpenIndex(value ? index : null)}>
                <div className='rounded-lg border border-border bg-card'>
                  <CollapsibleTrigger
                    className={cn(
                      'flex w-full items-center justify-between gap-4 p-4 text-left text-sm font-medium hover:cursor-pointer',
                    )}
                  >
                    {faq.question}
                    <ChevronDown
                      className={cn('size-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <p className='px-4 pb-4 text-sm text-muted-foreground'>{faq.answer}</p>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            )
          })}
        </div>
      </div>
    </section>
  )
}
