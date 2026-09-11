import CategoryPage from '@/components/tools/CategoryPage'
import React from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Video Tools — Morph' }

export default function VideoPage() {
  return <CategoryPage categoryId="video" />
}
