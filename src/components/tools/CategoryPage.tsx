import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ToolCard from './ToolCard'
import { categoryById, toolsByCategory, type ToolCategoryId } from '@/lib/tools'

export default function CategoryPage({ categoryId }: { categoryId: ToolCategoryId }) {
  const category = categoryById(categoryId)
  const categoryTools = toolsByCategory(categoryId)
  const Icon = category.icon

  return (
    <div className='container px-6 pb-10 w-screen mt-6'>
      <div className='flex flex-col gap-6'>
        <div className='py-6 pr-2 md:pb-0 w-full'>
          <Link href='/tools' className='text-sm text-muted-foreground flex items-center gap-1 p-2 hover:text-foreground transition-colors'>
            <ArrowLeft className='size-4' />
            All tools
          </Link>
          <h1 className='text-2xl font-black md:text-3xl p-2 flex items-center gap-3'>
            <Icon className={category.color + ' size-7 md:size-8'} />
            {category.name}
          </h1>
          <p className='text-xs md:text-sm font-light text-muted-foreground'>
            {categoryTools.length} offline micro engines, executed entirely on your device.
          </p>
        </div>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          {categoryTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} category={category} />
          ))}
        </div>
      </div>
    </div>
  )
}
