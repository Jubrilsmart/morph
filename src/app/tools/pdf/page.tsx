import CategoryPage from '@/components/tools/CategoryPage'
import React from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Document Tools — Morph' }

export default function PdfCategoryPage() {
  return <CategoryPage categoryId="pdf" />
}
