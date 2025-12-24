
-- =============================================
-- SP 1: [Music].[sp_UploadTrack]
-- =============================================
-- AmaÃ§: Yeni ÅŸarkÄ± yÃ¼kleme iÅŸlemi
-- KullanÄ±m: Backend'den ÅŸarkÄ± upload formu submit edildiÄŸinde
-- =============================================
-- Ã–rnek Ã‡aÄŸrÄ±:
--   EXEC [Music].[sp_UploadTrack] 
--        @UserID = 1, 
--        @Title = 'Summer Vibes', 
--        @GenreID = 2, 
--        @AlbumID = NULL, 
--        @AudioUrl = 'https://cdn.example.com/tracks/summer-vibes.mp3',
--        @DurationSeconds = 180;
-- =============================================
CREATE   PROCEDURE [Music].[sp_UploadTrack]
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
        
        -- Slug oluÅŸtur (Title'dan URL-friendly string)
        DECLARE @Slug NVARCHAR(250);
        DECLARE @BaseSlug NVARCHAR(250);
        DECLARE @Counter INT = 1;
        
        -- TÃ¼rkÃ§e karakterleri deÄŸiÅŸtir ve slug'a dÃ¶nÃ¼ÅŸtÃ¼r
        SET @BaseSlug = LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
            REPLACE(@Title, ' ', '-'), 'Ä±', 'i'), 'ÄŸ', 'g'), 'Ã¼', 'u'), 
            'ÅŸ', 's'), 'Ã¶', 'o'), 'Ã§', 'c'));
        
        -- Ã–zel karakterleri temizle (sadece harf, rakam, tire)
        SET @BaseSlug = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
            @BaseSlug, '!', ''), '?', ''), '.', ''), ',', ''), 
            '''', ''), '"', '');
        
        SET @Slug = @BaseSlug;
        
        -- EÄŸer aynÄ± slug varsa sonuna sayÄ± ekle (-2, -3, vb.)
        WHILE EXISTS (SELECT 1 FROM [Music].[Tracks] WHERE Slug = @Slug)
        BEGIN
            SET @Slug = @BaseSlug + '-' + CAST(@Counter AS NVARCHAR(10));
            SET @Counter = @Counter + 1;
        END
        
        -- ÅarkÄ±yÄ± ekle
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
            GETDATE(), -- Åu anki zaman
            1, -- VarsayÄ±lan olarak public
            0  -- BaÅŸlangÄ±Ã§ play count
        );
        
        -- Yeni eklenen TrackID'yi dÃ¶ndÃ¼r
        DECLARE @NewTrackID INT = SCOPE_IDENTITY();
        
        COMMIT TRANSACTION;
        
        -- BaÅŸarÄ± mesajÄ± ve TrackID dÃ¶ndÃ¼r
        SELECT 
            @NewTrackID AS TrackID,
            @Slug AS Slug,
            'SUCCESS' AS Status,
            'ÅarkÄ± baÅŸarÄ±yla yÃ¼klendi.' AS Message;
            
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        -- Hata mesajÄ± dÃ¶ndÃ¼r
        SELECT 
            0 AS TrackID,
            '' AS Slug,
            'ERROR' AS Status,
            ERROR_MESSAGE() AS Message;
    END CATCH
END
