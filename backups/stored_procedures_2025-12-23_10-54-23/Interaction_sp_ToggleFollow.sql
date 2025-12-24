
CREATE PROCEDURE [Interaction].[sp_ToggleFollow]
    @FollowerID INT,
    @FollowingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @IsFollowing BIT;
    DECLARE @IsFriend BIT;
    
    -- Validation
    IF @FollowerID = @FollowingID
    BEGIN
        RAISERROR('Cannot follow yourself', 16, 1);
        RETURN;
    END
    
    -- Check if already following
    IF EXISTS (SELECT 1 FROM [Interaction].[Follows] 
               WHERE FollowerID = @FollowerID AND FollowingID = @FollowingID)
    BEGIN
        -- Unfollow
        DELETE FROM [Interaction].[Follows]
        WHERE FollowerID = @FollowerID AND FollowingID = @FollowingID;
        
        SET @IsFollowing = 0;
        SET @IsFriend = 0;
        
        SELECT 'unfollowed' AS Action, @IsFollowing AS IsFollowing, @IsFriend AS IsFriend;
    END
    ELSE
    BEGIN
        -- Follow
        INSERT INTO [Interaction].[Follows] (FollowerID, FollowingID, FollowDate)
        VALUES (@FollowerID, @FollowingID, GETDATE());
        
        SET @IsFollowing = 1;
        
        -- Check if they follow back (mutual follow = friends)
        SET @IsFriend = CASE 
            WHEN EXISTS (
                SELECT 1 FROM [Interaction].[Follows] 
                WHERE FollowerID = @FollowingID AND FollowingID = @FollowerID
            ) THEN 1
            ELSE 0
        END;
        
        SELECT 'followed' AS Action, @IsFollowing AS IsFollowing, @IsFriend AS IsFriend;
    END
END
