import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WifiOff, Shield, Sparkles, Zap } from 'lucide-react';
import React from 'react'


const FEATURES = [
  {
    icon: Zap,
    title: "lightning fast speed",
    description: "Native WASM-powered execution ensures maximum processing speeds local to your CPU.",
  },
  {
    icon: Shield,
    title: "100% Private",
    description: "No remote databases, zero trackers, and zero server uploads. Your secrets stay yours.",
  },
  {
    icon: WifiOff,
    title: "Completely offline",
    description: "Perfect for remote workflows, plane journeys, or secure air-gapped environments.",
  },
  {
    icon: Sparkles,
    title: "Beautiful UI",
    description: "A flawless desktop-grade experience optimized for fluidity, speed, and focus.",
  },
];


export default function Feature() {
  return (
    <section id='features' className='p-5 lg:p-24 bg-background text-foreground scroll-mt-20'>
      <div className="container mx-auto">
        <div>
          <h2
            className='uppercase text-sm text-primary text-center hidden md:block'>
            core philosophy
          </h2>
          <div
            className='text-3xl text-center font-bold mt-2'>
            A Lightweight Power House In Your Browser
          </div>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-8 mt-12'>
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title}>
                <CardHeader>
                  <div className='flex gap-4 items-center p-2 bg-primary/30 rounded-full w-fit h-fit'>
                    <Icon className='size-6 text-primary' />
                  </div>
                  <CardTitle className='text-lg font-semibold mt-4'>
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className='text-sm text-muted-foreground'>
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>)
          })}
        </div>
      </div>
    </section >
  )
}
