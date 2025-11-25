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

async function checkProcedures() {
    try {
        await sql.connect(config);
        console.log('✅ Bağlantı kuruldu\n');
        
        // Check if Feedback schema exists
        const schemaResult = await sql.query(`
            SELECT SCHEMA_NAME 
            FROM INFORMATION_SCHEMA.SCHEMATA 
            WHERE SCHEMA_NAME = 'Feedback'
        `);
        
        console.log('Feedback Schema:', schemaResult.recordset.length > 0 ? 'Var' : 'Yok');
        
        // Check stored procedures
        const procResult = await sql.query(`
            SELECT 
                ROUTINE_SCHEMA,
                ROUTINE_NAME
            FROM INFORMATION_SCHEMA.ROUTINES
            WHERE ROUTINE_SCHEMA = 'Feedback'
            AND ROUTINE_TYPE = 'PROCEDURE'
        `);
        
        console.log('\n📋 Stored Procedures:\n');
        if (procResult.recordset.length === 0) {
            console.log('❌ Hiç stored procedure bulunamadı!');
        } else {
            procResult.recordset.forEach(p => {
                console.log(`✅ ${p.ROUTINE_SCHEMA}.${p.ROUTINE_NAME}`);
            });
        }
        
        // Check tables
        const tableResult = await sql.query(`
            SELECT TABLE_NAME
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_SCHEMA = 'Feedback'
        `);
        
        console.log('\n📊 Tables:\n');
        if (tableResult.recordset.length === 0) {
            console.log('❌ Hiç tablo bulunamadı!');
        } else {
            tableResult.recordset.forEach(t => {
                console.log(`✅ Feedback.${t.TABLE_NAME}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Hata:', error.message);
    } finally {
        await sql.close();
    }
}

checkProcedures();
