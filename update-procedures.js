const sql = require('mssql');

const config = {
    server: 'localhost',
    port: 52548,
    database: 'FrekansDB',
    user: 'nodeapp',
    password: 'NodeApp123!',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function updateProcedures() {
    try {
        const pool = await sql.connect(config);
        
        console.log('Updating sp_GetFollowers...');
        await pool.request().query(`
            IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_GetFollowers' AND schema_id = SCHEMA_ID('Interaction'))
                DROP PROCEDURE [Interaction].[sp_GetFollowers];
        `);
        
        await pool.request().query(`
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
        `);
        console.log('✅ sp_GetFollowers updated');
        
        console.log('Updating sp_GetFollowing...');
        await pool.request().query(`
            IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_GetFollowing' AND schema_id = SCHEMA_ID('Interaction'))
                DROP PROCEDURE [Interaction].[sp_GetFollowing];
        `);
        
        await pool.request().query(`
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
        `);
        console.log('✅ sp_GetFollowing updated');
        
        console.log('✅ All procedures updated successfully!');
        
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await sql.close();
    }
}

updateProcedures();
