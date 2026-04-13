# Synapse — FAQ

Kumpulan pertanyaan dan jawaban untuk juri, penonton, maupun teman dan kerabat.

---

## Bagian A — Untuk Orang Awam (Teman & Kerabat)

---

**Q: Ini itu apaan sih?**

Synapse itu seperti "otak bersama" untuk AI. Ada dua hal utama yang bisa dilakukan:

1. **Store (menyimpan)** — Satu AI agent menemukan sesuatu yang berguna, lalu menyimpannya ke Synapse secara permanen.
2. **Query (mengambil)** — AI agent lain bisa mencari dan mengambil pengetahuan itu kapanpun, hanya dari bidang yang relevan.

Bayangkan kamu punya beberapa asisten AI — satu untuk urusan kesehatan, satu untuk teknik, satu untuk hukum. Biasanya mereka tidak bisa saling belajar. Dengan Synapse, satu AI yang menemukan solusi langsung bisa dipakai oleh AI lain. *Satu yang menyimpan, semua yang belajar.*

---

**Q: Jadi ini semacam ChatGPT?**

Bukan. ChatGPT adalah AI agent itu sendiri — yang menjawab pertanyaanmu. Synapse adalah "perpustakaannya" — tempat AI agent menyimpan dan mengambil pengetahuan. Synapse tidak menjawab pertanyaanmu langsung; Synapse adalah infrastruktur yang membuat AI agent jadi lebih pintar dan tidak gampang lupa.

---

**Q: Kenapa AI bisa "lupa"?**

AI seperti ChatGPT tidak punya memori jangka panjang. Setiap kali sesi percakapan selesai, semuanya hilang. Besok kamu mulai lagi dari nol, dia tidak ingat percakapan kemarin. Dan bahkan kalau ada dua AI yang berjalan bersamaan, mereka tidak bisa saling berbagi apa yang mereka tahu.

Synapse menyelesaikan dua masalah sekaligus: AI bisa **menyimpan** pengetahuan secara permanen, dan AI lain bisa **mengambil** pengetahuan itu kapanpun — seperti membaca dari buku catatan bersama yang tidak pernah hilang.

---

**Q: Apa bedanya dengan Google atau Wikipedia?**

Google dan Wikipedia menyimpan informasi untuk manusia — dalam bentuk website yang bisa dibaca. Synapse menyimpan pengetahuan untuk AI agent — dalam format yang bisa langsung diproses oleh mesin (vektor angka). Selain itu, Synapse menggunakan blockchain sehingga setiap pengetahuan punya bukti keaslian yang tidak bisa dipalsukan.

---

**Q: Blockchain? Itu bukan buat kripto?**

Blockchain memang sering dikaitkan dengan kripto, tapi teknologinya sendiri bisa dipakai untuk banyak hal. Di Synapse, blockchain digunakan seperti "notaris digital" — setiap pengetahuan yang disimpan dicatat buktinya di blockchain, sehingga tidak bisa diubah atau dipalsukan oleh siapapun.

---

**Q: Ini proyek buat siapa?**

Untuk developer dan perusahaan yang membangun sistem AI — terutama yang menggunakan banyak AI agent sekaligus dan ingin mereka bisa **store dan query** pengetahuan bersama secara terstruktur dan aman.

---

**Q: Ada tampilan web-nya, berarti ini untuk manusia?**

Tampilan web Synapse adalah **dashboard untuk developer** — bukan antarmuka utama produknya. Developer menggunakannya untuk melihat apa yang sudah disimpan agent, menguji query secara manual, dan memonitor aktivitas jaringan.

AI agent sendiri berinteraksi langsung lewat **REST API** atau **MCP Server** secara programatik — tidak perlu klik tombol atau isi form. Analoginya seperti AWS: ada web console untuk manusia memonitor, tapi aplikasi tetap pakai API secara langsung.

---

**Q: Apakah ini sudah bisa dipakai?**

Sudah bisa dicoba! Kodenya ada di GitHub dan bisa dijalankan di komputer sendiri. Integrasi dengan blockchain 0G juga sudah berjalan di testnet (jaringan percobaan). Untuk versi production yang bisa dipakai jutaan orang, masih dalam pengembangan.

---

## Bagian B — Untuk Penonton Hackathon

---

**Q: Apa yang paling unik dari Synapse dibanding proyek lain?**

Konsep intinya: *satu agent menyimpan, semua agent belajar* — dan ini diimplementasikan dengan empat hal konkret:

1. **Store + Query yang simetris** — store bukan hanya backup, query bukan hanya search. Keduanya adalah warga kelas satu di Synapse, dirancang untuk dipakai oleh AI agent secara programatik.
2. **Namespace isolation saat query** — satu agent bisa berganti peran tanpa konteks yang campur aduk. Query sebagai dokter hanya mengambil pengetahuan medis, nol kontaminasi dari domain lain.
3. **Trust score kolektif** — pengetahuan yang terbukti berguna (banyak di-query dan di-vote) naik ke atas secara otomatis.
4. **On-chain verification** — setiap pengetahuan punya bukti kriptografis yang tidak bisa dipalsukan di 0G blockchain.

---

**Q: Apakah Synapse sudah terintegrasi benar-benar dengan 0G, atau hanya simulasi?**

Sudah terintegrasi benar-benar dengan dua layanan 0G:
- **0G Storage** — konten pengetahuan diunggah dan mendapat CID (Content Identifier) asli dari jaringan
- **0G Chain** — hash SHA-256 setiap pengetahuan dicatat on-chain dan bisa diverifikasi di block explorer Galileo testnet

---

**Q: Kenapa pakai 0G dan bukan blockchain lain seperti Ethereum atau Solana?**

0G didesain khusus untuk kebutuhan AI — throughput tinggi, biaya rendah, dan memiliki komponen storage terdesentralisasi yang native. Ethereum terlalu mahal dan lambat untuk menyimpan ribuan knowledge entry. Solana tidak punya native storage layer. 0G adalah pilihan paling tepat untuk use case ini.

---

**Q: Berapa biaya untuk menyimpan satu pengetahuan di blockchain?**

Sangat murah. Di testnet Galileo, satu transaksi `storeKnowledgeHash` menggunakan sekitar 65.000 gas dengan gas price 3 gwei, sehingga biayanya kurang dari **0.0001 OG** per entry. Di mainnet dengan harga pasar, ini setara dengan fraksi sen dolar.

---

## Bagian C — Untuk Juri Teknikal

---

**Q: Bagaimana arsitektur pencarian semantiknya bekerja?**

Setiap konten pengetahuan diubah menjadi vektor 384 dimensi menggunakan model `all-MiniLM-L6-v2` dari sentence-transformers. Vektor disimpan di FAISS IndexFlatIP (inner product). Saat query, query juga diembedding dan cosine similarity dihitung terhadap semua vektor. Hasil diurutkan berdasarkan skor similarity, dengan filtering namespace dan TTL dilakukan sebelum ranking.

---

**Q: Bagaimana namespace isolation diimplementasikan?**

Di level vector store. Setiap `KnowledgeEntry` memiliki field `namespace`. Saat search, jika namespace disertakan, FAISS melakukan pencarian hanya pada subset vektor yang matching namespace-nya. Implementasinya menggunakan linear scan setelah FAISS search untuk filter — efisien untuk dataset kecil-menengah.

---

**Q: Bagaimana 0G Storage diintegrasikan?**

Menggunakan Node.js helper script (`zg_upload/upload.mjs`) yang dipanggil sebagai subprocess dari Python backend. Script menggunakan `@0gfoundation/0g-ts-sdk` untuk:
1. Membaca file JSON (knowledge entry yang diserialisasi)
2. Menghitung Merkle tree
3. Submit transaksi on-chain untuk registrasi
4. Upload data ke storage nodes via indexer

Root hash dari Merkle tree digunakan sebagai CID.

---

**Q: Kenapa pakai subprocess Node.js bukan Python SDK?**

Python SDK untuk 0G Storage belum mature saat pengembangan. TypeScript SDK (`0g-ts-sdk`) adalah implementasi resmi yang paling stabil. Subprocess approach memungkinkan backend tetap Python (FastAPI) tanpa mengorbankan kompatibilitas dengan SDK resmi 0G.

---

**Q: Bagaimana trust score mencegah manipulation/gaming?**

Saat ini trust score menggunakan model sederhana: setiap vote dari agent manapun bernilai sama. Ini cukup untuk proof of concept. Untuk production, roadmap mencakup agent reputation layer — vote dari agent dengan rekam jejak baik bernilai lebih tinggi, sehingga satu agent tidak bisa spam-vote untuk menaikkan skornya sendiri.

---

**Q: Bagaimana on-chain verification bekerja?**

Smart contract `KnowledgeRegistry.sol` menyimpan mapping dari `bytes32 contentHash` ke struct yang berisi `agentId`, `knowledgeId`, `cid`, dan `timestamp`. Fungsi `verify(bytes32 hash)` bisa dipanggil oleh siapapun untuk memverifikasi apakah sebuah pengetahuan pernah disimpan dan oleh siapa. Ini adalah immutable audit trail.

---

**Q: Apa rencana untuk skalabilitas?**

Beberapa area yang sudah diidentifikasi:
- **FAISS** perlu diganti dengan distributed vector store (seperti Qdrant atau Weaviate) untuk skala besar
- **Background upload** — 0G Storage upload saat ini blocking; perlu dijalankan async dengan status tracking
- **Sharding namespace** — untuk dataset besar, setiap namespace bisa punya index FAISS terpisah
- **Caching** — embedding computation bisa di-cache untuk konten yang sering diakses

---

**Q: Apakah Synapse bisa digunakan dengan AI agent selain Claude?**

Ya. Synapse menyediakan REST API standar yang bisa dipanggil oleh agent apapun yang bisa melakukan HTTP request. Selain itu, Synapse juga menyediakan MCP server yang kompatibel dengan semua agent yang mendukung Model Context Protocol — tidak hanya Claude.

---

**Q: Apa perbedaan antara 0G Storage CID dan on-chain hash?**

- **CID** (dari 0G Storage) adalah Merkle root hash dari konten file — digunakan sebagai alamat untuk mengambil konten dari jaringan storage
- **On-chain hash** (di 0G Chain) adalah SHA-256 dari teks konten pengetahuan — digunakan sebagai bukti keberadaan dan integritas konten

Keduanya saling melengkapi: CID membuktikan di mana data disimpan, on-chain hash membuktikan konten apa yang disimpan dan kapan.

---

*Synapse — "One agent stores. Every agent learns." · Built on 0G Network · Hackathon 0G APAC 2026*
