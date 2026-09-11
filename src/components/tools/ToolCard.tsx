import Link from "next/link"
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronRight, Wifi } from 'lucide-react'
import type { Tool, ToolCategory } from '@/lib/tools'

export default function ToolCard({ tool, category }: { tool: Tool; category: ToolCategory }) {
  const Icon = tool.icon
  return (
    <Link href={tool.href} className="block group">
      <Card className="bg-background/80 transition-colors group-hover:bg-accent/40 h-full">
        <CardHeader>
          <div className="bg-accent py-1 px-2 rounded-sm w-fit h-fit">
            <Icon className={category.color + " h-5 w-5"} />
          </div>
          <CardTitle className="font-bold text-xl md:text-2xl">{tool.title}</CardTitle>
          <CardAction>
            <ChevronRight className="group-hover:translate-x-1 transition-transform" />
          </CardAction>
        </CardHeader>
        <CardDescription className="text-sm font-light px-4 flex items-center gap-2">
          <p>{tool.description}</p>
          {tool.status === "scaffold" && (
            <Badge variant="secondary" className="text-muted-foreground">Soon</Badge>
          )}
          {tool.requiresNetwork && (
            <Badge variant="secondary" className="text-muted-foreground gap-1">
              <Wifi className="size-3" />
              Needs internet
            </Badge>
          )}
        </CardDescription>
      </Card>
    </Link>
  )
}
