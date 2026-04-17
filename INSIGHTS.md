# Synapse — Insights, Discussions & Q&A

Dokumen ini merekam semua diskusi, pertanyaan, dan keputusan desain selama pengembangan Synapse. Diperbarui secara ongoing.

---

## Produk & Konsep

---

**Q: Synapse mirip dengan AI agent marketplace seperti Skill Colosseum. Apa bedanya?**

A: Skill Colosseum adalah marketplace untuk *kemampuan* agent — agent membeli/menyewa skill dari agent lain, seperti marketplace jasa. Synapse adalah *memory layer* — bukan jual-beli kemampuan, tapi berbagi pengetahuan. Di Synapse, agent yang belajar sesuatu bisa langsung dishare ke semua agent lain secara gratis dan terverifikasi. Analoginya: Colosseum = marketplace freelancer, Synapse = Wikipedia bersama untuk AI agent.

---

**Q: Apakah dengan Synapse AI agent bisa memiliki lebih banyak MCP / "tukar otak"?**

A: Ya, konsepnya mirip. Agent bisa query namespace berbeda untuk "berganti peran" — query namespace `medical` untuk jadi dokter, query namespace `engineering` untuk jadi engineer. Tapi ini bukan mengganti MCP secara teknis, melainkan inject knowledge domain-spesifik ke context window agent sebelum menjawab. MCP-nya tetap Synapse, yang berubah adalah namespace yang di-query.

---

**Q: Jika AI agent query Synapse dan dapat 3 baris knowledge, apakah agent itu hanya punya pengetahuan sebanyak 3 baris saja?**

A: Tidak. Knowledge dari Synapse adalah *konteks tambahan*, bukan pengganti kemampuan model. Agent tetap punya semua kemampuan bawaan dari model (GPT-4, Claude, dll). Yang ditambahkan Synapse adalah fakta spesifik yang relevan untuk pertanyaan tertentu. Tanpa 3 baris itu agent mungkin hallucinate — dengan 3 baris itu agent menjawab akurat. Yang berubah bukan "seberapa pintar" agent, tapi "seberapa akurat" untuk domain spesifik.

---

**Q: Apa yang sebenarnya berubah pada AI agent setelah query Synapse?**

A: Agent mendapat *konteks tambahan* yang di-inject ke prompt sebelum menjawab. Perubahan konkretnya:
1. **Instant domain expertise** — agent baru bisa langsung "tahu" sesuatu tanpa training
2. **Context switching tanpa overhead** — agent yang sama bisa ganti peran hanya dengan ganti namespace query
3. **Pengetahuan yang terus berkembang** — kalau agent lain store knowledge baru hari ini, semua agent yang query besok otomatis dapat pengetahuan itu
4. **Trust filter** — agent bisa prioritaskan knowledge dengan trust score tinggi, menghindari informasi yang belum terbukti berguna

---

**Q: Kenapa harus pakai Synapse kalau AI agent sudah bisa cari informasi pakai web search?**

A: Web search mengonsumsi ~6000 token per query (fetch 3 halaman HTML, LLM baca semua, ekstrak jawaban dari noise). Synapse mengonsumsi ~100 token (2 entri atomik, langsung jawaban, tidak ada noise). Selain efisiensi token, Synapse punya keunggulan lain: hasil terverifikasi on-chain (bukan hasil Google yang bisa berubah), namespace isolation (tidak dapat hasil irrelevant), dan trust score (knowledge yang terbukti berguna muncul di atas).

---

**Q: Saya tanya ke AI agent tentang RPC URL dan dia bisa jawab tanpa Synapse. Berarti Synapse tidak berguna?**

A: Tergantung jenis knowledge-nya. Untuk fakta publik yang sudah ada di internet sebelum model di-train — ya, model memang sudah tahu. Synapse unggul di tiga area: (1) knowledge setelah training cutoff, (2) knowledge private/internal yang tidak pernah ada di internet, (3) knowledge antar agent yang perlu diverifikasi on-chain. Contoh test yang fair: tanya contract address Synapse yang baru di-deploy — tidak ada model yang tahu itu dari training data.

---

**Q: Saya tanya di sesi yang sama dan AI bisa jawab. Itu Synapse yang bekerja?**

A: Bukan — itu context window. Kalau informasi sudah disebutkan di percakapan yang sama, model "ingat" dari konteks aktif sesi itu. Untuk membuktikan Synapse benar-benar bekerja, test harus di sesi baru yang fresh, atau gunakan model berbeda, atau pakai `agent_synapse_claude.py` yang system prompt-nya membatasi model hanya boleh jawab dari hasil query Synapse.

---

## Desain Teknis

---

**Q: Kenapa satu dokumen bisa jadi 13 entries di Explorer? Itu tidak boros?**

A: Ini disengaja — konsep *atomic knowledge*. Satu entry = satu fakta tunggal. Kalau satu dokumen dijadikan satu entry besar, vector embedding-nya menjadi rata-rata dari semua fakta di dalamnya. Akibatnya query "RPC URL" bisa return entry yang juga berisi info faucet, SDK version, dan contract address — semua campur. Dengan memecah jadi banyak entry kecil: query lebih presisi, setiap fakta punya trust score sendiri, dan TTL bisa diset per-fakta sesuai seberapa cepat fakta itu berubah.

---

**Q: Kenapa FAISS bukan database biasa seperti PostgreSQL?**

A: Karena pencarian semantik berbeda dengan pencarian teks biasa. PostgreSQL mencari berdasarkan kata kunci exact match. FAISS mencari berdasarkan kemiripan makna menggunakan vektor matematika. Query "cara menghindari race condition" bisa menemukan entry "gunakan asyncio.Lock() untuk serialisasi akses nonce" — meski tidak ada satu kata pun yang sama persis. Ini yang membuat AI agent bisa query dengan bahasa natural dan tetap dapat hasil relevan.

---

**Q: Kenapa data hilang setiap Railway redeploy?**

A: FAISS disimpan di RAM (in-memory). Trade-off yang disengaja untuk fase hackathon — setup lebih simpel, tidak ada ketergantungan external storage. Konsekuensinya: setiap kali backend restart, data perlu di-store ulang. Untuk production, solusinya adalah persist FAISS index ke file atau migrasi ke vector database persistent seperti Qdrant.

---

**Q: Kenapa butuh Node.js di backend Python?**

A: Python SDK untuk 0G Storage belum mature saat pengembangan. TypeScript SDK (`@0gfoundation/0g-ts-sdk`) adalah implementasi resmi yang paling stabil. Backend Python memanggil script Node.js sebagai subprocess untuk handle upload ke 0G Storage. Pragmatis tapi bekerja — menghindari menulis ulang logika Merkle tree dari nol di Python.

---

**Q: Kenapa ada entries dengan `on_chain: false`?**

A: Dua kemungkinan: (1) hash sudah ada di chain dari run sebelumnya — contract `verify()` dicek sebelum transaksi baru, kalau duplicate di-skip untuk hemat gas; (2) transaksi gagal karena gas tidak cukup atau RPC timeout. Entry tetap tersimpan di vector store lokal, tapi tidak punya bukti on-chain.

---

**Q: Synapse katanya untuk AI agent, tapi kenapa ada tampilan web?**

A: Web Synapse adalah developer dashboard, bukan antarmuka utama. Fungsinya: inspeksi entries yang di-store agent, test query manual, monitor live feed. AI agent sendiri tidak pernah buka browser — mereka pakai REST API atau MCP server. Analoginya: database MySQL tidak butuh web interface, tapi developer tetap pakai phpMyAdmin untuk inspeksi.

---

## Trust & Security

---

**Q: Bagaimana mencegah orang sembarang store knowledge palsu/hoax?**

A: Saat ini Synapse bersifat permissionless — siapapun bisa store apapun. Pertahanan yang sudah ada: (1) trust score — hoax tidak di-mark useful, tenggelam secara alami; (2) namespace isolation — hoax di satu namespace tidak kontaminasi namespace lain; (3) TTL — hoax tidak permanen. Yang belum ada tapi di roadmap: agent reputation weighted voting, namespace gating untuk domain kritis, stake-to-store untuk content sensitif.

---

**Q: Bagaimana jika AI agent yang query mendapat knowledge hoax, mempercayainya, dan menaikkan rating hoax tersebut?**

A: Ini adalah *poisoning attack* / *sybil attack* — attack vector nyata yang belum fully solved bahkan di Wikipedia dan Stack Overflow. Skenarionya: attacker store hoax → agent baru percaya → mark useful → trust score naik → makin banyak agent tertipu → cycle berlanjut. Solusi berlapis yang dibutuhkan: (1) agent reputation — vote dari agent baru bernilai lebih kecil dari agent dengan track record; (2) cross-validation — entry yang bertentangan dengan konsensus namespace mendapat confidence rendah; (3) stake-to-vote — voting ada cost, kalau entry terbukti hoax stake di-slash. Ini open research problem. Jawaban jujur ke juri: mekanisme dasar sudah terbukti, poisoning resistance ada di roadmap prioritas tinggi.

---

## Bisnis & Strategi

---

**Q: Cold start problem — bagaimana Synapse bisa berguna kalau belum ada knowledge?**

A: Tiga fase: (1) Seed manual — populate 100+ entries berkualitas sebelum siapapun datang, seperti Wikipedia yang ditulis founder-nya sendiri di awal; (2) Early adopters — CLI simpel, komunitas 0G, early mover advantage lewat trust score; (3) Network effect — setelah cukup knowledge tersimpan, nilai Synapse naik sendiri dan orang punya insentif untuk store lebih banyak.

---

**Q: Video demo yang baik itu pendek atau panjang? Project lain banyak yang 8+ menit.**

A: Untuk submission HackQuest, pendek lebih baik — juri menonton puluhan video, 8 menit berisiko di-skip. Yang dinilai bukan durasi tapi apakah 0G component terlihat jelas bekerja. Rekomendasi: 1 video utama 2-3 menit untuk submission, beberapa clip pendek 30-45 detik untuk X/Twitter. Video 8 menit hanya bagus kalau setiap menitnya ada value — kalau mostly setup dan penjelasan, merugikan.

---

**Q: Siapa yang pertama kali perlu menggunakan Synapse agar ekosistemnya mulai berjalan?**

A: Founder sendiri. Semua platform network effect dimulai dengan founder menjadi power user pertama dan paling aktif. Wikipedia dimulai Jimmy Wales menulis artikel sendiri. Stack Overflow dimulai Jeff Atwood & Joel Spolsky menjawab pertanyaan sendiri. Synapse dimulai dengan seeding knowledge yang genuine berguna — 0G docs, SUI docs, error solutions dari pengalaman nyata.

---

*Last updated: April 2026 · Synapse — "One agent stores. Every agent learns."*
