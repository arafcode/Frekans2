-- =============================================
-- User Activity Tracking
-- Add LastActiveAt column and update procedures
-- =============================================

USE FrekansDB;
GO

-- Add LastActiveAt column to Users table if not exists
IF NOT EXISTS (SELECT * FROM sys.columns 
               WHERE object_id = OBJECT_ID('[Identity].[Users]') 
               AND name = 'LastActiveAt')
BEGIN
    ALTER TABLE [Identity].[Users]
    ADD LastActiveAt DATETIME NULL;
    
    -- Set default to current time for existing users
    UPDATE [Identity].[Users]
    SET LastActiveAt = GETDATE();
    
    PRINT '✅ LastActiveAt column added to Users table';
END
ELSE
BEGIN
    PRINT 'ℹ️ LastActiveAt column already exists';
END
GO

-- Stored Procedure: Update user last active time
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_UpdateUserActivity' AND schema_id = SCHEMA_ID('Identity'))
    DROP PROCEDURE [Identity].[sp_UpdateUserActivity];
GO

CREATE PROCEDURE [Identity].[sp_UpdateUserActivity]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE [Identity].[Users]
    SET LastActiveAt = GETDATE()
    WHERE UserID = @UserID;
    
    SELECT 
        UserID,
        LastActiveAt
    FROM [Identity].[Users]
    WHERE UserID = @UserID;
END
GO

PRINT '✅ sp_UpdateUserActivity created';
GO

-- Update sp_GetUserByID to include LastActiveAt
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_GetUserByID' AND schema_id = SCHEMA_ID('Identity'))
    DROP PROCEDURE [Identity].[sp_GetUserByID];
GO

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
GO

PRINT '✅ sp_GetUserByID updated with LastActiveAt';
GO

PRINT '✅ User activity tracking setup complete';
GO
