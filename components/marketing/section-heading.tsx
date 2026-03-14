import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface SectionHeadingProps {
  eyebrow: string
  title: string
  description?: string
  className?: string
  align?: 'left' | 'center'
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
  align = 'left',
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'space-y-5',
        align === 'center' && 'mx-auto max-w-3xl text-center',
        className,
      )}
    >
      <Badge
        variant="outline"
        className={cn(
          'rounded-full border-cyan/20 bg-background/85 px-4 py-1.5 text-cyan',
          align === 'center' && 'mx-auto',
        )}
      >
        {eyebrow}
      </Badge>
      <div className="space-y-4">
        <h2 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          {title}
        </h2>
        {description ? (
          <p className="max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  )
}
