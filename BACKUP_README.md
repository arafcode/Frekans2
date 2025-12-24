# 💾 FREKANS Yedekleme ve Geri Yükleme Sistemi

## 📋 İçindekiler

1. [Hızlı Başlangıç](#hızlı-başlangıç)
2. [Yedekleme Türleri](#yedekleme-türleri)
3. [Kullanım Kılavuzu](#kullanım-kılavuzu)
4. [Otomatik Yedekleme](#otomatik-yedekleme)
5. [Geri Yükleme](#geri-yükleme)

---

## 🚀 Hızlı Başlangıç

### Manuel Yedekleme

#### Windows (PowerShell)
```powershell
.\backup.ps1
```

#### Node.js
```bash
node backup-database.js
```

### Geri Yükleme
```bash
node restore-database.js
```

---

## 📦 Yedekleme Türleri

Sistem 4 farklı yedekleme türü oluşturur:

### 1. **SQL Server Native Backup (.bak)**
- **Dosya:** `FrekansDB_TARIH.bak`
- **Özellik:** SQL Server'ın native backup sistemi
- **Avantaj:** En hızlı ve güvenilir geri yükleme
- **Dezavantaj:** SQL Server izinleri gerektirir

### 2. **JSON Export**
- **Klasör:** `json_TARIH/`
- **Özellik:** Her tablo ayrı JSON dosyası olarak
- **Avantaj:** 
  - Platformlar arası taşınabilir
  - Elle düzenlenebilir
  - Seçici geri yükleme yapılabilir
- **İçerik:**
  ```
  Identity_Users.json
  Identity_UserFollows.json
  Music_Artists.json
  Music_Albums.json
  Music_Tracks.json
  ... (tüm tablolar)
  ```

### 3. **Stored Procedures**
- **Klasör:** `stored_procedures_TARIH/`
- **Özellik:** Tüm SP'ler .sql dosyası olarak
- **Avantaj:** Kod versiyonlama ve geri yükleme

### 4. **Upload Klasörü**
- **Klasör:** `uploads_TARIH/`
- **İçerik:**
  - Audio dosyaları
  - Cover görselleri
- **Avantaj:** Medya dosyalarının korunması

---

## 📖 Kullanım Kılavuzu

### Temel Yedekleme

```bash
# 1. Tek komutla tam yedek
node backup-database.js

# 2. PowerShell ile (eski yedekleri otomatik temizler)
.\backup.ps1
```

### Çıktı Örneği

```
🔄 FREKANS Veritabanı Yedekleme Başladı...

📅 Tarih: 23.12.2025 14:30:00
✅ Veritabanı bağlantısı kuruldu

📦 SQL Server native backup oluşturuluyor...
   Dosya: C:\FREKANS\backups\FrekansDB_2025-12-23_14-30-00.bak
✅ SQL Backup tamamlandı (145.32 MB)

📋 Tablo verileri JSON formatına export ediliyor...
   Toplam 16 tablo export edilecek...

   ✓ [Identity].[Users]: 1500 kayıt
   ✓ [Identity].[UserFollows]: 8200 kayıt
   ✓ [Music].[Tracks]: 50000 kayıt
   ✓ [Music].[Artists]: 2500 kayıt
   ...

✅ JSON export tamamlandı

⚙️  Stored Procedures yedekleniyor...
   ✓ Identity.sp_RegisterUser
   ✓ Music.sp_AddTrackToPlaylist
   ...

✅ 15 Stored Procedure yedeklendi

📁 Upload klasörü yedekleniyor...
✅ Upload klasörü yedeklendi: 3420 dosya, 2456.78 MB

✅ TÜM YEDEKLEME İŞLEMLERİ BAŞARIYLA TAMAMLANDI!
📂 Yedekler: C:\FREKANS\backups
```

---

## ⏰ Otomatik Yedekleme

### Windows Task Scheduler ile Günlük Yedek

#### 1. Manuel Kurulum

**Task Scheduler'ı Aç:**
```
Win + R → taskschd.msc
```

**Yeni Görev Oluştur:**
- **General Tab:**
  - Name: "FREKANS Daily Backup"
  - Run whether user is logged on or not: ✓
  - Run with highest privileges: ✓

- **Triggers Tab:**
  - New → Daily
  - Start: 02:00 AM (Gece 2'de çalışsın)
  - Recur every: 1 days

- **Actions Tab:**
  - New → Start a program
  - Program: `powershell.exe`
  - Arguments: `-ExecutionPolicy Bypass -File "C:\FREKANS\backup.ps1"`
  - Start in: `C:\FREKANS`

#### 2. PowerShell ile Otomatik Kurulum

```powershell
# Günlük saat 02:00'da çalışan scheduled task oluştur
$Action = New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument "-ExecutionPolicy Bypass -File C:\FREKANS\backup.ps1" `
    -WorkingDirectory "C:\FREKANS"

$Trigger = New-ScheduledTaskTrigger -Daily -At 2:00AM

$Principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -RunLevel Highest

Register-ScheduledTask -TaskName "FREKANS Daily Backup" `
    -Action $Action `
    -Trigger $Trigger `
    -Principal $Principal `
    -Description "FREKANS veritabanı günlük otomatik yedekleme"
```

### Haftalık Yedekleme

```powershell
# Her Pazar saat 03:00'te çalışan task
$Trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At 3:00AM

Register-ScheduledTask -TaskName "FREKANS Weekly Backup" `
    -Action $Action `
    -Trigger $Trigger `
    -Principal $Principal
```

---

## 🔄 Geri Yükleme

### JSON Backup'tan Geri Yükleme

```bash
node restore-database.js
```

#### İnteraktif Kullanım

```
🔄 FREKANS Veritabanı Geri Yükleme

📂 Mevcut Backup'lar:

   1. 2025-12-23_14-30-00
   2. 2025-12-22_02-00-00
   3. 2025-12-21_02-00-00

Hangi backup'ı geri yüklemek istiyorsunuz? (1-3): 1

⚠️  DİKKAT: Bu işlem mevcut verileri SİLECEK!
   Backup: json_2025-12-23_14-30-00

Devam etmek istediğinize emin misiniz? (evet/hayır): evet

🔄 Geri yükleme başladı...
✅ Veritabanı bağlantısı kuruldu

🗑️  Mevcut veriler siliniyor...
   ✓ Identity.Users temizlendi
   ✓ Music.Tracks temizlendi
   ...

📥 Backup verileri yükleniyor...
   ✓ Identity_Users: 1500 kayıt yüklendi
   ✓ Music_Tracks: 50000 kayıt yüklendi
   ...

✅ GERİ YÜKLEME TAMAMLANDI!
```

### .bak Dosyasından Geri Yükleme (SQL Server Management Studio)

```sql
USE master;
GO

-- Mevcut bağlantıları kes
ALTER DATABASE FrekansDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
GO

-- Geri yükle
RESTORE DATABASE FrekansDB
FROM DISK = 'C:\FREKANS\backups\FrekansDB_2025-12-23_14-30-00.bak'
WITH REPLACE,
     STATS = 10;
GO

-- Multi-user moduna geri dön
ALTER DATABASE FrekansDB SET MULTI_USER;
GO
```

---

## 🛡️ Yedek Saklama Politikası

**backup.ps1** scripti otomatik olarak:
- **30 günden eski** yedekleri siler
- Disk alanından tasarruf sağlar
- En güncel 30 günlük yedekleri korur

### Manuel Temizleme

```powershell
# 60 günden eski yedekleri sil
Get-ChildItem -Path "C:\FREKANS\backups" -Recurse |
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-60) } |
    Remove-Item -Force -Recurse
```

---

## 📊 Backup Klasör Yapısı

```
backups/
├── FrekansDB_2025-12-23_14-30-00.bak          # SQL Native Backup
├── json_2025-12-23_14-30-00/                  # JSON Export
│   ├── Identity_Users.json
│   ├── Identity_UserFollows.json
│   ├── Music_Artists.json
│   ├── Music_Tracks.json
│   └── ...
├── stored_procedures_2025-12-23_14-30-00/     # SP Backups
│   ├── Identity_sp_RegisterUser.sql
│   ├── Music_sp_AddTrackToPlaylist.sql
│   └── ...
└── uploads_2025-12-23_14-30-00/               # Media Files
    ├── audio/
    │   ├── track1.mp3
    │   └── ...
    └── covers/
        ├── cover1.jpg
        └── ...
```

---

## ⚙️ İleri Seviye Kullanım

### Sadece Belirli Tabloları Yedekle

`backup-database.js` dosyasında `exportTablesToJSON` fonksiyonunu düzenleyin:

```javascript
const tablesQuery = `
    SELECT TABLE_SCHEMA, TABLE_NAME
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_TYPE = 'BASE TABLE'
    AND TABLE_NAME IN ('Users', 'Tracks', 'Artists')  -- Sadece bunları
    ORDER BY TABLE_SCHEMA, TABLE_NAME
`;
```

### Uzak Sunucuya Yedek Gönderme

```powershell
# backup.ps1 sonuna ekle
$BackupSource = "C:\FREKANS\backups"
$RemotePath = "\\NAS-SERVER\Backups\FREKANS"

Copy-Item -Path $BackupSource\* -Destination $RemotePath -Recurse -Force
```

---

## 🔧 Sorun Giderme

### "SQL Backup hatası: izin yok"

**Çözüm:** SQL Server kullanıcısına backup izni ver

```sql
USE master;
GO

GRANT BACKUP DATABASE TO nodeapp;
GRANT BACKUP LOG TO nodeapp;
GO
```

### "IDENTITY_INSERT hatası"

Bu normal! Script otomatik olarak idare eder. Eğer sorun devam ederse:

```sql
-- Manuel düzeltme
SET IDENTITY_INSERT [Schema].[Table] ON;
-- INSERT işlemleri
SET IDENTITY_INSERT [Schema].[Table] OFF;
```

### JSON dosyası çok büyük

50K+ kayıt varsa JSON dosyaları büyük olabilir. Sıkıştırma ekleyin:

```javascript
// backup-database.js içinde
const zlib = require('zlib');

// JSON'u gzip ile sıkıştır
const compressed = zlib.gzipSync(JSON.stringify(data, null, 2));
fs.writeFileSync(filePath + '.gz', compressed);
```

---

## 📝 Best Practices

1. **Günlük Yedekleme:** Kritik sistemler için her gün
2. **Off-site Backup:** Yedekleri farklı konumlarda sakla
3. **Test Et:** Geri yükleme scriptini düzenli test et
4. **Monitoring:** Yedekleme loglarını kontrol et
5. **Versiyon:** Minimum 7 günlük yedek tut

---

## 📞 Destek

Sorun yaşarsanız:
1. Log dosyalarını kontrol edin
2. SQL Server bağlantısını test edin
3. Disk alanını kontrol edin
4. İzinleri gözden geçirin

---

**Son Güncelleme:** 23 Aralık 2025  
**Versiyon:** 1.0.0  
**Yazar:** FREKANS Development Team
