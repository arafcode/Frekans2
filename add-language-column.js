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

async function addLanguageColumn() {
    try {
        await sql.connect(config);
        console.log('✅ Bağlantı kuruldu');
        
        // Check if Language column exists
        const checkResult = await sql.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'Identity' 
            AND TABLE_NAME = 'Users' 
            AND COLUMN_NAME = 'Language'
        `);
        
        if (checkResult.recordset.length === 0) {
            console.log('➕ Language sütunu ekleniyor...');
            await sql.query("ALTER TABLE [Identity].[Users] ADD [Language] NVARCHAR(10) NOT NULL DEFAULT 'tr'");
            console.log('✅ Language sütunu eklendi');
        } else {
            console.log('ℹ️ Language sütunu zaten mevcut');
        }
        
    } catch (error) {
        console.error('❌ Hata:', error.message);
    } finally {
        await sql.close();
    }
}

addLanguageColumn();
