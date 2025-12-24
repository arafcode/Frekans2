
-- =============================================
-- SP 2: [Interaction].[sp_ToggleLike]
-- =============================================
-- AmaÃ§: BeÄŸeni durumunu toggle etme (Like/Unlike)
-- MantÄ±k: Daha Ã¶nce beÄŸendiyse sil, beÄŸenmediyse ekle
-- =============================================
-- Ã–rnek Ã‡aÄŸrÄ±:
--   EXEC [Interaction].[sp_ToggleLike] 
--        @UserID = 5, 
--        @TrackID = 42;
-- =============================================
CREATE   PROCEDURE [Interaction].[sp_ToggleLike]
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
        
        -- KullanÄ±cÄ± bu ÅŸarkÄ±yÄ± daha Ã¶nce beÄŸenmiÅŸ mi kontrol et
        IF EXISTS (
            SELECT 1 
            FROM [Interaction].[Likes] 
            WHERE UserID = @UserID AND TrackID = @TrackID
        )
        BEGIN
            -- UNLIKE: BeÄŸeni kaydÄ±nÄ± sil
            DELETE FROM [Interaction].[Likes]
            WHERE UserID = @UserID AND TrackID = @TrackID;
            
            SET @IsLiked = 0;
            SET @ActionTaken = 'UNLIKED';
        END
        ELSE
        BEGIN
            -- LIKE: Yeni beÄŸeni kaydÄ± ekle
            INSERT INTO [Interaction].[Likes] (UserID, TrackID, LikedAt)
            VALUES (@UserID, @TrackID, GETDATE());
            
            SET @IsLiked = 1;
            SET @ActionTaken = 'LIKED';
        END
        
        -- GÃ¼ncel toplam beÄŸeni sayÄ±sÄ±nÄ± hesapla
        SELECT @CurrentLikeCount = COUNT(*)
        FROM [Interaction].[Likes]
        WHERE TrackID = @TrackID;
        
        COMMIT TRANSACTION;
        
        -- Sonucu dÃ¶ndÃ¼r (Frontend iÃ§in)
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
        
        -- Hata mesajÄ± dÃ¶ndÃ¼r
        SELECT 
            @TrackID AS TrackID,
            @UserID AS UserID,
            0 AS IsLiked,
            'ERROR' AS Action,
            0 AS TotalLikes,
            ERROR_MESSAGE() AS Status;
    END CATCH
END
