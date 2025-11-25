# SoundCloud Clone - Big Data Seeder

## 🎯 Hedef
**50.000+ kayıt** ile veritabanını test ve performans analizi için doldurmak.

---

## 📦 Kurulum

### 1. Bağımlılıkları Yükle
```powershell
cd C:\soundcloud-clone\database\seeder
npm install
```

Bu komut şu paketleri yükler:
- `mssql` (v10.0.2) - MSSQL bağlantısı
- `@faker-js/faker` (v8.3.1) - Gerçekçi fake data

---

## ⚙️ Yapılandırma

### `db-seed.js` Dosyasında Düzenle:

```javascript
const config = {
    user: 'sa',                          // MSSQL kullanıcı adı
    password: 'YourStrongPassword123!',  // ⚠️ BURAYA ŞİFRENİ YAZ!
    server: 'localhost',                 // veya SQL Server IP
    database: 'FrekansDB',
    // ...
};
```

**Önemli:** `password` alanını kendi MSSQL şifrenle değiştir!

---

## 🚀 Kullanım

### Normal Çalıştırma
```powershell
npm run seed
```

### Hızlı Mod (4GB RAM Limiti)
Eğer 50.000 kayıtta memory hatası alırsan:
```powershell
npm run seed:fast
```

---

## 📊 Veri Hedefleri

Script şu miktarda veri oluşturur:

| Tablo | Kayıt Sayısı | Açıklama |
|-------|--------------|----------|
| **Users** | 1.000 | Sanatçılar (Lil Code, DJ SQL gibi) |
| **Genres** | 50 | Müzik türleri (Trap, Lo-Fi, House...) |
| **Albums** | 2.000 | Albümler |
| **Tracks** | **50.000** | 🎵 Şarkılar (Waveform data ile) |
| **Plays** | 100.000 | Dinleme kayıtları |
| **Likes** | 30.000 | Beğeniler |
| **Comments** | 20.000 | Yorumlar (zaman damgalı) |
| **Follows** | 5.000 | Takip ilişkileri |
| **TOPLAM** | **208.050** | ✅ |

---

## ⚡ Performans Optimizasyonları

### 1. Chunk-based Bulk Insert
- Veriler 1000'erlik parçalara bölünür
- Her chunk tek SQL sorgusuyla gönderilir
- 50.000 kayıt ~3-5 dakikada tamamlanır

### 2. İlerleme Göstergesi
```
Tracks: [████████████████████░░░░░░░░] 25000/50000 (50.0%)
```

### 3. Memory Yönetimi
- Veriler bellekte chunk'lar halinde işlenir
- Garbage collection için `--max-old-space-size=4096` bayrağı

---

## 🎨 Özel Özellikler

### 1. Waveform Data
Her şarkı için 100 elemanlı JSON array:
```json
[40, 70, 20, 90, 55, 80, ...]
```
Frontend'de ses dalgası görselleştirmesi için kullanılacak.

### 2. SoundCloud Tarzı İsimler
- **Sanatçılar:** "Lil Crypto", "DJ Database", "Young Algorithm"
- **Şarkılar:** "Midnight Dreams", "Neon Vibes", "Digital Paradise"

### 3. Zaman Damgalı Yorumlar
Yorumların %70'i şarkının belirli bir saniyesine yapılır:
```sql
TimestampSeconds: 45  -- Şarkının 45. saniyesine yorum
```

---

## 🐛 Hata Çözümleri

### Problem 1: Bağlantı Hatası
```
ConnectionError: Failed to connect to localhost:1433
```
**Çözüm:**
- MSSQL Server'ın çalıştığından emin ol
- SQL Server Configuration Manager'da TCP/IP'yi etkinleştir
- Port 1433'ün açık olduğunu kontrol et

### Problem 2: Yetki Hatası
```
Login failed for user 'sa'
```
**Çözüm:**
- `config.user` ve `config.password` doğru mu?
- SQL Server Authentication etkin mi?

### Problem 3: Timeout
```
RequestError: Timeout: Request failed to complete in 15000ms
```
**Çözüm:**
- Script'te `requestTimeout: 300000` (5 dakika) ayarlandı
- Yine de olursa değeri artır veya chunk boyutunu küçült

---

## 📈 Örnek Çıktı

```
🚀 SoundCloud Clone Big Data Seeder
=====================================
Target: 50,000+ Records
=====================================

🔌 Connecting to MSSQL...
✅ Connected to FrekansDB

🗑️  Cleaning existing data...
✅ Database cleaned

📊 Generating Users (Artists)...
Users: [██████████████████████████████] 1000/1000 (100.0%)
✅ Users seeded successfully!

📊 Generating Genres...
✅ Genres seeded successfully!

📊 Generating Albums...
Albums: [██████████████████████████████] 2000/2000 (100.0%)
✅ Albums seeded successfully!

📊 Generating 50,000 Tracks... (This may take a few minutes)
Tracks: [██████████████████████████████] 50000/50000 (100.0%)
⏳ Inserting 50,000 tracks in chunks...
Inserting Tracks: [██████████████████████████████] 50000/50000 (100.0%)
✅ Tracks seeded successfully!

... (Interactions)

🎉 =====================================
   SEEDING COMPLETED SUCCESSFULLY!
=====================================
⏱️  Duration: 187.45 seconds
📊 Total Records Inserted: 208,050

📈 Breakdown:
   - Users:    1,000
   - Genres:   50
   - Albums:   2,000
   - Tracks:   50,000
   - Plays:    100,000
   - Likes:    30,000
   - Comments: 20,000
   - Follows:  5,000
=====================================
```

---

## 🔍 Doğrulama Sorguları

Seed işleminden sonra kontrol et:

```sql
-- Toplam kayıt sayıları
SELECT 'Users' AS TableName, COUNT(*) AS RecordCount FROM [Identity].[Users]
UNION ALL
SELECT 'Genres', COUNT(*) FROM [Music].[Genres]
UNION ALL
SELECT 'Albums', COUNT(*) FROM [Music].[Albums]
UNION ALL
SELECT 'Tracks', COUNT(*) FROM [Music].[Tracks]
UNION ALL
SELECT 'Plays', COUNT(*) FROM [Interaction].[Plays]
UNION ALL
SELECT 'Likes', COUNT(*) FROM [Interaction].[Likes]
UNION ALL
SELECT 'Comments', COUNT(*) FROM [Interaction].[Comments]
UNION ALL
SELECT 'Follows', COUNT(*) FROM [Interaction].[Follows];

-- Waveform kontrolü
SELECT TOP 5 TrackID, Title, LEN(WaveformData) AS WaveformLength
FROM [Music].[Tracks];

-- En popüler şarkılar
SELECT TOP 10 
    T.Title,
    COUNT(P.PlayID) AS PlayCount
FROM [Music].[Tracks] T
LEFT JOIN [Interaction].[Plays] P ON T.TrackID = P.TrackID
GROUP BY T.Title
ORDER BY PlayCount DESC;
```

---

## 💡 İpuçları

1. **İlk çalıştırma:** Script otomatik olarak eski verileri temizler
2. **Tekrar çalıştırma:** Unique constraint hataları almamak için önce manual DELETE yap
3. **Production:** Gerçek ortamda `DELETE` komutlarını kaldır!
4. **Performans testi:** 50.000 şarkı ile sayfalama, arama ve sıralama sorgularını test et

---

## 📞 Destek

Sorun yaşarsan:
1. Console çıktısını oku (hangi tabloda hata aldığını gösterir)
2. SQL Server loglarını kontrol et
3. `CHUNK_SIZE` değerini 500'e düşür (daha yavaş ama stabil)

**Başarılar! 🚀**
