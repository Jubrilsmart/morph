import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WifiOff, Shield, Sparkles, Zap } from 'lucide-react';
import React from 'react'


const timeline = [
  {
    icon: Zap,
    title: "Drop File",
    description: "Drag elements into our fast container space.",
  },
  {
    icon: Shield,
    title: "Configure Settings",
    description: "Fine tine quality metrics, code, or scaling bounds.",
  },
  {
    icon: WifiOff,
    title: "Convert",
    description: "Native local compilers translate format arrays rapidly.",
  },
  {
    icon: Sparkles,
    title: "Download",
    description: "Instantly claim outputs without server upload waits or bandwidth.",
  },
  {
    title: "Done",
    description: "Secure results packed inside high fidelity layers."
  }
];


export default function Timeline() {
  return (
    <section id='workflow' className='hidden md:block lg:p-24 bg-background text-foreground scroll-mt-20'>
      <div className="container mx-auto">
        <div>
          <h2
            className='uppercase text-sm text-primary text-center'>
            simple workflow
          </h2>
          <div
            className='text-3xl text-center font-bold mt-2'>
            How it works offline
          </div>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mt-12'>
          {timeline.map((timeline, index) => {
            return (
              <Card key={timeline.title}>
                <CardHeader>
                  <div className='flex items-center justify-center text-center font-black text-2xl p-2 bg-primary/10 rounded-full w-fit h-fit'>
                    <div className='text-primary'>{"0" + (index + 1)}</div>
                  </div>
                  <CardTitle className='text-lg font-semibold mt-4'>
                    {timeline.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className='text-sm text-muted-foreground'>
                    {timeline.description}
                  </CardDescription>
                </CardContent>
              </Card>)
          })}
        </div>
      </div>
    </section >
  )
}
