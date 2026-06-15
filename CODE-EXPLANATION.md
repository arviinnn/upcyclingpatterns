# Code Explanation Guide

Bu dosya kod bilmeyen birinin projeyi dosya dosya okuyabilmesi için hazırlandı. Kaynak dosyaların içinde de yorumlar var; bu rehber ise büyük resmi açıklar.

## En Önemli Dosyalar

| Dosya | Ne işe yarar? | Nereden başlamalı? |
| --- | --- | --- |
| `index.html` | Sayfanın iskeleti. Başlık, menü, hero alanı, bölümler, form, footer ve SEO etiketleri burada durur. | Üstteki `<head>` bölümü ayarları, `<body>` bölümü görünen sayfayı anlatır. |
| `style.css` | Sayfanın tüm görsel tasarımı. Renkler, boşluklar, kartlar, mobil uyum, karanlık mod ve baskı kuralları buradadır. | En üstteki `:root` değişkenleri markanın renk ve ölçü ayarlarıdır. |
| `script.js` | Sayfanın hareketli tarafı. Dil değiştirme, CMS verisi okuma, form doğrulama, menü, sekmeler ve lightbox burada çalışır. | Dosya başındaki harita ve en alttaki `init()` fonksiyonu akışı gösterir. |
| `sw.js` | Service worker. Siteyi PWA gibi kurabilir hale getirir ve temel dosyaları çevrimdışı kullanıma hazırlar. | `STATIC_ASSETS` listesi hangi dosyaların önbelleğe alınacağını gösterir. |
| `manifest.json` | PWA adı, ikonları, tema rengi ve kısayolları. | `icons` ve `shortcuts` alanları uygulama görünümünü belirler. |
| `netlify.toml` | Netlify yayın, güvenlik başlıkları, cache ayarları ve yönlendirmeler. | `GLOBAL SECURITY HEADERS` ve `REDIRECTS` bölümleri canlı yayını etkiler. |

## İçerik Dosyaları

`data/` klasöründeki JSON dosyaları sayfada görünen düzenlenebilir içerikleri taşır. JSON dosyalarına yorum yazılamaz; çünkü yorum eklenirse JSON geçersiz olur. Bu yüzden açıklamalar bu rehberde ve `admin/config.yml` içinde tutulur.

| Dosya | İçerik |
| --- | --- |
| `data/site.json` | Proje adı, e-posta, tarih, sosyal medya ve SEO metinleri. |
| `data/content.json` | Ana sayfadaki sabit metinlerin CMS karşılıkları. |
| `data/sections.json` | Hakkında, hedefler, faaliyetler, sonuçlar gibi bölüm listeleri. |
| `data/gallery.json` | Galeri görselleri ve YouTube videoları. |
| `data/news.json` | Haber kartları. |
| `data/outputs.json` | İndirilebilir çıktı kartları. |
| `data/partners.json` | Ortak okul kartları. |
| `data/faq.json` | Sık sorulan sorular. |
| `data/logos.json` | Footer ve görünürlük logoları. |
| `data/design.json` | CMS üzerinden değiştirilebilen görsel ölçüler. |

## Güvenli Düzenleme Sırası

1. Metin veya görsel değişikliği için önce `data/` dosyalarını ya da `/admin/` panelini kullanın.
2. Sayfa yapısını değiştirmek için `index.html` içinde ilgili bölümü bulun.
3. Görsel tasarımı değiştirmek için önce `style.css` içindeki `:root` değişkenlerini düzenleyin.
4. Davranış değiştirmek için `script.js` içinde ilgili `bind...`, `render...` veya `apply...` fonksiyonunu bulun.
5. Değişiklikten sonra `node scripts/build.js` ve `node --test tests/*.test.js` çalıştırın.

## Testler Ne Kontrol Eder?

| Test | Kontrol |
| --- | --- |
| `tests/smoke.test.js` | Kritik dosyalar açılıyor mu, ana sayfada konsol hatası ve kırık yerel link var mı? |
| `tests/a11y.test.js` | Başlık, dil etiketi, tek H1, görsel alt metinleri, form label'ları ve yatay taşma var mı? |
| `tests/i18n.test.js` | `index.html` içindeki her çeviri anahtarı İngilizce ve Türkçe sözlüklerde var mı? |
| `tests/encoding.test.js` | Yanlış karakter kodlaması yüzünden oluşan bozuk metin izleri geri gelmiş mi? |

## Kısa Mantık Haritası

```text
Tarayıcı index.html dosyasını açar.
  ↓
style.css sayfanın görünümünü yükler.
  ↓
script.js dil, tema, menü, form ve CMS davranışlarını başlatır.
  ↓
script.js data/*.json dosyalarını okur.
  ↓
JSON içeriği güvenli şekilde HTML alanlarına yazılır.
  ↓
sw.js ilk ziyaretten sonra temel dosyaları önbelleğe alır.
```
