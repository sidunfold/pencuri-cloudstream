# PencuriMovie for Nuvio — experimental 0.1.0

Sasaran: Nuvio yang menyokong JavaScript Plugins pada telefon Android, Android TV dan Google TV. Google TV menggunakan platform Android TV. Ini bukan aplikasi APK dan bukan manifest add-on Stremio.

Status: ujian logik menggunakan respons tiruan lulus untuk movie, tv dan series, termasuk pemilihan episod dan penolakan tajuk/tahun tidak sepadan. Belum diuji dalam aplikasi pada peranti sebenar. Ujian hos RPM memberikan `Request is invalid`; main balik belum berjaya disahkan. Hos tanpa pautan media terus mungkin tidak disokong. Jangan anggap repo ini sedia untuk kegunaan harian.

URL pemasangan percubaan:

https://raw.githubusercontent.com/sidunfold/pencuri-cloudstream/nuvio/manifest.json

Dalam Nuvio yang mempunyai menu Plugins, tambah URL manifest ini sebagai repository kemudian aktifkan PencuriMovie. Gunakan URL yang sama pada telefon Android, Android TV dan Google TV. Jika aplikasi hanya menawarkan add-on Stremio, format ini tidak serasi dengan menu itu.

Fail manifest.json dan pencuri.js berada bersama-sama pada branch nuvio. Provider memerlukan TMDB_API_KEY yang dibekalkan oleh runtime Nuvio; ia tidak membundel kunci API. Format mediaType tv dan series diterima. Pautan iframe tidak dipulangkan sebagai video. Setiap permintaan mempunyai timeout 12 saat.

Ujian tempatan: `node test.cjs`.

Rujukan format: https://github.com/yoruix/nuvio-providers/blob/template/DOCUMENTATION.md
Runtime: https://github.com/NuvioMedia/NuvioMobile dan https://github.com/NuvioMedia/NuvioTV
