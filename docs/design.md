# SprintBoard tasarım temeli

Görsel yön: macOS uygulamalarından ilham alan sakin bir çalışma alanı. Sıcak gri yüzeyler, net tipografi, beyaz görev kartları ve sınırlı indigo vurgu.

- Sidebar pano gezinmesi ve pano ilerlemesi içindir. Görev araması ve durum filtresi ana alanın araç çubuğunda kalır.
- Ana düzen: üst gezinme satırı, pano başlığı, gerçek veriden ilerleme özeti, araç çubuğu, görev sütunları.
- `src/index.css` ortak renkleri, yüzeyleri, boşlukları ve bileşen stillerini belirler. Yeni bileşenlerde bu değişkenleri ve mevcut sınıfları kullanın; ikinci bir tema oluşturmayın.
- Vurgu rengi `--accent-color`, ana metin `--text`, ayırıcı `--line`. Durum renkleri sütunun `--status-color` ve `--status-bg` değişkenlerinden gelir.
- Kartlar 12px, kontroller 8–9px, dialog 20px köşe kullanır. Gölgeler hafif tutulur.
- Pano ve liste görünümü aynı görevleri ve aynı aksiyonları sunar. Mobilde sütunlar alt alta dizilir, sidebar açılır bir menü olur.
- Etkileşimler klavye ile kullanılmalı; sürükleme dışında durum seçimi korunmalıdır. Dialog odağı içeride tutar ve kapanınca açan kontrole döndürür.
- Sayaçlar ve ilerleme gerçek görevlerden hesaplanır. Örnek görevler veya çalışmayan gezinme öğeleri eklemeyin.
- Kullanıcının mevcut `sprintboard.tasks.v1` kayıtlarını koruyun.

Doğrulama: `npm run build`, `npm test`; masaüstü ve mobil tarayıcıda boş pano, dolu pano, liste, görev ekleme ve filtrelenmiş görünümü kontrol edin.
