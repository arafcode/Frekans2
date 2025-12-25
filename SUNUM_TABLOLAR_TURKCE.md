# 📊 FREKANS - TABLOLAR (TÜRKÇE AÇIKLAMALI)

---

## 🗂️ SCHEMA YAPISI

### 1️⃣ Identity Schema (Kimlik Şeması)
**Amaç:** Kullanıcı hesapları ve kimlik doğrulama

---

### 👤 Users Tablosu (Kullanıcılar)

| Kolon | Türkçe İsim | Tip | Açıklama |
|-------|-------------|-----|----------|
| `UserID` | Kullanıcı No | INT (PK) | Benzersiz kullanıcı numarası |
| `Username` | Kullanıcı Adı | NVARCHAR(50) | Profilde görünen isim (örn: DJShadow) |
| `Email` | E-posta | NVARCHAR(100) | Giriş için kullanılan email |
| `PasswordHash` | Şifre (Hash) | NVARCHAR(255) | Güvenlik için şifrelenmiş |
| `Bio` | Biyografi | NVARCHAR(MAX) | Hakkımda yazısı |
| `AvatarUrl` | Profil Resmi | NVARCHAR(500) | Avatar fotoğraf linki |
| `IsVerified` | Doğrulanmış Hesap | BIT | Mavi tik var mı? (1=Evet, 0=Hayır) |
| `FollowerCount` | Takipçi Sayısı | INT | Kaç kişi takip ediyor (Trigger ile otomatik) |
| `FollowingCount` | Takip Edilen Sayısı | INT | Kaç kişiyi takip ediyor (Trigger ile otomatik) |
| `LastActiveAt` | Son Aktiflik | DATETIME2 | En son ne zaman giriş yaptı |
| `CreatedAt` | Kayıt Tarihi | DATETIME2 | Hesap ne zaman açıldı |

**Ne İşe Yarar?**
- Hem sanatçıları hem de dinleyicileri tutar
- Login/logout işlemleri
- Profil sayfası bilgileri
- Takipçi/takip eden sistemi

**Örnek Veri:**
```
UserID: 1
Username: "DJShadow"
Email: "djshadow@example.com"
Bio: "Professional trap producer 🎵"
IsVerified: 1 (Mavi tik var)
FollowerCount: 1245 (1245 takipçisi var)
```

---

## 2️⃣ Music Schema (Müzik Şeması)
**Amaç:** Şarkılar, albümler ve müzik türleri

---

### 🎵 Tracks Tablosu (Şarkılar)

| Kolon | Türkçe İsim | Tip | Açıklama |
|-------|-------------|-----|----------|
| `TrackID` | Şarkı No | INT (PK) | Benzersiz şarkı numarası |
| `ArtistID` | Sanatçı No | INT (FK) | Hangi sanatçının şarkısı |
| `AlbumID` | Albüm No | INT (FK, NULL) | Hangi albümde (Single ise NULL) |
| `GenreID` | Tür No | INT (FK) | Müzik türü (Trap, Lo-Fi...) |
| `Title` | Şarkı Başlığı | NVARCHAR(200) | Şarkının adı |
| `Slug` | URL İsmi | NVARCHAR(250) | URL'de kullanılan (midnight-trap) |
| `AudioUrl` | Ses Dosyası | NVARCHAR(500) | MP3 dosyasının linki |
| `DurationSeconds` | Süre (saniye) | INT | Şarkı kaç saniye |
| `WaveformData` | Dalga Formu | NVARCHAR(MAX) | SoundCloud tarzı görsel veri (JSON) |
| `PlayCount` | Dinlenme Sayısı | INT | Kaç kere dinlendi (Trigger ile otomatik artar) |
| `IsPublic` | Herkese Açık | BIT | Public mu Private mı (1=Public, 0=Gizli) |
| `UploadDate` | Yüklenme Tarihi | DATETIME2 | Ne zaman yüklendi |

**Ne İşe Yarar?**
- Sistemdeki tüm şarkıları tutar (5,238 şarkı)
- Her şarkının audio dosyası ve metadata'sı
- Waveform verisi ile SoundCloud tarzı görselleştirme
- PlayCount ile popülerlik takibi

**Örnek Veri:**
```
TrackID: 42
Title: "Midnight Trap"
Slug: "midnight-trap"
AudioUrl: "https://cdn.frekans.com/audio/midnight-trap.mp3"
DurationSeconds: 195 (3 dakika 15 saniye)
PlayCount: 15,234 (15 bin kere dinlendi)
IsPublic: 1 (Herkes dinleyebilir)
```

**Özel Özellikler:**
- **Slug:** URL dostu isim. Türkçe karakterler İngilizce'ye çevrilir
  - "Gece Sessizliği" → "gece-sessizligi"
  - Aynı isim varsa: "gece-sessizligi-2", "gece-sessizligi-3"
- **WaveformData:** JSON formatında amplitüd değerleri
  - `[0.2, 0.5, 0.8, 0.6, 0.9, 0.7, 0.4]`
  - Frontend'de dalga formu çizmek için kullanılır

---

### 🎼 Genres Tablosu (Müzik Türleri)

| Kolon | Türkçe İsim | Tip | Açıklama |
|-------|-------------|-----|----------|
| `GenreID` | Tür No | INT (PK) | Benzersiz tür numarası |
| `Name` | Tür Adı | NVARCHAR(50) | Müzik türünün adı |

**Ne İşe Yarar?**
- Şarkıları kategorize etmek
- Filtreleme (sadece Trap şarkıları göster)
- İstatistikler (en popüler tür hangisi)

**Örnek Veriler:**
```
1. Trap
2. Lo-Fi
3. House
4. Hip-Hop
5. Electronic
6. Ambient
```

---

### 💿 Albums Tablosu (Albümler)

| Kolon | Türkçe İsim | Tip | Açıklama |
|-------|-------------|-----|----------|
| `AlbumID` | Albüm No | INT (PK) | Benzersiz albüm numarası |
| `ArtistID` | Sanatçı No | INT (FK) | Hangi sanatçının albümü |
| `Title` | Albüm Adı | NVARCHAR(200) | Albümün adı |
| `CoverImageUrl` | Kapak Resmi | NVARCHAR(500) | Albüm kapağı linki |
| `ReleaseDate` | Çıkış Tarihi | DATE | Ne zaman yayınlandı |
| `Description` | Açıklama | NVARCHAR(MAX) | Albüm hakkında bilgi |
| `CreatedAt` | Oluşturma Tarihi | DATETIME2 | Sisteme ne zaman eklendi |

**Ne İşe Yarar?**
- Sanatçıların albüm/EP'lerini gruplar
- Single (tekli) şarkılar için AlbumID NULL olur
- Albüm kapağı tüm şarkılarda kullanılır

**Örnek Veri:**
```
AlbumID: 5
Title: "Dark Nights Vol.1"
ArtistID: 1 (DJShadow'un albümü)
CoverImageUrl: "/covers/dark-nights.jpg"
ReleaseDate: 2024-06-15
```

---

### 🎧 Playlists Tablosu (Çalma Listeleri)

| Kolon | Türkçe İsim | Tip | Açıklama |
|-------|-------------|-----|----------|
| `PlaylistID` | Playlist No | INT (PK) | Benzersiz playlist numarası |
| `UserID` | Kullanıcı No | INT (FK) | Playlist sahibi |
| `Name` | Playlist Adı | NVARCHAR(200) | Listenin adı |
| `Description` | Açıklama | NVARCHAR(500) | Liste hakkında bilgi |
| `CoverImageUrl` | Kapak Resmi | NVARCHAR(500) | Playlist kapağı |
| `IsPublic` | Herkese Açık | BIT | Public/Private (1=Public, 0=Gizli) |
| `CreatedAt` | Oluşturma Tarihi | DATETIME2 | Ne zaman oluşturuldu |

**Ne İşe Yarar?**
- Kullanıcılar favori şarkılarını gruplar
- Tema bazlı listeler (Chill Vibes, Workout Music...)
- Public listeler diğer kullanıcılara gösterilir

**Örnek Veri:**
```
PlaylistID: 12
Name: "Favorilerim"
Description: "En sevdiğim şarkılar"
IsPublic: 1 (Herkes görebilir)
UserID: 5
```

---

### 🔗 PlaylistTracks Tablosu (Playlist Şarkıları)

| Kolon | Türkçe İsim | Tip | Açıklama |
|-------|-------------|-----|----------|
| `PlaylistTrackID` | Kayıt No | INT (PK) | Benzersiz kayıt numarası |
| `PlaylistID` | Playlist No | INT (FK) | Hangi playlist |
| `TrackID` | Şarkı No | INT (FK) | Hangi şarkı |
| `TrackOrder` | Sıra | INT | Playlist içindeki sırası |
| `AddedAt` | Eklenme Tarihi | DATETIME2 | Ne zaman eklendi |

**Ne İşe Yarar?**
- **Çoktan-çoğa (Many-to-Many) ilişki tablosu**
- Bir şarkı birden fazla playlist'te olabilir
- Bir playlist'te birden fazla şarkı olabilir
- Şarkıların sırasını tutar (TrackOrder)

**Örnek Veri:**
```
Playlist: "Favorilerim" (ID: 12)
├─ 1. Midnight Trap (TrackOrder: 1)
├─ 2. Coffee Morning (TrackOrder: 2)
└─ 3. Dreams (TrackOrder: 3)
```

---

## 3️⃣ Interaction Schema (Etkileşim Şeması)
**Amaç:** Kullanıcıların birbirleriyle ve içerikle etkileşimi

---

### 🎧 Plays Tablosu (Dinlemeler)

| Kolon | Türkçe İsim | Tip | Açıklama |
|-------|-------------|-----|----------|
| `PlayID` | Dinleme No | **BIGINT** (PK) | Benzersiz dinleme kaydı |
| `TrackID` | Şarkı No | INT (FK) | Hangi şarkı dinlendi |
| `UserID` | Kullanıcı No | INT (FK, NULL) | Kim dinledi (misafir için NULL) |
| `PlayedAt` | Dinlenme Zamanı | DATETIME2 | Ne zaman dinlendi |

**Ne İşe Yarar?**
- **Analytics (İstatistik) için hayati önem!**
- Her dinleme kaydedilir
- Popüler şarkıları belirler
- Trend analizleri (son 7 gün, aylık, vb.)
- En çok dinlenen saatler

**Neden BIGINT?**
- Milyonlarca kayıt olabilir
- INT max: 2.1 milyar
- BIGINT max: 9 katrilyon (yeterli!)

**Örnek Veriler:**
```
150,000+ dinleme kaydı
En popüler şarkı: 15,234 dinlenme
Günlük ortalama: 500-1000 yeni dinleme
```

**Trigger İlişkisi:**
Her dinlemede → `trg_UpdatePlayCount` tetiklenir → Tracks.PlayCount +1 artar

---

### ❤️ Likes Tablosu (Beğeniler)

| Kolon | Türkçe İsim | Tip | Açıklama |
|-------|-------------|-----|----------|
| `LikeID` | Beğeni No | INT (PK) | Benzersiz beğeni kaydı |
| `UserID` | Kullanıcı No | INT (FK) | Kim beğendi |
| `TrackID` | Şarkı No | INT (FK) | Hangi şarkıyı beğendi |
| `LikedAt` | Beğeni Zamanı | DATETIME2 | Ne zaman beğendi |

**Ne İşe Yarar?**
- SoundCloud'daki "kalp" ikonu gibi
- Kullanıcının favori şarkıları
- Şarkının popülerliği

**Önemli Kural:**
- **UNIQUE Constraint:** Bir kullanıcı bir şarkıyı sadece 1 kez beğenebilir
- `CONSTRAINT UQ_Likes_User_Track UNIQUE (UserID, TrackID)`

**Örnek Veri:**
```
UserID: 5 → TrackID: 42 beğendi (15:30)
UserID: 5 → TrackID: 42 tekrar beğendi → HATA! (Zaten beğenmiş)
```

---

### 💬 Comments Tablosu (Yorumlar)

| Kolon | Türkçe İsim | Tip | Açıklama |
|-------|-------------|-----|----------|
| `CommentID` | Yorum No | INT (PK) | Benzersiz yorum numarası |
| `UserID` | Kullanıcı No | INT (FK) | Kim yorum yaptı |
| `TrackID` | Şarkı No | INT (FK) | Hangi şarkıya yorum |
| `Content` | Yorum Metni | NVARCHAR(500) | Yorumun içeriği |
| `TimestampSeconds` | Zaman Damgası | INT (NULL) | Şarkının kaçıncı saniyesine yorum |
| `PostedAt` | Yorum Zamanı | DATETIME2 | Ne zaman yazıldı |

**Ne İşe Yarar?**
- Şarkılara yorum yapma
- **Özel özellik:** SoundCloud gibi **zaman damgalı yorumlar**
  - "Bu beat 1:30'da müthiş!" → TimestampSeconds: 90
  - Genel yorumlar → TimestampSeconds: NULL

**Örnek Veri:**
```
Content: "Bu drop harika! 🔥"
TimestampSeconds: 125 (2:05'te yorum)

Content: "Harika şarkı, tebrikler!"
TimestampSeconds: NULL (genel yorum)
```

**Trigger Koruması:**
- `trg_PreventCommentSpam`: 5 saniyede 2. yorum engellenir

---

### 👥 Follows Tablosu (Takipler)

| Kolon | Türkçe İsim | Tip | Açıklama |
|-------|-------------|-----|----------|
| `FollowID` | Takip No | INT (PK) | Benzersiz takip kaydı |
| `FollowerID` | Takip Eden | INT (FK) | Takip eden kullanıcı |
| `FollowingID` | Takip Edilen | INT (FK) | Takip edilen kullanıcı |
| `FollowDate` | Takip Tarihi | DATETIME2 | Ne zaman takip etti |

**Ne İşe Yarar?**
- Instagram/Twitter tarzı takip sistemi
- Takip ettiğin sanatçıların yeni şarkılarını görürsün
- "Kimler beni takip ediyor?" listesi

**İlişki:**
- **Self-Reference:** Aynı tablodaki 2 farklı kayda referans
  - FollowerID → Users.UserID
  - FollowingID → Users.UserID

**Örnek Veri:**
```
FollowerID: 5 (Ali)
FollowingID: 1 (DJShadow)
→ Ali, DJShadow'u takip ediyor
```

**Trigger İlişkisi:**
- `trg_UpdateFollowerCount_Insert`: Takip edilince FollowerCount +1
- `trg_UpdateFollowerCount_Delete`: Takipten çıkılınca FollowerCount -1

---

### 💌 Messages Tablosu (Mesajlar)

| Kolon | Türkçe İsim | Tip | Açıklama |
|-------|-------------|-----|----------|
| `MessageID` | Mesaj No | BIGINT (PK) | Benzersiz mesaj numarası |
| `SenderID` | Gönderen | INT (FK) | Mesajı gönderen kullanıcı |
| `ReceiverID` | Alıcı | INT (FK) | Mesajı alan kullanıcı |
| `MessageText` | Mesaj İçeriği | NVARCHAR(MAX) | Mesajın metni |
| `SentDate` | Gönderim Zamanı | DATETIME2 | Ne zaman gönderildi |
| `IsRead` | Okundu mu | BIT | Okundu/okunmadı (1=Okundu, 0=Okunmadı) |

**Ne İşe Yarar?**
- Kullanıcılar arası özel mesajlaşma
- Sanatçılarla iletişim
- Okundu/okunmadı durumu

**Örnek Veri:**
```
SenderID: 5 (Ali)
ReceiverID: 1 (DJShadow)
MessageText: "Şarkın çok güzel, tebrikler!"
IsRead: 0 (Henüz okunmadı)
```

---

## 4️⃣ Audit Schema (Denetim Şeması)
**Amaç:** Güvenlik ve değişiklik takibi

---

### 📝 UserProfileChanges Tablosu (Profil Değişiklikleri)

| Kolon | Türkçe İsim | Tip | Açıklama |
|-------|-------------|-----|----------|
| `ChangeID` | Değişiklik No | BIGINT (PK) | Benzersiz log kaydı |
| `UserID` | Kullanıcı No | INT | Hangi kullanıcı |
| `FieldChanged` | Değişen Alan | NVARCHAR(50) | Hangi kolon değişti (Username, Bio...) |
| `OldValue` | Eski Değer | NVARCHAR(MAX) | Değişiklik öncesi |
| `NewValue` | Yeni Değer | NVARCHAR(MAX) | Değişiklik sonrası |
| `ChangedAt` | Değişiklik Zamanı | DATETIME2 | Ne zaman değişti |

**Ne İşe Yarar?**
- **Audit Log (Denetim Kaydı)**
- Profil değişikliklerini takip et
- Güvenlik (şüpheli aktivite tespiti)
- History (geçmiş görüntüleme)

**Trigger Tarafından Oluşturulur:**
- `trg_AuditUserProfileChanges`: Profil güncellendiğinde otomatik log

**Örnek Veri:**
```
UserID: 1 (DJShadow)
FieldChanged: "Bio"
OldValue: "Trap producer"
NewValue: "Professional trap producer 🎵"
ChangedAt: 2025-12-24 22:15:05
```

---

## 📊 ÖZET İSTATİSTİKLER

| Tablo | Türkçe İsim | Kayıt Sayısı | Boyut |
|-------|-------------|--------------|-------|
| Users | Kullanıcılar | 1,010 | 250 KB |
| Tracks | Şarkılar | 5,238 | 2.5 MB |
| Albums | Albümler | 524 | 180 KB |
| Playlists | Çalma Listeleri | 2,015 | 400 KB |
| PlaylistTracks | Playlist Şarkıları | 12,450 | 600 KB |
| **Plays** | **Dinlemeler** | **150,000+** | **8 MB** |
| Likes | Beğeniler | 25,630 | 1.2 MB |
| Comments | Yorumlar | 18,450 | 3.5 MB |
| Follows | Takipler | 5,050 | 200 KB |
| UserProfileChanges | Audit Log | 1,250 | 150 KB |

**TOPLAM:** ~18 MB veritabanı

---

## 🔗 TABLO İLİŞKİLERİ

### One-to-Many (1:N - Bir-Çok)
```
Users (1) ──── (N) Tracks
"Bir sanatçının birden fazla şarkısı olabilir"

Users (1) ──── (N) Albums
"Bir sanatçının birden fazla albümü olabilir"

Tracks (1) ──── (N) Plays
"Bir şarkı birden fazla kez dinlenebilir"
```

### Many-to-Many (N:M - Çok-Çok)
```
Playlists (N) ──── PlaylistTracks ──── (M) Tracks
"Bir playlist'te birden fazla şarkı, bir şarkı birden fazla playlist'te"
```

### Self-Reference (Kendine Referans)
```
Users ──── Follows ──── Users
"Kullanıcılar birbirini takip eder"
FollowerID → Users
FollowingID → Users
```

---

## ✅ ÖNEMLİ NOKTALAR

### 1. BIGINT Kullanımı
- **Plays.PlayID:** Milyonlarca dinleme kaydı
- **Messages.MessageID:** Milyonlarca mesaj

### 2. NULL Değerler
- **Tracks.AlbumID:** Single şarkılar için NULL
- **Plays.UserID:** Misafir kullanıcılar için NULL
- **Comments.TimestampSeconds:** Genel yorumlar için NULL

### 3. UNIQUE Constraints
- **Users.Username:** Aynı kullanıcı adı olmaz
- **Users.Email:** Aynı email olmaz
- **Tracks.Slug:** Aynı URL olmaz
- **Likes (UserID, TrackID):** Aynı şarkıyı 2 kez beğenemez

### 4. Foreign Key Cascade Rules
```sql
-- Sanatçı silinemez (şarkısı varsa)
FK_Tracks_Artist → ON DELETE NO ACTION

-- Albüm silinirse şarkı kalır (AlbumID NULL olur)
FK_Tracks_Album → ON DELETE SET NULL

-- Şarkı silinirse dinlemeler de silinir
FK_Plays_Track → ON DELETE CASCADE
```

---

## 🎯 SUNUM İÇİN ÖNEMLİ VURGULAR

1. **3 Schema Kullanımı** → Organizasyon ve güvenlik
2. **BIGINT** → Ölçeklenebilirlik (Plays, Messages)
3. **Trigger'larla Otomatik Güncelleme** → PlayCount, FollowerCount
4. **Zaman Damgalı Yorumlar** → SoundCloud özelliği
5. **Audit Log** → Güvenlik ve takip
6. **Many-to-Many İlişki** → Playlists ↔ Tracks
7. **Cascade Rules** → Veri bütünlüğü

---

**Hazırlayan:** [İsminiz]  
**Tarih:** 24 Aralık 2025  
**Proje:** FREKANS - Veritabanı Programlama Ödevi
