const sql = require('mssql');

const dbConfig = {
    user: 'nodeapp',
    password: 'NodeApp123!',
    server: 'localhost',
    port: 52548,
    database: 'FrekansDB',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

async function checkColumns() {
    try {
        await sql.connect(dbConfig);
        console.log('✅ Bağlantı başarılı');
        
        const result = await sql.query`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'Identity' 
            AND TABLE_NAME = 'Users'
            ORDER BY ORDINAL_POSITION
        `;
        
        console.log('\n📋 Identity.Users kolonları:');
        result.recordset.forEach(row => {
            console.log('  - ' + row.COLUMN_NAME);
        });
        
        const hasFollowerCount = result.recordset.some(r => r.COLUMN_NAME === 'FollowerCount');
        const hasFollowingCount = result.recordset.some(r => r.COLUMN_NAME === 'FollowingCount');
        
        console.log('\n🔍 Kontrol:');
        console.log('  FollowerCount:', hasFollowerCount ? '✅ Var' : '❌ Yok');
        console.log('  FollowingCount:', hasFollowingCount ? '✅ Var' : '❌ Yok');
        
        await sql.close();
    } catch (error) {
        console.error('❌ Hata:', error.message);
    }
}

checkColumns();
