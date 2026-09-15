import {
  ArrowLeftRight,
  AudioLines,
  Crop,
  Eraser,
  File,
  FileText,
  FileType,
  Film,
  Image,
  ImageDown,
  ImageUpscale,
  LucideIcon,
  Merge,
  Minimize2,
  RotateCw,
  Scissors,
  Video,
  VideoOff,
} from "lucide-react"

export type ToolCategoryId = "video" | "image" | "pdf"

export type ToolStatus = "ready" | "scaffold"

export interface ToolCategory {
  id: ToolCategoryId
  name: string
  icon: LucideIcon
  color: string
  href: string
}

export interface Tool {
  id: string
  title: string
  description: string
  href: string
  icon: LucideIcon
  category: ToolCategoryId
  status: ToolStatus
  requiresNetwork?: boolean
}

export const categories: ToolCategory[] = [
  {
    id: "video",
    name: "Video Engines",
    icon: Film,
    color: "text-blue-500",
    href: "/tools/video",
  },
  {
    id: "image",
    name: "Image Processors",
    icon: Image,
    color: "text-red-500",
    href: "/tools/image",
  },
  {
    id: "pdf",
    name: "Document Processors",
    icon: File,
    color: "text-green-500",
    href: "/tools/pdf",
  },
]

export const tools: Tool[] = [
  // Video
  {
    id: "video-converter",
    title: "Video Converter",
    description: "WASM accelerated offline run",
    href: "/tools/video/converter",
    icon: Video,
    category: "video",
    status: "ready",
  },
  {
    id: "video-compressor",
    title: "Compress Video",
    description: "WASM accelerated offline run",
    href: "/tools/video/compressor",
    icon: VideoOff,
    category: "video",
    status: "ready",
  },
  {
    id: "video-audio-extract",
    title: "Extract Audio",
    description: "Rip audio from video, or convert audio formats",
    href: "/tools/video/audio",
    icon: AudioLines,
    category: "video",
    status: "ready",
  },
  // Image
  {
    id: "image-convert",
    title: "Convert Image",
    description: "WASM accelerated offline run",
    href: "/tools/image/convert",
    icon: ArrowLeftRight,
    category: "image",
    status: "ready",
  },
  {
    id: "image-compress",
    title: "Compress Image",
    description: "WASM accelerated offline run",
    href: "/tools/image/compress",
    icon: Minimize2,
    category: "image",
    status: "ready",
  },
  {
    id: "image-resize",
    title: "Resize Image",
    description: "WASM accelerated offline run",
    href: "/tools/image/resize",
    icon: ImageUpscale,
    category: "image",
    status: "ready",
  },
  {
    id: "image-crop",
    title: "Crop Image",
    description: "WASM accelerated offline run",
    href: "/tools/image/crop",
    icon: Crop,
    category: "image",
    status: "ready",
  },
  {
    id: "image-background-remove",
    title: "Remove Background",
    description: "Scaffolded — engine arriving soon",
    href: "/tools/image/background-remove",
    icon: Eraser,
    category: "image",
    status: "scaffold",
  },
  // PDF / Documents
  {
    id: "pdf-image-to-pdf",
    title: "Image to PDF",
    description: "WASM accelerated offline run",
    href: "/tools/pdf/image-to-pdf",
    icon: Image,
    category: "pdf",
    status: "ready",
  },
  {
    id: "pdf-to-image",
    title: "PDF to Image",
    description: "WASM accelerated offline run",
    href: "/tools/pdf/pdf-to-image",
    icon: ImageDown,
    category: "pdf",
    status: "ready",
  },
  {
    id: "pdf-docx-to-pdf",
    title: "DOCX to PDF",
    description: "WASM accelerated offline run",
    href: "/tools/pdf/docx-to-pdf",
    icon: FileText,
    category: "pdf",
    status: "ready",
  },
  {
    id: "pdf-to-docx",
    title: "PDF to DOCX",
    description: "Text extraction — layout not preserved",
    href: "/tools/pdf/pdf-to-docx",
    icon: FileType,
    category: "pdf",
    status: "ready",
  },
  {
    id: "pdf-merge",
    title: "Merge PDF",
    description: "WASM accelerated offline run",
    href: "/tools/pdf/merge",
    icon: Merge,
    category: "pdf",
    status: "ready",
  },
  {
    id: "pdf-split",
    title: "Split Pages",
    description: "WASM accelerated offline run",
    href: "/tools/pdf/split",
    icon: Scissors,
    category: "pdf",
    status: "ready",
  },
  {
    id: "pdf-rotate",
    title: "Rotate PDF",
    description: "WASM accelerated offline run",
    href: "/tools/pdf/rotate",
    icon: RotateCw,
    category: "pdf",
    status: "ready",
  },
]

export function toolsByCategory(category: ToolCategoryId): Tool[] {
  return tools.filter((tool) => tool.category === category)
}

export function toolByHref(href: string): Tool {
  const tool = tools.find((t) => t.href === href)
  if (!tool) throw new Error(`Unknown tool: ${href}`)
  return tool
}

export function categoryById(id: ToolCategoryId): ToolCategory {
  const category = categories.find((c) => c.id === id)
  if (!category) throw new Error(`Unknown category: ${id}`)
  return category
}
