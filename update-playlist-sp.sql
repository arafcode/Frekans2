-- Update sp_GetUserPlaylists to include OwnerUsername
IF OBJECT_ID('[Music].[sp_GetUserPlaylists]', 'P') IS NOT NULL
    DROP PROCEDURE [Music].[sp_GetUserPlaylists];
GO

CREATE PROCEDURE [Music].[sp_GetUserPlaylists]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        p.PlaylistID,
        p.UserID,
        p.Name,
        p.Description,
        p.CoverImageUrl,
        p.IsPublic,
        p.CreatedDate,
        p.UpdatedDate,
        u.Username AS OwnerUsername,
        COUNT(pt.TrackID) AS TrackCount
    FROM [Music].[Playlists] p
    INNER JOIN [Identity].[Users] u ON p.UserID = u.UserID
    LEFT JOIN [Music].[PlaylistTracks] pt ON p.PlaylistID = pt.PlaylistID
    WHERE p.UserID = @UserID
    GROUP BY p.PlaylistID, p.UserID, p.Name, p.Description, p.CoverImageUrl, 
             p.IsPublic, p.CreatedDate, p.UpdatedDate, u.Username
    ORDER BY p.UpdatedDate DESC;
END;
GO

PRINT 'sp_GetUserPlaylists güncellendi - OwnerUsername eklendi.';
