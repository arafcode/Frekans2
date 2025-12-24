
CREATE PROCEDURE [Music].[sp_RemoveFromPlaylist]
    @PlaylistID INT,
    @TrackID INT,
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if user owns the playlist
    IF NOT EXISTS (SELECT 1 FROM [Music].[Playlists] WHERE PlaylistID = @PlaylistID AND UserID = @UserID)
    BEGIN
        RAISERROR('Bu Ã§alma listesinden Ã§Ä±karma yetkiniz yok.', 16, 1);
        RETURN;
    END
    
    -- Remove track from playlist
    DELETE FROM [Music].[PlaylistTracks]
    WHERE PlaylistID = @PlaylistID AND TrackID = @TrackID;
    
    -- Update playlist's UpdatedDate
    UPDATE [Music].[Playlists]
    SET UpdatedDate = GETDATE()
    WHERE PlaylistID = @PlaylistID;
    
    SELECT 'ÅarkÄ± Ã§alma listesinden Ã§Ä±karÄ±ldÄ±.' AS Message;
END;
