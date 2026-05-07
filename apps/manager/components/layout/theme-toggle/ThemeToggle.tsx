'use client'

import { useState } from 'react'
import { MoonIcon, SunIcon } from 'lucide-react'
import { Button } from '@pkg/ui'
import type { IThemeToggleProps, TTheme } from './types'

const ThemeToggle = ({ defaultTheme }: IThemeToggleProps) => {
  const [theme, setTheme] = useState<TTheme>(defaultTheme)

  const handleClick = () => {
    const next: TTheme = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.classList.toggle('dark', next === 'dark')
    document.cookie = `theme=${next}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
    setTheme(next)
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      title={theme === 'dark' ? 'Світла тема' : 'Темна тема'}
      aria-label="Перемкнути тему"
    >
      {theme === 'dark' ? <SunIcon className="size-5" /> : <MoonIcon className="size-5" />}
    </Button>
  )
}

export { ThemeToggle }
