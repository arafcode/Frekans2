const sql = require('mssql');

const config = {
    user: 'nodeapp',
    password: 'NodeApp123!',
    server: 'localhost',
    database: 'FrekansDB',
    port: 52548,
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

async function addCoverImageColumn() {
    try {
        console.log('🔌 Veritabanına bağlanılıyor...');
        await sql.connect(config);
        console.log('✅ Bağlantı başarılı!\n');

        // Check if column exists
        const checkQuery = `
            SELECT COUNT(*) as ColumnExists
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'Music' 
            AND TABLE_NAME = 'Tracks' 
            AND COLUMN_NAME = 'CoverImageUrl'
        `;
        
        const checkResult = await sql.query(checkQuery);
        
        if (checkResult.recordset[0].ColumnExists > 0) {
            console.log('ℹ️  CoverImageUrl kolonu zaten mevcut.');
            await sql.close();
            return;
        }

        console.log('➕ CoverImageUrl kolonu ekleniyor...');
        
        const alterQuery = `
            ALTER TABLE [Music].[Tracks]
            ADD CoverImageUrl NVARCHAR(500) NULL;
        `;
        
        await sql.query(alterQuery);
        
        console.log('✅ CoverImageUrl kolonu başarıyla eklendi!');
        
        // Update some tracks with sample cover images
        console.log('\n📝 Örnek kapak görselleri ekleniyor...');
        
        const updateQuery = `
            UPDATE TOP (50) [Music].[Tracks]
            SET CoverImageUrl = CONCAT('https://picsum.photos/seed/', TrackID, '/300/300')
            WHERE CoverImageUrl IS NULL;
        `;
        
        const updateResult = await sql.query(updateQuery);
        console.log(`✅ ${updateResult.rowsAffected[0]} şarkıya örnek görsel eklendi.`);
        
        await sql.close();
        console.log('\n✨ İşlem tamamlandı!');

    } catch (error) {
        console.error('❌ Hata:', error.message);
        process.exit(1);
    }
}

addCoverImageColumn();
