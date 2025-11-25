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

async function updateAvatar() {
    try {
        // First, find the user
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('username', sql.NVarChar, 'araf')
            .query('SELECT UserID, Username, AvatarUrl FROM [Identity].[Users] WHERE Username = @username');
        
        if (result.recordset.length === 0) {
            console.log('User "araf" not found');
            return;
        }
        
        const user = result.recordset[0];
        console.log('Found user:', user);
        
        // Update avatar to a male photo
        const newAvatarUrl = 'https://randomuser.me/api/portraits/men/32.jpg';
        await pool.request()
            .input('avatarUrl', sql.NVarChar, newAvatarUrl)
            .input('username', sql.NVarChar, 'araf')
            .query('UPDATE [Identity].[Users] SET AvatarUrl = @avatarUrl WHERE Username = @username');
        
        console.log('✅ Avatar updated successfully!');
        console.log('New avatar URL:', newAvatarUrl);
        
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await sql.close();
    }
}

updateAvatar();
