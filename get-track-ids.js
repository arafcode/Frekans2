const sql = require('mssql');

const config = {
    user: 'nodeapp',
    password: 'Nodeapp123!',
    server: 'localhost',
    port: 52548,
    database: 'FrekansDB',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

async function getTrackIds() {
    try {
        const pool = await sql.connect(config);
        
        const result = await pool.request().query(`
            SELECT TOP 10 
                TrackID, 
                Title, 
                PlayCount,
                IsPublic
            FROM Music.Tracks 
            WHERE IsPublic = 1
            ORDER BY TrackID
        `);
        
        console.log('\n🎵 Veritabanındaki İlk 10 Şarkı:\n');
        result.recordset.forEach(track => {
            console.log(`ID: ${track.TrackID} → "${track.Title}" (PlayCount: ${track.PlayCount})`);
        });
        
        console.log('\n✅ Sunumda kullanabileceğiniz ID\'ler:');
        console.log(`   http://localhost:3000/track-detail.html?id=${result.recordset[0].TrackID}`);
        
        await pool.close();
    } catch (err) {
        console.error('❌ Hata:', err.message);
    }
}

getTrackIds();
