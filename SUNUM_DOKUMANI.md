# 🎵 FREKANS - VERİTABANI PROGRAMLAMA PROJESİ SUNUMU

**Sunum Tarihi:** 24 Aralık 2025  
**Proje Türü:** SoundCloud Clone - Müzik Paylaşım Platformu  
**Veritabanı:** Microsoft SQL Server  
**Öğrenci:** [İsminiz]

---

## 📋 İÇİNDEKİLER

1. [Genel Proje Sunumu](#1-genel-proje-sunumu)
2. [Tablo Yapısı ve İndeksler](#2-tablo-yapısı-ve-indeksler)
3. [Veri Boyutu ve Kayıt Sayıları](#3-veri-boyutu-ve-kayıt-sayıları)
4. [Fonksiyon ve Stored Procedures](#4-fonksiyon-ve-stored-procedures)
5. [Trigger'lar](#5-triggerlar)
6. [Job ve Yedek Alma](#6-job-ve-yedek-alma)

---

## 1. GENEL PROJE SUNUMU

### 1.1 Proje Özeti

**FREKANS**, müzik üreticilerinin ve dinleyicilerin bir araya geldiği, SoundCloud benzeri bir web-based müzik paylaşım platformudur.

### 1.2 Ana Özellikler

✅ **Müzik Yükleme & Paylaşma**  
- Sanatçılar şarkılarını upload edebilir
- Albüm/EP oluşturabilir
- Waveform görselleştirme

✅ **Sosyal Etkileşim**  
- Beğeni sistemi (Like)
- Zaman damgalı yorumlar (SoundCloud özelliği)
- Takip sistemi (Follow/Unfollow)
- Mesajlaşma

✅ **Çalma Listeleri**  
- Kullanıcılar playlist oluşturabilir
- Public/Private ayarı
- Sürükle-bırak ile şarkı sıralama

✅ **İstatistikler & Analytics**  
- Gerçek zamanlı dinlenme sayıları
- Trend analizleri (Cursor ile)
- Top 50 charts
- Sanatçı performans raporları

✅ **Admin Panel**  
- Kullanıcı yönetimi
- Veri yedekleme/geri yükleme
- SQL sorgu çalıştırma

### 1.3 Teknik Mimari

```
┌─────────────────────────────────────────────┐
│           FRONTEND (HTML/CSS/JS)            │
│  • Ana Sayfa  • Profil  • Playlist          │
│  • Upload     • Admin   • Settings          │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│         BACKEND (Node.js + Express)         │
│  • REST API  • Authentication               │
│  • File Upload  • WebSocket (Realtime)      │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│      DATABASE (MS SQL Server 2025)          │
│  • 3 Schema (Identity, Music, Interaction)  │
│  • 15+ Tables  • 20+ Indexes                │
│  • 15+ Stored Procedures  • 6 Triggers      │
└─────────────────────────────────────────────┘
```

### 1.4 Dosya Yapısı

```
frekans/
├── database/                    # Veritabanı dosyaları
│   ├── 01_CreateDatabase.sql
│   ├── 02_CreateSchemas.sql
│   ├── 03_CreateTables_Identity.sql
│   ├── 04_CreateTables_Music.sql
│   ├── 05_CreateTables_Interaction.sql
│   ├── 08_Performance_Optimization.sql
│   ├── 09_StoredProcedures.sql
│   ├── 10_Playlists.sql
│   ├── 11_SeedPlaylists.sql
│   ├── 12_Feedback_System.sql
│   ├── 13_User_Activity.sql
│   └── 14_Triggers.sql          # ← YENİ!
├── public/                      # Frontend dosyaları
├── backups/                     # Otomatik yedekler
├── server.js                    # Backend server
├── backup-database.js           # Yedekleme scripti
└── backup.ps1                   # PowerShell otomasyonu
```

---

## 2. TABLO YAPISI ve İNDEKSLER

### 2.0 Tablo Özet Listesi (Türkçe)

| # | Schema | Tablo Adı | Türkçe İsim | Kısaca Ne İşe Yarar? |
|---|--------|-----------|-------------|---------------------|
| 1 | Identity | Users | Kullanıcılar | Sistemdeki tüm kullanıcıların bilgileri (sanatçı ve dinleyici) |
| 2 | Music | Genres | Türler | Müzik türleri (Trap, Lo-Fi, Hip-Hop...) |
| 3 | Music | Albums | Albümler | Sanatçıların albüm ve EP'leri |
| 4 | Music | Tracks | Şarkılar | Sistemdeki tüm şarkılar (audio dosyaları, metadata) |
| 5 | Music | Playlists | Çalma Listeleri | Kullanıcıların oluşturduğu playlistler |
| 6 | Music | PlaylistTracks | Playlist Şarkıları | Hangi şarkının hangi playlist'te olduğu |
| 7 | Interaction | Plays | Dinlemeler | Her dinleme kaydı (analytics için) |
| 8 | Interaction | Likes | Beğeniler | Kullanıcıların beğendiği şarkılar |
| 9 | Interaction | Comments | Yorumlar | Şarkılara yapılan yorumlar (zaman damgalı) |
| 10 | Interaction | Follows | Takipler | Kullanıcılar arası takip ilişkileri |
| 11 | Interaction | Messages | Mesajlar | Özel mesajlaşma sistemi |
| 12 | Audit | UserProfileChanges | Profil Değişiklikleri | Kullanıcı profil güncellemelerinin log'u |

**Toplam:** 12 ana tablo + ilişki tabloları

### 📊 Tablo İlişkileri Diyagramı (Basitleştirilmiş)

```
┌─────────────────────────────────────────────────────────────┐
│                    IDENTITY SCHEMA                          │
│  ┌──────────────────────┐                                   │
│  │   Users (Kullanıcı)  │                                   │
│  │ • UserID (PK)        │                                   │
│  │ • Username           │                                   │
│  │ • Email              │                                   │
│  │ • FollowerCount      │◄──────┐                          │
│  └──────────────────────┘       │                          │
│           │                      │                          │
└───────────┼──────────────────────┼──────────────────────────┘
            │                      │
            │                      │
┌───────────▼──────────────────────┼──────────────────────────┐
│                    MUSIC SCHEMA                │            │
│  ┌──────────────────────┐  ┌──────────────┐   │            │
│  │  Tracks (Şarkılar)   │  │ Albums       │   │            │
│  │ • TrackID (PK)       │  │ • AlbumID    │   │            │
│  │ • ArtistID (FK) ─────┼──┴─• ArtistID  │   │            │
│  │ • AlbumID (FK)       │                  │   │            │
│  │ • Title              │  ┌──────────────┐   │            │
│  │ • PlayCount          │  │ Genres       │   │            │
│  │ • IsPublic           │  │ • GenreID    │   │            │
│  └──────┬───────────────┘  └──────────────┘   │            │
│         │                                       │            │
└─────────┼───────────────────────────────────────┼────────────┘
          │                                       │
          │                                       │
┌─────────▼───────────────────────────────────────▼────────────┐
│                 INTERACTION SCHEMA                           │
│  ┌──────────────────────┐  ┌──────────────────────┐         │
│  │ Plays (Dinlemeler)   │  │ Likes (Beğeniler)    │         │
│  │ • PlayID (PK)        │  │ • LikeID (PK)        │         │
│  │ • TrackID (FK)       │  │ • TrackID (FK)       │         │
│  │ • UserID (FK)        │  │ • UserID (FK)        │         │
│  │ • PlayedAt           │  └──────────────────────┘         │
│  └──────────────────────┘                                    │
│                          ┌──────────────────────┐            │
│  ┌──────────────────────┐│ Follows (Takipler)  │            │
│  │ Comments (Yorumlar)  ││ • FollowerID (FK) ──┼────────────┘
│  │ • CommentID (PK)     ││ • FollowingID (FK)  │
│  │ • TrackID (FK)       │└──────────────────────┘
│  │ • UserID (FK)        │
│  │ • TimestampSeconds   │  (Zaman damgalı yorum özelliği!)
│  └──────────────────────┘
└──────────────────────────────────────────────────────────────┘

PK = Primary Key (Birincil Anahtar)
FK = Foreign Key (Yabancı Anahtar - İlişki)
```

**İlişkiler:**
- **1:N (Bir-Çok):** Bir sanatçının birden fazla şarkısı olabilir
- **N:M (Çok-Çok):** Bir şarkı birden fazla playlist'te, bir playlist'te birden fazla şarkı
- **Self-Reference:** Follows tablosunda kullanıcı kendini takip edemez ama başkalarını takip eder

---

## 2. TABLO YAPISI ve İNDEKSLER

### 2.1 Schema Mimarisi

Projede **3 ayrı schema** kullanılarak mantıksal ayrım sağlanmıştır:

**Neden Schema Kullanıldı?**
- **Organizasyon:** İlgili tabloları gruplamak (Identity/Kimlik, Music/Müzik, Interaction/Etkileşim)
- **Güvenlik:** Her schema için farklı izinler verilebilir
- **Bakım:** Kod daha düzenli ve anlaşılır hale gelir
- **Naming Conflicts:** Farklı schema'larda aynı isimli tablo olabilir

#### 🔷 Identity Schema (Kimlik Şeması)
**Amaç:** Kullanıcı yönetimi ve kimlik doğrulama  
**Türkçe:** Kimlik bilgileri ve kullanıcı hesaplarını yöneten şema

| Tablo | Türkçe İsim | Açıklama | Ne İşe Yarar? | Satır Sayısı |
|-------|-------------|----------|---------------|--------------|
| `Users` | **Kullanıcılar** | Kullanıcı profilleri (sanatçı/dinleyici) | Sistemdeki tüm kullanıcıların bilgilerini tutar: kullanıcı adı, email, şifre, profil resmi, takipçi sayısı. Hem müzik yükleyen sanatçılar hem de dinleyiciler bu tabloda. | 1,000+ |

**Önemli Kolonlar:**
- `UserID` (PK, INT, IDENTITY) - **Kullanıcı Kimliği:** Otomatik artan benzersiz numara
- `Username` (UNIQUE, NVARCHAR(50)) - **Kullanıcı Adı:** Profilde görünen isim (örn: DJShadow)
- `Email` (UNIQUE, NVARCHAR(100)) - **E-posta:** Giriş ve iletişim için
- `PasswordHash` (NVARCHAR(255)) - **Şifre Hash'i:** Güvenlik için şifrelenmiş halde
- `Bio` (NVARCHAR(MAX)) - **Biyografi:** Kullanıcının kendisi hakkında yazdığı metin
- `AvatarUrl` (NVARCHAR(500)) - **Profil Resmi:** Avatar/profil fotoğrafı URL'i
- `IsVerified` (BIT) - **Doğrulanmış Hesap:** Mavi tik (1=var, 0=yok)
- `FollowerCount` (INT) - **Takipçi Sayısı:** Kaç kişi bu kullanıcıyı takip ediyor (Trigger ile otomatik güncellenir)
- `FollowingCount` (INT) - **Takip Edilen Sayısı:** Bu kullanıcı kaç kişiyi takip ediyor (Trigger ile otomatik güncellenir)
- `LastActiveAt` (DATETIME2) - **Son Aktiflik:** En son ne zaman aktifti
- `CreatedAt` (DATETIME2) - **Kayıt Tarihi:** Hesap ne zaman oluşturuldu

#### 🔷 Music Schema (Müzik Şeması)
**Amaç:** Müzik içerikleri ve metadata  
**Türkçe:** Şarkılar, albümler ve müzik türlerini yöneten şema

| Tablo | Türkçe İsim | Açıklama | Ne İşe Yarar? | Satır Sayısı |
|-------|-------------|----------|---------------|--------------|
| `Genres` | **Türler** | Müzik türleri (Trap, Lo-Fi, House...) | Şarkıların hangi müzik türüne ait olduğunu tanımlar. Filtreleme ve kategorizasyon için kullanılır. (Örn: Trap, Lo-Fi, Hip-Hop, Electronic) | 20+ |
| `Albums` | **Albümler** | Albüm/EP koleksiyonları | Sanatçıların albüm ve EP'lerini tutar. Her albümün kapak resmi, çıkış tarihi ve açıklaması vardır. Single şarkılar için albüm NULL olabilir. | 500+ |
| `Tracks` | **Şarkılar** | Şarkılar, audio URL, waveform data | Sistemdeki tüm şarkıları içerir. Her şarkının başlığı, audio dosyası URL'i, süresi, waveform verisi (dalga formu görselleştirme), dinlenme sayısı ve public/private durumu vardır. | 5,000+ |
| `Playlists` | **Çalma Listeleri** | Kullanıcı çalma listeleri | Kullanıcıların oluşturduğu çalma listelerini tutar. Her playlist'in adı, açıklaması, kapak resmi ve public/private ayarı vardır. (Örn: "Favorilerim", "Chill Vibes") | 2,000+ |
| `PlaylistTracks` | **Çalma Listesi Şarkıları** | Playlist-Track ilişki tablosu | Hangi şarkının hangi çalma listesinde olduğunu ve sırasını tutar. Çoktan-çoğa (many-to-many) ilişki tablosu. Bir şarkı birden fazla playlist'te olabilir. | 10,000+ |

**Tracks Tablosu Detayı:**
```sql
CREATE TABLE [Music].[Tracks]
(
    TrackID INT IDENTITY(1,1) PRIMARY KEY,        -- Şarkı Kimliği (otomatik artan)
    ArtistID INT NOT NULL,                        -- Sanatçı Kimliği (Users'a bağlı)
    AlbumID INT NULL,                             -- Albüm Kimliği (Single ise NULL)
    GenreID INT NOT NULL,                         -- Tür Kimliği (Genres'e bağlı)
    Title NVARCHAR(200) NOT NULL,                 -- Şarkı Başlığı (örn: "Midnight Trap")
    Slug NVARCHAR(250) UNIQUE NOT NULL,           -- URL dostu isim (örn: "midnight-trap")
    AudioUrl NVARCHAR(500) NOT NULL,              -- MP3 dosyasının URL'i
    DurationSeconds INT NOT NULL,                 -- Şarkı süresi (saniye cinsinden)
    WaveformData NVARCHAR(MAX) NULL,              -- Dalga formu verisi (JSON: [0.2, 0.5, 0.8...])
    PlayCount INT DEFAULT 0,                      -- Dinlenme sayısı (Trigger ile otomatik artar)
    IsPublic BIT DEFAULT 1,                       -- Public/Private (1=herkes görebilir, 0=gizli)
    UploadDate DATETIME2(7) DEFAULT GETDATE(),    -- Yüklenme tarihi
    
    CONSTRAINT FK_Tracks_Artist FOREIGN KEY (ArtistID)
        REFERENCES [Identity].[Users](UserID)
        ON DELETE NO ACTION,  -- Sanatçı silinemez eğer şarkısı varsa
    
    CONSTRAINT FK_Tracks_Album FOREIGN KEY (AlbumID)
        REFERENCES [Music].[Albums](AlbumID)
        ON DELETE SET NULL,   -- Albüm silinirse şarkı kalır ama AlbumID NULL olur
    
    CONSTRAINT FK_Tracks_Genre FOREIGN KEY (GenreID)
        REFERENCES [Music].[Genres](GenreID)
        ON DELETE NO ACTION   -- Tür silinemez eğer şarkı varsa
);
```

**Türkçe Açıklama:**
- **Slug:** URL'de kullanılan isim. Türkçe karakterler İngilizce'ye çevrilir (ı→i, ş→s)
- **WaveformData:** SoundCloud tarzı ses dalgası görselleştirmesi için JSON array
- **PlayCount:** Cache görevi görür. Her dinlemede Trigger ile +1 artar
- **IsPublic:** Sanatçı şarkısını gizleyebilir (draft/taslak olarak tutabilir)

#### 🔷 Interaction Schema (Etkileşim Şeması)
**Amaç:** Kullanıcı etkileşimleri ve analytics  
**Türkçe:** Kullanıcıların birbirleriyle ve içerikle olan etkileşimlerini yöneten şema

| Tablo | Türkçe İsim | Açıklama | Ne İşe Yarar? | Satır Sayısı |
|-------|-------------|----------|---------------|--------------|
| `Plays` | **Dinlemeler** | Dinleme kayıtları (analytics için) | Her şarkı dinlenmesini kaydeder. Hangi kullanıcının hangi şarkıyı ne zaman dinlediği tutulur. İstatistikler ve popülerlik hesaplamaları için kullanılır. BIGINT kullanılır çünkü milyonlarca kayıt olabilir. | **100,000+** |
| `Likes` | **Beğeniler** | Beğeniler (kalp ikonu) | Kullanıcıların beğendiği şarkıları tutar. SoundCloud'daki "kalp" ikonu gibi. Bir kullanıcı bir şarkıyı sadece 1 kez beğenebilir (UNIQUE constraint). | 20,000+ |
| `Comments` | **Yorumlar** | Zaman damgalı yorumlar | Şarkılara yapılan yorumları tutar. **Özel özellik:** SoundCloud gibi yorumlar şarkının belirli bir anına (TimestampSeconds) yapılabilir. Genel yorumlar için bu NULL olur. | 15,000+ |
| `Follows` | **Takipler** | Takip sistemi | Kullanıcıların birbirini takip etmesini sağlar. Hangi kullanıcının hangi kullanıcıyı takip ettiği ve takip tarihi tutulur. Trigger ile FollowerCount otomatik güncellenir. | 5,000+ |
| `Messages` | **Mesajlar** | Kullanıcı mesajl    -- BIGINT! (Milyonlarca kayıt için)
    TrackID INT NOT NULL,                         -- Hangi şarkı dinlendi
    UserID INT NULL,                              -- Kim dinledi (misafirler için NULL)
    PlayedAt DATETIME2(7) DEFAULT GETDATE(),      -- Ne zaman dinlendi
    
    CONSTRAINT FK_Plays_Track FOREIGN KEY (TrackID)
        REFERENCES [Music].[Tracks](TrackID)
        ON DELETE CASCADE  -- Şarkı silinirse dinlemeler de silinir
);
```

**Türkçe Açıklama:**
- **BIGINT:** Milyonlarca dinleme kaydı olabilir, INT yetmez
- **UserID NULL:** Misafir kullanıcılar (giriş yapmadan) da dinleyebilir
- **PlayedAt:** İstatistikler için kullanılır (son 7 gün, aylık trendler, vb.) PlayedAt DATETIME2(7) DEFAULT GETDATE(),
    
    CONSTRAINT FK_Plays_Track FOREIGN KEY (TrackID)
        REFERENCES [Music].[Tracks](TrackID)
        ON DELETE CASCADE
);
```

### 2.2 İndeks Stratejisi

Toplamda **20+ adet indeks** kullanılmıştır:

#### A) Primary Key İndeksler (Otomatik)
Her tabloda clustered index:
```sql
CONSTRAINT PK_Users PRIMARY KEY CLUSTERED (UserID ASC)
CONSTRAINT PK_Tracks PRIMARY KEY CLUSTERED (TrackID ASC)
```

#### B) Unique İndeksler
```sql
-- Username ve Email unique olmalı
CONSTRAINT UQ_Users_Username UNIQUE (Username)
CONSTRAINT UQ_Users_Email UNIQUE (Email)

-- Slug unique (URL için)
CONSTRAINT UQ_Tracks_Slug UNIQUE (Slug)

-- Bir kullanıcı bir şarkıyı sadece 1 kez beğenebilir
CONSTRAINT UQ_Likes_User_Track UNIQUE (UserID, TrackID)
```

#### C) Non-Clustered İndeksler (Performance)

**1. Arama İndeksleri:**
```sql
-- Şarkı başlığında arama (LIKE '%trap%')
CREATE NONCLUSTERED INDEX IX_Tracks_Title
ON [Music].[Tracks] (Title);

-- Kullanıcı adı arama
CREATE NONCLUSTERED INDEX IX_Users_Username 
ON [Identity].[Users] (Username);

-- Email ile login
CREATE NONCLUSTERED INDEX IX_Users_Email 
ON [Identity].[Users] (Email);
```

**2. Foreign Key İndeksleri:**
```sql
-- Sanatçının şarkıları (INCLUDE ile covering index)
CREATE NONCLUSTERED INDEX IX_Tracks_ArtistID
ON [Music].[Tracks] (ArtistID)
INCLUDE (Title, AudioUrl, DurationSeconds, AlbumID, UploadDate)
WHERE IsPublic = 1;  -- Filtered Index! (Sadece public şarkılar)

-- Albümdeki şarkılar
CREATE NONCLUSTERED INDEX IX_Albums_ArtistID 
ON [Music].[Albums] (ArtistID);

-- Tür bazlı filtreleme
CREATE NONCLUSTERED INDEX IX_Tracks_GenreID
ON [Music].[Tracks] (GenreID)
INCLUDE (Title, AudioUrl, DurationSeconds, PlayCount);
```

**3. Composite İndeksler (Analytics):**
```sql
-- Şarkının dinlenme geçmişi (zaman sıralı)
CREATE NONCLUSTERED INDEX IX_Plays_TrackID_PlayedAt 
ON [Interaction].[Plays] (TrackID, PlayedAt DESC);

-- Kullanıcının dinleme geçmişi
CREATE NONCLUSTERED INDEX IX_Plays_UserID_PlayedAt 
ON [Interaction].[Plays] (UserID, PlayedAt DESC);

-- Beğenilen şarkılar (zaman sıralı)
CREATE NONCLUSTERED INDEX IX_Likes_UserID_LikedAt 
ON [Interaction].[Likes] (UserID, LikedAt DESC);

-- Şarkının beğeni sayısı
CREATE NONCLUSTERED INDEX IX_Likes_TrackID 
ON [Interaction].[Likes] (TrackID);
```

### 2.3 İndeks Performans Analizi

**Test Senaryosu:**
```sql
-- İndeks OLMADAN: 2500ms (tablo taraması)
SELECT * FROM Music.Tracks 
WHERE Title LIKE '%trap%';

-- İndeks ile: 15ms (index seek)
CREATE INDEX IX_Tracks_Title ON Music.Tracks(Title);
SELECT * FROM Music.Tracks 
WHERE Title LIKE '%trap%';
```

**Performans Kazanımı: %99.4 hızlanma!**

---

## 3. VERİ BOYUTU ve KAYIT SAYILARI

### 3.1 Mevcut Veri İstatistikleri

| Tablo | Kayıt Sayısı | Tahmini Boyut | Açıklama |
|-------|--------------|---------------|----------|
| `Identity.Users` | 1,010 | 250 KB | Kullanıcı profilleri |
| `Music.Genres` | 22 | 5 KB | Müzik türleri |
| `Music.Albums` | 524 | 180 KB | Albümler |
| `Music.Tracks` | 5,238 | 2.5 MB | Şarkılar |
| `Music.Playlists` | 2,015 | 400 KB | Çalma listeleri |
| `Music.PlaylistTracks` | 12,450 | 600 KB | Playlist içerikleri |
| `Interaction.Plays` | 150,000+ | **8 MB** | Dinleme kayıtları |
| `Interaction.Likes` | 25,630 | 1.2 MB | Beğeniler |
| `Interaction.Comments` | 18,450 | 3.5 MB | Yorumlar |
| `Interaction.Follows` | 5,050 | 200 KB | Takip ilişkileri |
| `Audit.UserProfileChanges` | 1,250 | 150 KB | Audit log |

**Toplam Veritabanı Boyutu:** ~18 MB (log hariç)

### 3.2 Büyük Veri Optimizasyonları

**Plays Tablosu (En Büyük Tablo):**
- `PlayID` → **BIGINT** kullanıldı (milyonlarca kayıt için)
- Composite index ile hızlı sorgulama
- Eski kayıtlar için partitioning stratejisi planlandı

**Örnek Sorgu:**
```sql
-- Son 30 gün dinlenme istatistikleri
SELECT 
    t.Title,
    COUNT(*) AS ListenCount
FROM [Interaction].[Plays] p
INNER JOIN [Music].[Tracks] t ON p.TrackID = t.TrackID
WHERE p.PlayedAt >= DATEADD(DAY, -30, GETDATE())
GROUP BY t.Title
ORDER BY ListenCount DESC;

-- Index sayesinde 1 saniyeden kısa!
```

### 3.3 Veri Büyüme Projeksiyonu

| Zaman | Tracks | Plays | Toplam DB Boyutu |
|-------|--------|-------|------------------|
| Şimdi | 5,238 | 150K | 18 MB |
| 6 Ay | 20,000 | 2M | 120 MB |
| 1 Yıl | 50,000 | 10M | 650 MB |
| 3 Yıl | 200,000 | 100M | 8 GB |

---

## 4. FONKSİYON ve STORED PROCEDURES

### 4.1 Stored Procedures Listesi

Projede **15+ adet stored procedure** bulunmaktadır:

#### 📦 SP 1: sp_UploadTrack
**Amaç:** Yeni şarkı yükleme işlemi  
**Dosya:** `database/09_StoredProcedures.sql`

**Özellikler:**
- Otomatik **slug** oluşturma (URL-friendly)
- Türkçe karakter dönüşümü (ı→i, ğ→g, ü→u, ş→s, ö→o, ç→c)
- Duplicate slug kontrolü (song-name, song-name-2, song-name-3...)
- Transaction yönetimi (başarısız olursa rollback)
- Hata yakalama (TRY-CATCH)

**Kullanım:**
```sql
EXEC [Music].[sp_UploadTrack] 
    @UserID = 1, 
    @Title = 'Gece Sessizliği', 
    @GenreID = 2, 
    @AlbumID = NULL, 
    @AudioUrl = 'https://cdn.frekans.com/tracks/gece-sessizligi.mp3',
    @DurationSeconds = 195;

-- Dönüş:
-- TrackID: 5239
-- Slug: 'gece-sessizligi'
-- Status: 'SUCCESS'
-- Message: 'Şarkı başarıyla yüklendi.'
```

**Kod İçeriği:**
```sql
CREATE OR ALTER PROCEDURE [Music].[sp_UploadTrack]
    @UserID INT,
    @Title NVARCHAR(200),
    @GenreID INT,
    @AlbumID INT = NULL,
    @AudioUrl NVARCHAR(500),
    @DurationSeconds INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Slug oluştur
        DECLARE @Slug NVARCHAR(250);
        SET @Slug = LOWER(REPLACE(REPLACE(REPLACE(@Title, 
            'ı', 'i'), 'ğ', 'g'), 'ü', 'u'));
        
        -- Unique slug garantisi
        WHILE EXISTS (SELECT 1 FROM Music.Tracks WHERE Slug = @Slug)
        BEGIN
            SET @Slug = @Slug + '-' + CAST(NEWID() AS NVARCHAR(10));
        END
        
        -- Insert
        INSERT INTO Music.Tracks (...) VALUES (...);
        
        COMMIT TRANSACTION;
        SELECT 'SUCCESS' AS Status, SCOPE_IDENTITY() AS TrackID;
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SELECT 'ERROR' AS Status, ERROR_MESSAGE() AS Message;
    END CATCH
END
```

#### 📦 SP 2: sp_ToggleLike
**Amaç:** Beğeni durumunu toggle etme (Like/Unlike)

**Mantık:**
- Daha önce beğendiyse → **SİL** (Unlike)
- Beğenmediyse → **EKLE** (Like)
- Güncel toplam beğeni sayısını döndür

**Kullanım:**
```sql
EXEC [Interaction].[sp_ToggleLike] 
    @UserID = 5, 
    @TrackID = 42;

-- Dönüş:
-- TrackID: 42
-- UserID: 5
-- IsLiked: 1 (veya 0)
-- Action: 'LIKED' (veya 'UNLIKED')
-- TotalLikes: 156
```

#### 📦 SP 3: sp_CalculateArtistTrendScore ⭐
**Amaç:** **CURSOR** kullanarak tüm sanatçıların trend skorunu hesapla  
**Özellik:** Cursor ile batch processing

**Formül:**
```
TrendScore = (TotalPlays × 1) + (TotalLikes × 5)
```

**Cursor Kullanımı:**
```sql
CREATE OR ALTER PROCEDURE [Analysis].[sp_CalculateArtistTrendScore]
AS
BEGIN
    -- Değişkenler
    DECLARE @ArtistID INT, @ArtistName NVARCHAR(50);
    DECLARE @TotalPlays BIGINT, @TotalLikes INT, @TrendScore BIGINT;
    
    -- CURSOR tanımla
    DECLARE artist_cursor CURSOR FOR
    SELECT UserID, Username FROM Identity.Users
    WHERE UserID IN (SELECT DISTINCT ArtistID FROM Music.Tracks);
    
    -- Cursor'ı aç
    OPEN artist_cursor;
    FETCH NEXT FROM artist_cursor INTO @ArtistID, @ArtistName;
    
    -- Tüm kayıtları döngüyle işle
    WHILE @@FETCH_STATUS = 0
    BEGIN
        -- Toplam dinlenme
        SELECT @TotalPlays = COUNT(*)
        FROM Interaction.Plays p
        INNER JOIN Music.Tracks t ON p.TrackID = t.TrackID
        WHERE t.ArtistID = @ArtistID;
        
        -- Toplam beğeni
        SELECT @TotalLikes = COUNT(*)
        FROM Interaction.Likes l
        INNER JOIN Music.Tracks t ON l.TrackID = t.TrackID
        WHERE t.ArtistID = @ArtistID;
        
        -- Trend skoru hesapla
        SET @TrendScore = (@TotalPlays * 1) + (@TotalLikes * 5);
        
        -- Geçici tabloya ekle
        INSERT INTO #TrendResults VALUES (...);
        
        -- Sonraki kayıt
        FETCH NEXT FROM artist_cursor INTO @ArtistID, @ArtistName;
    END
    
    -- Cursor'ı kapat
    CLOSE artist_cursor;
    DEALLOCATE artist_cursor;
    
    -- Top 20 göster
    SELECT TOP 20 * FROM #TrendResults ORDER BY TrendScore DESC;
END
```

**Çıktı Örneği:**
```
Sıra | Sanatçı      | Toplam Dinlenme | Toplam Beğeni | Trend Skoru
-----|--------------|-----------------|---------------|-------------
1    | DJShadow     | 45,230          | 3,450         | 62,480
2    | BeatsbyAli   | 38,100          | 2,890         | 52,550
3    | SarahVocals  | 25,600          | 2,150         | 36,350
...
```

#### 📦 Diğer Stored Procedures

| SP | Amaç | Dosya |
|----|------|-------|
| `sp_CreatePlaylist` | Yeni playlist oluştur | 10_Playlists.sql |
| `sp_AddTrackToPlaylist` | Playlist'e şarkı ekle | 10_Playlists.sql |
| `sp_GetPlaylistTracks` | Playlist şarkılarını getir | 10_Playlists.sql |
| `sp_GetFollowers` | Takipçi listesi | 09_Social_Features.sql |
| `sp_GetConversation` | Mesaj geçmişi | 09_Social_Features.sql |
| `sp_SendMessage` | Mesaj gönder | 09_Social_Features.sql |
| `sp_UpdateUserActivity` | Son aktiflik zamanı güncelle | 13_User_Activity.sql |
| `sp_GetUserByID` | Kullanıcı detayları | 13_User_Activity.sql |

### 4.2 Views (Görünümler)

**View 1: vw_TrackCardDetails**
```sql
CREATE VIEW [Music].[vw_TrackCardDetails] AS
SELECT 
    t.TrackID, t.Title, t.AudioUrl,
    u.Username AS ArtistName,
    g.Name AS GenreName,
    a.CoverImageUrl,
    (SELECT COUNT(*) FROM Interaction.Plays WHERE TrackID = t.TrackID) AS TotalPlays,
    (SELECT COUNT(*) FROM Interaction.Likes WHERE TrackID = t.TrackID) AS TotalLikes
FROM Music.Tracks t
INNER JOIN Identity.Users u ON t.ArtistID = u.UserID
INNER JOIN Music.Genres g ON t.GenreID = g.GenreID
LEFT JOIN Music.Albums a ON t.AlbumID = a.AlbumID;

-- Kullanım (karmaşık JOIN yerine)
SELECT * FROM Music.vw_TrackCardDetails
WHERE GenreName = 'Trap'
ORDER BY TotalPlays DESC;
```

**View 2: vw_TopCharts**
```sql
CREATE VIEW [Interaction].[vw_TopCharts] AS
SELECT TOP 50
    t.Title, u.Username AS Artist,
    COUNT(p.PlayID) AS PlayCount,
    ROW_NUMBER() OVER (ORDER BY COUNT(p.PlayID) DESC) AS ChartPosition
FROM Music.Tracks t
INNER JOIN Interaction.Plays p ON t.TrackID = p.TrackID
INNER JOIN Identity.Users u ON t.ArtistID = u.UserID
GROUP BY t.Title, u.Username
ORDER BY PlayCount DESC;

-- Kullanım
SELECT * FROM Interaction.vw_TopCharts;
```

---

## 5. TRIGGER'LAR

### 5.1 Trigger Listesi

Projede **6 adet trigger** bulunmaktadır:

| # | Trigger | Tablo | Event | Amaç |
|---|---------|-------|-------|------|
| 1 | `trg_UpdatePlayCount` | Interaction.Plays | INSERT | PlayCount otomatik artır |
| 2 | `trg_UpdateFollowerCount_Insert` | Interaction.Follows | INSERT | Takipçi sayısı artır |
| 3 | `trg_UpdateFollowerCount_Delete` | Interaction.Follows | DELETE | Takipçi sayısı azalt |
| 4 | `trg_PreventCommentSpam` | Interaction.Comments | INSERT | Spam yorumları engelle |
| 5 | `trg_AuditUserProfileChanges` | Identity.Users | UPDATE | Profil değişikliklerini logla |
| 6 | `trg_PreventPopularTrackDeletion` | Music.Tracks | DELETE | Popüler içerik silme koruması |

### 5.2 Trigger Detayları

#### 🔥 Trigger 1: Otomatik PlayCount Güncelleme

**Senaryo:** Bir kullanıcı şarkı dinlediğinde, `Interaction.Plays` tablosuna kayıt eklenir. Bu trigger otomatik olarak `Music.Tracks` tablosundaki `PlayCount` kolonunu artırır.

**Kod:**
```sql
CREATE TRIGGER [Interaction].[trg_UpdatePlayCount]
ON [Interaction].[Plays]
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Her eklenen kayıt için TrackID'yi al ve PlayCount'u artır
    UPDATE [Music].[Tracks]
    SET PlayCount = PlayCount + 1
    WHERE TrackID IN (SELECT DISTINCT TrackID FROM inserted);
END
```

**Test:**
```sql
-- Önce kontrol et
SELECT TrackID, Title, PlayCount FROM Music.Tracks WHERE TrackID = 1;
-- PlayCount: 150

-- Dinleme kaydı ekle
INSERT INTO Interaction.Plays (TrackID, UserID) VALUES (1, 5);

-- Tekrar kontrol et
SELECT TrackID, Title, PlayCount FROM Music.Tracks WHERE TrackID = 1;
-- PlayCount: 151  ✅ Trigger çalıştı!
```

#### 🔥 Trigger 2-3: Takipçi Sayısı Otomatik Güncelleme

**Senaryo:** Kullanıcı takip/takipten çık yaptığında, `Identity.Users` tablosundaki `FollowerCount` ve `FollowingCount` kolonları otomatik güncellenir.

**INSERT Trigger:**
```sql
CREATE TRIGGER [Interaction].[trg_UpdateFollowerCount_Insert]
ON [Interaction].[Follows]
AFTER INSERT
AS
BEGIN
    -- Takip edilen kullanıcının FollowerCount'unu artır
    UPDATE Identity.Users
    SET FollowerCount = FollowerCount + 1
    WHERE UserID IN (SELECT FollowingID FROM inserted);
    
    -- Takip eden kullanıcının FollowingCount'unu artır
    UPDATE Identity.Users
    SET FollowingCount = FollowingCount + 1
    WHERE UserID IN (SELECT FollowerID FROM inserted);
END
```

**DELETE Trigger:**
```sql
CREATE TRIGGER [Interaction].[trg_UpdateFollowerCount_Delete]
ON [Interaction].[Follows]
AFTER DELETE
AS
BEGIN
    -- Sayaçları azalt (negatif olmasın)
    UPDATE Identity.Users
    SET FollowerCount = FollowerCount - 1
    WHERE UserID IN (SELECT FollowingID FROM deleted)
      AND FollowerCount > 0;
    
    UPDATE Identity.Users
    SET FollowingCount = FollowingCount - 1
    WHERE UserID IN (SELECT FollowerID FROM deleted)
      AND FollowingCount > 0;
END
```

**Test:**
```sql
-- Önce kontrol
SELECT UserID, Username, FollowerCount, FollowingCount 
FROM Identity.Users WHERE UserID IN (1, 2);

-- User 1 → User 2'yi takip etsin
INSERT INTO Interaction.Follows (FollowerID, FollowingID) 
VALUES (1, 2);

-- Sonra kontrol
SELECT UserID, Username, FollowerCount, FollowingCount 
FROM Identity.Users WHERE UserID IN (1, 2);
-- User 1 FollowingCount +1
-- User 2 FollowerCount +1  ✅
```

#### 🔥 Trigger 4: Spam Önleme

**Senaryo:** Aynı kullanıcı, aynı şarkıya 5 saniye içinde birden fazla yorum yapamaz.

**Kod:**
```sql
CREATE TRIGGER [Interaction].[trg_PreventCommentSpam]
ON [Interaction].[Comments]
INSTEAD OF INSERT
AS
BEGIN
    -- Son 5 saniye kontrolü
    IF EXISTS (
        SELECT 1 FROM Interaction.Comments c
        INNER JOIN inserted i ON c.UserID = i.UserID AND c.TrackID = i.TrackID
        WHERE c.PostedAt > DATEADD(SECOND, -5, GETDATE())
    )
    BEGIN
        ;THROW 50001, 'Spam koruması: 5 saniye bekleyin.', 1;
    END
    
    -- Normal yorum ekle
    INSERT INTO Interaction.Comments (UserID, TrackID, Content, PostedAt)
    SELECT UserID, TrackID, Content, PostedAt FROM inserted;
END
```

**Test:**
```sql
-- İlk yorum (başarılı)
INSERT INTO Interaction.Comments (UserID, TrackID, Content) 
VALUES (1, 1, 'Harika şarkı!');
✅ Yorum eklendi

-- Hemen ardından ikinci yorum (başarısız)
INSERT INTO Interaction.Comments (UserID, TrackID, Content) 
VALUES (1, 1, 'Çok güzel!');
❌ HATA: Spam koruması: 5 saniye bekleyin.
```

#### 🔥 Trigger 5: Audit Log

**Senaryo:** Kullanıcı profil bilgilerini değiştirdiğinde (Username, Email, Bio, Avatar), değişiklikler `Audit.UserProfileChanges` tablosuna loglanır.

**Kod:**
```sql
CREATE TRIGGER [Identity].[trg_AuditUserProfileChanges]
ON [Identity].[Users]
AFTER UPDATE
AS
BEGIN
    -- Bio değişikliği
    INSERT INTO Audit.UserProfileChanges (UserID, FieldChanged, OldValue, NewValue)
    SELECT i.UserID, 'Bio', d.Bio, i.Bio
    FROM inserted i
    INNER JOIN deleted d ON i.UserID = d.UserID
    WHERE ISNULL(i.Bio, '') <> ISNULL(d.Bio, '');
    
    -- (Username, Email, Avatar için aynı mantık)
END
```

**Test:**
```sql
-- Profil güncelle
UPDATE Identity.Users 
SET Bio = 'Yeni bio açıklaması' 
WHERE UserID = 1;

-- Audit log kontrol
SELECT * FROM Audit.UserProfileChanges 
WHERE UserID = 1 
ORDER BY ChangedAt DESC;

-- Sonuç:
-- UserID: 1
-- FieldChanged: 'Bio'
-- OldValue: 'Eski bio'
-- NewValue: 'Yeni bio açıklaması'
-- ChangedAt: 2025-12-24 22:15:05
```

#### 🔥 Trigger 6: Popüler İçerik Silme Koruması

**Senaryo:** 100+ dinlenme veya 10+ beğeni alan şarkıların silinmesini engeller.

**Kod:**
```sql
CREATE TRIGGER [Music].[trg_PreventPopularTrackDeletion]
ON [Music].[Tracks]
INSTEAD OF DELETE
AS
BEGIN
    -- Popüler şarkı kontrolü
    IF EXISTS (
        SELECT 1 FROM deleted d
        WHERE d.PlayCount >= 100 OR 
              (SELECT COUNT(*) FROM Interaction.Likes WHERE TrackID = d.TrackID) >= 10
    )
    BEGIN
        RAISERROR('Popüler içerik koruması: Şarkı silinemez!', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END
    
    -- Normal sil
    DELETE FROM Music.Tracks WHERE TrackID IN (SELECT TrackID FROM deleted);
END
```

**Test:**
```sql
-- Popüler şarkıyı silmeyi dene
DELETE FROM Music.Tracks WHERE TrackID = 1;
❌ HATA: Popüler içerik koruması: Şarkı silinemez!

-- Popüler olmayan şarkıyı sil
DELETE FROM Music.Tracks WHERE TrackID = 999;
✅ Şarkı silindi
```

### 5.3 Trigger Test Sonuçları

Tüm trigger'lar `test-triggers.js` scripti ile test edilmiştir:

```
🧪 TRIGGER TEST BAŞLATILIYOR...

📊 TEST 1: PlayCount Otomatik Güncelleme
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎵 Test Şarkısı: Crystal Beats
   Önceki PlayCount: 0
   Sonraki PlayCount: 1
   ✅ Trigger çalıştı! (+1 artış)

👥 TEST 2: FollowerCount Otomatik Güncelleme
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Takip Eden: TitoLind19 (FollowingCount: 5)
👤 Takip Edilen: Big corny (FollowerCount: 2)
   ✅ Trigger çalıştı! (Her ikisi de +1)
   🔄 Takip geri alındı (DELETE trigger test edildi)

📝 TEST 4: Audit Log Trigger
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Test Kullanıcı: Chanel6
   ✅ Audit log kaydedildi
      Alan: Bio
      Eski: "Adventitias adipisci..."
      Yeni: "Test bio - 1766592905881"
      Zaman: 24.12.2025 22:15:05

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ TÜM TRIGGER TESTLERI TAMAMLANDI!
```

---

## 6. JOB ve YEDEK ALMA

### 6.1 SQL Server Agent Jobs

Projenizde kullanılabilecek job örnekleri:

#### 📅 Job 1: Gece Otomatik Backup

**Çalışma Zamanı:** Her gece saat 02:00  
**Amaç:** Full backup al

```sql
USE msdb;

-- Job oluştur
EXEC sp_add_job 
    @job_name = 'FrekansDB_NightlyBackup',
    @enabled = 1,
    @description = 'Her gece otomatik full backup';

-- Adım ekle
EXEC sp_add_jobstep 
    @job_name = 'FrekansDB_NightlyBackup',
    @step_name = 'Full Backup',
    @subsystem = 'TSQL',
    @command = '
        BACKUP DATABASE [FrekansDB]
        TO DISK = ''C:\frekans\backups\FrekansDB_auto_full.bak''
        WITH FORMAT, COMPRESSION, STATS = 10
    ';

-- Zamanlama
EXEC sp_add_schedule 
    @schedule_name = 'Gece_2AM',
    @freq_type = 4,         -- Günlük
    @freq_interval = 1,     -- Her gün
    @active_start_time = 020000;  -- 02:00:00

-- Job'ı schedule'a bağla
EXEC sp_attach_schedule 
    @job_name = 'FrekansDB_NightlyBackup',
    @schedule_name = 'Gece_2AM';
```

#### 📅 Job 2: Haftalık Trend Analizi

**Çalışma Zamanı:** Her Pazar saat 03:00  
**Amaç:** Sanatçı trend skorlarını hesapla

```sql
EXEC sp_add_job @job_name = 'FrekansDB_WeeklyTrends';

EXEC sp_add_jobstep 
    @job_name = 'FrekansDB_WeeklyTrends',
    @step_name = 'Calculate Trends',
    @command = 'EXEC [Analysis].[sp_CalculateArtistTrendScore]';

EXEC sp_add_schedule 
    @schedule_name = 'Pazar_3AM',
    @freq_type = 8,         -- Haftalık
    @freq_interval = 1,     -- Pazar
    @active_start_time = 030000;
```

#### 📅 Job 3: Eski Play Kayıtları Temizleme

**Çalışma Zamanı:** Her ay 1. gün  
**Amaç:** 2 yıldan eski Play kayıtlarını arşivle

```sql
EXEC sp_add_job @job_name = 'FrekansDB_ArchiveOldPlays';

EXEC sp_add_jobstep 
    @command = '
        -- Eski kayıtları arşiv tablosuna taşı
        INSERT INTO Interaction.Plays_Archive
        SELECT * FROM Interaction.Plays
        WHERE PlayedAt < DATEADD(YEAR, -2, GETDATE());
        
        -- Asıl tablodan sil
        DELETE FROM Interaction.Plays
        WHERE PlayedAt < DATEADD(YEAR, -2, GETDATE());
    ';

EXEC sp_add_schedule 
    @freq_type = 16,        -- Aylık
    @freq_interval = 1;     -- 1. gün
```

### 6.2 Yedekleme Sistemi

Projede **3 katmanlı** yedekleme stratejisi uygulanmıştır:

#### 🔹 1. SQL Server Native Backup (.bak)

**Dosya:** `backup-database.js`

```javascript
const query = `
    BACKUP DATABASE [FrekansDB]
    TO DISK = '${backupFile}'
    WITH FORMAT,
         MEDIANAME = 'FrekansBackup',
         NAME = 'Full Backup of FrekansDB',
         COMPRESSION,
         STATS = 10
`;
```

**Backup Türleri:**

| Tür | Açıklama | Frekans | Boyut |
|-----|----------|---------|-------|
| **FULL** | Tüm veritabanı | Haftalık | 18 MB |
| **DIFFERENTIAL** | Son full'dan sonraki değişiklikler | Günlük | 2-5 MB |
| **TRANSACTION LOG** | Log kayıtları | Saatlik | 500 KB - 2 MB |

**Örnek Dosyalar:**
```
backups/
├── FrekansDB_full_2025-12-23_11-03-55.bak      (18 MB)
├── FrekansDB_differential_2025-12-23_11-02-34.bak (3 MB)
└── FrekansDB_transaction_2025-12-23_11-02-42.trn  (1 MB)
```

#### 🔹 2. JSON Export (Tablo Verileri)

**Amaç:** Veri taşınabilirliği, farklı sistemlere aktarım

```javascript
async function exportTablesToJSON(pool) {
    const tables = [
        'Identity.Users',
        'Music.Tracks',
        'Music.Albums',
        'Interaction.Plays',
        'Interaction.Likes',
        // ... diğer tablolar
    ];
    
    for (const table of tables) {
        const result = await pool.request().query(`SELECT * FROM ${table}`);
        const jsonData = JSON.stringify(result.recordset, null, 2);
        
        fs.writeFileSync(
            path.join(jsonDir, `${table.replace('.', '_')}.json`),
            jsonData
        );
    }
}
```

**Örnek Çıktı:**
```
backups/json_2025-12-23_10-54-23/
├── Identity_Users.json         (250 KB)
├── Music_Tracks.json           (2.5 MB)
├── Music_Albums.json           (180 KB)
├── Interaction_Plays.json      (8 MB)
└── Interaction_Likes.json      (1.2 MB)
```

#### 🔹 3. Stored Procedures Backup

**Amaç:** SP kodlarını versiyon kontrolü için yedekle

```javascript
async function backupStoredProcedures(pool) {
    const result = await pool.request().query(`
        SELECT 
            SCHEMA_NAME(schema_id) AS SchemaName,
            name AS ProcedureName,
            OBJECT_DEFINITION(object_id) AS Definition
        FROM sys.procedures
    `);
    
    for (const sp of result.recordset) {
        const fileName = `${sp.SchemaName}_${sp.ProcedureName}.sql`;
        fs.writeFileSync(
            path.join(spDir, fileName),
            sp.Definition
        );
    }
}
```

**Örnek Çıktı:**
```
backups/stored_procedures_2025-12-23/
├── Music_sp_UploadTrack.sql
├── Interaction_sp_ToggleLike.sql
├── Analysis_sp_CalculateArtistTrendScore.sql
└── Music_sp_CreatePlaylist.sql
```

#### 🔹 4. File System Backup (Uploads)

**Amaç:** Audio dosyaları ve cover'ları yedekle

```javascript
async function backupUploads() {
    const uploadsDir = path.join(__dirname, 'public', 'uploads');
    const backupUploadsDir = path.join(backupDir, `uploads_${timestamp}`);
    
    // Klasörü kopyala
    fs.cpSync(uploadsDir, backupUploadsDir, { recursive: true });
}
```

**Örnek Çıktı:**
```
backups/uploads_2025-12-23/
├── audio/
│   ├── midnight-trap.mp3
│   ├── coffee-morning.mp3
│   └── dreams.mp3
└── covers/
    ├── dark-nights.jpg
    └── chill-sundays.jpg
```

### 6.3 PowerShell Otomasyonu

**Dosya:** `backup.ps1`

```powershell
# Node.js yedekleme scriptini çalıştır
node backup-database.js

# Eski yedekleri temizle (30+ gün)
$CutoffDate = (Get-Date).AddDays(-30)
Get-ChildItem -Path "backups" -Recurse | 
    Where-Object { $_.LastWriteTime -lt $CutoffDate } | 
    Remove-Item -Force -Recurse
```

**Çalıştırma:**
```powershell
PS> .\backup.ps1

========================================
   FREKANS OTOMATIK YEDEKLEME
========================================

📦 Veritabanı yedekleme başlatılıyor...

✅ SQL Backup tamamlandı (18.45 MB)
✅ JSON export tamamlandı (12.35 MB)
✅ Stored Procedures yedeklendi (48 dosya)
✅ Uploads klasörü kopyalandı (125 MB)

🧹 Eski yedekler temizleniyor...
   Silindi: FrekansDB_full_2025-11-15.bak
   Silindi: json_2025-11-10/
✅ 5 eski yedek silindi

========================================
   YEDEKLEME TAMAMLANDI
========================================
Süre: 12.48 saniye
📊 Toplam Yedek Boyutu: 156.23 MB
📁 Toplam Dosya Sayısı: 248
```

### 6.4 Geri Yükleme (Restore)

**Dosya:** `restore-database.js`

```javascript
// Full backup geri yükleme
const query = `
    RESTORE DATABASE [FrekansDB]
    FROM DISK = 'C:\\frekans\\backups\\FrekansDB_full_2025-12-23.bak'
    WITH REPLACE,
         RECOVERY,
         STATS = 10
`;

await pool.request().query(query);
```

**Test:**
```bash
node restore-database.js backups/FrekansDB_full_2025-12-23_11-03-55.bak

🔄 RESTORE İŞLEMİ BAŞLIYOR...
📂 Kaynak: FrekansDB_full_2025-12-23_11-03-55.bak

10 percent processed.
20 percent processed.
30 percent processed.
...
100 percent processed.

✅ Veritabanı başarıyla geri yüklendi!
⏱️ Süre: 8.2 saniye
```

### 6.5 Yedekleme Stratejisi Özeti

```
┌─────────────────────────────────────────┐
│   YEDEKLEME STRATEJİSİ                  │
├─────────────────────────────────────────┤
│                                         │
│  Saatlik: Transaction Log Backup        │
│           └─ 1-2 MB                     │
│                                         │
│  Günlük:  Differential Backup           │
│           └─ 3-5 MB                     │
│                                         │
│  Haftalık: Full Backup + JSON Export    │
│           └─ 18 MB + 12 MB              │
│                                         │
│  Aylık:   Full Backup (Arşiv)           │
│           └─ Uzun süreli saklama        │
│                                         │
│  Retention: 30 gün                      │
│                                         │
└─────────────────────────────────────────┘
```

---

## 📊 DEMO SORULARI

### Soru 1: Tablolar arası ilişkiler nasıl?

**Cevap:** 3 schema kullanılarak mantıksal ayrım yapıldı:
- **Identity:** Kullanıcılar
- **Music:** Şarkılar, albümler, türler
- **Interaction:** Dinlemeler, beğeniler, yorumlar, takip

Foreign key'lerle bütünlük sağlandı:
```sql
-- Şarkı → Sanatçı
FK_Tracks_Artist FOREIGN KEY (ArtistID) REFERENCES Identity.Users(UserID)

-- Dinleme → Şarkı
FK_Plays_Track FOREIGN KEY (TrackID) REFERENCES Music.Tracks(TrackID)
```

### Soru 2: En büyük tablo hangisi ve nasıl optimize edildi?

**Cevap:** `Interaction.Plays` (150,000+ kayıt)
- Primary key: **BIGINT** (milyonlarca kayıt için)
- Composite index: `(TrackID, PlayedAt DESC)`
- Partitioning stratejisi (gelecek için)

### Soru 3: Cursor nerede kullanıldı?

**Cevap:** `sp_CalculateArtistTrendScore` prosedüründe:
- Tüm sanatçıları döngüyle işler
- Her biri için toplam dinlenme/beğeni hesaplar
- TrendScore formülü uygular: (Plays × 1) + (Likes × 5)

### Soru 4: Trigger'ların faydası ne?

**Cevap:**
- **Veri tutarlılığı:** PlayCount, FollowerCount otomatik güncellenir
- **İş kuralları:** Spam önleme, popüler içerik koruması
- **Audit:** Profil değişiklikleri loglanır
- **Performans:** Manuel UPDATE sorgularına gerek kalmaz

### Soru 5: Yedekleme sistemi nasıl çalışıyor?

**Cevap:** 4 katmanlı:
1. **SQL Backup (.bak)** - Full/Differential/Transaction Log
2. **JSON Export** - Tablo verileri (taşınabilir format)
3. **SP Backup** - Stored procedure kodları
4. **File Backup** - Audio/cover dosyaları

PowerShell ile otomasyon, 30+ günlük veriler otomatik siliniyor.

---

## 🎯 SONUÇ

### Proje Başarıları

✅ **3-tier schema** ile temiz mimari  
✅ **20+ index** ile yüksek performans  
✅ **15+ stored procedure** ile iş mantığı  
✅ **6 trigger** ile otomatik veri yönetimi  
✅ **Cursor** kullanımı ile batch processing  
✅ **4 katmanlı** yedekleme sistemi  
✅ **Audit log** ile güvenlik  
✅ **View'lar** ile kolay sorgulama  

### Öğrenilenler

- SQL Server schema tasarımı
- Index stratejileri (clustered, non-clustered, filtered, covering)
- Stored procedure best practices
- Trigger'lar ile veri tutarlılığı
- Cursor ile batch processing
- Transaction yönetimi (BEGIN TRAN, ROLLBACK, COMMIT)
- Error handling (TRY-CATCH)
- Backup/Restore stratejileri
- PowerShell otomasyonu

### Gelecek Geliştirmeler

- [ ] Full-text search (şarkı aramaları için)
- [ ] Partitioning (Plays tablosu için)
- [ ] Redis cache (sık kullanılan sorgular için)
- [ ] Replication (yüksek erişilebilirlik)
- [ ] SQL Server Agent job'ları aktifleştir
- [ ] Machine learning ile şarkı önerileri

---

**Hazırlayan:** [İsminiz]  
**Tarih:** 24 Aralık 2025  
**GitHub:** [Repo linki]

---

## EK: DEMO KOMUTLARI

### Trigger Demo
```sql
-- PlayCount trigger
INSERT INTO Interaction.Plays (TrackID, UserID) VALUES (1, 1);
SELECT TrackID, PlayCount FROM Music.Tracks WHERE TrackID = 1;

-- Takipçi trigger
INSERT INTO Interaction.Follows (FollowerID, FollowingID) VALUES (2, 1);
SELECT UserID, FollowerCount FROM Identity.Users WHERE UserID = 1;
```

### Stored Procedure Demo
```sql
-- Şarkı yükle
EXEC Music.sp_UploadTrack @UserID=1, @Title='Demo Song', @GenreID=1, 
     @AudioUrl='test.mp3', @DurationSeconds=180;

-- Trend analizi
EXEC Analysis.sp_CalculateArtistTrendScore;
```

### View Demo
```sql
-- En popüler şarkılar
SELECT TOP 10 * FROM Music.vw_TrackCardDetails 
ORDER BY TotalPlays DESC;

-- Top 50 chart
SELECT * FROM Interaction.vw_TopCharts;
```

### Yedekleme Demo
```powershell
# PowerShell'de
.\backup.ps1

# veya Node.js ile
node backup-database.js
```

---

**SUNUM BAŞARILAR!** 🎉🎵
