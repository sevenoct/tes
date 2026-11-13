Hasan Ramdani — Portfolio Website (OLED · Liquid Glass · Monochrome)

FILE
- index.html            halaman utama
- style.css             tema liquid glass + semua ukuran font
- script.js             gelombang latar, menu mobile, lensa kaca, efek kursor
- cv.pdf                CV
- logo.png, logo-nav.png            logo kamu (transparan) untuk navbar & kartu hero
- favicon.ico, favicon-32.png, favicon-192.png, favicon-512.png,
  apple-touch-icon.png, site.webmanifest     ikon di tab browser / layar HP

Upload SEMUA file ke folder root domain. Situs statis, tanpa server/database.
Font (Manrope) dimuat dari Google Fonts, jadi perlu internet saat dibuka.

YANG MUDAH DIUBAH
- Playlist: index.html, cari id="playlist-widget" (ganti ID playlist di dua tempat: src iframe & link "Open in Spotify").
- Tulisan "with her @maudyindh": baris <p class="widget-credit"> di bawah iframe. Hapus baris itu kalau tidak ingin tampil.
- Instagram: bagian id="contact" di index.html.
- Ukuran font: variabel --fs-xs ... --fs-lg di bagian atas style.css (tidak ada teks di bawah 14px).
- Kekuatan efek lensa (Chrome/Edge): atribut data-bezel / data-strength pada elemen class="lens" (opsional).

CATATAN TEKNIS
- Pembiasan cahaya asli (lensa) memakai SVG displacement di backdrop-filter, hanya didukung Chromium
  (Chrome, Edge, Brave, Opera, Samsung Internet). Safari & Firefox otomatis memakai kaca blur berlapis
  dengan tepi bercahaya yang sama, tanpa error.
- Menghormati prefers-reduced-motion dan prefers-reduced-transparency.
