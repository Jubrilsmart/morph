'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import React from 'react'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from './ui/breadcrumb'

const labels: Record<string, string> = {
  tools: 'Tools',
  video: 'Video',
  image: 'Image',
  pdf: 'Documents',
  converter: 'Converter',
  compressor: 'Compressor',
  convert: 'Convert',
  compress: 'Compress',
  resize: 'Resize',
  crop: 'Crop',
  'background-remove': 'Background Remove',
  'image-to-pdf': 'Image to PDF',
  'pdf-to-image': 'PDF to Image',
  'docx-to-pdf': 'DOCX to PDF',
  'pdf-to-docx': 'PDF to DOCX',
  merge: 'Merge',
  split: 'Split',
  rotate: 'Rotate',
}

export default function BreadCrumb() {
  const segments = usePathname().split('/').slice(1).filter(Boolean)

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link href="/" />}>Home</BreadcrumbLink>
        </BreadcrumbItem>
        {segments.map((segment, index) => {
          const href = '/' + segments.slice(0, index + 1).join('/')
          const label = labels[segment] ?? segment
          const isLast = index === segments.length - 1
          return (
            <React.Fragment key={href}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast
                  ? <BreadcrumbPage>{label}</BreadcrumbPage>
                  : <BreadcrumbLink render={<Link href={href} />}>{label}</BreadcrumbLink>}
              </BreadcrumbItem>
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
