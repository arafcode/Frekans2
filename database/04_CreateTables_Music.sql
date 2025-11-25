-- =============================================
-- SoundCloud Clone - Music Schema Tables
-- =============================================
-- Müzik içerikleri: Türler, Albümler, Şarkılar
-- =============================================

USE FrekansDB;
GO

-- =============================================
-- Table: Music.Genres
-- Açıklama: Müzik türleri (Trap, Lo-Fi, House vb.)
-- =============================================
CREATE TABLE [Music].[Genres]
(
    GenreID INT IDENTITY(1,1) NOT NULL,
    Name NVARCHAR(50) NOT NULL,
    
    -- Primary Key
    CONSTRAINT PK_Genres PRIMARY KEY CLUSTERED (GenreID ASC),
    
    -- Unique Constraint
    CONSTRAINT UQ_Genres_Name UNIQUE (Name)
);
GO

PRINT 'Music.Genres tablosu oluşturuldu.';
GO

-- =============================================
-- Table: Music.Albums
-- Açıklama: Albüm/EP/Playlist koleksiyonları
-- =============================================
CREATE TABLE [Music].[Albums]
(
    AlbumID INT IDENTITY(1,1) NOT NULL,
    ArtistID INT NOT NULL,
    Title NVARCHAR(200) NOT NULL,
    CoverImageUrl NVARCHAR(500) NULL,
    ReleaseDate DATE NULL,
    Description NVARCHAR(MAX) NULL,
    CreatedAt DATETIME2(7) NOT NULL DEFAULT GETDATE(),
    
    -- Primary Key
    CONSTRAINT PK_Albums PRIMARY KEY CLUSTERED (AlbumID ASC),
    
    -- Foreign Key
    CONSTRAINT FK_Albums_Artist FOREIGN KEY (ArtistID)
        REFERENCES [Identity].[Users](UserID)
        ON DELETE CASCADE -- Sanatçı silinirse albümleri de silinir
);
GO

-- Index: Sanatçıya göre albümleri listele
CREATE NONCLUSTERED INDEX IX_Albums_ArtistID 
ON [Music].[Albums] (ArtistID);
GO

PRINT 'Music.Albums tablosu oluşturuldu.';
GO

-- =============================================
-- Table: Music.Tracks
-- Açıklama: Şarkı/Track detayları ve metadata
-- =============================================
CREATE TABLE [Music].[Tracks]
(
    TrackID INT IDENTITY(1,1) NOT NULL,
    ArtistID INT NOT NULL,
    AlbumID INT NULL, -- Single'lar için NULL olabilir
    GenreID INT NOT NULL,
    Title NVARCHAR(200) NOT NULL,
    Slug NVARCHAR(250) NOT NULL, -- URL dostu: "trap-beat-2024"
    AudioUrl NVARCHAR(500) NOT NULL, -- Dosya yolu veya CDN URL
    DurationSeconds INT NOT NULL,
    WaveformData NVARCHAR(MAX) NULL, -- JSON formatında waveform amplitüd değerleri
    UploadDate DATETIME2(7) NOT NULL DEFAULT GETDATE(),
    IsPublic BIT NOT NULL DEFAULT 1, -- Gizli/Public durumu
    PlayCount INT NOT NULL DEFAULT 0, -- Cache için (Interaction.Plays'ten hesaplanır)
    
    -- Primary Key
    CONSTRAINT PK_Tracks PRIMARY KEY CLUSTERED (TrackID ASC),
    
    -- Foreign Keys
    CONSTRAINT FK_Tracks_Artist FOREIGN KEY (ArtistID)
        REFERENCES [Identity].[Users](UserID)
        ON DELETE NO ACTION, -- Sanatçı silinemez eğer şarkısı varsa (koruma)
    
    CONSTRAINT FK_Tracks_Album FOREIGN KEY (AlbumID)
        REFERENCES [Music].[Albums](AlbumID)
        ON DELETE SET NULL, -- Albüm silinirse şarkı kalır ama albüm bilgisi NULL olur
    
    CONSTRAINT FK_Tracks_Genre FOREIGN KEY (GenreID)
        REFERENCES [Music].[Genres](GenreID)
        ON DELETE NO ACTION, -- Tür silinemez eğer şarkı varsa
    
    -- Unique Constraint
    CONSTRAINT UQ_Tracks_Slug UNIQUE (Slug),
    
    -- Check Constraints
    CONSTRAINT CK_Tracks_Duration CHECK (DurationSeconds > 0),
    CONSTRAINT CK_Tracks_PlayCount CHECK (PlayCount >= 0)
);
GO

-- Index: Sanatçının şarkılarını listele
CREATE NONCLUSTERED INDEX IX_Tracks_ArtistID 
ON [Music].[Tracks] (ArtistID);
GO

-- Index: Albümdeki şarkıları listele
CREATE NONCLUSTERED INDEX IX_Tracks_AlbumID 
ON [Music].[Tracks] (AlbumID);
GO

-- Index: Türe göre şarkı ara
CREATE NONCLUSTERED INDEX IX_Tracks_GenreID 
ON [Music].[Tracks] (GenreID);
GO

-- Index: Public şarkıları sırala (En popüler vb.)
CREATE NONCLUSTERED INDEX IX_Tracks_IsPublic_PlayCount 
ON [Music].[Tracks] (IsPublic, PlayCount DESC);
GO

-- Index: Slug ile şarkı sayfası
CREATE NONCLUSTERED INDEX IX_Tracks_Slug 
ON [Music].[Tracks] (Slug);
GO

PRINT 'Music.Tracks tablosu oluşturuldu.';
GO
