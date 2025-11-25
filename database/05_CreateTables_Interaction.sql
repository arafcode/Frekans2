-- =============================================
-- SoundCloud Clone - Interaction Schema Tables
-- =============================================
-- Kullanıcı etkileşimleri: Dinleme, Beğeni, Yorum, Takip
-- =============================================

USE FrekansDB;
GO

-- =============================================
-- Table: Interaction.Plays
-- Açıklama: Şarkı dinleme kayıtları (Analytics için)
-- =============================================
CREATE TABLE [Interaction].[Plays]
(
    PlayID BIGINT IDENTITY(1,1) NOT NULL, -- BIGINT çünkü milyonlarca kayıt olabilir
    TrackID INT NOT NULL,
    UserID INT NULL, -- Misafir kullanıcılar için NULL olabilir
    PlayedAt DATETIME2(7) NOT NULL DEFAULT GETDATE(),
    
    -- Primary Key
    CONSTRAINT PK_Plays PRIMARY KEY CLUSTERED (PlayID ASC),
    
    -- Foreign Keys
    CONSTRAINT FK_Plays_Track FOREIGN KEY (TrackID)
        REFERENCES [Music].[Tracks](TrackID)
        ON DELETE CASCADE, -- Şarkı silinirse dinleme kayıtları da silinir
    
    CONSTRAINT FK_Plays_User FOREIGN KEY (UserID)
        REFERENCES [Identity].[Users](UserID)
        ON DELETE SET NULL -- Kullanıcı silinirse dinleme kayıtları kalır (istatistik için)
);
GO

-- Index: Şarkının dinlenme geçmişi
CREATE NONCLUSTERED INDEX IX_Plays_TrackID_PlayedAt 
ON [Interaction].[Plays] (TrackID, PlayedAt DESC);
GO

-- Index: Kullanıcının dinleme geçmişi
CREATE NONCLUSTERED INDEX IX_Plays_UserID_PlayedAt 
ON [Interaction].[Plays] (UserID, PlayedAt DESC);
GO

PRINT 'Interaction.Plays tablosu oluşturuldu.';
GO

-- =============================================
-- Table: Interaction.Likes
-- Açıklama: Şarkı beğenileri (Kalp ikonu)
-- =============================================
CREATE TABLE [Interaction].[Likes]
(
    LikeID INT IDENTITY(1,1) NOT NULL,
    UserID INT NOT NULL,
    TrackID INT NOT NULL,
    LikedAt DATETIME2(7) NOT NULL DEFAULT GETDATE(),
    
    -- Primary Key
    CONSTRAINT PK_Likes PRIMARY KEY CLUSTERED (LikeID ASC),
    
    -- Foreign Keys
    CONSTRAINT FK_Likes_User FOREIGN KEY (UserID)
        REFERENCES [Identity].[Users](UserID)
        ON DELETE CASCADE, -- Kullanıcı silinirse beğenileri de silinir
    
    CONSTRAINT FK_Likes_Track FOREIGN KEY (TrackID)
        REFERENCES [Music].[Tracks](TrackID)
        ON DELETE CASCADE, -- Şarkı silinirse beğenileri de silinir
    
    -- Unique Constraint: Bir kullanıcı aynı şarkıyı sadece 1 kez beğenebilir
    CONSTRAINT UQ_Likes_User_Track UNIQUE (UserID, TrackID)
);
GO

-- Index: Kullanıcının beğendiği şarkılar
CREATE NONCLUSTERED INDEX IX_Likes_UserID_LikedAt 
ON [Interaction].[Likes] (UserID, LikedAt DESC);
GO

-- Index: Şarkının beğeni sayısı
CREATE NONCLUSTERED INDEX IX_Likes_TrackID 
ON [Interaction].[Likes] (TrackID);
GO

PRINT 'Interaction.Likes tablosu oluşturuldu.';
GO

-- =============================================
-- Table: Interaction.Comments
-- Açıklama: Şarkılara yapılan yorumlar (Zaman damgalı - SoundCloud özelliği)
-- =============================================
CREATE TABLE [Interaction].[Comments]
(
    CommentID INT IDENTITY(1,1) NOT NULL,
    UserID INT NOT NULL,
    TrackID INT NOT NULL,
    Content NVARCHAR(500) NOT NULL, -- Yorum metni
    TimestampSeconds INT NULL, -- Şarkının kaçıncı saniyesine yorum yapıldı (NULL = Genel yorum)
    PostedAt DATETIME2(7) NOT NULL DEFAULT GETDATE(),
    
    -- Primary Key
    CONSTRAINT PK_Comments PRIMARY KEY CLUSTERED (CommentID ASC),
    
    -- Foreign Keys
    CONSTRAINT FK_Comments_User FOREIGN KEY (UserID)
        REFERENCES [Identity].[Users](UserID)
        ON DELETE CASCADE, -- Kullanıcı silinirse yorumları da silinir
    
    CONSTRAINT FK_Comments_Track FOREIGN KEY (TrackID)
        REFERENCES [Music].[Tracks](TrackID)
        ON DELETE CASCADE, -- Şarkı silinirse yorumları da silinir
    
    -- Check Constraints
    CONSTRAINT CK_Comments_Content CHECK (LEN(Content) > 0),
    CONSTRAINT CK_Comments_Timestamp CHECK (TimestampSeconds >= 0)
);
GO

-- Index: Şarkının yorumlarını listele (Zaman sıralı)
CREATE NONCLUSTERED INDEX IX_Comments_TrackID_TimestampSeconds 
ON [Interaction].[Comments] (TrackID, TimestampSeconds ASC);
GO

-- Index: Kullanıcının yorumları
CREATE NONCLUSTERED INDEX IX_Comments_UserID_PostedAt 
ON [Interaction].[Comments] (UserID, PostedAt DESC);
GO

PRINT 'Interaction.Comments tablosu oluşturuldu.';
GO

-- =============================================
-- Table: Interaction.Follows
-- Açıklama: Kullanıcıların birbirini takip sistemi
-- =============================================
CREATE TABLE [Interaction].[Follows]
(
    FollowerID INT NOT NULL, -- Takip eden
    FollowingID INT NOT NULL, -- Takip edilen
    FollowDate DATETIME2(7) NOT NULL DEFAULT GETDATE(),
    
    -- Primary Key: Composite Key
    CONSTRAINT PK_Follows PRIMARY KEY CLUSTERED (FollowerID, FollowingID),
    
    -- Foreign Keys
    CONSTRAINT FK_Follows_Follower FOREIGN KEY (FollowerID)
        REFERENCES [Identity].[Users](UserID)
        ON DELETE NO ACTION, -- Cascade döngüsü olmasın diye NO ACTION
    
    CONSTRAINT FK_Follows_Following FOREIGN KEY (FollowingID)
        REFERENCES [Identity].[Users](UserID)
        ON DELETE NO ACTION, -- Cascade döngüsü olmasın diye NO ACTION
    
    -- Check Constraint: Kullanıcı kendini takip edemez
    CONSTRAINT CK_Follows_NoSelfFollow CHECK (FollowerID != FollowingID)
);
GO

-- Index: Kullanıcının takip ettikleri
CREATE NONCLUSTERED INDEX IX_Follows_FollowerID 
ON [Interaction].[Follows] (FollowerID);
GO

-- Index: Kullanıcının takipçileri
CREATE NONCLUSTERED INDEX IX_Follows_FollowingID 
ON [Interaction].[Follows] (FollowingID);
GO

PRINT 'Interaction.Follows tablosu oluşturuldu.';
GO

-- =============================================
-- Tüm tablolar başarıyla oluşturuldu
-- =============================================
PRINT '';
PRINT '========================================';
PRINT 'SoundCloud Clone Veritabanı Tamamlandı!';
PRINT '========================================';
PRINT 'Toplam 3 Schema:';
PRINT '  - Identity (1 tablo)';
PRINT '  - Music (3 tablo)';
PRINT '  - Interaction (4 tablo)';
PRINT '';
PRINT 'Toplam 8 Tablo Oluşturuldu.';
PRINT '========================================';
GO
