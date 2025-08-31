import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Layout from '@/components/layout/Layout'

// Mock the child components
vi.mock('@/components/layout/Header', () => ({
  default: () => <div data-testid="header">Header Component</div>
}))

vi.mock('@/components/layout/Navigation', () => ({
  default: () => <div data-testid="navigation">Navigation Component</div>
}))

describe('Layout Component', () => {
  it('renders without crashing', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    )
    
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('renders Header component', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    )
    
    expect(screen.getByTestId('header')).toBeInTheDocument()
  })

  it('renders Navigation component', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    )
    
    expect(screen.getByTestId('navigation')).toBeInTheDocument()
  })

  it('renders children content in main element', () => {
    const testContent = 'This is test content'
    render(
      <Layout>
        <div>{testContent}</div>
      </Layout>
    )
    
    const mainElement = screen.getByRole('main')
    expect(mainElement).toBeInTheDocument()
    expect(mainElement).toHaveTextContent(testContent)
  })

  it('applies correct CSS classes for layout structure', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    )
    
    // Check root container classes
    const rootDiv = screen.getByText('Test Content').closest('.min-h-screen')
    expect(rootDiv).toHaveClass('min-h-screen', 'bg-background', 'text-foreground')
    
    // Check main element classes
    const mainElement = screen.getByRole('main')
    expect(mainElement).toHaveClass('flex-1', 'responsive-container', 'py-6')
  })

  it('has proper semantic structure', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    )
    
    // Verify semantic HTML structure
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('supports multiple children elements', () => {
    render(
      <Layout>
        <div>First child</div>
        <div>Second child</div>
        <span>Third child</span>
      </Layout>
    )
    
    expect(screen.getByText('First child')).toBeInTheDocument()
    expect(screen.getByText('Second child')).toBeInTheDocument()
    expect(screen.getByText('Third child')).toBeInTheDocument()
  })
})