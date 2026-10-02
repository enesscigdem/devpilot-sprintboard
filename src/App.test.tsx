import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import App from './App'

describe('App', () => {
  it('üç sütun başlığını render eder', () => {
    render(<App />)
    expect(screen.getByText('SprintBoard')).toBeInTheDocument()
    expect(screen.getByText('Yapılacak')).toBeInTheDocument()
    expect(screen.getByText('Devam Ediyor')).toBeInTheDocument()
    expect(screen.getByText('Tamamlandı')).toBeInTheDocument()
  })
})
