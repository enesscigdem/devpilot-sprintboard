# SprintBoard

iCloud Notes tarzı, zengin metin destekli küçük bir not uygulaması.

## Hedef

Türkçe arayüzde solda not listesi, sağda seçili notun zengin metin editörü. Notlar oluşturulur, aranır, sabitlenir ve silinir.

## Teknoloji kararı

- React + TypeScript + Vite
- npm
- İlk sürümde backend, veritabanı ve kullanıcı girişi yok
- Notlar bu tarayıcıda localStorage ile saklanır (eski görevler otomatik taşınır)
- Canlı yayın için GitHub reposuna bağlı Vercel kullanılacak

## Kurulum

Gereksinimler: Node.js 20+ ve npm.

```bash
npm ci
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

Her görev ayrı analiz, uygulama, doğrulama ve insan incelemesi üzerinden ilerleyecek. Tasarım geliştirmelerinde [tasarım temelini](docs/design.md) referans alın.

