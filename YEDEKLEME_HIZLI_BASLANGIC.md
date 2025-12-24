# 💾 FREKANS Yedekleme Sistemi - Hızlı Başlangıç

## 🚀 WEB ARAYÜZÜ (ÖNERİLEN)

### Erişim
```
http://localhost:3000/backup.html
```

**veya**
- Admin Panel → "Yedekleme" butonu
- SQL Query Tool → "Yedekleme" butonu

---

## 🎯 HIZLI KULLANIM

### 1. Yedekleme Türü Seç
- 💾 **Full Backup** → İlk yedekleme için
- 📊 **Differential Backup** → Günlük kullanım
- 📝 **Transaction Log** → Sürekli koruma

### 2. "Yedeklemeyi Başlat" Butonu
- Tek tıkla yedekleme başlar
- Canlı loglar görünür
- İlerleme çubuğu gösterilir

### 3. Otomatik Yedekleme (Opsiyonel)
- Switch'i aç
- Periyot seç (30 dk önerilir)
- Sistem otomatik yedek alır

---

## 💻 KOMUT SATIRI

```powershell
# Hızlı yedekleme
.\backup.ps1

# Veya
node backup-database.js
```

---

## 📂 Yedekler Nereye Kaydedilir?

```
C:\FREKANS\backups\
├── FrekansDB_full_TARIH.bak      ← SQL Backup
├── json_TARIH/                    ← JSON Export
├── stored_procedures_TARIH/       ← SP Backups
└── uploads_TARIH/                 ← Medya Dosyaları
```

---

## ✅ HOCAYA GÖSTERIM

1. **Web sayfasını aç:** `http://localhost:3000/backup.html`
2. **Full Backup seç** (yeşil kart)
3. **"Yedeklemeyi Başlat"** butonuna tıkla
4. **Konsol loglarını göster** (terminal benzeri)
5. **Otomatik yedeklemeyi aç** (30 dakika periyot)
6. **Yedekleme geçmişini göster** (altta)

**Bonus:** Terminal'de `.\backup.ps1` çalıştır!

---

## 📊 Yedekleme Türleri Karşılaştırma

| Tür | Boyut | Hız | Kullanım |
|-----|-------|-----|----------|
| **Full** | 30-50 MB | 2-5 sn | Günlük |
| **Differential** | 5-15 MB | 1-2 sn | Saatlik |
| **Transaction Log** | 1-5 MB | <1 sn | 15-30 dk |

---

## 🔄 Geri Yükleme

```bash
node restore-database.js
```

---

## 📝 Detaylı Kılavuz

- **Web Kullanımı:** [YEDEKLEME_SUNUM.md](YEDEKLEME_SUNUM.md)
- **Komut Satırı:** [BACKUP_README.md](BACKUP_README.md)

---

**🎓 Başarılar!** Hocanıza harika bir sunum yapacaksınız! 🚀
