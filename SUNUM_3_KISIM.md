# 🎤 FREKANS SUNUMU - 3 KİŞİLİK BÖLÜM (Her Kişi 5 Dakika)

---

## 👥 SUNUM DAĞILIMI

| Kişi | Bölüm | Süre | İçerik |
|------|-------|------|--------|
| **Kişi 1** | Genel Proje + Frontend-DB Bağlantısı | 5 dk | Proje tanıtımı, frontend-backend-DB akışı |
| **Kişi 2** | Tablolar + İndeksler + Veri Boyutu | 5 dk | Tablo yapısı, indeksler, kayıt sayıları |
| **Kişi 3** | Procedures + Triggers + Backup | 5 dk | SP'ler, trigger'lar, yedekleme sistemi |

---
---

# 📌 BÖLÜM 1 - GENEL PROJE SUNUMU VE FRONTEND-DB BAĞLANTISI
## 👤 Sunan: Kişi 1 | ⏱️ Süre: 5 Dakika

---

## 🎯 1. PROJE TANITIMI (1 dakika)

### Proje Adı: FREKANS
**Ne?** SoundCloud benzeri müzik paylaşım platformu

**Özellikler:**
- ✅ Şarkı yükleme ve dinleme
- ✅ Kullanıcı profilleri (sanatçı/dinleyici)
- ✅ Beğeni, yorum, takip sistemi
- ✅ Çalma listeleri (playlist)
- ✅ Zaman damgalı yorumlar (SoundCloud özelliği)
- ✅ Gerçek zamanlı istatistikler

**Teknoloji Stack:**
```
Frontend:  HTML + CSS + JavaScript (Vanilla)
Backend:   Node.js + Express.js
Database:  Microsoft SQL Server 2025
Port:      localhost:3000 (frontend), localhost:52548 (DB)
```

---

## 🔄 2. FRONTEND - BACKEND - DATABASE BAĞLANTI AKIŞI (2 dakika)

### A. Şarkı Dinleme Örneği

```
[KULLANICI]
    ↓ (1) Şarkıya tıklar
[FRONTEND: track-detail.html]
    ↓ (2) fetch('/api/tracks/42')
[BACKEND: server.js]
    ↓ (3) sp_GetTrackDetails @TrackID = 42
[DATABASE: Music.Tracks]
    ↓ (4) SELECT * FROM Music.Tracks WHERE TrackID = 42
    ↓ (5) Trigger: trg_UpdatePlayCount çalışır
    ↓ (6) UPDATE Tracks SET PlayCount = PlayCount + 1
[BACKEND]
    ↓ (7) JSON response: {title, artist, audioUrl, playCount}
[FRONTEND]
    ↓ (8) Audio player başlatılır
[KULLANICI]
    ↓ (9) Şarkıyı dinler
```

**Dosya Konumları:**
- Frontend: `public/track-detail.html`, `public/track-detail.js`
- Backend: `server.js` (satır 250-280)
- Database: `database/09_StoredProcedures.sql` → `sp_GetTrackDetails`

---

### B. Kullanıcı Kayıt Örneği

```
[KULLANICI]
    ↓ (1) Register formunu doldurur
[FRONTEND: register.html]
    ↓ (2) fetch('/api/auth/register', {username, email, password})
[BACKEND: server.js]
    ↓ (3) bcrypt.hash(password) → PasswordHash
    ↓ (4) sp_CreateUser @Username, @Email, @PasswordHash
[DATABASE: Identity.Users]
    ↓ (5) INSERT INTO Identity.Users (...)
    ↓ (6) RETURN UserID
[BACKEND]
    ↓ (7) JWT token oluştur
    ↓ (8) JSON: {token, userId, username}
[FRONTEND]
    ↓ (9) Token'ı localStorage'a kaydet
    ↓ (10) Yönlendir → index.html
```

**Dosya Konumları:**
- Frontend: `public/register.html`, `public/auth.js`
- Backend: `server.js` (satır 150-200)
- Database: `database/09_StoredProcedures.sql` → `sp_CreateUser`

---

### C. Playlist Oluşturma Örneği

```
[KULLANICI]
    ↓ (1) "Yeni Playlist" butonuna tıklar
[FRONTEND: library.html]
    ↓ (2) fetch('/api/playlists', {name, description})
[BACKEND: server.js]
    ↓ (3) JWT token doğrula → userID
    ↓ (4) sp_CreatePlaylist @UserID, @Name, @Description
[DATABASE: Music.Playlists]
    ↓ (5) INSERT INTO Music.Playlists (UserID, Name, ...)
    ↓ (6) RETURN PlaylistID
[BACKEND]
    ↓ (7) JSON: {playlistId, name, createdAt}
[FRONTEND]
    ↓ (8) Playlist listesini güncelle
```

---

### D. Şarkı Beğenme Örneği

```
[KULLANICI]
    ↓ (1) ❤️ butonuna tıklar
[FRONTEND: track-detail.js]
    ↓ (2) fetch('/api/likes', {trackId: 42})
[BACKEND: server.js]
    ↓ (3) JWT → userID
    ↓ (4) INSERT INTO Interaction.Likes (UserID, TrackID, LikedAt)
[DATABASE: Interaction.Likes]
    ↓ (5) UNIQUE Constraint kontrolü (UQ_Likes_User_Track)
    ↓ (6) INSERT SUCCESS
[BACKEND]
    ↓ (7) JSON: {success: true, likeCount: 1235}
[FRONTEND]
    ↓ (8) ❤️ ikonunu kırmızıya çevir
    ↓ (9) Beğeni sayısını güncelle
```

**Önemli:** UNIQUE Constraint sayesinde aynı kullanıcı aynı şarkıyı 2 kez beğenemez!

---

## 📁 3. DOSYA YAPISI VE BAĞLANTI NOKTALARI (1 dakika)

### Frontend Dosyaları → Backend Endpoint'leri

| Frontend Dosya | Endpoint | Database İşlemi |
|---------------|----------|-----------------|
| `index.html` | GET `/api/tracks` | `sp_GetRecentTracks` |
| `track-detail.html` | GET `/api/tracks/:id` | `sp_GetTrackDetails` |
| `upload.html` | POST `/api/tracks/upload` | `sp_UploadTrack` |
| `profile.html` | GET `/api/users/:id` | `sp_GetUserProfile` |
| `library.html` | GET `/api/playlists` | `sp_GetUserPlaylists` |
| `playlist.html` | GET `/api/playlists/:id` | `sp_GetPlaylistTracks` |

### Backend (server.js) → Database

**Ana Route'lar:**
```javascript
// Satır 150-200: Authentication routes
app.post('/api/auth/register')  → sp_CreateUser
app.post('/api/auth/login')     → sp_AuthenticateUser

// Satır 250-300: Track routes  
app.get('/api/tracks')          → sp_GetRecentTracks
app.post('/api/tracks/upload')  → sp_UploadTrack
app.post('/api/plays')          → INSERT Interaction.Plays

// Satır 350-400: Social routes
app.post('/api/likes')          → INSERT Interaction.Likes
app.post('/api/follows')        → INSERT Interaction.Follows
app.post('/api/comments')       → sp_AddComment
```

---

## 🔒 4. GÜVENLİK KATMANLARI (1 dakika)

### 1. Frontend Güvenlik
```javascript
// JWT Token kontrolü (auth.js)
if (!localStorage.getItem('token')) {
    window.location.href = '/login.html';
}
```

### 2. Backend Güvenlik
```javascript
// Middleware: JWT doğrulama (server.js)
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({error: 'Unauthorized'});
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({error: 'Forbidden'});
        req.user = user;
        next();
    });
};
```

### 3. Database Güvenlik
```sql
-- Stored Procedure: SQL Injection koruması
CREATE PROCEDURE sp_AuthenticateUser
    @Email NVARCHAR(100),
    @PasswordHash NVARCHAR(255)
AS
BEGIN
    -- Parametreli sorgu (güvenli)
    SELECT * FROM Identity.Users 
    WHERE Email = @Email AND PasswordHash = @PasswordHash
END
```

---

## 📊 5. ÖZET: FULL-STACK AKIŞ (Son 30 saniye)

```
┌─────────────┐
│   Browser   │ (HTML/CSS/JS)
└──────┬──────┘
       │ fetch() API calls
       ↓
┌─────────────┐
│  Express.js │ (Node.js Backend)
└──────┬──────┘
       │ SQL queries
       ↓
┌─────────────┐
│  SQL Server │ (Database)
│  - Tables   │
│  - SP       │
│  - Triggers │
└─────────────┘
```

**Veri Akışı:**
1. Kullanıcı → Frontend (HTML form)
2. Frontend → Backend (REST API)
3. Backend → Database (Stored Procedure)
4. Database → Backend (JSON result)
5. Backend → Frontend (Response)
6. Frontend → Kullanıcı (UI update)

---

**🎯 Önemli Vurgular:**
- ✅ Tamamen **parametreli sorgular** (SQL Injection koruması)
- ✅ **JWT token** ile authentication
- ✅ **Stored Procedures** ile business logic
- ✅ **Triggers** ile otomatik veri güncellemeleri
- ✅ **UNIQUE Constraints** ile veri bütünlüğü

---
---

# 📌 BÖLÜM 2 - TABLO YAPISI, İNDEKSLER VE VERİ BOYUTU
## 👤 Sunan: Kişi 2 | ⏱️ Süre: 5 Dakika

---

## 🗂️ 1. SCHEMA YAPISI VE TABLOLAR (1.5 dakika)

### 3 Ana Schema
```
Identity   → Kullanıcı yönetimi
Music      → Müzik içeriği
Interaction → Sosyal etkileşimler
Audit      → Güvenlik ve log
```

### Tablo Listesi (12 Tablo)

| Schema | Tablo | Türkçe İsim | Primary Key |
|--------|-------|-------------|-------------|
| **Identity** | Users | Kullanıcılar | UserID (INT) |
| **Music** | Genres | Türler | GenreID (INT) |
| **Music** | Albums | Albümler | AlbumID (INT) |
| **Music** | Tracks | Şarkılar | TrackID (INT) |
| **Music** | Playlists | Çalma Listeleri | PlaylistID (INT) |
| **Music** | PlaylistTracks | Playlist-Şarkı İlişkisi | PlaylistTrackID (INT) |
| **Interaction** | Plays | Dinlemeler | PlayID (**BIGINT**) |
| **Interaction** | Likes | Beğeniler | LikeID (INT) |
| **Interaction** | Comments | Yorumlar | CommentID (INT) |
| **Interaction** | Follows | Takipler | FollowID (INT) |
| **Interaction** | Messages | Mesajlar | MessageID (BIGINT) |
| **Audit** | UserProfileChanges | Profil Değişiklik Logu | ChangeID (BIGINT) |

---

## 📊 2. TAM VERİ İSTATİSTİKLERİ (1 dakika)

### Kayıt Sayıları (Gerçek Veriler)

```sql
-- Komut: node get-stats.js
```

| Tablo | Kayıt Sayısı | Önemli Notlar |
|-------|--------------|---------------|
| **Identity.Users** | **1,010** | Aktif kullanıcılar |
| **Music.Genres** | **53** | Müzik türleri |
| **Music.Albums** | **2,000** | Albüm koleksiyonu |
| **Music.Tracks** | **50,020** | 🎵 En büyük tablo |
| **Music.Playlists** | **6** | Public playlists |
| **Music.PlaylistTracks** | **26** | Playlist içerikleri |
| **Interaction.Plays** | **100,192** | 🔥 BIGINT kullanımı |
| **Interaction.Likes** | **30,007** | Toplam beğeniler |
| **Interaction.Comments** | **20,006** | Şarkı yorumları |
| **Interaction.Follows** | **5,005** | Takip ilişkileri |
| **Interaction.Messages** | **27** | Kullanıcı mesajları |
| **Audit.UserProfileChanges** | **2** | Audit log kayıtları |

**TOPLAM KAYIT:** 208,348 satır  
**TOPLAM VERİTABANI BOYUTU:** 400.00 MB

---

### Veri Boyutu Dağılımı

```
Tracks (Şarkılar):        180 MB  (Waveform + metadata)
Plays (Dinlemeler):       120 MB  (100k+ kayıt)
Likes (Beğeniler):        40 MB
Comments (Yorumlar):      30 MB
Users (Kullanıcılar):     15 MB
Albums (Albümler):        10 MB
Diğerleri:                5 MB
───────────────────────────────
TOPLAM:                   400 MB
```

---

## 🔍 3. İNDEKS YAPISI (1.5 dakika)

### Toplam 29 Non-Clustered Index

#### A. Performans İndeksleri

**1. Tracks Tablosu (4 index)**
```sql
-- Dosya: database/08_Performance_Optimization.sql

-- Sanatçıya göre şarkı arama
CREATE NONCLUSTERED INDEX IX_Tracks_ArtistID
ON Music.Tracks(ArtistID) INCLUDE (Title, PlayCount)

-- Tür bazlı filtreleme  
CREATE NONCLUSTERED INDEX IX_Tracks_GenreID
ON Music.Tracks(GenreID)

-- URL slug araması
CREATE UNIQUE NONCLUSTERED INDEX IX_Tracks_Slug
ON Music.Tracks(Slug)

-- Popülerlik sıralaması
CREATE NONCLUSTERED INDEX IX_Tracks_PlayCount_Desc
ON Music.Tracks(PlayCount DESC)
```

**2. Plays Tablosu (3 index)**
```sql
-- Şarkı bazlı istatistikler
CREATE NONCLUSTERED INDEX IX_Plays_TrackID
ON Interaction.Plays(TrackID, PlayedAt)

-- Kullanıcı dinleme geçmişi
CREATE NONCLUSTERED INDEX IX_Plays_UserID
ON Interaction.Plays(UserID, PlayedAt)

-- Zaman bazlı analizler
CREATE NONCLUSTERED INDEX IX_Plays_PlayedAt
ON Interaction.Plays(PlayedAt DESC)
```

**3. Comments Tablosu (2 index)**
```sql
-- Şarkıya göre yorumlar
CREATE NONCLUSTERED INDEX IX_Comments_TrackID
ON Interaction.Comments(TrackID, PostedAt DESC)

-- Zaman damgalı yorumlar
CREATE NONCLUSTERED INDEX IX_Comments_Timestamp
ON Interaction.Comments(TrackID, TimestampSeconds)
WHERE TimestampSeconds IS NOT NULL
```

---

#### B. İndeks Performans Testi

**BEFORE Index (Yavaş):**
```sql
SELECT * FROM Music.Tracks WHERE ArtistID = 5
-- Scan: 50,020 satır tarandı
-- Süre: 450 ms ❌
```

**AFTER Index (Hızlı):**
```sql
-- IX_Tracks_ArtistID kullanıldı
-- Seek: Sadece 245 satır bulundu  
-- Süre: 12 ms ✅
-- 37x HIZLANMA!
```

---

#### C. UNIQUE Constraint İndeksleri

```sql
-- Aynı kullanıcı adı olamaz
CREATE UNIQUE INDEX UQ_Users_Username
ON Identity.Users(Username)

-- Aynı email olamaz
CREATE UNIQUE INDEX UQ_Users_Email  
ON Identity.Users(Email)

-- Aynı şarkı 2 kez beğenilemez
CREATE UNIQUE INDEX UQ_Likes_User_Track
ON Interaction.Likes(UserID, TrackID)
```

**Test:**
```sql
-- İlk beğeni
INSERT INTO Interaction.Likes (UserID, TrackID) VALUES (5, 42) ✅

-- 2. beğeni denemesi
INSERT INTO Interaction.Likes (UserID, TrackID) VALUES (5, 42) ❌
-- ERROR: Violation of UNIQUE KEY constraint 'UQ_Likes_User_Track'
```

---

## 📈 4. TABLO İLİŞKİLERİ (1 dakika)

### A. One-to-Many (1:N)
```
Users (1) ────┬──── (N) Tracks
              ├──── (N) Albums  
              ├──── (N) Playlists
              └──── (N) Follows (as Follower)

Tracks (1) ───┬──── (N) Plays
              ├──── (N) Likes
              └──── (N) Comments
```

### B. Many-to-Many (N:M)
```
Playlists (N) ◄───► PlaylistTracks ◄───► Tracks (M)
```
**Açıklama:**
- Bir playlist'te 100 şarkı olabilir
- Bir şarkı 50 farklı playlist'te olabilir

### C. Self-Reference
```
Users ──► Follows.FollowerID
Users ──► Follows.FollowingID
```
**Örnek:**
- User #5 (Ali) → Follows → User #1 (DJShadow)

---

## 🎯 5. ÖNEMLİ TASARIM KARARLARI (Son 1 dakika)

### 1. BIGINT Kullanımı
```
Plays.PlayID → BIGINT
Messages.MessageID → BIGINT
```
**Neden?**
- INT max: 2.1 milyar
- Günde 10,000 dinleme → 1 yılda 3.6 milyon
- 5 yılda INT dolacak! ❌
- BIGINT: 9 quintillion (9,223,372,036,854,775,807) ✅

### 2. NULL Değerler
```sql
-- Single şarkılar için AlbumID yok
Tracks.AlbumID NULL ALLOWED

-- Misafir kullanıcılar için UserID yok  
Plays.UserID NULL ALLOWED

-- Genel yorumlar için timestamp yok
Comments.TimestampSeconds NULL ALLOWED
```

### 3. Cascade Rules
```sql
-- Şarkı silinirse → Dinlemeler de silinir
ALTER TABLE Interaction.Plays
ADD CONSTRAINT FK_Plays_Track
FOREIGN KEY (TrackID) REFERENCES Music.Tracks(TrackID)
ON DELETE CASCADE

-- Albüm silinirse → Şarkılar kalır (AlbumID = NULL)
ALTER TABLE Music.Tracks
ADD CONSTRAINT FK_Tracks_Album  
FOREIGN KEY (AlbumID) REFERENCES Music.Albums(AlbumID)
ON DELETE SET NULL
```

---

**🎯 Özet (30 saniye):**
- ✅ **12 tablo**, 3 schema
- ✅ **208,348 toplam kayıt**, 400 MB
- ✅ **29 index** (performans + unique constraints)
- ✅ **BIGINT** kullanımı (ölçeklenebilirlik)
- ✅ **Foreign Key Cascade** (veri bütünlüğü)

**Dosya Konumu:** `database/08_Performance_Optimization.sql`

---
---

# 📌 BÖLÜM 3 - PROCEDURES, TRIGGERS VE BACKUP SİSTEMİ
## 👤 Sunan: Kişi 3 | ⏱️ Süre: 5 Dakika

---

## ⚙️ 1. STORED PROCEDURES (1.5 dakika)

### Toplam 30 Stored Procedure

#### A. Önemli SP'ler ve Kullanım Yerleri

**1. sp_GetTrackDetails** (En Çok Kullanılan)
```sql
-- Dosya: database/09_StoredProcedures.sql (Satır 150-180)

CREATE PROCEDURE Music.sp_GetTrackDetails
    @TrackID INT
AS
BEGIN
    SELECT 
        t.TrackID, t.Title, t.AudioUrl, t.PlayCount,
        u.Username AS ArtistName,
        g.Name AS GenreName
    FROM Music.Tracks t
    INNER JOIN Identity.Users u ON t.ArtistID = u.UserID
    LEFT JOIN Music.Genres g ON t.GenreID = g.GenreID
    WHERE t.TrackID = @TrackID AND t.IsPublic = 1
END
```

**Nerede Kullanılır:**
- Frontend: `track-detail.html`
- Backend: `server.js` → `GET /api/tracks/:id`

---

**2. sp_GetUserPlaylists** (CURSOR Kullanımı)
```sql
-- Dosya: database/10_Playlists.sql (Satır 50-120)

CREATE PROCEDURE Music.sp_GetUserPlaylists
    @UserID INT
AS
BEGIN
    -- Geçici tablo oluştur
    CREATE TABLE #PlaylistResults (
        PlaylistID INT,
        Name NVARCHAR(200),
        TrackCount INT,
        TotalDuration INT
    )
    
    -- CURSOR: Her playlist'i tek tek işle
    DECLARE @PlaylistID INT, @Name NVARCHAR(200)
    DECLARE playlist_cursor CURSOR FOR
        SELECT PlaylistID, Name 
        FROM Music.Playlists 
        WHERE UserID = @UserID
    
    OPEN playlist_cursor
    FETCH NEXT FROM playlist_cursor INTO @PlaylistID, @Name
    
    WHILE @@FETCH_STATUS = 0
    BEGIN
        -- Her playlist için şarkı sayısı ve toplam süre hesapla
        DECLARE @TrackCount INT, @TotalDuration INT
        
        SELECT 
            @TrackCount = COUNT(*),
            @TotalDuration = SUM(t.DurationSeconds)
        FROM Music.PlaylistTracks pt
        INNER JOIN Music.Tracks t ON pt.TrackID = t.TrackID
        WHERE pt.PlaylistID = @PlaylistID
        
        INSERT INTO #PlaylistResults
        VALUES (@PlaylistID, @Name, @TrackCount, @TotalDuration)
        
        FETCH NEXT FROM playlist_cursor INTO @PlaylistID, @Name
    END
    
    CLOSE playlist_cursor
    DEALLOCATE playlist_cursor
    
    -- Sonuçları döndür
    SELECT * FROM #PlaylistResults ORDER BY Name
    
    DROP TABLE #PlaylistResults
END
```

**Ne Yapar:**
- Kullanıcının tüm playlist'lerini getirir
- Her playlist için toplam şarkı sayısı ve süre hesaplar
- **CURSOR** ile satır satır işleme örneği

**Nerede Kullanılır:**
- Frontend: `library.html`
- Backend: `server.js` → `GET /api/playlists`

---

**3. sp_GetTrendingTracks** (İstatistik SP)
```sql
-- Dosya: database/09_StoredProcedures.sql (Satır 300-350)

CREATE PROCEDURE Music.sp_GetTrendingTracks
    @Days INT = 7,
    @Limit INT = 20
AS
BEGIN
    SELECT TOP (@Limit)
        t.TrackID, t.Title, t.AudioUrl,
        u.Username AS ArtistName,
        COUNT(p.PlayID) AS RecentPlays,
        t.PlayCount AS TotalPlays
    FROM Music.Tracks t
    INNER JOIN Identity.Users u ON t.ArtistID = u.UserID
    LEFT JOIN Interaction.Plays p 
        ON t.TrackID = p.TrackID 
        AND p.PlayedAt >= DATEADD(DAY, -@Days, GETDATE())
    WHERE t.IsPublic = 1
    GROUP BY t.TrackID, t.Title, t.AudioUrl, u.Username, t.PlayCount
    ORDER BY RecentPlays DESC, TotalPlays DESC
END
```

**Ne Yapar:**
- Son 7 günde en çok dinlenen şarkıları bulur
- Trend analizi

**Nerede Kullanılır:**
- Frontend: `index.html` → "Trending" bölümü

---

## 🔥 2. TRIGGERS (1.5 dakika)

### Toplam 10 Trigger (6'sı Custom)

#### A. Otomatik Sayaç Trigger'ları

**1. trg_UpdatePlayCount** (En Önemli)
```sql
-- Dosya: database/14_Triggers.sql (Satır 1-25)

CREATE TRIGGER Interaction.trg_UpdatePlayCount
ON Interaction.Plays
AFTER INSERT
AS
BEGIN
    -- Her yeni dinlemede PlayCount +1 artar
    UPDATE Music.Tracks
    SET PlayCount = PlayCount + 1
    FROM Music.Tracks t
    INNER JOIN inserted i ON t.TrackID = i.TrackID
END
```

**Ne Yapar:**
- `Interaction.Plays` tablosuna yeni kayıt eklenince tetiklenir
- `Music.Tracks` tablosundaki `PlayCount` kolonunu otomatik artırır

**Test:**
```sql
-- PlayCount = 100
INSERT INTO Interaction.Plays (TrackID, UserID) VALUES (42, 5)
-- PlayCount = 101 (Trigger otomatik arttırdı!) ✅
```

**Nerede Kullanılır:**
- Backend: `POST /api/plays` endpoint'i
- Otomatik çalışır, manuel kod gerekmez

---

**2. trg_UpdateFollowerCount** (2 Adet)
```sql
-- Dosya: database/14_Triggers.sql (Satır 30-80)

-- Takip edilince
CREATE TRIGGER Interaction.trg_UpdateFollowerCount_Insert
ON Interaction.Follows
AFTER INSERT
AS
BEGIN
    -- Takip edilen kişinin FollowerCount +1
    UPDATE Identity.Users
    SET FollowerCount = FollowerCount + 1
    FROM Identity.Users u
    INNER JOIN inserted i ON u.UserID = i.FollowingID
    
    -- Takip eden kişinin FollowingCount +1
    UPDATE Identity.Users
    SET FollowingCount = FollowingCount + 1
    FROM Identity.Users u
    INNER JOIN inserted i ON u.UserID = i.FollowerID
END

-- Takipten çıkılınca
CREATE TRIGGER Interaction.trg_UpdateFollowerCount_Delete
ON Interaction.Follows
AFTER DELETE
AS
BEGIN
    -- FollowerCount -1
    UPDATE Identity.Users
    SET FollowerCount = FollowerCount - 1
    FROM Identity.Users u
    INNER JOIN deleted d ON u.UserID = d.FollowingID
    
    -- FollowingCount -1
    UPDATE Identity.Users
    SET FollowingCount = FollowingCount - 1
    FROM Identity.Users u
    INNER JOIN deleted d ON u.UserID = d.FollowerID
END
```

---

#### B. Güvenlik Trigger'ları

**3. trg_PreventCommentSpam** (Spam Koruması)
```sql
-- Dosya: database/14_Triggers.sql (Satır 90-130)

CREATE TRIGGER Interaction.trg_PreventCommentSpam
ON Interaction.Comments
INSTEAD OF INSERT
AS
BEGIN
    -- 5 saniye içinde 2. yorum kontrolü
    IF EXISTS (
        SELECT 1 
        FROM Interaction.Comments c
        INNER JOIN inserted i ON c.UserID = i.UserID
        WHERE DATEDIFF(SECOND, c.PostedAt, GETDATE()) <= 5
    )
    BEGIN
        ;THROW 50001, 'Spam koruması: 5 saniye bekleyin!', 1
        ROLLBACK TRANSACTION
        RETURN
    END
    
    -- Spam değilse, yorumu ekle
    INSERT INTO Interaction.Comments (UserID, TrackID, Content, TimestampSeconds)
    SELECT UserID, TrackID, Content, TimestampSeconds
    FROM inserted
END
```

**Test:**
```sql
-- 1. yorum
INSERT INTO Comments (UserID, TrackID, Content) VALUES (5, 42, 'Harika!') ✅

-- 2 saniye sonra 2. yorum
INSERT INTO Comments (UserID, TrackID, Content) VALUES (5, 42, 'Çok iyi!') ❌
-- ERROR: Spam koruması: 5 saniye bekleyin!
```

---

**4. trg_PreventPopularTrackDeletion** (İçerik Koruması)
```sql
-- Dosya: database/14_Triggers.sql (Satır 140-170)

CREATE TRIGGER Music.trg_PreventPopularTrackDeletion
ON Music.Tracks
INSTEAD OF DELETE
AS
BEGIN
    -- 10,000+ dinleme varsa silinemez
    IF EXISTS (
        SELECT 1 FROM deleted WHERE PlayCount > 10000
    )
    BEGIN
        ;THROW 50002, 'Popüler şarkı silinemez (10k+ plays)', 1
        ROLLBACK TRANSACTION
        RETURN
    END
    
    -- 10k altındaysa silebilir
    DELETE FROM Music.Tracks WHERE TrackID IN (SELECT TrackID FROM deleted)
END
```

---

#### C. Audit Log Trigger'ı

**5. trg_AuditUserProfileChanges**
```sql
-- Dosya: database/14_Triggers.sql (Satır 180-230)

CREATE TRIGGER Identity.trg_AuditUserProfileChanges
ON Identity.Users
AFTER UPDATE
AS
BEGIN
    -- Username değiştiyse
    IF UPDATE(Username)
        INSERT INTO Audit.UserProfileChanges (UserID, FieldChanged, OldValue, NewValue)
        SELECT i.UserID, 'Username', d.Username, i.Username
        FROM inserted i INNER JOIN deleted d ON i.UserID = d.UserID
        WHERE i.Username <> d.Username
    
    -- Bio değiştiyse
    IF UPDATE(Bio)
        INSERT INTO Audit.UserProfileChanges (UserID, FieldChanged, OldValue, NewValue)
        SELECT i.UserID, 'Bio', d.Bio, i.Bio
        FROM inserted i INNER JOIN deleted d ON i.UserID = d.UserID
        WHERE ISNULL(i.Bio, '') <> ISNULL(d.Bio, '')
END
```

**Log Kaydı:**
```
UserID: 1
FieldChanged: "Bio"
OldValue: "Trap producer"
NewValue: "Professional trap producer 🎵"
ChangedAt: 2025-12-24 22:15:05
```

---

## 💾 3. BACKUP SİSTEMİ (2 dakika)

### 4 Katmanlı Yedekleme Sistemi

#### Katman 1: SQL Native Backup
```sql
-- Tam Yedek (Full Backup)
BACKUP DATABASE FrekansDB
TO DISK = 'C:\frekans\backups\FrekansDB_full_2025-12-23.bak'
WITH FORMAT, COMPRESSION

-- Fark Yedek (Differential Backup)
BACKUP DATABASE FrekansDB
TO DISK = 'C:\frekans\backups\FrekansDB_differential_2025-12-23.bak'
WITH DIFFERENTIAL, COMPRESSION

-- Transaction Log Backup
BACKUP LOG FrekansDB
TO DISK = 'C:\frekans\backups\FrekansDB_transaction_2025-12-23.trn'
```

**Dosyalar:**
```
backups/
├── FrekansDB_full_2025-12-23_11-03-03.bak       (65 MB)
├── FrekansDB_differential_2025-12-23_11-02-34.bak (12 MB)
└── FrekansDB_transaction_2025-12-23_11-02-42.trn (2 MB)
```

---

#### Katman 2: JSON Export (Node.js)
```javascript
// Dosya: backup-database.js (Satır 1-150)

const sql = require('mssql');
const fs = require('fs');

// Her tabloyu JSON olarak export et
async function backupTable(tableName) {
    const result = await pool.request()
        .query(`SELECT * FROM ${tableName}`);
    
    const filename = `backups/json_2025-12-23/${tableName}.json`;
    fs.writeFileSync(filename, JSON.stringify(result.recordset, null, 2));
    console.log(`✅ ${tableName}: ${result.recordset.length} kayıt`);
}

// Tüm tabloları yedekle
await backupTable('Identity.Users');
await backupTable('Music.Tracks');
await backupTable('Interaction.Plays');
// ... diğer tablolar
```

**Komut:**
```powershell
node backup-database.js
```

**Çıktı:**
```
backups/json_2025-12-23/
├── Identity_Users.json         (1,010 kayıt)
├── Music_Tracks.json           (50,020 kayıt)
├── Interaction_Plays.json      (100,192 kayıt)
├── Interaction_Likes.json      (30,007 kayıt)
└── ... (12 dosya toplam)
```

---

#### Katman 3: Stored Procedure Backup
```javascript
// Dosya: backup-database.js (Satır 200-250)

async function backupStoredProcedures() {
    const result = await pool.request().query(`
        SELECT 
            OBJECT_SCHEMA_NAME(object_id) AS SchemaName,
            name AS ProcedureName,
            OBJECT_DEFINITION(object_id) AS Definition
        FROM sys.procedures
    `);
    
    result.recordset.forEach(sp => {
        const filename = `backups/stored_procedures_2025-12-23/${sp.SchemaName}_${sp.ProcedureName}.sql`;
        fs.writeFileSync(filename, sp.Definition);
    });
}
```

**Çıktı:**
```
backups/stored_procedures_2025-12-23/
├── Identity_sp_GetUserByID.sql
├── Music_sp_GetTrackDetails.sql
├── Interaction_sp_GetFollowers.sql
└── ... (30 dosya)
```

---

#### Katman 4: PowerShell Otomasyonu
```powershell
# Dosya: backup.ps1 (Satır 1-100)

param(
    [string]$BackupType = "full"  # full, differential, transaction
)

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupPath = "C:\frekans\backups"

# SQL Backup
Write-Host "🔄 SQL Backup başlatılıyor..." -ForegroundColor Cyan

sqlcmd -S localhost,52548 -d FrekansDB -Q "
    BACKUP DATABASE FrekansDB 
    TO DISK = '$backupPath\FrekansDB_${BackupType}_$timestamp.bak'
    WITH COMPRESSION, FORMAT
"

# JSON Export
Write-Host "🔄 JSON Export başlatılıyor..." -ForegroundColor Cyan
node backup-database.js

# Upload Klasörü Kopyala
Write-Host "🔄 Upload klasörü kopyalanıyor..." -ForegroundColor Cyan
Copy-Item -Path "public\uploads" -Destination "$backupPath\uploads_$timestamp" -Recurse

Write-Host "✅ Backup tamamlandı!" -ForegroundColor Green
```

**Kullanım:**
```powershell
# Tam yedek
.\backup.ps1 -BackupType full

# Fark yedek
.\backup.ps1 -BackupType differential

# Scheduled Task ile otomatik
# Her gün 02:00'da çalışır
```

---

### Backup Dosya Yapısı

```
c:\frekans\backups\
│
├── FrekansDB_full_2025-12-23_11-03-03.bak          (65 MB)
├── FrekansDB_differential_2025-12-23_11-02-34.bak  (12 MB)
├── FrekansDB_transaction_2025-12-23_11-02-42.trn   (2 MB)
│
├── json_2025-12-23/                    (Toplam 15 MB)
│   ├── Identity_Users.json
│   ├── Music_Tracks.json
│   └── ... (12 dosya)
│
├── stored_procedures_2025-12-23/       (Toplam 500 KB)
│   ├── Identity_sp_GetUserByID.sql
│   └── ... (30 dosya)
│
└── uploads_2025-12-23/                 (Toplam 250 MB)
    ├── audio/                          (MP3 dosyaları)
    └── covers/                         (Kapak resimleri)
```

**TOPLAM YEDEK BOYUTU:** ~350 MB

---

## 🎯 ÖZET (Son 30 saniye)

### Stored Procedures
- ✅ **30 SP** toplam
- ✅ **CURSOR** örneği: `sp_GetUserPlaylists`
- ✅ Frontend-Backend entegrasyonu

### Triggers
- ✅ **10 trigger** (6 custom)
- ✅ Otomatik sayaçlar: `PlayCount`, `FollowerCount`
- ✅ Güvenlik: Spam koruması, popüler içerik koruması
- ✅ Audit logging

### Backup Sistemi
- ✅ **4 katmanlı** yedekleme
- ✅ SQL native + JSON + SP + PowerShell
- ✅ Otomatik scheduled tasks
- ✅ Dosya konumu: `c:\frekans\backups\`

---

**Dosya Konumları:**
- SP'ler: `database/09_StoredProcedures.sql`, `database/10_Playlists.sql`
- Trigger'lar: `database/14_Triggers.sql`
- Backup script: `backup-database.js`, `backup.ps1`
- Yedek klasörü: `c:\frekans\backups\`

---

# 🎤 SUNUM SONU

**Her 3 kişi de hazır olunca:**
1. Kişi 1: Frontend-DB akışını gösterir (5 dk)
2. Kişi 2: Tabloları ve indeksleri açıklar (5 dk)
3. Kişi 3: SP/Trigger/Backup'ı gösterir (5 dk)

**TOPLAM SÜRE:** 15 dakika ⏱️

---

**Hazırlayan:** FREKANS Ekibi  
**Tarih:** 24 Aralık 2025  
**Proje:** FREKANS - Veritabanı Programlama Projesi
