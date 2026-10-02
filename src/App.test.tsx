import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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

  it('yeni görevi Yapılacak sütununa ekler', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Yeni görev' }))
    const baslik = await screen.findByLabelText('Başlık')
    fireEvent.change(baslik, { target: { value: 'Yeni test görevi' } })
    fireEvent.change(screen.getByLabelText(/Açıklama/), { target: { value: 'Kısa açıklama' } })
    fireEvent.click(screen.getByRole('button', { name: 'Görevi ekle' }))
    expect(await screen.findByText('Yeni test görevi')).toBeInTheDocument()
    expect(screen.getByText('Kısa açıklama')).toBeInTheDocument()
    expect(screen.getAllByText('Bu sütunda henüz kart yok.')).toHaveLength(2)
  })

  it('yalnızca boşluk içeren başlığı kabul etmez', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Yeni görev' }))
    const baslik = await screen.findByLabelText('Başlık')
    fireEvent.change(baslik, { target: { value: '   ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Görevi ekle' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Başlık zorunludur.')
    expect(screen.getAllByText('Bu sütunda henüz kart yok.')).toHaveLength(3)
  })

  it('karttan görevi siler ve boş durumu geri getirir', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Yeni görev' }))
    const baslik = await screen.findByLabelText('Başlık')
    fireEvent.change(baslik, { target: { value: 'Silinecek görev' } })
    fireEvent.click(screen.getByRole('button', { name: 'Görevi ekle' }))
    expect(await screen.findByText('Silinecek görev')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Silinecek görev görevini sil' }))
    expect(screen.queryByText('Silinecek görev')).not.toBeInTheDocument()
    expect(screen.getAllByText('Bu sütunda henüz kart yok.')).toHaveLength(3)
  })
})
