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

async function checkDatabase() {
    try {
        const pool = await sql.connect(config);
        
        console.log('\n🔍 ===== STORED PROCEDURES =====');
        const procedures = await pool.request().query(`
            SELECT 
                OBJECT_SCHEMA_NAME(object_id) AS SchemaName,
                name AS ProcedureName,
                create_date AS CreatedDate
            FROM sys.procedures
            ORDER BY SchemaName, ProcedureName
        `);
        
        console.log(`\n📊 Toplam: ${procedures.recordset.length} Stored Procedure\n`);
        procedures.recordset.forEach(sp => {
            console.log(`✅ ${sp.SchemaName}.${sp.ProcedureName}`);
        });
        
        console.log('\n\n🔥 ===== TRIGGERS =====');
        const triggers = await pool.request().query(`
            SELECT 
                OBJECT_SCHEMA_NAME(parent_object_id) AS SchemaName,
                OBJECT_NAME(parent_object_id) AS TableName,
                name AS TriggerName,
                CASE is_disabled WHEN 0 THEN 'Aktif' ELSE 'Devre Dışı' END AS Status
            FROM sys.triggers
            WHERE parent_class = 1
            ORDER BY SchemaName, TableName, TriggerName
        `);
        
        console.log(`\n📊 Toplam: ${triggers.recordset.length} Trigger\n`);
        triggers.recordset.forEach(trg => {
            console.log(`✅ ${trg.SchemaName}.${trg.TableName} → ${trg.TriggerName} (${trg.Status})`);
        });
        
        console.log('\n\n📝 ===== ÖRNEK TRIGGER KODU =====');
        const triggerCode = await pool.request().query(`
            SELECT OBJECT_DEFINITION(OBJECT_ID('Interaction.trg_UpdatePlayCount')) AS Code
        `);
        
        if (triggerCode.recordset[0] && triggerCode.recordset[0].Code) {
            console.log('\n🔥 trg_UpdatePlayCount Trigger Kodu:\n');
            console.log(triggerCode.recordset[0].Code.substring(0, 500) + '...\n');
        }
        
        console.log('\n✅ Kontrol tamamlandı!');
        
        await pool.close();
    } catch (err) {
        console.error('❌ Hata:', err.message);
    }
}

checkDatabase();
