# 🎯 SUNUM SIRASINDA SQL'DE NASIL GÖSTERECEKSİNİZ?
## Trigger, Stored Procedure ve Backup'ları Bulma Rehberi

**🔧 SQL Server Management Studio (SSMS) - Türkçe Arayüz**

---

## 📍 1. STORED PROCEDURES NASIL BULUNUR?

### Adım Adım (SSMS Türkçe):

1. **SQL Server Management Studio'yu açın**
2. **Veritabanlarınız** → **FrekansDB** klasörünü açın
3. **Programlanabilirlik** (veya **Programmability**) klasörünü açın
4. **Saklı Yordamlar** (veya **Stored Procedures**) klasörünü açın

```
FrekansDB
└─ 📁 Programlanabilirlik
   └─ 📁 Saklı Yordamlar
      ├─ dbo.sp_CreateUser
      ├─ dbo.sp_GetTrackDetails
      ├─ dbo.sp_GetUserPlaylists
      └─ ... (30 SP)
```

### Kodunu Nasıl Gösterirsiniz?

**Yöntem 1: Sağ Tık ile**
```
1. Stored Procedure'ün üzerine SAĞ TIK
2. "Değiştir" (Modify) veya "Kodlama" → "CREATE Kodu" seçin
3. Kod penceresi açılır ✅
```

**Yöntem 2: Çift Tık**
```
1. SP'nin üzerine ÇİFT TIK
2. Kod otomatik açılır
```

---

## 🔥 2. TRIGGERS NASIL BULUNUR?

### Adım Adım:

Trigger'lar **tablolara bağlı** olduğu için tablo içinde bulunur!

1. **Veritabanları** → **FrekansDB** → **Tablolar** klasörünü açın
2. Hangi tablonun trigger'ını göstermek istiyorsanız o tabloyu bulun

### Örnek 1: PlayCount Trigger'ı (trg_UpdatePlayCount)

```
Tablolar
└─ 📁 Interaction.Plays
   ├─ 📁 Sütunlar (Columns)
   ├─ 📁 Anahtarlar (Keys)
   ├─ 📁 Kısıtlamalar (Constraints)
   └─ 📁 Tetikleyiciler (Triggers) 👈 BURAYA TIKLAYUN!
      └─ ⚡ trg_UpdatePlayCount
```

### Örnek 2: Takipçi Sayısı Trigger'ı

```
Tablolar
└─ 📁 Interaction.Follows
   └─ 📁 Tetikleyiciler
      ├─ ⚡ trg_UpdateFollowerCount_Insert
      └─ ⚡ trg_UpdateFollowerCount_Delete
```

### Örnek 3: Spam Koruması Trigger'ı

```
Tablolar
└─ 📁 Interaction.Comments
   └─ 📁 Tetikleyiciler
      └─ ⚡ trg_PreventCommentSpam
```

### Trigger Kodunu Nasıl Gösterirsiniz?

```
1. Trigger'ın üzerine SAĞ TIK
2. "Değiştir" (Modify) seçin
3. Kod açılır ✅
```

**Alternatif: SQL Sorgusu ile**
```sql
-- Yeni Query penceresi açın (Ctrl+N)
EXEC sp_helptext 'Interaction.trg_UpdatePlayCount';
```

---

## 💾 3. BACKUP'LARI NASIL GÖSTERİRSİNİZ?

### A. Backup Dosyalarını Windows'ta Gösterin

**Sunum Sırasında:**

```
1. Windows tuşu + E (Dosya Gezgini)
2. c:\frekans\backups\ klasörüne gidin
3. Dosyaları gösterin:
   - FrekansDB_full_2025-12-23.bak (65 MB)
   - json_2025-12-23\ klasörü
   - stored_procedures_2025-12-23\ klasörü
```

**Konuşma:**
> "Bakın, backup dosyalarımız burada. Bu .bak dosyası SQL Server'ın native backup'ı, 65 MB. JSON klasöründe her tablo ayrı ayrı, ve stored procedures klasöründe tüm SP'lerin kodları var."

---

### B. SQL'de Backup Geçmişini Gösterin

**SSMS'te Query Açın:**

```sql
-- Backup geçmişini göster
SELECT 
    bs.database_name AS [Veritabanı],
    bs.backup_start_date AS [Yedekleme Zamanı],
    bs.type AS [Tip],
    CASE bs.type
        WHEN 'D' THEN 'Full (Tam Yedek)'
        WHEN 'I' THEN 'Differential (Fark Yedek)'
        WHEN 'L' THEN 'Log Yedek'
    END AS [Yedek Türü],
    bs.backup_size/1024/1024 AS [Boyut (MB)],
    bmf.physical_device_name AS [Dosya Yolu]
FROM msdb.dbo.backupset bs
LEFT JOIN msdb.dbo.backupmediafamily bmf ON bs.media_set_id = bmf.media_set_id
WHERE bs.database_name = 'FrekansDB'
ORDER BY bs.backup_start_date DESC;
```

**Bu sorgu şunu gösterir:**
```
Veritabanı | Yedekleme Zamanı     | Yedek Türü    | Boyut  | Dosya Yolu
-----------|---------------------|---------------|--------|----------------------------------
FrekansDB  | 2025-12-23 11:03:03 | Full          | 65 MB  | C:\frekans\backups\FrekansDB_full...
FrekansDB  | 2025-12-23 11:02:34 | Differential  | 12 MB  | C:\frekans\backups\FrekansDB_diff...
```

---

### C. Backup Script'ini Gösterin

**VS Code'da:**
```
1. backup.ps1 dosyasını açın
2. Kodu gösterin:
```

```powershell
# Bu script'i gösterin
param([string]$BackupType = "full")

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupPath = "C:\frekans\backups"

sqlcmd -S localhost,52548 -d FrekansDB -Q "
    BACKUP DATABASE FrekansDB 
    TO DISK = '$backupPath\FrekansDB_${BackupType}_$timestamp.bak'
    WITH COMPRESSION
"
```

---

## 🎤 SUNUM SIRASINDA NASIL GÖSTERECEĞINIZ - ADIM ADIM

### 📝 BÖLÜM 1: Stored Procedures (1.5 dk)

**1. Frontend'de Demo Yapın:**
```
✅ Browser'da track-detail.html açın
✅ F12 basın (DevTools)
✅ Network sekmesi
✅ Sayfayı yenileyin
✅ GET /api/tracks/42 isteğini gösterin
```

**2. Backend Kodunu Gösterin:**
```
✅ VS Code → server.js açın
✅ GET /api/tracks/:id endpoint'ini bulun
✅ "execute('Music.sp_GetTrackDetails')" satırını gösterin
```

**3. SQL'de SP'yi Gösterin:**
```
✅ SSMS açın
✅ FrekansDB → Programlanabilirlik → Saklı Yordamlar
✅ sp_GetTrackDetails bulun
✅ Sağ tık → Değiştir
✅ Kodu gösterin (3 tablo JOIN yapıyor)
```

**Söyleyeceğiniz:**
> "Bakın, frontend'den istek geldi, backend bu SP'yi çağırdı. SP'nin kodu da burada. 3 tabloyu birleştirerek tek seferde şarkı bilgilerini getiriyor."

---

### 🔥 BÖLÜM 2: Triggers (2 dk)

**1. PlayCount Trigger Demo:**

**Frontend'de:**
```
✅ track-detail.html açık
✅ PlayCount sayısını not edin (örn: 15,234)
✅ Play butonuna basın
✅ 2-3 saniye bekleyin
✅ Sayfayı yenileyin (F5)
✅ PlayCount 15,235 oldu! ✅
```

**SQL'de:**
```
✅ SSMS açın
✅ Tablolar → Interaction.Plays
✅ Tetikleyiciler klasörünü açın
✅ trg_UpdatePlayCount'a sağ tık → Değiştir
✅ Kodu gösterin
```

**Kod Açıklama:**
```sql
CREATE TRIGGER Interaction.trg_UpdatePlayCount
ON Interaction.Plays
AFTER INSERT  -- Plays tablosuna INSERT olunca
AS
BEGIN
    UPDATE Music.Tracks
    SET PlayCount = PlayCount + 1  -- PlayCount +1 artar
    FROM Music.Tracks t
    INNER JOIN inserted i ON t.TrackID = i.TrackID
END
```

**Söyleyeceğiniz:**
> "İşte bu trigger. Plays tablosuna yeni kayıt eklenince otomatik çalışıyor. PlayCount'u +1 arttırıyor. Biz backend'de 'PlayCount güncelle' diye kod yazmadık, trigger otomatik yapıyor."

---

**2. Follower Trigger Demo:**

**Frontend'de:**
```
✅ profile.html açın
✅ Takipçi sayısını not edin (örn: 1,245)
✅ Follow butonuna tıklayın
✅ Sayfayı yenileyin
✅ 1,246 oldu! ✅
```

**SQL'de:**
```
✅ Tablolar → Interaction.Follows
✅ Tetikleyiciler
✅ trg_UpdateFollowerCount_Insert
✅ Kodu gösterin
```

---

**3. Spam Trigger Demo:**

**Frontend'de:**
```
✅ Şarkıya 1 yorum yapın → Başarılı ✅
✅ Hemen 2. yorum yapmayı deneyin
✅ HATA! "5 saniye bekleyin" ❌
```

**SQL'de:**
```
✅ Tablolar → Interaction.Comments
✅ Tetikleyiciler
✅ trg_PreventCommentSpam
✅ Kodu gösterin
```

**Söyleyeceğiniz:**
> "Bu trigger spam koruması yapıyor. 5 saniye içinde 2. yorum yapmaya çalışırsanız, hata veriyor."

---

### 💾 BÖLÜM 3: Backup (1 dk)

**1. Backup Dosyalarını Gösterin:**
```
✅ Windows + E (Dosya Gezgini)
✅ c:\frekans\backups\ klasörünü açın
✅ Dosyaları gösterin:
   - .bak dosyaları (SQL backup)
   - json_2025-12-23\ klasörü
   - stored_procedures_2025-12-23\ klasörü
   - uploads_2025-12-23\ klasörü
```

**2. JSON Klasörünü Açın:**
```
✅ json_2025-12-23\ klasörüne girin
✅ Identity_Users.json gösterin
✅ Notepad ile açın (birkaç satır gösterin)
```

**JSON İçeriği Örneği:**
```json
[
  {
    "UserID": 1,
    "Username": "DJShadow",
    "Email": "djshadow@example.com",
    "FollowerCount": 1245
  },
  ...
]
```

**3. SQL'de Backup Geçmişi:**
```sql
-- Query açın, bu sorguyu çalıştırın
SELECT 
    bs.database_name,
    bs.backup_start_date,
    CASE bs.type
        WHEN 'D' THEN 'Full Backup'
        WHEN 'I' THEN 'Differential'
    END AS BackupType,
    bs.backup_size/1024/1024 AS SizeMB,
    bmf.physical_device_name AS FilePath
FROM msdb.dbo.backupset bs
LEFT JOIN msdb.dbo.backupmediafamily bmf ON bs.media_set_id = bmf.media_set_id
WHERE bs.database_name = 'FrekansDB'
ORDER BY bs.backup_start_date DESC;
```

**4. Backup Script Gösterin:**
```
✅ VS Code → backup.ps1
✅ PowerShell kodunu gösterin
```

**Söyleyeceğiniz:**
> "4 katmanlı backup sistemimiz var. SQL native backup, JSON export, SP backup ve upload dosyaları. Hepsi bu PowerShell script'i ile otomatik çalışıyor."

---

## 🎯 HIZLI KOPYA-YAPIŞTIR SORGULAR

### Tüm Trigger'ları Listele:
```sql
SELECT 
    OBJECT_NAME(parent_object_id) AS Tablo,
    name AS TriggerAdı
FROM sys.triggers
WHERE parent_class = 1
ORDER BY Tablo;
```

### Tüm SP'leri Listele:
```sql
SELECT 
    OBJECT_SCHEMA_NAME(object_id) AS Schema,
    name AS SPAdı
FROM sys.procedures
ORDER BY Schema, name;
```

### Bir Trigger'ın Kodunu Göster:
```sql
EXEC sp_helptext 'Interaction.trg_UpdatePlayCount';
```

### Backup Geçmişi:
```sql
SELECT TOP 10
    bs.database_name AS Veritabanı,
    bs.backup_start_date AS Tarih,
    CASE bs.type
        WHEN 'D' THEN 'Full'
        WHEN 'I' THEN 'Differential'
        WHEN 'L' THEN 'Log'
    END AS Tip,
    bs.backup_size/1024/1024 AS [MB],
    bmf.physical_device_name AS [Dosya Yolu]
FROM msdb.dbo.backupset bs
LEFT JOIN msdb.dbo.backupmediafamily bmf ON bs.media_set_id = bmf.media_set_id
WHERE bs.database_name = 'FrekansDB'
ORDER BY bs.backup_start_date DESC;
```

---

## 💡 SUNUM İPUÇLARI

### ✅ YAPMANIZ GEREKENLER:

1. **Sunumdan önce her şeyi test edin**
   - SSMS'i açın, trigger'ları bulun
   - Frontend'de demo yapın
   - Backup klasörünü açın

2. **Ekranı paylaşırken büyük font kullanın**
   - SSMS'de: Tools → Options → Fonts → 14pt
   - VS Code'da: Ctrl + (zoom in)

3. **Her adımda ekranı gösterin**
   - "Bakın, burada..." diyerekken fareyle işaret edin

4. **Canlı demo yapın**
   - Önceden kayıt almak yerine, gerçekten çalıştırın
   - Hata olsa bile sorun değil, "işte böyle çalışıyor" dersiniz

---

### ❌ YAPMAMANIZ GEREKENLER:

1. **Sadece kod göstermeyin** - Frontend'de sonucu gösterin
2. **Çok hızlı geçmeyin** - Her şeyi aceleyle anlatmayın
3. **Ezberden konuşmayın** - Doğal konuşun
4. **Panik yapmayın** - Bir şey bulamazsanız, sorguyla gösterin

---

## 📱 ACİL DURUM PLANI

Eğer SSMS'te trigger bulamazsanız:

**Plan B: SQL Sorgusu ile gösterin**
```sql
-- Tüm trigger'ları listeleyin
SELECT * FROM sys.triggers WHERE parent_class = 1;

-- Trigger kodunu gösterin
EXEC sp_helptext 'Interaction.trg_UpdatePlayCount';
```

**Plan C: VS Code'dan gösterin**
```
✅ database/14_Triggers.sql dosyasını açın
✅ "Burda kodlar var" deyin
```

---

## 🎬 SON KONTROLLİSTESİ

**Sunumdan 10 dakika önce:**

- [ ] SSMS açık mı?
- [ ] FrekansDB bağlantısı var mı?
- [ ] Browser'da localhost:3000 açık mı?
- [ ] VS Code'da server.js hazır mı?
- [ ] Backup klasörü açık mı?
- [ ] Font boyutu yeterince büyük mü?

**Başarılar! 🚀**
