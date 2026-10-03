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
    expect(screen.getByRole('heading', { name: 'Yapılacak' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Devam Ediyor' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Tamamlandı' })).toBeInTheDocument()
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
    expect(screen.getAllByText('Henüz görev yok.')).toHaveLength(2)
  })

  it('yalnızca boşluk içeren başlığı kabul etmez', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Yeni görev' }))
    const baslik = await screen.findByLabelText('Başlık')
    fireEvent.change(baslik, { target: { value: '   ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Görevi ekle' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Başlık zorunludur.')
    expect(screen.getAllByText('Henüz görev yok.')).toHaveLength(3)
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
    expect(screen.getAllByText('Henüz görev yok.')).toHaveLength(3)
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
    expect(screen.getAllByText('Henüz görev yok.')).toHaveLength(2)

    fireEvent.dragStart(screen.getByText('Taşınacak görev'), { dataTransfer })
    fireEvent.drop(screen.getByLabelText('Tamamlandı'), { dataTransfer })

    const tamamlandi = within(screen.getByLabelText('Tamamlandı'))
    expect(tamamlandi.getByText('Taşınacak görev')).toBeInTheDocument()
    expect(tamamlandi.getByText('1')).toBeInTheDocument()
    expect(within(screen.getByLabelText('Devam Ediyor')).getByText('0')).toBeInTheDocument()
    expect(within(screen.getByLabelText('Yapılacak')).getByText('0')).toBeInTheDocument()
    expect(screen.getAllByText('Henüz görev yok.')).toHaveLength(2)

    fireEvent.click(screen.getByRole('button', { name: 'Taşınacak görev görevini sil' }))
    expect(screen.queryByText('Taşınacak görev')).not.toBeInTheDocument()
    expect(screen.getAllByText('Henüz görev yok.')).toHaveLength(3)
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
    expect(screen.getAllByText('Henüz görev yok.')).toHaveLength(2)
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
    expect(screen.getAllByText('Henüz görev yok.')).toHaveLength(3)
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

  it('araç çubuğu filtresi yalnızca seçilen durumdaki görevleri gösterir', () => {
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
    const filter = screen.getByLabelText('Duruma göre filtrele')
    expect(screen.queryAllByText('Henüz görev yok.')).toHaveLength(0)
    fireEvent.change(filter, { target: { value: 'Devam Ediyor' } })
    expect(screen.getByText('Kodlama görevi')).toBeInTheDocument()
    expect(screen.queryByText('Tasarım görevi')).not.toBeInTheDocument()
    expect(screen.queryByText('Yayın görevi')).not.toBeInTheDocument()
    expect(screen.getAllByText('Eşleşen görev yok.')).toHaveLength(2)
    fireEvent.change(filter, { target: { value: 'Tümü' } })
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

    expect(screen.getByRole('combobox', { name: 'Duruma göre filtrele' })).toHaveValue('Tümü')
    expect(screen.getByLabelText('Görevlerde ara')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Sprint 1/  })).toBeInTheDocument()
    expect(screen.getByText('Henüz görev yok')).toBeInTheDocument()
  })

  it('sütun başlıklarında sade sayaç ve sütuna görev ekleme aksiyonu sunar', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: 'Yapılacak sütununa görev ekle' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Devam Ediyor sütununa görev ekle' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tamamlandı sütununa görev ekle' })).toBeInTheDocument()
  })
  it('sütundan eklenen görev doğru duruma kaydedilir ve liste görünümünde silinebilir', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Devam Ediyor sütununa görev ekle' }))
    expect(screen.getByLabelText('Durum')).toHaveValue('Devam Ediyor')
    fireEvent.change(screen.getByLabelText('Başlık'), { target: { value: 'Odak işi' } })
    fireEvent.click(screen.getByRole('button', { name: 'Görevi ekle' }))
    expect(within(screen.getByLabelText('Devam Ediyor')).getByText('Odak işi')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Liste' }))
    fireEvent.change(screen.getByLabelText('Durum değiştir'), { target: { value: 'Tamamlandı' } })
    expect(within(screen.getByLabelText('Tamamlandı')).getByText('Odak işi')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Odak işi görevini sil' }))
    expect(screen.queryByText('Odak işi')).not.toBeInTheDocument()
  })

  it('arama ve durum filtresini birlikte uygular ve temizler', () => {
    window.localStorage.setItem('sprintboard.tasks.v1', JSON.stringify([
      { id: '1', title: 'Tasarım', status: 'Yapılacak' },
      { id: '2', title: 'Tasarım kontrolü', status: 'Tamamlandı' },
      { id: '3', title: 'Kodlama', status: 'Tamamlandı' },
    ]))
    render(<App />)
    fireEvent.change(screen.getByLabelText('Görevlerde ara'), { target: { value: 'Tasarım' } })
    fireEvent.change(screen.getByLabelText('Duruma göre filtrele'), { target: { value: 'Tamamlandı' } })
    expect(screen.getByText('Tasarım kontrolü')).toBeInTheDocument()
    expect(screen.queryByText('Tasarım')).not.toBeInTheDocument()
    expect(screen.queryByText('Kodlama')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Filtreleri temizle' }))
    expect(screen.getByText('Tasarım')).toBeInTheDocument()
    expect(screen.getByText('Kodlama')).toBeInTheDocument()
  })

})

