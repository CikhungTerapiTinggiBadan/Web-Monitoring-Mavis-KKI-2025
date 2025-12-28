# 🚤 Mavis Sengkuni - GCS Wahana Dashboard

Mavis Sengkuni adalah aplikasi Ground Control Station (GCS) berbasis web yang dikembangkan oleh tim **Mavis dari Universitas Negeri Yogyakarta**. Aplikasi ini dirancang untuk memantau pergerakan dan status wahana (kapal/drone air) secara real-time menggunakan integrasi database Firebase.

![Dashboard Screenshot](public/main.png)

## Fitur Utama

* **Real-Time Telemetry Data:** Integrasi langsung dengan Firebase Realtime Database untuk menampilkan koordinat GPS, *Course Over Ground* (COG), dan kecepatan (KMH/Knot) secara instan.
* **Peta Interaktif (MapLibre):** Visualisasi posisi wahana di peta dengan fitur:
    * **Trajectory Tracking:** Garis merah yang menunjukkan riwayat jalur yang telah dilalui.
    * **Heading & COG:** Indikator arah hadap wahana dan proyeksi arah gerak (garis kuning).
    * **Dynamic Grid:** Grid dinamis pada peta untuk membantu estimasi jarak antar titik.
* **Sistem Monitoring Checkpoint:** Tabel log otomatis yang mencatat waktu, koordinat, dan kecepatan setiap kali wahana melewati titik checkpoint (1-13).
* **Dual-Camera Capture:** Menampilkan hasil tangkapan gambar terbaru dari dua kamera (Surface & Underwater) dalam format Base64.
* **Lintasan Selector:** Fitur untuk memilih mode lintasan (A atau B) yang menyesuaikan orientasi navigasi pada dashboard.

## Tech Stack

* **Framework:** Next.js (React)
* **Styling:** Tailwind CSS
* **Database:** Firebase Realtime Database
* **Mapping:** MapLibre GL & React Map GL
* **Components:** * `react-wavify` (Animasi ombak header)
    * `lucide-react` / Heroicons (Ikonografi)

## Struktur Data Firebase

Aplikasi ini mengharapkan struktur data berikut pada Firebase:
* `Data/GPS_DATA`: Latitude, Longitude, COG.
* `Data/Speed Over Ground`: SOG_KMH, SOG_KNOT, Heading.
* `Data/Centerpoint Garis`: Gambar Base64 (Surface & Underwater), Date, Time.
* `Data/Checkpoint`: Riwayat data tiap pos.

## Cara Menjalankan Lokal

1.  **Clone repositori:**
    ```bash
    git clone [https://github.com/username/mavis-sengkuni.git](https://github.com/username/mavis-sengkuni.git)
    cd mavis-sengkuni
    ```

2.  **Instal dependensi:**
    ```bash
    npm install requirements.txt
    ```

3.  **Konfigurasi Firebase:**
    Pastikan file `firebaseConfig.js` sudah dikonfigurasi dengan API Key proyek Anda.

4.  **Jalankan aplikasi:**
    ```bash
    npm run dev
    ```
    Aplikasi akan tersedia di `http://localhost:3000`.

---
**Mavis Team - Universitas Negeri Yogyakarta**
