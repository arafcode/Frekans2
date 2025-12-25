# 🎯 FREKANS SUNUM HIRSIZ REFERANS KARTI

## ⏱️ ZAMANLAMA (15 Dakika)

```
0:00 - 3:00  │ Genel Proje & Frontend-DB Bağlantısı
3:00 - 6:00  │ Tablo Yapısı & İndeksler  
6:00 - 8:00  │ Veri Boyutu & Kayıt Sayıları
8:00 - 11:00 │ Stored Procedures (CURSOR dahil)
11:00 - 13:00│ Trigger'lar
13:00 - 15:00│ Job & Yedekleme
```

---

## 🔢 EZBERLENMESİ GEREKEN SAYILAR

| Metrik | Sayı | Söyleniş |
|--------|------|----------|
| **Toplam Tablo** | **12** | On iki tablo |
| **Kullanıcı** | **1,010** | Bin on kullanıcı |
| **Şarkı** | **50,020** | Elli bin yirmi şarkı |
| **Dinleme** | **100,192** | Yüz bin yüz doksan iki dinleme |
| **Beğeni** | **30,007** | Otuz bin yedi beğeni |
| **Yorum** | **20,006** | Yirmi bin altı yorum |
| **DB Boyutu** | **400 MB** | Dört yüz megabayt |
| **Index Sayısı** | **29** | Yirmi dokuz indeks |
| **Stored Procedure** | **30** | Otuz prosedür |
| **Trigger Sayısı** | **10** | On trigger |

---

## 📊 TABLOLAR (TÜRKÇE)

### Identity Schema (Kimlik)
1. **Users** → **Kullanıcılar** (1,010 kayıt)

### Music Schema (Müzik)
2. **Genres** → **Türler** (53 kayıt)
3. **Albums** → **Albümler** (2,000 kayıt)
4. **Tracks** → **Şarkılar** (50,020 kayıt) ⭐
5. **Playlists** → **Çalma Listeleri** (6 kayıt)
6. **PlaylistTracks** → **Playlist Şarkıları** (26 kayıt)

### Interaction Schema (Etkileşim)
7. **Plays** → **Dinlemeler** (100,192 kayıt) ⭐⭐
8. **Likes** → **Beğeniler** (30,007 kayıt)
9. **Comments** → **Yorumlar** (20,006 kayıt)
10. **Follows** → **Takipler** (5,005 kayıt)
11. **Messages** → **Mesajlar** (27 kayıt)

### Audit Schema (Denetim)
12. **UserProfileChanges** → **Profil Değişiklikleri** (2 kayıt)

---

## 🔗 FRONTEND → DATABASE AKIŞI

```
Kullanıcı Aksiyonu → Frontend (HTML/JS) → Backend API (server.js) 
→ SQL Query/SP → Veritabanı → Trigger (Opsiyonel) → Sonuç
```

**Örnek: Şarkı Dinleme**
```
1. index.html: Şarkıya tıkla
2. app.js: fetch('/api/tracks/42/play')
3. server.js: INSERT Interaction.Plays
4. TRIGGER: PlayCount +1 (otomatik)
5. Frontend: Güncel sayı gösterilir
```

---

## 📇 EN ÖNEMLİ 3 INDEX

1. **IX_Tracks_Title** → Şarkı araması (%99 hızlanma)
2. **IX_Plays_TrackID_PlayedAt** → Analytics sorguları
3. **IX_Tracks_ArtistID** → Sanatçı profili (Filtered Index)

---

## 📝 EN ÖNEMLİ 3 STORED PROCEDURE

### 1. sp_UploadTrack
- **Ne yapar:** Şarkı yükleme
- **Özellik:** Otomatik slug ("Gece Sessizliği" → "gece-sessizligi")
- **Dosya:** `09_StoredProcedures.sql`

### 2. sp_ToggleLike
- **Ne yapar:** Beğeni toggle (Like/Unlike)
- **Özellik:** Daha önce beğendiyse sil, yoksa ekle
- **Dosya:** `09_StoredProcedures.sql`

### 3. sp_CalculateArtistTrendScore ⭐
- **Ne yapar:** CURSOR ile trend analizi
- **Özellik:** Tüm sanatçıları döngüyle işler
- **Formül:** (Dinlenme × 1) + (Beğeni × 5)
- **Dosya:** `09_StoredProcedures.sql`

---

## ⚡ EN ÖNEMLİ 3 TRIGGER

### 1. trg_UpdatePlayCount
- **Tablo:** Interaction.Plays
- **Event:** AFTER INSERT
- **Ne yapar:** Her dinlemede PlayCount +1
- **Dosya:** `14_Triggers.sql`

### 2. trg_UpdateFollowerCount
- **Tablo:** Interaction.Follows
- **Event:** AFTER INSERT/DELETE
- **Ne yapar:** FollowerCount otomatik günceller
- **Dosya:** `14_Triggers.sql`

### 3. trg_PreventCommentSpam
- **Tablo:** Interaction.Comments
- **Event:** INSTEAD OF INSERT
- **Ne yapar:** 5 saniye içinde 2. yorum engeller
- **Dosya:** `14_Triggers.sql`

---

## 💾 YEDEKLEME SİSTEMİ

### 4 Katman:

1. **SQL Backup** (.bak) → `backups/FrekansDB_full_*.bak` (400 MB)
2. **JSON Export** → `backups/json_*/` (150 MB)
3. **SP Backup** → `backups/stored_procedures_*/` (30 dosya)
4. **PowerShell Otomasyon** → `backup.ps1`

**Ana Dosya:** `backup-database.js`

---

## 🎬 DEMO KOMUTLARI (Eğer Zaman Kalırsa)

### Trigger Demo:
```sql
INSERT INTO Interaction.Plays (TrackID, UserID) VALUES (1, 1);
SELECT PlayCount FROM Music.Tracks WHERE TrackID = 1;
```

### CURSOR Demo:
```sql
EXEC Analysis.sp_CalculateArtistTrendScore;
```

### Yedekleme Demo:
```powershell
.\backup.ps1
```

---

## 🗣️ KONUŞMA ÖRNEKLERİ

### Tablo Yapısı:
> "Projemizde **12 tablo** var. Bunlar **3 schema**'ya ayrılmış: Identity, Music ve Interaction. En büyük tablomuz **Plays** (Dinlemeler) tablosu, **100 bin kayıt** içeriyor. **BIGINT** kullandık çünkü milyonlarca dinleme olabilir."

### İndeks:
> "**29 adet non-clustered index** kullandık. Örneğin şarkı araması için **IX_Tracks_Title** indeksi var. Bu indeks sayesinde **%99 performans artışı** elde ettik. İndeks olmadan 2.5 saniye sürerken, indeksle **15 milisaniyeye** düştü."

### Stored Procedure:
> "**30 stored procedure** var. En önemlisi **sp_CalculateArtistTrendScore**. Bu prosedür **CURSOR** kullanarak tüm sanatçıları döngüyle işler ve trend skorlarını hesaplar. Formül basit: Dinlenme sayısı artı beğeni sayısının 5 katı."

### Trigger:
> "**10 trigger** kullandık. **trg_UpdatePlayCount** trigger'ı her dinlemede otomatik olarak PlayCount'u artırır. Manuel UPDATE yazmaya gerek kalmıyor, trigger otomatik çalışıyor."

### Yedekleme:
> "**4 katmanlı** yedekleme sistemimiz var. SQL Server native backup, JSON export, stored procedure backup ve PowerShell otomasyonu. Yedekler **backups klasörüne** kaydediliyor. Veritabanı **400 MB** boyutunda."

---

## ⚠️ ÖNEMLİ VURGULAR

1. **BIGINT:** Plays tablosunda kullanıldı (milyonlarca kayıt)
2. **CURSOR:** sp_CalculateArtistTrendScore'da kullanıldı
3. **Filtered Index:** IX_Tracks_ArtistID (WHERE IsPublic = 1)
4. **Trigger Otomasyonu:** PlayCount, FollowerCount
5. **Zaman Damgalı Yorumlar:** SoundCloud özelliği
6. **Slug:** Türkçe → İngilizce otomatik dönüşüm

---

## 📁 DOSYA REFERANSLARI

| Konu | Dosya Adı |
|------|-----------|
| Tablolar | `03-05_CreateTables_*.sql` |
| İndeksler | `08_Performance_Optimization.sql` |
| Stored Procedures | `09_StoredProcedures.sql` |
| Triggers | `14_Triggers.sql` |
| Yedekleme | `backup-database.js` |
| PowerShell | `backup.ps1` |
| Backend | `server.js` |
| Frontend | `public/index.html`, `app.js` |

---

## ✅ SUNUM KONTROL LİSTESİ

- [ ] Sayıları ezberledim
- [ ] Tablo isimlerini (Türkçe) biliyorum
- [ ] Frontend-DB akışını anlatabilirim
- [ ] Index faydalarını açıklayabilirim
- [ ] CURSOR ne işe yarar biliyorum
- [ ] Trigger örneklerini gösterebilirim
- [ ] Yedekleme dosyalarını biliyorum
- [ ] Demo komutlarını hazırladım

---

**İYİ SUNUMLAR!** 🎉
