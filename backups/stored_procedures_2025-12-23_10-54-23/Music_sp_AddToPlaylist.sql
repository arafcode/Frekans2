
CREATE PROCEDURE [Music].[sp_AddToPlaylist]
    @PlaylistID INT,
    @TrackID INT,
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if user owns the playlist
    IF NOT EXISTS (SELECT 1 FROM [Music].[Playlists] WHERE PlaylistID = @PlaylistID AND UserID = @UserID)
    BEGIN
        RAISERROR('Bu Ã§alma listesine ekleme yetkiniz yok.', 16, 1);
        RETURN;
    END
    
    -- Check if track already in playlist
    IF EXISTS (SELECT 1 FROM [Music].[PlaylistTracks] WHERE PlaylistID = @PlaylistID AND TrackID = @TrackID)
    BEGIN
        RAISERROR('Bu ÅŸarkÄ± zaten listede mevcut.', 16, 1);
        RETURN;
    END
    
    -- Get next order number
    DECLARE @NextOrder INT;
    SELECT @NextOrder = ISNULL(MAX(TrackOrder), 0) + 1
    FROM [Music].[PlaylistTracks]
    WHERE PlaylistID = @PlaylistID;
    
    -- Add track to playlist
    INSERT INTO [Music].[PlaylistTracks] (PlaylistID, TrackID, TrackOrder)
    VALUES (@PlaylistID, @TrackID, @NextOrder);
    
    -- Update playlist's UpdatedDate
    UPDATE [Music].[Playlists]
    SET UpdatedDate = GETDATE()
    WHERE PlaylistID = @PlaylistID;
    
    SELECT 'ÅarkÄ± Ã§alma listesine eklendi.' AS Message;
END;
