
CREATE PROCEDURE [Music].[sp_DeletePlaylist]
    @PlaylistID INT,
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if user owns the playlist
    IF NOT EXISTS (SELECT 1 FROM [Music].[Playlists] WHERE PlaylistID = @PlaylistID AND UserID = @UserID)
    BEGIN
        RAISERROR('Bu Ã§alma listesini silme yetkiniz yok.', 16, 1);
        RETURN;
    END
    
    DELETE FROM [Music].[Playlists]
    WHERE PlaylistID = @PlaylistID;
    
    SELECT 'Ã‡alma listesi silindi.' AS Message;
END;
