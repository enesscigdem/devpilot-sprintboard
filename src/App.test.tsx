import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import App from './App'
import { sanitizeHtml, groupNotes, type Note } from './lib/notes'

const note = (over: Partial<Note>): Note => ({
  id: 'n', title: 'Not', html: '', pinned: false, createdAt: Date.now(), updatedAt: Date.now(), ...over,
})
const seed = (notes: Note[]) => window.localStorage.setItem('sprintboard.notes.v2', JSON.stringify(notes))
const stored = () => JSON.parse(window.localStorage.getItem('sprintboard.notes.v2') ?? '[]') as Note[]

describe('Notlar', () => {
  beforeEach(() => window.localStorage.clear())

  it('boş durumda not seçilmedi ekranını gösterir', () => {
    render(<App />)
    expect(screen.getByText('Henüz not yok')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Not seçilmedi' })).toBeInTheDocument()
  })

  it('yeni not oluşturur, başlık ve içeriği kaydeder', () => {
    render(<App />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Yeni not' })[0])
    fireEvent.change(screen.getByLabelText('Not başlığı'), { target: { value: 'Alışveriş' } })
    const body = screen.getByRole('textbox', { name: 'Not içeriği' })
    body.innerHTML = '<p>Süt <b>ve</b> ekmek</p>'
    fireEvent.input(body)
    const list = within(screen.getByLabelText('Not listesi'))
    expect(list.getByText('Alışveriş')).toBeInTheDocument()
    expect(list.getByText('Süt ve ekmek')).toBeInTheDocument()
    expect(stored()).toHaveLength(1)
    expect(stored()[0]).toMatchObject({ title: 'Alışveriş', html: '<p>Süt <b>ve</b> ekmek</p>' })
    expect(screen.getByText('3 kelime')).toBeInTheDocument()
  })

  it('boş kalan notu kaydetmez', () => {
    render(<App />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Yeni not' })[0])
    expect(stored()).toHaveLength(0)
  })

  it('listede notu seçince ayrıntısını sağda açar', () => {
    seed([note({ id: 'a', title: 'Birinci', html: '<p>Bir</p>', updatedAt: 2 }), note({ id: 'b', title: 'İkinci', html: '<p>İki</p>', updatedAt: 1 })])
    render(<App />)
    expect(screen.getByLabelText('Not başlığı')).toHaveValue('Birinci')
    fireEvent.click(screen.getByRole('button', { name: /İkinci/ }))
    expect(screen.getByLabelText('Not başlığı')).toHaveValue('İkinci')
    expect(screen.getByRole('textbox', { name: 'Not içeriği' })).toHaveTextContent('İki')
  })

  it('notu sabitler ve Sabitlenmiş grubunda gösterir', () => {
    seed([note({ id: 'a', title: 'Birinci' })])
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Notu sabitle' }))
    expect(within(screen.getByRole('region', { name: 'Sabitlenmiş' })).getByText('Birinci')).toBeInTheDocument()
    expect(stored()[0].pinned).toBe(true)
  })

  it('silme onay ister ve notu kayıttan düşürür', () => {
    seed([note({ id: 'a', title: 'Silinecek' })])
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Notu sil' }))
    expect(stored()).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'Sil' }))
    expect(screen.queryByText('Silinecek')).not.toBeInTheDocument()
    expect(stored()).toHaveLength(0)
  })

  it('başlık ve içerikte arar', () => {
    seed([note({ id: 'a', title: 'Toplantı', html: '<p>bütçe</p>' }), note({ id: 'b', title: 'Fikirler', html: '<p>logo</p>' })])
    render(<App />)
    const list = screen.getByLabelText('Not listesi')
    fireEvent.change(screen.getByLabelText('Notlarda ara'), { target: { value: 'BÜTÇE' } })
    expect(within(list).getByText('Toplantı')).toBeInTheDocument()
    expect(within(list).queryByText('Fikirler')).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Notlarda ara'), { target: { value: 'yok' } })
    expect(screen.getByText('Eşleşen not yok')).toBeInTheDocument()
  })

  it('eski görev kayıtlarını notlara taşır', () => {
    window.localStorage.setItem('sprintboard.tasks.v1', JSON.stringify([
      { id: 't1', title: 'Eski görev', description: 'Açıklama', status: 'Devam Ediyor' },
    ]))
    render(<App />)
    expect(within(screen.getByLabelText('Not listesi')).getByText('Eski görev')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Not içeriği' })).toHaveTextContent('Açıklama')
  })

  it('bozuk kaydı yok sayar', () => {
    window.localStorage.setItem('sprintboard.notes.v2', '{ bozuk')
    expect(() => render(<App />)).not.toThrow()
    expect(screen.getByText('Henüz not yok')).toBeInTheDocument()
  })

  it('kontrol listesi maddesini işaretler', () => {
    seed([note({ id: 'a', title: 'Liste', html: '<ul data-checklist=""><li>Süt</li></ul>' })])
    render(<App />)
    const li = within(screen.getByRole('textbox', { name: 'Not içeriği' })).getByText('Süt')
    li.getBoundingClientRect = () => ({ left: 0 } as DOMRect)
    fireEvent.click(li, { clientX: 8 })
    expect(stored()[0].html).toContain('data-checked="true"')
  })

  it('uzun başlık, boşluksuz metin ve çok satırlı içeriği not listesinde doğru görüntüler', () => {
    const longTitle = 'A'.repeat(120)
    const unbrokenBody = '<p>' + 'X'.repeat(300) + '</p><p>Satır 2</p>'
    seed([note({ id: 'long-note', title: longTitle, html: unbrokenBody })])
    render(<App />)
    const list = within(screen.getByLabelText('Not listesi'))
    expect(list.getByText(longTitle)).toBeInTheDocument()
    expect(list.getByText(new RegExp('X'.repeat(50)))).toBeInTheDocument()
  })

  it('editör sayfası responsive içerik kapsayıcısıyla görüntülenir', () => {
    seed([note({ id: '1', title: 'Responsive Not', html: '<p>İçerik alanı</p>' })])
    render(<App />)
    const editorPage = document.querySelector('.editor-page')
    expect(editorPage).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Not içeriği' })).toHaveTextContent('İçerik alanı')
  })
})

describe('sanitizeHtml', () => {
  it('script, olay özniteliği ve tehlikeli bağlantıları temizler', () => {
    const out = sanitizeHtml('<p onclick="x()">Merhaba<script>alert(1)</script></p><a href="javascript:alert(1)">k</a><a href="https://a.com">g</a><img src=x onerror=alert(1)>')
    expect(out).not.toMatch(/script|onclick|javascript|img|onerror/)
    expect(out).toContain('href="https://a.com"')
  })
})

describe('groupNotes', () => {
  it('Sabitlenmiş, Bugün ve Daha eski olarak gruplar', () => {
    const now = new Date('2026-05-20T12:00:00').getTime()
    const groups = groupNotes([
      note({ id: '1', pinned: true, updatedAt: now }),
      note({ id: '2', updatedAt: now - 1000 }),
      note({ id: '3', updatedAt: now - 40 * 86_400_000 }),
    ], now)
    expect(groups.map((g) => g.label)).toEqual(['Sabitlenmiş', 'Bugün', 'Daha eski'])
  })
})
