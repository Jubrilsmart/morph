import { describe, it, expect } from 'vitest'
import {
  categories,
  categoryById,
  tools,
  toolByHref,
  toolsByCategory,
  type ToolCategoryId,
} from '@/lib/tools'

describe('tool registry', () => {
  it('has unique ids and hrefs', () => {
    expect(new Set(tools.map((t) => t.id)).size).toBe(tools.length)
    expect(new Set(tools.map((t) => t.href)).size).toBe(tools.length)
  })

  it('every tool href lives under /tools/', () => {
    for (const tool of tools) {
      expect(tool.href.startsWith('/tools/')).toBe(true)
    }
  })

  it('every tool references a registered category', () => {
    const ids = new Set(categories.map((c) => c.id))
    for (const tool of tools) {
      expect(ids.has(tool.category)).toBe(true)
    }
  })

  it('partitions tools by category', () => {
    const counts = tools.map((t) => t.category)
    expect(toolsByCategory('video')).toHaveLength(counts.filter((c) => c === 'video').length)
    expect(toolsByCategory('image')).toHaveLength(counts.filter((c) => c === 'image').length)
    expect(toolsByCategory('pdf')).toHaveLength(counts.filter((c) => c === 'pdf').length)
    expect(toolsByCategory('video').every((t) => t.category === 'video')).toBe(true)
  })

  it('category hrefs match their tool href prefix', () => {
    for (const category of categories) {
      for (const tool of toolsByCategory(category.id)) {
        expect(tool.href.startsWith(`${category.href}/`)).toBe(true)
      }
    }
  })

  it('looks tools up by href', () => {
    expect(toolByHref('/tools/video/converter').id).toBe('video-converter')
    expect(toolByHref('/tools/pdf/merge').id).toBe('pdf-merge')
  })

  it('throws for unknown hrefs', () => {
    expect(() => toolByHref('/tools/does-not-exist')).toThrow(/Unknown tool/)
  })

  it('looks categories up by id and throws for unknown ids', () => {
    expect(categoryById('pdf').name).toBe('Document Processors')
    expect(() => categoryById('audio' as unknown as ToolCategoryId)).toThrow(/Unknown category/)
  })

  it('flags at most scaffolded tools and network-requiring tools consistently', () => {
    for (const tool of tools) {
      expect(['ready', 'scaffold']).toContain(tool.status)
    }
    // No tool needs the network — the whole point of Morph.
    expect(tools.filter((t) => t.requiresNetwork)).toHaveLength(0)
  })
})
