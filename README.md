# SprintBoard

DevPilot ile sıfırdan geliştirilecek küçük bir görev takip uygulaması.

## Hedef

Türkçe arayüzde görev oluşturma, düzenleme, silme ve Yapılacak / Devam Ediyor / Tamamlandı durumları arasında geçiş.

## Teknoloji kararı

- React + TypeScript + Vite
- npm
- İlk sürümde backend, veritabanı ve kullanıcı girişi yok
- Kalıcı saklama sonraki görevde localStorage ile eklenecek
- Canlı yayın için GitHub reposuna bağlı Vercel kullanılacak

## Kurulum

Gereksinimler: Node.js 20+ ve npm.

```bash
npm install
```

## Çalıştırma

Geliştirme sunucusunu başlatmak için:

```bash
npm run dev
```

Üretim derlemesi ve önizleme:

```bash
npm run build
npm run preview
```

## Test

```bash
npm test
```

## Geliştirme sırası

1. Minimal çalışabilir iskelet ve test altyapısı
2. Görev ekleme ve silme
3. Durum değiştirme ve düzenleme
4. localStorage ile kalıcı saklama
5. Arama, öncelik filtresi ve sayaçlar

Her görev ayrı analiz, uygulama, doğrulama ve insan incelemesi üzerinden ilerleyecek. Bu repository başlangıçta uygulama kodu içermez.
