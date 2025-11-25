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

async function fixFollowerCounts() {
    try {
        const pool = await sql.connect(config);
        
        console.log('Recalculating follower and following counts for all users...');
        
        // Update all users' follower and following counts
        await pool.request().query(`
            UPDATE [Identity].[Users]
            SET 
                FollowerCount = (
                    SELECT COUNT(*) 
                    FROM [Interaction].[Follows] 
                    WHERE FollowingID = [Identity].[Users].UserID
                ),
                FollowingCount = (
                    SELECT COUNT(*) 
                    FROM [Interaction].[Follows] 
                    WHERE FollowerID = [Identity].[Users].UserID
                )
        `);
        
        console.log('✅ Follower counts updated!');
        
        // Show results
        const result = await pool.request().query(`
            SELECT UserID, Username, FollowerCount, FollowingCount
            FROM [Identity].[Users]
            WHERE FollowerCount > 0 OR FollowingCount > 0
            ORDER BY UserID
        `);
        
        console.log('\n📊 Users with followers/following:');
        result.recordset.forEach(user => {
            console.log(`  ${user.Username} (ID: ${user.UserID}): ${user.FollowerCount} followers, ${user.FollowingCount} following`);
        });
        
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await sql.close();
    }
}

fixFollowerCounts();
