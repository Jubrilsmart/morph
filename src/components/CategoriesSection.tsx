import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Image, FileText, Film, ChevronRight } from 'lucide-react';
import React from 'react'
import Link from 'next/link'
import { Badge } from './ui/badge';


const FEATURES = [
  {
    icon: Film,
    title: "Video Toolkit",
    href: "/tools/video",
    description: "Native WASM-powered execution ensures maximum processing speeds local to your CPU.",
    subtools: ["Convert", "Compress", "Trim", "Extract Audio"]
  },
  {
    icon: Image,
    title: "Image processing",
    href: "/tools/image",
    description: "No remote databases, zero trackers, and zero server uploads. Your secrets stay yours.",
    subtools: ["Convert", "Compress", "Resize", "Crop"]

  },
  {
    icon: FileText,
    title: "Document Control",
    href: "/tools/pdf",
    description: "Perfect for remote workflows, plane journeys, or secure air-gapped environments.",
    subtools: ["Convert", "Merge", "Rotate", "Split"]
  },
];


export default function Category() {
  return (
    <section id='categories' className='p-5 lg:p-24 bg-background text-foreground scroll-mt-20'>
      <div className="container mx-auto">
        <div>
          <h2
            className='hidden md:block uppercase text-sm text-primary text-center'>
            supported modules
          </h2>
          <div
            className='text-3xl text-center font-bold mt-2'>
            Engineered for High Performance and Privacy
          </div>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12'>
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="p-6 transition-colors hover:bg-accent/40">
                <CardHeader>
                  <div className='flex gap-4 items-center p-2 bg-primary/30 rounded-full w-fit h-fit'>
                    <Icon className='size-6 text-primary' />
                  </div>
                  <CardTitle className='text-lg font-semibold mt-4'>
                    <Link href={feature.href}>{feature.title}</Link>
                  </CardTitle>
                  <CardAction className='hidden md:block'>
                    <Link href={feature.href}>
                      <Badge variant={'secondary'} className="bg-primary/10 text-primary">
                        Wasm-Codec
                      </Badge>
                    </Link>
                  </CardAction>
                  <CardAction className='md:hidden'>
                    <Link href={feature.href}>
                      <ChevronRight />
                    </Link>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <CardDescription className='text-sm text-muted-foreground'>
                    {feature.description}
                    <div className='mt-5 flex flex-wrap gap-2'>
                      {feature.subtools.map((subtool) => (
                        <Badge key={subtool} variant={'secondary'} className="px-2 py-3 text-muted-foreground">
                          {subtool}
                        </Badge>
                      ))}
                    </div>
                  </CardDescription>

                </CardContent>
              </Card>)
          })}
        </div>
      </div>
    </section >
  )
}
