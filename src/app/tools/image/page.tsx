import CategoryPage from '@/components/tools/CategoryPage'
import React from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Image Tools — Morph' }

export default function ImageCategoryPage() {
  return <CategoryPage categoryId="image" />
}
