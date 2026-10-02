import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import App from './App'

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

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

  it('kartı sürükleyip sütunlar arasında taşır, sayaçları ve boş durumları günceller', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Yeni görev' }))
    const baslik = await screen.findByLabelText('Başlık')
    fireEvent.change(baslik, { target: { value: 'Taşınacak görev' } })
    fireEvent.click(screen.getByRole('button', { name: 'Görevi ekle' }))
    expect(await screen.findByText('Taşınacak görev')).toBeInTheDocument()

    const veri = new Map<string, string>()
    const dataTransfer = {
      setData: (bicim: string, deger: string) => {
        veri.set(bicim, deger)
      },
      getData: (bicim: string) => veri.get(bicim) ?? '',
    }

    fireEvent.dragStart(screen.getByText('Taşınacak görev'), { dataTransfer })
    fireEvent.drop(screen.getByLabelText('Devam Ediyor'), { dataTransfer })

    const devamEden = within(screen.getByLabelText('Devam Ediyor'))
    expect(devamEden.getByText('Taşınacak görev')).toBeInTheDocument()
    expect(devamEden.getByText('1')).toBeInTheDocument()
    expect(within(screen.getByLabelText('Yapılacak')).getByText('0')).toBeInTheDocument()
    expect(screen.getAllByText('Bu sütunda henüz kart yok.')).toHaveLength(2)

    fireEvent.dragStart(screen.getByText('Taşınacak görev'), { dataTransfer })
    fireEvent.drop(screen.getByLabelText('Tamamlandı'), { dataTransfer })

    const tamamlandi = within(screen.getByLabelText('Tamamlandı'))
    expect(tamamlandi.getByText('Taşınacak görev')).toBeInTheDocument()
    expect(tamamlandi.getByText('1')).toBeInTheDocument()
    expect(within(screen.getByLabelText('Devam Ediyor')).getByText('0')).toBeInTheDocument()
    expect(within(screen.getByLabelText('Yapılacak')).getByText('0')).toBeInTheDocument()
    expect(screen.getAllByText('Bu sütunda henüz kart yok.')).toHaveLength(2)

    fireEvent.click(screen.getByRole('button', { name: 'Taşınacak görev görevini sil' }))
    expect(screen.queryByText('Taşınacak görev')).not.toBeInTheDocument()
    expect(screen.getAllByText('Bu sütunda henüz kart yok.')).toHaveLength(3)
  })

  it('kart üzerindeki durum seçimiyle görevi taşır', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Yeni görev' }))
    const baslik = await screen.findByLabelText('Başlık')
    fireEvent.change(baslik, { target: { value: 'Seçimle taşınacak' } })
    fireEvent.click(screen.getByRole('button', { name: 'Görevi ekle' }))
    expect(await screen.findByText('Seçimle taşınacak')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Durum değiştir'), { target: { value: 'Tamamlandı' } })
    const tamamlandi = within(screen.getByLabelText('Tamamlandı'))
    expect(tamamlandi.getByText('Seçimle taşınacak')).toBeInTheDocument()
    expect(within(screen.getByLabelText('Yapılacak')).getByText('0')).toBeInTheDocument()
  })

  it('görevleri ve sütun konumlarını localStorage ile saklar', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Yeni görev' }))
    const baslik = await screen.findByLabelText('Başlık')
    fireEvent.change(baslik, { target: { value: 'Kayıtlı görev' } })
    fireEvent.change(screen.getByLabelText(/Açıklama/), { target: { value: 'Kalıcı açıklama' } })
    fireEvent.click(screen.getByRole('button', { name: 'Görevi ekle' }))
    expect(await screen.findByText('Kayıtlı görev')).toBeInTheDocument()

    const veri = new Map<string, string>()
    const dataTransfer = {
      setData: (bicim: string, deger: string) => {
        veri.set(bicim, deger)
      },
      getData: (bicim: string) => veri.get(bicim) ?? '',
    }
    fireEvent.dragStart(screen.getByText('Kayıtlı görev'), { dataTransfer })
    fireEvent.drop(screen.getByLabelText('Tamamlandı'), { dataTransfer })
    expect(within(screen.getByLabelText('Tamamlandı')).getByText('Kalıcı açıklama')).toBeInTheDocument()

    const kayit = JSON.parse(window.localStorage.getItem('sprintboard.tasks.v1') ?? '[]') as Array<{
      title: string
      description?: string
      status: string
    }>
    expect(kayit).toHaveLength(1)
    expect(kayit[0]).toMatchObject({ title: 'Kayıtlı görev', description: 'Kalıcı açıklama', status: 'Tamamlandı' })
  })

  it('sayfa yenilendiğinde kayıtlı görevleri ve durumlarını geri yükler', () => {
    window.localStorage.setItem(
      'sprintboard.tasks.v1',
      JSON.stringify([{ id: 'gorev-1', title: 'Önceki görev', description: 'Önceki açıklama', status: 'Devam Ediyor' }]),
    )
    render(<App />)
    const devamEden = within(screen.getByLabelText('Devam Ediyor'))
    expect(devamEden.getByText('Önceki görev')).toBeInTheDocument()
    expect(devamEden.getByText('Önceki açıklama')).toBeInTheDocument()
    expect(devamEden.getByText('1')).toBeInTheDocument()
    expect(within(screen.getByLabelText('Yapılacak')).getByText('0')).toBeInTheDocument()
    expect(screen.getAllByText('Bu sütunda henüz kart yok.')).toHaveLength(2)
  })

  it('silinen görev kayıttan da düşer', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Yeni görev' }))
    const baslik = await screen.findByLabelText('Başlık')
    fireEvent.change(baslik, { target: { value: 'Silinecek kayıt' } })
    fireEvent.click(screen.getByRole('button', { name: 'Görevi ekle' }))
    expect(await screen.findByText('Silinecek kayıt')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Silinecek kayıt görevini sil' }))
    expect(screen.queryByText('Silinecek kayıt')).not.toBeInTheDocument()
    expect(JSON.parse(window.localStorage.getItem('sprintboard.tasks.v1') ?? '[]')).toHaveLength(0)
  })

  it('bozuk kaydı yok sayıp uygulamayı çökertmez', () => {
    window.localStorage.setItem('sprintboard.tasks.v1', '{ bozuk json')
    expect(() => render(<App />)).not.toThrow()
    expect(screen.getAllByText('Bu sütunda henüz kart yok.')).toHaveLength(3)
  })

  it('geçersiz ve eski kayıtları temizleyerek geri yükler', () => {
    window.localStorage.setItem(
      'sprintboard.tasks.v1',
      JSON.stringify({
        tasks: [
          null,
          { id: 5, title: '   ' },
          { id: 'gorev-2' },
          { id: 'gorev-3', title: 'Geçerli görev', status: 'Bilinmeyen durum' },
          { id: 'gorev-3', title: 'Kopya görev' },
        ],
      }),
    )
    render(<App />)
    const yapilacak = within(screen.getByLabelText('Yapılacak'))
    expect(yapilacak.getByText('Geçerli görev')).toBeInTheDocument()
    expect(screen.queryByText('Kopya görev')).not.toBeInTheDocument()
    expect(yapilacak.getByText('1')).toBeInTheDocument()
  })

  it('sidebar filtresi yalnızca seçilen durumdaki görevleri gösterir', () => {
    window.localStorage.setItem(
      'sprintboard.tasks.v1',
      JSON.stringify({
        tasks: [
          { id: 'gorev-1', title: 'Tasarım görevi', status: 'Yapılacak' },
          { id: 'gorev-2', title: 'Kodlama görevi', status: 'Devam Ediyor' },
          { id: 'gorev-3', title: 'Yayın görevi', status: 'Tamamlandı' },
        ],
      }),
    )
    render(<App />)
    const sidebar = within(screen.getByLabelText('Görev filtreleri'))
    expect(screen.getAllByText('Bu sütunda henüz kart yok.')).toHaveLength(0)
    fireEvent.click(sidebar.getByRole('button', { name: /Devam Ediyor/ }))
    expect(screen.getByText('Kodlama görevi')).toBeInTheDocument()
    expect(screen.queryByText('Tasarım görevi')).not.toBeInTheDocument()
    expect(screen.queryByText('Yayın görevi')).not.toBeInTheDocument()
    expect(screen.getAllByText('Bu sütunda henüz kart yok.')).toHaveLength(2)
    fireEvent.click(sidebar.getByRole('button', { name: /Tümü/ }))
    expect(screen.getByText('Tasarım görevi')).toBeInTheDocument()
    expect(screen.getByText('Kodlama görevi')).toBeInTheDocument()
    expect(screen.getByText('Yayın görevi')).toBeInTheDocument()
  })

  it('sidebar yalnızca pano listesini sunar ve filtreleri araç çubuğuna taşır', () => {
    render(<App />)
    const sidebar = screen.getByLabelText('Panolar')
    expect(sidebar.tagName).toBe('ASIDE')
    expect(within(sidebar).getByRole('button', { name: /Sprint 1/ })).toHaveAttribute('aria-current', 'true')
    expect(within(sidebar).queryByRole('button', { name: /Tümü/ })).not.toBeInTheDocument()
    expect(within(sidebar).queryByRole('button', { name: /Yeni görev/ })).not.toBeInTheDocument()

    const toolbar = screen.getByRole('group', { name: 'Duruma göre filtrele' })
    expect(within(toolbar).getByRole('button', { name: 'Tümü' })).toHaveAttribute('aria-current', 'true')
    expect(within(toolbar).getByRole('button', { name: 'Tamamlandı' })).toHaveAttribute('aria-current', 'false')
    expect(screen.getByLabelText('Görevlerde ara')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Sprint 1' })).toBeInTheDocument()
    expect(screen.getByText('Henüz görev yok')).toBeInTheDocument()
  })

  it('sütun başlıklarında sade sayaç ve sütuna görev ekleme aksiyonu sunar', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: 'Yapılacak sütununa görev ekle' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Devam Ediyor sütununa görev ekle' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tamamlandı sütununa görev ekle' })).toBeInTheDocument()
  })
})
