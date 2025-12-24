# =============================================
# FREKANS - Otomatik Yedekleme PowerShell Scripti
# =============================================
# Hem veritabanını hem de dosyaları yedekler
# Eski yedekleri temizler (30 günden eski olanlar)
# =============================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   FREKANS OTOMATIK YEDEKLEME" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$StartTime = Get-Date
Write-Host "Başlangıç: $($StartTime.ToString('dd.MM.yyyy HH:mm:ss'))`n" -ForegroundColor Yellow

# =============================================
# 1. Node.js Yedekleme Scriptini Çalıştır
# =============================================
Write-Host "📦 Veritabanı yedekleme başlatılıyor...`n" -ForegroundColor Green

try {
    node backup-database.js
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Veritabanı yedekleme başarılı!" -ForegroundColor Green
    } else {
        Write-Host "`n⚠️  Veritabanı yedekleme tamamlanamadı (kod: $LASTEXITCODE)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "`n❌ Veritabanı yedekleme hatası: $_" -ForegroundColor Red
}

# =============================================
# 2. Eski Yedekleri Temizle (30+ gün)
# =============================================
Write-Host "`n🧹 Eski yedekler temizleniyor (30+ gün)...`n" -ForegroundColor Cyan

$BackupDir = Join-Path $PSScriptRoot "backups"
$DaysToKeep = 30
$CutoffDate = (Get-Date).AddDays(-$DaysToKeep)

if (Test-Path $BackupDir) {
    $OldBackups = Get-ChildItem -Path $BackupDir -Recurse | 
                  Where-Object { $_.LastWriteTime -lt $CutoffDate }
    
    if ($OldBackups.Count -gt 0) {
        $OldBackups | ForEach-Object {
            Remove-Item $_.FullName -Force -Recurse -ErrorAction SilentlyContinue
            Write-Host "   Silindi: $($_.Name)" -ForegroundColor DarkGray
        }
        Write-Host "`n✅ $($OldBackups.Count) eski yedek silindi" -ForegroundColor Green
    } else {
        Write-Host "   Silinecek eski yedek bulunamadı" -ForegroundColor Gray
    }
} else {
    Write-Host "   Backup klasörü bulunamadı" -ForegroundColor Gray
}

# =============================================
# 3. Özet Bilgi
# =============================================
$EndTime = Get-Date
$Duration = $EndTime - $StartTime

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   YEDEKLEME TAMAMLANDI" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Bitiş: $($EndTime.ToString('dd.MM.yyyy HH:mm:ss'))" -ForegroundColor Yellow
Write-Host "Süre: $([math]::Round($Duration.TotalSeconds, 2)) saniye`n" -ForegroundColor Yellow

# Backup klasörü boyutunu göster
if (Test-Path $BackupDir) {
    $BackupSize = (Get-ChildItem -Path $BackupDir -Recurse | 
                   Measure-Object -Property Length -Sum).Sum
    $BackupSizeMB = [math]::Round($BackupSize / 1MB, 2)
    
    Write-Host "📊 Toplam Yedek Boyutu: $BackupSizeMB MB" -ForegroundColor Cyan
    
    $BackupFiles = Get-ChildItem -Path $BackupDir -File -Recurse | Measure-Object
    Write-Host "📁 Toplam Dosya Sayısı: $($BackupFiles.Count)`n" -ForegroundColor Cyan
}

Write-Host "✨ İşlem başarıyla tamamlandı!`n" -ForegroundColor Green
