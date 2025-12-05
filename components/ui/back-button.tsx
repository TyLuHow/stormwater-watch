'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BackButtonProps {
  /**
   * The route to navigate to when clicked
   */
  href: string
  /**
   * Optional label text (defaults to "Back")
   */
  label?: string
  /**
   * Optional variant (defaults to "ghost")
   */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  /**
   * Optional size (defaults to "sm")
   */
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg'
  /**
   * Optional additional CSS classes
   */
  className?: string
}

export function BackButton({
  href,
  label = 'Back',
  variant = 'ghost',
  size = 'sm',
  className,
}: BackButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    router.push(href)
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={cn('gap-2', className)}
      aria-label={label}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  )
}
