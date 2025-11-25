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

async function fixDancingParadise() {
    try {
        console.log('🔌 Veritabanına bağlanılıyor...');
        await sql.connect(config);
        console.log('✅ Bağlantı başarılı!\n');

        // Find Dancing Paradise track
        const findQuery = `
            SELECT TrackID, Title, CoverImageUrl
            FROM [Music].[Tracks]
            WHERE Title LIKE '%Dancing Paradise%'
        `;
        
        const result = await sql.query(findQuery);
        
        if (result.recordset.length === 0) {
            console.log('❌ Dancing Paradise şarkısı bulunamadı.');
            await sql.close();
            return;
        }
        
        console.log('🎵 Bulunan şarkı:', result.recordset[0]);
        const trackId = result.recordset[0].TrackID;
        
        // Update with picsum photo URL
        const updateQuery = `
            UPDATE [Music].[Tracks]
            SET CoverImageUrl = 'https://picsum.photos/seed/${trackId}/300/300'
            WHERE TrackID = ${trackId}
        `;
        
        await sql.query(updateQuery);
        console.log(`✅ Dancing Paradise şarkısının görseli güncellendi!`);
        console.log(`   Yeni URL: https://picsum.photos/seed/${trackId}/300/300`);
        
        await sql.close();
        console.log('\n✨ İşlem tamamlandı!');

    } catch (error) {
        console.error('❌ Hata:', error.message);
        process.exit(1);
    }
}

fixDancingParadise();
