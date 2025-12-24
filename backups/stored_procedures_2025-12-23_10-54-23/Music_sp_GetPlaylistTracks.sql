
CREATE PROCEDURE [Music].[sp_GetPlaylistTracks]
    @PlaylistID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        t.TrackID,
        t.Title,
        t.AudioUrl,
        t.CoverImageUrl,
        t.DurationSeconds AS Duration,
        t.Slug,
        u.Username,
        u.UserID,
        pt.AddedDate,
        pt.TrackOrder,
        (SELECT COUNT(*) FROM [Interaction].[Plays] WHERE TrackID = t.TrackID) AS PlayCount,
        (SELECT COUNT(*) FROM [Interaction].[Likes] WHERE TrackID = t.TrackID) AS LikeCount
    FROM [Music].[PlaylistTracks] pt
    INNER JOIN [Music].[Tracks] t ON pt.TrackID = t.TrackID
    INNER JOIN [Identity].[Users] u ON t.ArtistID = u.UserID
    WHERE pt.PlaylistID = @PlaylistID
    ORDER BY pt.TrackOrder, pt.AddedDate;
END;
