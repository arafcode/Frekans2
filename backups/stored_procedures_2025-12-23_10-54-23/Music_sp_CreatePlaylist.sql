
CREATE PROCEDURE [Music].[sp_CreatePlaylist]
    @UserID INT,
    @Name NVARCHAR(200),
    @Description NVARCHAR(500) = NULL,
    @CoverImageUrl NVARCHAR(500) = NULL,
    @IsPublic BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO [Music].[Playlists] (UserID, Name, Description, CoverImageUrl, IsPublic)
    VALUES (@UserID, @Name, @Description, @CoverImageUrl, @IsPublic);
    
    DECLARE @PlaylistID INT = SCOPE_IDENTITY();
    
    SELECT 
        PlaylistID,
        UserID,
        Name,
        Description,
        CoverImageUrl,
        IsPublic,
        CreatedDate,
        UpdatedDate,
        0 AS TrackCount
    FROM [Music].[Playlists]
    WHERE PlaylistID = @PlaylistID;
END;
