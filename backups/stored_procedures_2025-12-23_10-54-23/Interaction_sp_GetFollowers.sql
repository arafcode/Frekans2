
CREATE PROCEDURE [Interaction].[sp_GetFollowers]
    @UserID INT,
    @CurrentUserID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        u.UserID,
        u.Username,
        u.AvatarUrl,
        u.Bio,
        u.IsVerified,
        u.FollowerCount,
        u.FollowingCount,
        f.FollowDate,
        CASE 
            WHEN @CurrentUserID IS NOT NULL AND EXISTS (
                SELECT 1 FROM [Interaction].[Follows] 
                WHERE FollowerID = @CurrentUserID AND FollowingID = u.UserID
            ) THEN 1
            ELSE 0
        END AS IsFollowedByCurrentUser,
        CASE 
            WHEN @CurrentUserID IS NOT NULL AND EXISTS (
                SELECT 1 FROM [Interaction].[Follows] f1
                WHERE f1.FollowerID = @CurrentUserID AND f1.FollowingID = u.UserID
                  AND EXISTS (
                      SELECT 1 FROM [Interaction].[Follows] f2
                      WHERE f2.FollowerID = u.UserID AND f2.FollowingID = @CurrentUserID
                  )
            ) THEN 1
            ELSE 0
        END AS IsFriend
    FROM [Interaction].[Follows] f
    INNER JOIN [Identity].[Users] u ON f.FollowerID = u.UserID
    WHERE f.FollowingID = @UserID
    ORDER BY f.FollowDate DESC;
END
