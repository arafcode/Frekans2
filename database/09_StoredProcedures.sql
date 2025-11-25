-- =============================================
-- SoundCloud Clone - Stored Procedures
-- =============================================
-- Backend için güvenli veritabanı işlemleri
-- Cursor ile trend analizi (Ders 4 gereksinimi)
-- =============================================

USE FrekansDB;
GO

-- =============================================
-- Schema Oluştur: Analysis (Trend analizi için)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'Analysis')
BEGIN
    EXEC('CREATE SCHEMA [Analysis]');
    PRINT 'Analysis şeması oluşturuldu.';
END
GO

PRINT '';
PRINT '========================================';
PRINT 'STORED PROCEDURE''LER OLUŞTURULUYOR...';
PRINT '========================================';
GO

-- =============================================
-- SP 1: [Music].[sp_UploadTrack]
-- =============================================
-- Amaç: Yeni şarkı yükleme işlemi
-- Kullanım: Backend'den şarkı upload formu submit edildiğinde
-- =============================================
-- Örnek Çağrı:
--   EXEC [Music].[sp_UploadTrack] 
--        @UserID = 1, 
--        @Title = 'Summer Vibes', 
--        @GenreID = 2, 
--        @AlbumID = NULL, 
--        @AudioUrl = 'https://cdn.example.com/tracks/summer-vibes.mp3',
--        @DurationSeconds = 180;
-- =============================================
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
        
        -- Slug oluştur (Title'dan URL-friendly string)
        DECLARE @Slug NVARCHAR(250);
        DECLARE @BaseSlug NVARCHAR(250);
        DECLARE @Counter INT = 1;
        
        -- Türkçe karakterleri değiştir ve slug'a dönüştür
        SET @BaseSlug = LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
            REPLACE(@Title, ' ', '-'), 'ı', 'i'), 'ğ', 'g'), 'ü', 'u'), 
            'ş', 's'), 'ö', 'o'), 'ç', 'c'));
        
        -- Özel karakterleri temizle (sadece harf, rakam, tire)
        SET @BaseSlug = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
            @BaseSlug, '!', ''), '?', ''), '.', ''), ',', ''), 
            '''', ''), '"', '');
        
        SET @Slug = @BaseSlug;
        
        -- Eğer aynı slug varsa sonuna sayı ekle (-2, -3, vb.)
        WHILE EXISTS (SELECT 1 FROM [Music].[Tracks] WHERE Slug = @Slug)
        BEGIN
            SET @Slug = @BaseSlug + '-' + CAST(@Counter AS NVARCHAR(10));
            SET @Counter = @Counter + 1;
        END
        
        -- Şarkıyı ekle
        INSERT INTO [Music].[Tracks] 
        (
            ArtistID, 
            Title, 
            GenreID, 
            AlbumID, 
            AudioUrl, 
            DurationSeconds,
            Slug,
            UploadDate,
            IsPublic,
            PlayCount
        )
        VALUES 
        (
            @UserID,
            @Title,
            @GenreID,
            @AlbumID,
            @AudioUrl,
            @DurationSeconds,
            @Slug,
            GETDATE(), -- Şu anki zaman
            1, -- Varsayılan olarak public
            0  -- Başlangıç play count
        );
        
        -- Yeni eklenen TrackID'yi döndür
        DECLARE @NewTrackID INT = SCOPE_IDENTITY();
        
        COMMIT TRANSACTION;
        
        -- Başarı mesajı ve TrackID döndür
        SELECT 
            @NewTrackID AS TrackID,
            @Slug AS Slug,
            'SUCCESS' AS Status,
            'Şarkı başarıyla yüklendi.' AS Message;
            
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        -- Hata mesajı döndür
        SELECT 
            0 AS TrackID,
            '' AS Slug,
            'ERROR' AS Status,
            ERROR_MESSAGE() AS Message;
    END CATCH
END
GO

PRINT '✓ [Music].[sp_UploadTrack] oluşturuldu';
GO

-- =============================================
-- SP 2: [Interaction].[sp_ToggleLike]
-- =============================================
-- Amaç: Beğeni durumunu toggle etme (Like/Unlike)
-- Mantık: Daha önce beğendiyse sil, beğenmediyse ekle
-- =============================================
-- Örnek Çağrı:
--   EXEC [Interaction].[sp_ToggleLike] 
--        @UserID = 5, 
--        @TrackID = 42;
-- =============================================
CREATE OR ALTER PROCEDURE [Interaction].[sp_ToggleLike]
    @UserID INT,
    @TrackID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @IsLiked BIT;
        DECLARE @ActionTaken NVARCHAR(50);
        DECLARE @CurrentLikeCount INT;
        
        -- Kullanıcı bu şarkıyı daha önce beğenmiş mi kontrol et
        IF EXISTS (
            SELECT 1 
            FROM [Interaction].[Likes] 
            WHERE UserID = @UserID AND TrackID = @TrackID
        )
        BEGIN
            -- UNLIKE: Beğeni kaydını sil
            DELETE FROM [Interaction].[Likes]
            WHERE UserID = @UserID AND TrackID = @TrackID;
            
            SET @IsLiked = 0;
            SET @ActionTaken = 'UNLIKED';
        END
        ELSE
        BEGIN
            -- LIKE: Yeni beğeni kaydı ekle
            INSERT INTO [Interaction].[Likes] (UserID, TrackID, LikedAt)
            VALUES (@UserID, @TrackID, GETDATE());
            
            SET @IsLiked = 1;
            SET @ActionTaken = 'LIKED';
        END
        
        -- Güncel toplam beğeni sayısını hesapla
        SELECT @CurrentLikeCount = COUNT(*)
        FROM [Interaction].[Likes]
        WHERE TrackID = @TrackID;
        
        COMMIT TRANSACTION;
        
        -- Sonucu döndür (Frontend için)
        SELECT 
            @TrackID AS TrackID,
            @UserID AS UserID,
            @IsLiked AS IsLiked,
            @ActionTaken AS Action,
            @CurrentLikeCount AS TotalLikes,
            'SUCCESS' AS Status;
            
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        -- Hata mesajı döndür
        SELECT 
            @TrackID AS TrackID,
            @UserID AS UserID,
            0 AS IsLiked,
            'ERROR' AS Action,
            0 AS TotalLikes,
            ERROR_MESSAGE() AS Status;
    END CATCH
END
GO

PRINT '✓ [Interaction].[sp_ToggleLike] oluşturuldu';
GO

-- =============================================
-- SP 3: [Analysis].[sp_CalculateArtistTrendScore]
-- =============================================
-- Amaç: CURSOR kullanarak tüm sanatçıların trend skorunu hesapla
-- Senaryo: Gece çalışan batch job (Admin panel için)
-- Formül: TrendScore = (TotalPlays * 1) + (TotalLikes * 5)
-- =============================================
-- Örnek Çağrı:
--   EXEC [Analysis].[sp_CalculateArtistTrendScore];
-- =============================================
CREATE OR ALTER PROCEDURE [Analysis].[sp_CalculateArtistTrendScore]
AS
BEGIN
    SET NOCOUNT ON;
    
    PRINT '';
    PRINT '========================================';
    PRINT '🔥 TREND SANATÇI ANALİZİ BAŞLIYOR...';
    PRINT '========================================';
    PRINT '';
    
    -- Değişkenler
    DECLARE @ArtistID INT;
    DECLARE @ArtistName NVARCHAR(50);
    DECLARE @TotalPlays BIGINT;
    DECLARE @TotalLikes INT;
    DECLARE @TrendScore BIGINT;
    DECLARE @ArtistCount INT = 0;
    
    -- CURSOR tanımla: Şarkısı olan tüm sanatçıları getir
    DECLARE artist_cursor CURSOR FOR
    SELECT DISTINCT 
        u.UserID,
        u.Username
    FROM [Identity].[Users] u
    INNER JOIN [Music].[Tracks] t ON u.UserID = t.ArtistID
    WHERE t.IsPublic = 1
    ORDER BY u.Username;
    
    -- Geçici sonuç tablosu oluştur
    IF OBJECT_ID('tempdb..#TrendResults') IS NOT NULL
        DROP TABLE #TrendResults;
    
    CREATE TABLE #TrendResults
    (
        ArtistID INT,
        ArtistName NVARCHAR(50),
        TotalPlays BIGINT,
        TotalLikes INT,
        TrendScore BIGINT
    );
    
    -- Cursor'ı aç
    OPEN artist_cursor;
    
    -- İlk kaydı fetch et
    FETCH NEXT FROM artist_cursor INTO @ArtistID, @ArtistName;
    
    -- Tüm kayıtları döngüyle işle
    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @ArtistCount = @ArtistCount + 1;
        
        -- Bu sanatçının toplam dinlenme sayısını hesapla
        SELECT @TotalPlays = ISNULL(COUNT(*), 0)
        FROM [Interaction].[Plays] p
        INNER JOIN [Music].[Tracks] t ON p.TrackID = t.TrackID
        WHERE t.ArtistID = @ArtistID;
        
        -- Bu sanatçının toplam beğeni sayısını hesapla
        SELECT @TotalLikes = ISNULL(COUNT(*), 0)
        FROM [Interaction].[Likes] l
        INNER JOIN [Music].[Tracks] t ON l.TrackID = t.TrackID
        WHERE t.ArtistID = @ArtistID;
        
        -- Trend skoru hesapla: (Play * 1) + (Like * 5)
        SET @TrendScore = (@TotalPlays * 1) + (@TotalLikes * 5);
        
        -- Geçici tabloya ekle
        INSERT INTO #TrendResults (ArtistID, ArtistName, TotalPlays, TotalLikes, TrendScore)
        VALUES (@ArtistID, @ArtistName, @TotalPlays, @TotalLikes, @TrendScore);
        
        -- İlerleme raporu (Her 10 sanatçıda bir)
        IF @ArtistCount % 10 = 0
            PRINT '⏳ İşlenen sanatçı sayısı: ' + CAST(@ArtistCount AS NVARCHAR(10));
        
        -- Sonraki kaydı fetch et
        FETCH NEXT FROM artist_cursor INTO @ArtistID, @ArtistName;
    END
    
    -- Cursor'ı kapat ve bellekten temizle
    CLOSE artist_cursor;
    DEALLOCATE artist_cursor;
    
    PRINT '';
    PRINT '✅ Toplam ' + CAST(@ArtistCount AS NVARCHAR(10)) + ' sanatçı analiz edildi.';
    PRINT '';
    PRINT '========================================';
    PRINT '📊 TOP 20 TREND SANATÇI LİSTESİ';
    PRINT '========================================';
    PRINT '';
    
    -- Top 20 trend sanatçıyı göster
    SELECT TOP 20
        ROW_NUMBER() OVER (ORDER BY TrendScore DESC) AS [Sıra],
        ArtistName AS [Sanatçı],
        TotalPlays AS [Toplam Dinlenme],
        TotalLikes AS [Toplam Beğeni],
        TrendScore AS [Trend Skoru]
    FROM #TrendResults
    ORDER BY TrendScore DESC;
    
    PRINT '';
    PRINT '========================================';
    PRINT '🎯 DETAYLI İSTATİSTİKLER';
    PRINT '========================================';
    
    -- İstatistikler
    DECLARE @AvgTrendScore BIGINT;
    DECLARE @MaxTrendScore BIGINT;
    DECLARE @TopArtist NVARCHAR(50);
    
    SELECT 
        @AvgTrendScore = AVG(TrendScore),
        @MaxTrendScore = MAX(TrendScore)
    FROM #TrendResults;
    
    SELECT @TopArtist = ArtistName
    FROM #TrendResults
    WHERE TrendScore = @MaxTrendScore;
    
    PRINT '• Ortalama Trend Skoru: ' + CAST(@AvgTrendScore AS NVARCHAR(20));
    PRINT '• En Yüksek Trend Skoru: ' + CAST(@MaxTrendScore AS NVARCHAR(20));
    PRINT '• En Trend Sanatçı: ' + @TopArtist;
    PRINT '';
    PRINT '========================================';
    PRINT '✅ ANALİZ TAMAMLANDI!';
    PRINT '========================================';
    
    -- Geçici tabloyu temizle
    DROP TABLE #TrendResults;
END
GO

PRINT '✓ [Analysis].[sp_CalculateArtistTrendScore] oluşturuldu (CURSOR içerir)';
GO

PRINT '';
PRINT '========================================';
PRINT '✅ TÜM STORED PROCEDURE''LER OLUŞTURULDU!';
PRINT '========================================';
PRINT '';
PRINT '📦 ÖZET:';
PRINT '  • [Music].[sp_UploadTrack] - Şarkı yükleme';
PRINT '  • [Interaction].[sp_ToggleLike] - Beğeni toggle';
PRINT '  • [Analysis].[sp_CalculateArtistTrendScore] - Cursor ile trend analizi';
PRINT '';
PRINT '🔧 Kullanım Örnekleri:';
PRINT '  EXEC [Music].[sp_UploadTrack] @UserID=1, @Title=''Test'', @GenreID=2, @AudioUrl=''url'', @DurationSeconds=180;';
PRINT '  EXEC [Interaction].[sp_ToggleLike] @UserID=5, @TrackID=10;';
PRINT '  EXEC [Analysis].[sp_CalculateArtistTrendScore];';
PRINT '========================================';
GO
