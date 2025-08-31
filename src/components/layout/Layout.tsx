import { ReactNode } from 'react'
import Header from './Header'
import Navigation from './Navigation'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="flex">
        <Navigation />
        <main className="flex-1 responsive-container py-6">
          {children}
        </main>
      </div>
    </div>
  )
}