
CREATE PROCEDURE [Identity].[sp_GetUserByID]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        u.UserID,
        u.Username,
        u.Email,
        u.Bio,
        u.AvatarUrl,
        u.CoverImageUrl,
        u.IsVerified,
        u.CreatedAt,
        u.Language,
        u.IsAdmin,
        u.LastActiveAt,
        u.FollowerCount,
        u.FollowingCount
    FROM [Identity].[Users] u
    WHERE u.UserID = @UserID;
END
