const sql = require('mssql');

const config = {
    server: 'localhost',
    port: 52548,
    user: 'nodeapp',
    password: 'NodeApp123!',
    database: 'FrekansDB',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function addIsAdminColumn() {
    try {
        await sql.connect(config);
        console.log('✅ Connected to database');
        
        // Check if IsAdmin column exists
        const checkResult = await sql.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'Identity' 
            AND TABLE_NAME = 'Users' 
            AND COLUMN_NAME = 'IsAdmin'
        `);
        
        if (checkResult.recordset.length === 0) {
            console.log('➕ Adding IsAdmin column...');
            await sql.query('ALTER TABLE [Identity].[Users] ADD [IsAdmin] BIT NOT NULL DEFAULT 0');
            console.log('✅ IsAdmin column added');
            
            // Set first user as admin (or user with UserID = 1)
            await sql.query('UPDATE [Identity].[Users] SET [IsAdmin] = 1 WHERE UserID = 1');
            console.log('✅ Admin user set (UserID = 1)');
        } else {
            console.log('ℹ️ IsAdmin column already exists');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await sql.close();
    }
}

addIsAdminColumn();
