-- =============================================
-- SoundCloud Clone - Performance Optimization
-- =============================================
-- İndeksler ve View'lar ile sorgu performansı iyileştirme
-- 50.000+ kayıt için optimize edilmiş
-- =============================================

USE FrekansDB;
GO

-- =============================================
-- BÖLÜM 1: NON-CLUSTERED INDEX'LER
-- =============================================
-- Amaç: Şarkı aramaları ve filtreleme işlemlerini hızlandırmak
-- =============================================

PRINT 'Non-Clustered Index''ler oluşturuluyor...';
GO

-- Index 1: Şarkı başlığına göre arama (LIKE '%trap%' sorguları için)
-- Kullanım: Ana sayfada arama kutusu, autocomplete
CREATE NONCLUSTERED INDEX IX_Tracks_Title
ON [Music].[Tracks] (Title);
GO

PRINT '✓ IX_Tracks_Title oluşturuldu (Şarkı aramaları için)';
GO

-- Index 2: Türe göre filtreleme (Genre dropdown, kategori sayfaları)
-- Not: Zaten mevcutsa DROP ve yeniden oluştur
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Tracks_GenreID' AND object_id = OBJECT_ID('[Music].[Tracks]'))
BEGIN
    DROP INDEX IX_Tracks_GenreID ON [Music].[Tracks];
    PRINT '⚠ Mevcut IX_Tracks_GenreID kaldırıldı';
END
GO

CREATE NONCLUSTERED INDEX IX_Tracks_GenreID
ON [Music].[Tracks] (GenreID)
INCLUDE (Title, AudioUrl, DurationSeconds, PlayCount);
GO

PRINT '✓ IX_Tracks_GenreID oluşturuldu (Tür bazlı filtreleme için)';
GO

-- Index 3: Sanatçı profilindeki şarkı listesi (Artist profile page)
-- Not: Zaten mevcutsa DROP ve yeniden oluştur
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Tracks_ArtistID' AND object_id = OBJECT_ID('[Music].[Tracks]'))
BEGIN
    DROP INDEX IX_Tracks_ArtistID ON [Music].[Tracks];
    PRINT '⚠ Mevcut IX_Tracks_ArtistID kaldırıldı';
END
GO

CREATE NONCLUSTERED INDEX IX_Tracks_ArtistID
ON [Music].[Tracks] (ArtistID)
INCLUDE (Title, AudioUrl, DurationSeconds, AlbumID, UploadDate)
WHERE IsPublic = 1; -- Sadece public şarkılar için (Filtered Index)
GO

PRINT '✓ IX_Tracks_ArtistID oluşturuldu (Sanatçı profili için)';
GO

PRINT '';
PRINT '========================================';
PRINT 'Tüm Index''ler başarıyla oluşturuldu!';
PRINT '========================================';
GO

-- =============================================
-- BÖLÜM 2: VIEW'LAR (GÖRÜNÜMLER)
-- =============================================
-- Amaç: Frontend için karmaşık JOIN sorgularını basitleştirmek
-- =============================================

PRINT '';
PRINT 'View''lar oluşturuluyor...';
GO

-- =============================================
-- View 1: vw_TrackCardDetails
-- Amaç: Ana sayfadaki şarkı kartları için tek satırda tüm veri
-- =============================================
-- Kullanım: 
--   SELECT * FROM [Music].[vw_TrackCardDetails] WHERE IsPublic = 1 ORDER BY TotalPlays DESC;
-- =============================================
CREATE OR ALTER VIEW [Music].[vw_TrackCardDetails]
AS
SELECT 
    t.TrackID,
    t.Title,
    t.AudioUrl,
    t.DurationSeconds AS Duration,
    t.UploadDate,
    t.IsPublic,
    t.Slug,
    
    -- Albüm bilgisi (Cover image için)
    ISNULL(a.CoverImageUrl, '') AS CoverImageUrl,
    ISNULL(a.Title, 'Single') AS AlbumTitle,
    
    -- Sanatçı bilgisi (User tablosundan)
    u.Username AS ArtistName,
    u.AvatarUrl AS ArtistAvatar,
    u.IsVerified AS ArtistIsVerified,
    
    -- Tür bilgisi
    g.Name AS GenreName,
    
    -- Toplam dinlenme sayısı (Interaction.Plays tablosundan COUNT)
    ISNULL((
        SELECT COUNT(*) 
        FROM [Interaction].[Plays] p 
        WHERE p.TrackID = t.TrackID
    ), 0) AS TotalPlays,
    
    -- Toplam beğeni sayısı (Interaction.Likes tablosundan COUNT)
    ISNULL((
        SELECT COUNT(*) 
        FROM [Interaction].[Likes] l 
        WHERE l.TrackID = t.TrackID
    ), 0) AS TotalLikes,
    
    -- Toplam yorum sayısı
    ISNULL((
        SELECT COUNT(*) 
        FROM [Interaction].[Comments] c 
        WHERE c.TrackID = t.TrackID
    ), 0) AS TotalComments

FROM [Music].[Tracks] t
INNER JOIN [Identity].[Users] u ON t.ArtistID = u.UserID
INNER JOIN [Music].[Genres] g ON t.GenreID = g.GenreID
LEFT JOIN [Music].[Albums] a ON t.AlbumID = a.AlbumID;
GO

PRINT '✓ [Music].[vw_TrackCardDetails] oluşturuldu';
PRINT '  Kullanım: Ana sayfa şarkı kartları, arama sonuçları';
GO

-- =============================================
-- View 2: vw_TopCharts
-- Amaç: En çok dinlenen şarkılar listesi (Top 50)
-- =============================================
-- Kullanım: 
--   SELECT * FROM [Interaction].[vw_TopCharts];
-- =============================================
CREATE OR ALTER VIEW [Interaction].[vw_TopCharts]
AS
SELECT TOP 50
    t.TrackID,
    t.Title,
    t.AudioUrl,
    t.DurationSeconds AS Duration,
    t.Slug,
    
    -- Albüm kapağı
    ISNULL(a.CoverImageUrl, '') AS CoverImageUrl,
    
    -- Sanatçı bilgisi
    u.Username AS ArtistName,
    u.AvatarUrl AS ArtistAvatar,
    u.IsVerified AS ArtistIsVerified,
    
    -- Tür
    g.Name AS GenreName,
    
    -- Dinlenme sayısı (Plays tablosundan gerçek zamanlı COUNT)
    (
        SELECT COUNT(*) 
        FROM [Interaction].[Plays] p 
        WHERE p.TrackID = t.TrackID
    ) AS TotalPlays,
    
    -- Beğeni sayısı
    (
        SELECT COUNT(*) 
        FROM [Interaction].[Likes] l 
        WHERE l.TrackID = t.TrackID
    ) AS TotalLikes,
    
    -- Sıralama için ranking
    ROW_NUMBER() OVER (ORDER BY (
        SELECT COUNT(*) 
        FROM [Interaction].[Plays] p 
        WHERE p.TrackID = t.TrackID
    ) DESC) AS ChartPosition

FROM [Music].[Tracks] t
INNER JOIN [Identity].[Users] u ON t.ArtistID = u.UserID
INNER JOIN [Music].[Genres] g ON t.GenreID = g.GenreID
LEFT JOIN [Music].[Albums] a ON t.AlbumID = a.AlbumID

WHERE t.IsPublic = 1 -- Sadece public şarkılar

ORDER BY TotalPlays DESC;
GO

PRINT '✓ [Interaction].[vw_TopCharts] oluşturuldu';
PRINT '  Kullanım: En çok dinlenenler sayfası (Top 50 chart)';
GO

PRINT '';
PRINT '========================================';
PRINT 'Tüm View''lar başarıyla oluşturuldu!';
PRINT '========================================';
PRINT '';
PRINT '📊 ÖZET:';
PRINT '  • 3 Adet Non-Clustered Index';
PRINT '  • 2 Adet View (vw_TrackCardDetails, vw_TopCharts)';
PRINT '';
PRINT '🚀 Performans iyileştirmeleri aktif!';
PRINT '========================================';
GO
