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

async function testFeedbackStats() {
    try {
        await sql.connect(config);
        console.log('✅ Bağlantı kuruldu\n');
        
        // Test stored procedure
        console.log('📊 sp_GetFeedbackStats sonucu:\n');
        const result = await sql.query('EXEC [Feedback].[sp_GetFeedbackStats]');
        
        if (result.recordset.length === 0) {
            console.log('❌ Hiç veri döndürülmedi');
        } else {
            console.log('Status | Count');
            console.log('----------------');
            result.recordset.forEach(row => {
                console.log(`${row.Status} | ${row.Count}`);
            });
            
            const total = result.recordset.reduce((sum, row) => sum + parseInt(row.Count), 0);
            console.log('----------------');
            console.log(`TOPLAM: ${total}`);
        }
        
        // Direct count
        console.log('\n📊 Direct COUNT sonucu:\n');
        const countResult = await sql.query('SELECT COUNT(*) as Total FROM [Feedback].[Feedbacks]');
        console.log(`Toplam kayıt: ${countResult.recordset[0].Total}`);
        
    } catch (error) {
        console.error('❌ Hata:', error.message);
    } finally {
        await sql.close();
    }
}

testFeedbackStats();
