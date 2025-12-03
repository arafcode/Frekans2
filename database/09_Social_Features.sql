-- =============================================
-- Social Features: Follow System and Messaging
-- =============================================
USE FrekansDB;
GO

-- =============================================
-- 1. Follow Table (Takip Sistemi)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Follows' AND schema_id = SCHEMA_ID('Interaction'))
BEGIN
    CREATE TABLE [Interaction].[Follows] (
        FollowID INT IDENTITY(1,1) PRIMARY KEY,
        FollowerID INT NOT NULL,  -- Takip eden kullanıcı
        FollowingID INT NOT NULL, -- Takip edilen kullanıcı
        FollowDate DATETIME NOT NULL DEFAULT GETDATE(),
        
        CONSTRAINT FK_Follows_Follower FOREIGN KEY (FollowerID) 
            REFERENCES [Identity].[Users](UserID) ON DELETE NO ACTION,
        CONSTRAINT FK_Follows_Following FOREIGN KEY (FollowingID) 
            REFERENCES [Identity].[Users](UserID) ON DELETE NO ACTION,
        CONSTRAINT CHK_Follows_NotSelf CHECK (FollowerID != FollowingID),
        CONSTRAINT UQ_Follows UNIQUE (FollowerID, FollowingID)
    );
    
    CREATE INDEX IX_Follows_Follower ON [Interaction].[Follows](FollowerID);
    CREATE INDEX IX_Follows_Following ON [Interaction].[Follows](FollowingID);
    
    PRINT '✅ Follows table created';
END
ELSE
BEGIN
    PRINT '⚠️  Follows table already exists';
END
GO

-- =============================================
-- 2. Messages Table (Mesajlaşma)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Messages' AND schema_id = SCHEMA_ID('Interaction'))
BEGIN
    CREATE TABLE [Interaction].[Messages] (
        MessageID INT IDENTITY(1,1) PRIMARY KEY,
        SenderID INT NOT NULL,
        ReceiverID INT NOT NULL,
        MessageText NVARCHAR(1000) NOT NULL,
        SentDate DATETIME NOT NULL DEFAULT GETDATE(),
        IsRead BIT NOT NULL DEFAULT 0,
        
        CONSTRAINT FK_Messages_Sender FOREIGN KEY (SenderID) 
            REFERENCES [Identity].[Users](UserID) ON DELETE NO ACTION,
        CONSTRAINT FK_Messages_Receiver FOREIGN KEY (ReceiverID) 
            REFERENCES [Identity].[Users](UserID) ON DELETE NO ACTION,
        CONSTRAINT CHK_Messages_NotSelf CHECK (SenderID != ReceiverID)
    );
    
    CREATE INDEX IX_Messages_Sender ON [Interaction].[Messages](SenderID);
    CREATE INDEX IX_Messages_Receiver ON [Interaction].[Messages](ReceiverID);
    CREATE INDEX IX_Messages_Conversation ON [Interaction].[Messages](SenderID, ReceiverID, SentDate);
    
    PRINT '✅ Messages table created';
END
ELSE
BEGIN
    PRINT '⚠️  Messages table already exists';
END
GO

-- =============================================
-- 3. Stored Procedure: Toggle Follow
-- =============================================
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_ToggleFollow' AND schema_id = SCHEMA_ID('Interaction'))
    DROP PROCEDURE [Interaction].[sp_ToggleFollow];
GO

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
GO

PRINT '✅ sp_ToggleFollow created';
GO

-- =============================================
-- 4. Stored Procedure: Get User Followers
-- =============================================
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_GetFollowers' AND schema_id = SCHEMA_ID('Interaction'))
    DROP PROCEDURE [Interaction].[sp_GetFollowers];
GO

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
GO

PRINT '✅ sp_GetFollowers created';
GO

-- =============================================
-- 5. Stored Procedure: Get User Following
-- =============================================
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_GetFollowing' AND schema_id = SCHEMA_ID('Interaction'))
    DROP PROCEDURE [Interaction].[sp_GetFollowing];
GO

CREATE PROCEDURE [Interaction].[sp_GetFollowing]
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
    INNER JOIN [Identity].[Users] u ON f.FollowingID = u.UserID
    WHERE f.FollowerID = @UserID
    ORDER BY f.FollowDate DESC;
END
GO

PRINT '✅ sp_GetFollowing created';
GO

-- =============================================
-- 6. Stored Procedure: Send Message
-- =============================================
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_SendMessage' AND schema_id = SCHEMA_ID('Interaction'))
    DROP PROCEDURE [Interaction].[sp_SendMessage];
GO

CREATE PROCEDURE [Interaction].[sp_SendMessage]
    @SenderID INT,
    @ReceiverID INT,
    @MessageText NVARCHAR(1000),
    @Metadata NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Validation
    IF @SenderID = @ReceiverID
    BEGIN
        RAISERROR('Cannot message yourself', 16, 1);
        RETURN;
    END
    
    -- Check if they are friends (both follow each other)
    IF NOT EXISTS (
        SELECT 1 FROM [Interaction].[Follows] f1
        WHERE f1.FollowerID = @SenderID AND f1.FollowingID = @ReceiverID
          AND EXISTS (
              SELECT 1 FROM [Interaction].[Follows] f2
              WHERE f2.FollowerID = @ReceiverID AND f2.FollowingID = @SenderID
          )
    )
    BEGIN
        RAISERROR('Can only message friends (mutual followers)', 16, 1);
        RETURN;
    END
    
    -- Insert message
    INSERT INTO [Interaction].[Messages] (SenderID, ReceiverID, MessageText, SentDate, IsRead, Metadata)
    VALUES (@SenderID, @ReceiverID, @MessageText, GETDATE(), 0, @Metadata);
    
    SELECT 
        SCOPE_IDENTITY() AS MessageID,
        @SenderID AS SenderID,
        @ReceiverID AS ReceiverID,
        @MessageText AS MessageText,
        GETDATE() AS SentDate,
        0 AS IsRead,
        @Metadata AS Metadata;
END
GO

PRINT '✅ sp_SendMessage created';
GO

-- =============================================
-- 7. Stored Procedure: Get Conversation
-- =============================================
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_GetConversation' AND schema_id = SCHEMA_ID('Interaction'))
    DROP PROCEDURE [Interaction].[sp_GetConversation];
GO

CREATE PROCEDURE [Interaction].[sp_GetConversation]
    @UserID1 INT,
    @UserID2 INT,
    @Limit INT = 50
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP (@Limit)
        m.MessageID,
        m.SenderID,
        m.ReceiverID,
        m.MessageText,
        m.SentDate,
        m.IsRead,
        m.Metadata,
        sender.Username AS SenderUsername,
        sender.AvatarUrl AS SenderAvatar
    FROM [Interaction].[Messages] m
    INNER JOIN [Identity].[Users] sender ON m.SenderID = sender.UserID
    WHERE (m.SenderID = @UserID1 AND m.ReceiverID = @UserID2)
       OR (m.SenderID = @UserID2 AND m.ReceiverID = @UserID1)
    ORDER BY m.SentDate DESC;
END
GO

PRINT '✅ sp_GetConversation created';
GO

-- =============================================
-- 8. Update Users table to add follower counts
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Identity].[Users]') AND name = 'FollowerCount')
BEGIN
    ALTER TABLE [Identity].[Users] ADD FollowerCount INT NOT NULL DEFAULT 0;
    PRINT '✅ FollowerCount column added';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Identity].[Users]') AND name = 'FollowingCount')
BEGIN
    ALTER TABLE [Identity].[Users] ADD FollowingCount INT NOT NULL DEFAULT 0;
    PRINT '✅ FollowingCount column added';
END
GO

PRINT '========================================';
PRINT '✅ Social Features Setup Complete!';
PRINT '========================================';
