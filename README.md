# PencuriMovie Submalay — Cloudstream

Kod percubaan untuk https://pencurimoviesubmalay26.site/.

## Status sebenar
- Struktur HTML halaman utama, carian, butiran filem dan episod telah diperiksa.
- Permintaan pemain `zeta_player_ajax` telah memberi respons iframe pada satu contoh.
- Binaan tempatan belum dapat dijalankan: muat turun Gradle gagal kerana rangkaian.
- Main balik belum diuji dalam aplikasi Cloudstream. Hos luar hanya akan berfungsi jika extractor Cloudstream menyokongnya. Tiada jaminan semua mirror boleh dimainkan.
- Tiada repo awam diterbitkan dan tiada fail .cs3 siap disertakan dalam ZIP ini.
- Plugin ditandakan status 3 (beta-only) semasa percubaan.

## Bina repo melalui GitHub
1. Cipta repository **public** baharu, contohnya `pencuri-cloudstream`.
2. Ekstrak ZIP. Muat naik semua kandungan di DALAM folder PencuriCloudstream ke akar repo. Pastikan `.github/workflows/build.yml`, folder `gradle` dan fail `gradlew` turut dimuat naik.
3. Di Settings → Actions → General, benarkan Actions serta Read and write permissions jika tetapan akaun memerlukannya.
4. Di Actions, jalankan workflow **Build Cloudstream repository**. Binaan mungkin memerlukan pelarasan jika API/dependency upstream berubah.
5. Tunggu workflow berjaya. Ia menghasilkan `.cs3`, `plugins.json` dan `repo.json` pada branch `builds`. Branch ini khusus untuk fail binaan dan diganti pada setiap binaan.
6. Pautan repo selepas binaan berjaya:
   `https://raw.githubusercontent.com/USERNAME/pencuri-cloudstream/builds/repo.json`
   Gantikan USERNAME dan nama repo dengan maklumat sebenar.
7. Dalam Cloudstream beta: Settings → Extensions → Add Repository. Masukkan pautan tadi, kemudian pasang PencuriMovie Submalay.

ZIP dan pautan website asal tidak boleh ditampal terus sebagai URL repo.

## Ujian pada telefon
Cuba carian, satu filem dan satu episod. Cuba beberapa mirror. Jika tiada pautan video, hos mungkin tiada extractor yang sesuai. Periksa log Cloudstream sebelum menukar status plugin kepada 1.

## Asal binaan
Fail wrapper dan konfigurasi asas diadaptasi daripada https://github.com/recloudstream/TestPlugins.
Dokumentasi: https://recloudstream.github.io/csdocs/devs/using-plugin-template/
Format repo: https://recloudstream.github.io/csdocs/devs/create-your-own-json-repository/
