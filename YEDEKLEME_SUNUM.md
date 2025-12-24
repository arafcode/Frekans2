# 🎓 FREKANS Yedekleme Sistemi - Hoca Sunumu

## 📋 Sistem Özeti

Profesyonel bir veritabanı yedekleme sistemi geliştirdik. Hem web arayüzünden hem de komut satırından kullanılabiliyor.

---

## 🌐 WEB ARAYÜZÜ ÖZELLİKLERİ

### Erişim
- **URL:** `http://localhost:3000/backup.html`
- **Admin Panelinden:** Admin Panel → Yedekleme butonu
- **SQL Query'den:** SQL Query Tool → Yedekleme butonu

### Yedekleme Türleri

#### 1. 💾 Full Backup (Tam Yedekleme)
- Veritabanının tamamını yedekler
- En güvenilir yöntem
- İlk yedekleme için zorunlu
- Boyut: ~30-50 MB
- Süre: 2-5 saniye
- **Kullanım:** Günlük veya haftalık

**SQL Komutu:**
```sql
BACKUP DATABASE [FrekansDB]
TO DISK = 'C:\FREKANS\backups\FrekansDB_full_TARIH.bak'
WITH FORMAT, COMPRESSION, STATS = 10
```

#### 2. 📊 Differential Backup (Farksal Yedekleme)
- Son full backup'tan bu yana değişen verileri yedekler
- Daha hızlı ve küçük boyutlu
- Full backup'a bağımlıdır
- Boyut: ~5-15 MB
- Süre: 1-2 saniye
- **Kullanım:** Saatlik

**SQL Komutu:**
```sql
BACKUP DATABASE [FrekansDB]
TO DISK = 'C:\FREKANS\backups\FrekansDB_differential_TARIH.bak'
WITH DIFFERENTIAL, COMPRESSION, STATS = 10
```

#### 3. 📝 Transaction Log Backup (İşlem Günlüğü Yedekleme)
- Transaction log kayıtlarını yedekler
- Point-in-time recovery için gerekli
- En küçük ve hızlı yöntem
- Boyut: ~1-5 MB
- Süre: <1 saniye
- **Kullanım:** Her 15-30 dakika

**SQL Komutu:**
```sql
BACKUP LOG [FrekansDB]
TO DISK = 'C:\FREKANS\backups\FrekansDB_transaction_TARIH.trn'
WITH COMPRESSION, STATS = 10
```

---

## 🎯 WEB ARAYÜZÜ KULLANIMI

### 1. Yedekleme Türü Seçimi
- Sayfada 3 yedekleme kartı görürsünüz
- İstediğiniz yedekleme türüne tıklayın
- Seçili kart yeşil renkte vurgulanır

### 2. Yedekleme Başlatma
- "Yedeklemeyi Başlat" butonuna tıklayın
- Konsol ekranında canlı loglar görünür:
  ```
  10:54:23  ═══════════════════════════════════
  10:54:23    FULL BACKUP BAŞLATILDI
  10:54:23  ═══════════════════════════════════
  10:54:23  🔌 Veritabanı bağlantısı kontrol ediliyor...
  10:54:24  ✅ Veritabanı bağlantısı kuruldu
  10:54:24  📋 Veritabanı tabloları taranıyor...
  10:54:24    ✓ [Identity].[Users]: 1010 kayıt
  10:54:25    ✓ [Music].[Tracks]: 50020 kayıt
  10:54:25    ✓ [Interaction].[Plays]: 100190 kayıt
  10:54:26  ⚙️  Stored Procedures yedekleniyor...
  10:54:26    ✓ 16 Stored Procedure yedeklendi
  10:54:26  📦 Yedek dosyası oluşturuluyor...
  10:54:27  ✅ YEDEKLEME BAŞARIYLA TAMAMLANDI!
  10:54:27  📂 Dosya: FrekansDB_full_2025-12-23.bak
  10:54:27  📊 Boyut: 30.5 MB
  10:54:27  ⏱️  Süre: 2.3 saniye
  ```

### 3. İlerleme Çubuğu
- Yedekleme sırasında ilerleme gösterilir
- 0% → 100% animasyonlu geçiş
- Her adımda bilgilendirme mesajı

### 4. Yedekleme Geçmişi
- Sayfanın altında yedekleme geçmişi
- Her yedekleme kaydedilir:
  - Yedekleme türü
  - Tarih ve saat
  - Dosya boyutu

---

## ⏰ OTOMATIK YEDEKLEME

### Aktivasyon
1. "Otomatik Yedekleme" bölümündeki switch'i açın
2. Yedekleme türünü seçin (Full/Differential/Transaction)
3. Periyodu belirleyin (15 dk, 30 dk, 1 saat, vb.)

### Önerilen Yapılandırma

**Günlük Kullanım:**
- Full Backup: Her gün 02:00
- Differential Backup: Her 6 saat
- Transaction Log: Her 30 dakika

**Yoğun Kullanım:**
- Full Backup: Her gün 02:00
- Differential Backup: Her 1 saat
- Transaction Log: Her 15 dakika

### Durum Takibi
Otomatik yedekleme açıkken:
```
✅ Otomatik yedekleme aktif
Sonraki yedekleme: 23.12.2025 11:30:00
Tür: Differential Backup
```

---

## 💻 KOMUT SATIRI KULLANIMI

### Manuel Yedekleme

**PowerShell:**
```powershell
.\backup.ps1
```

**Node.js:**
```bash
node backup-database.js
```

### Çıktı Örneği
```
🔄 FREKANS Veritabanı Yedekleme Başladı...

📅 Tarih: 23.12.2025 10:54:23
✅ Backup klasörü oluşturuldu
✅ Veritabanı bağlantısı kuruldu

📦 SQL Server native backup oluşturuluyor...
✅ SQL Backup tamamlandı (30.29 MB)

📋 Tablo verileri JSON formatına export ediliyor...
   Toplam 11 tablo export edilecek...
   ✓ [Identity].[Users]: 1010 kayıt
   ✓ [Music].[Tracks]: 50020 kayıt
   ... (toplam 11 tablo)

✅ JSON export tamamlandı

⚙️  Stored Procedures yedekleniyor...
   ✓ 16 Stored Procedure yedeklendi

📁 Upload klasörü yedekleniyor...
✅ Upload klasörü yedeklendi: 14 dosya, 60.31 MB

✅ TÜM YEDEKLEME İŞLEMLERİ BAŞARIYLA TAMAMLANDI!
```

---

## 📁 YEDEK DOSYALARI

### Klasör Yapısı
```
C:\FREKANS\backups\
├── FrekansDB_full_2025-12-23_10-54-23.bak           # Full backup
├── FrekansDB_differential_2025-12-23_14-30-00.bak  # Differential
├── FrekansDB_transaction_2025-12-23_15-00-00.trn   # Transaction log
├── json_2025-12-23_10-54-23/                        # JSON export
│   ├── Identity_Users.json
│   ├── Music_Tracks.json
│   └── ... (11 dosya)
├── stored_procedures_2025-12-23_10-54-23/          # SP backups
│   ├── Identity_sp_GetUserByID.sql
│   └── ... (16 dosya)
└── uploads_2025-12-23_10-54-23/                    # Medya dosyaları
    ├── audio/
    └── covers/
```

### Dosya İsimlendirme
- **Format:** `FrekansDB_[TÜR]_[TARIH]_[SAAT].[UZANTI]`
- **Örnek:** `FrekansDB_full_2025-12-23_10-54-23.bak`
- **Uzantılar:**
  - `.bak` → Full & Differential backups
  - `.trn` → Transaction log backups

---

## 🔄 GERİ YÜKLEME

### JSON Backup'tan Geri Yükleme
```bash
node restore-database.js
```

**İnteraktif kullanım:**
1. Mevcut backuplar listelenir
2. Geri yüklenecek backup seçilir
3. Onay istenir
4. Veriler geri yüklenir

### SQL Server Management Studio ile
```sql
-- Bağlantıları kes
ALTER DATABASE FrekansDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;

-- Full backup'ı geri yükle
RESTORE DATABASE FrekansDB
FROM DISK = 'C:\FREKANS\backups\FrekansDB_full_2025-12-23.bak'
WITH REPLACE, NORECOVERY;

-- Differential backup'ı uygula
RESTORE DATABASE FrekansDB
FROM DISK = 'C:\FREKANS\backups\FrekansDB_differential_2025-12-23.bak'
WITH NORECOVERY;

-- Transaction log'u uygula
RESTORE LOG FrekansDB
FROM DISK = 'C:\FREKANS\backups\FrekansDB_transaction_2025-12-23.trn'
WITH RECOVERY;

-- Multi-user moduna dön
ALTER DATABASE FrekansDB SET MULTI_USER;
```

---

## 🎓 HOCAYA SUNUM İPUÇLARI

### Gösterim Senaryosu

#### 1. Web Arayüzünü Aç
```
http://localhost:3000/backup.html
```

#### 2. Full Backup Yap
- Full Backup kartına tıklayın
- "Yedeklemeyi Başlat" butonuna basın
- Konsol loglarını gösterin
- İlerleme çubuğunu vurgulayın

#### 3. Otomatik Yedeklemeyi Göster
- Switch'i açın
- Differential backup seçin
- 30 dakika periyot belirleyin
- Durum mesajını gösterin

#### 4. Differential Backup Göster
- Differential Backup kartı seçin
- Yedeklemeyi başlatın
- Full backup'a kıyasla daha hızlı olduğunu vurgulayın

#### 5. Transaction Log Göster
- Transaction Log kartını seçin
- En hızlı ve küçük yedekleme olduğunu belirtin
- Point-in-time recovery için önemini açıklayın

#### 6. Yedekleme Geçmişini Göster
- Alt taraftaki geçmiş bölümünü gösterin
- Farklı yedekleme türlerini karşılaştırın

#### 7. Terminal Kullanımını Göster
```powershell
.\backup.ps1
```
- Terminal çıktısını gösterin
- 4 farklı yedekleme türünü açıklayın

#### 8. Yedek Dosyalarını Göster
```
C:\FREKANS\backups\
```
- Windows Explorer'da klasörü açın
- Dosya boyutlarını karşılaştırın

---

## 📊 TEKNİK DETAYLAR

### Backend API
- **Endpoint:** `POST /api/backup`
- **Body:** `{ "type": "full" | "differential" | "transaction" }`
- **Response:**
```json
{
  "success": true,
  "fileName": "FrekansDB_full_2025-12-23.bak",
  "type": "full",
  "size": "30.5 MB",
  "duration": "2.3 saniye",
  "timestamp": "2025-12-23T10:54:23.000Z"
}
```

### Frontend Özellikler
- ✅ Gerçek zamanlı konsol logları
- ✅ Animasyonlu ilerleme çubuğu
- ✅ Terminal benzeri görünüm
- ✅ Renkli log mesajları (info, success, warning, error)
- ✅ Otomatik scroll
- ✅ Responsive tasarım

### Güvenlik
- ✅ SQL Injection koruması (parameterized queries)
- ✅ Timestamp ile benzersiz dosya isimleri
- ✅ Compression ile boyut optimizasyonu
- ✅ Hata yönetimi ve geri dönüşler

---

## 🏆 PROJE ÖZELLİKLERİ

### Akademik Kazanımlar
1. ✅ **SQL Backup Komutları:** BACKUP DATABASE, BACKUP LOG
2. ✅ **Yedekleme Türleri:** Full, Differential, Transaction Log
3. ✅ **Otomasyon:** Scheduled backups, Timer management
4. ✅ **UI/UX:** Real-time feedback, Progress tracking
5. ✅ **Best Practices:** Error handling, Logging, File management

### Profesyonel Yaklaşım
- Modern web arayüzü
- Terminal tarzı log konsolu
- Otomatik yedekleme sistemi
- Yedek geçmişi takibi
- Responsive tasarım
- Detaylı dokümantasyon

---

## 🎯 DEMO CHECKLIST

Hocaya gösterim için kontrol listesi:

- [ ] Server çalışıyor (`http://localhost:3000`)
- [ ] Backup sayfası açılıyor (`/backup.html`)
- [ ] 3 yedekleme kartı görünüyor
- [ ] Full backup test edildi
- [ ] Konsol logları çalışıyor
- [ ] İlerleme çubuğu animasyonlu
- [ ] Otomatik yedekleme switch'i çalışıyor
- [ ] Yedekleme geçmişi görünüyor
- [ ] Terminal komutu test edildi (`.\backup.ps1`)
- [ ] Yedek dosyaları oluştu (`backups/` klasörü)
- [ ] Admin panelinden erişim sağlandı
- [ ] SQL Query sayfasından erişim sağlandı

---

## 📞 Sorun Giderme

### "SQL Backup hatası: izin yok"
```sql
-- SQL Server Management Studio'da çalıştır:
USE master;
GRANT BACKUP DATABASE TO nodeapp;
GRANT BACKUP LOG TO nodeapp;
```

### Alternatif: JSON Export
Eğer SQL Server yetkileri yoksa, sistem otomatik olarak JSON export'a geçer. Bu da kabul edilebilir bir yedekleme yöntemidir.

---

**Hazırlayan:** FREKANS Development Team  
**Tarih:** 23 Aralık 2025  
**Versiyon:** 2.0 - Web Arayüzü
