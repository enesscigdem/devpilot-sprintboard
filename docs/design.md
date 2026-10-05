# SprintBoard tasarım temeli

Görsel yön: iCloud Notes. Solda not listesi, sağda seçili notun zengin metin editörü; sıcak sarı vurgu, açık/koyu tema (`prefers-color-scheme`).

- Düzen: sol panel (başlık, arama, tarihe göre gruplanmış liste) + sağ panel (biçimlendirme çubuğu, başlık, içerik, durum satırı). Mobilde iki panel ayrı ekran olur, geri düğmesi listeye döner.
- Renkler ve yüzeyler `src/index.css` başındaki CSS değişkenlerinden gelir; ikinci bir tema eklemeyin.
- Editör `contentEditable` üzerine kuruludur (`src/components/NoteEditor.tsx`). Desteklenen biçimler: başlık/alt başlık, kalın, italik, altı/üstü çizili, madde/numara/kontrol listesi, alıntı, kod bloğu, bağlantı, ayırıcı çizgi.
- İçerik her yüklemede ve yapıştırmada `sanitizeHtml` ile izin verilen etiketlere indirilir (`src/lib/notes.ts`). Yeni etiket eklerken izin listesini güncelleyin.
- Notlar `sprintboard.notes.v2` anahtarında saklanır. Eski `sprintboard.tasks.v1` görevleri ilk açılışta notlara taşınır (durum, kontrol listesi maddesi olarak).
- Boş kalan not başka nota geçilince silinir ve kaydedilmez.

Doğrulama: `npm run build`, `npm test`; masaüstü ve dar ekranda boş durum, dolu liste, arama, biçimlendirme ve silme akışını tarayıcıda kontrol edin.
