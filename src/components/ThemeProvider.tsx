'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null
    if (savedTheme) {
      setThemeState(savedTheme)
    } else {
      setThemeState('system')
    }
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const root = window.document.documentElement
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    function applyTheme() {
      let activeTheme = theme
      if (theme === 'system') {
        activeTheme = mediaQuery.matches ? 'dark' : 'light'
      }

      if (activeTheme === 'dark') {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }

    applyTheme()
    localStorage.setItem('theme', theme)

    // Listen for OS system theme changes if set to system
    if (theme === 'system') {
      const listener = () => applyTheme()
      mediaQuery.addEventListener('change', listener)
      return () => mediaQuery.removeEventListener('change', listener)
    }
  }, [theme, mounted])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
