
CREATE PROCEDURE [Music].[sp_UpdatePlaylist]
    @PlaylistID INT,
    @UserID INT,
    @Name NVARCHAR(200) = NULL,
    @Description NVARCHAR(500) = NULL,
    @CoverImageUrl NVARCHAR(500) = NULL,
    @IsPublic BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if user owns the playlist
    IF NOT EXISTS (SELECT 1 FROM [Music].[Playlists] WHERE PlaylistID = @PlaylistID AND UserID = @UserID)
    BEGIN
        RAISERROR('Bu Ã§alma listesini gÃ¼ncelleme yetkiniz yok.', 16, 1);
        RETURN;
    END
    
    UPDATE [Music].[Playlists]
    SET 
        Name = ISNULL(@Name, Name),
        Description = ISNULL(@Description, Description),
        CoverImageUrl = ISNULL(@CoverImageUrl, CoverImageUrl),
        IsPublic = ISNULL(@IsPublic, IsPublic),
        UpdatedDate = GETDATE()
    WHERE PlaylistID = @PlaylistID;
    
    SELECT 
        PlaylistID,
        UserID,
        Name,
        Description,
        CoverImageUrl,
        IsPublic,
        CreatedDate,
        UpdatedDate
    FROM [Music].[Playlists]
    WHERE PlaylistID = @PlaylistID;
END;
