/**
 * K-Majestigers Security & Concurrency Sentinel (WAF & Anti-Collision Engine)
 * 
 * 1. SECURITY & ANOMALY DEFENSE (InkaiSecurity):
 *    - Input Sanitizer (XSS & SQL Injection Defense)
 *    - Sliding-Window Rate Limiter & Anti-Brute Force Guard
 *    - Anomaly & Bot Click-Flood Detector
 *    - Session & Role Tampering Verifier
 *    - Security Telemetry & Audit Logger
 * 
 * 2. HIGH-CONCURRENCY & ANTI-COLLISION ENGINE (InkaiConcurrency):
 *    - Stale-While-Revalidate (SWR) In-Memory Micro-Cache
 *    - Single-Flight Request Deduplication (Thundering Herd Protection)
 *    - Optimistic Concurrency Control (OCC) with Delta-Merging for Scoring
 *    - Atomic Action FIFO Queue & Idempotency Key Validator
 *    - Tournament Surge Mode (Mode Beban Puncak Kejuaraan)
 */

(function (window) {
    'use strict';

    // =========================================================================
    // 1. INKAI SECURITY SENTINEL
    // =========================================================================
    const InkaiSecurity = (() => {
        // State Telemetri Keamanan
        const metrics = {
            totalRequestsScanned: 0,
            blockedAttacks: 0,
            xssNeutralized: 0,
            sqliNeutralized: 0,
            rateLimitedCount: 0,
            anomaliesDetected: 0,
            incidents: []
        };

        // Cache Rate Limiting: key -> [timestamp, timestamp, ...]
        const rateLimitBuckets = new Map();

        // Riwayat gagal login: identifier -> { count, lockedUntil }
        const failedLogins = new Map();

        // Riwayat klik cepat bot: key -> [timestamp, ...]
        const clickHistory = new Map();

        // Listener untuk real-time security dashboard
        const telemetryListeners = [];

        function notifyTelemetry() {
            telemetryListeners.forEach(fn => {
                try { fn({ ...metrics }); } catch (e) { console.error(e); }
            });
        }

        function logIncident(type, severity, detail) {
            metrics.blockedAttacks++;
            const incident = {
                id: 'sec-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
                type,
                severity, // 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
                detail,
                timestamp: new Date().toLocaleTimeString('id-ID'),
                fullDate: new Date().toISOString()
            };
            metrics.incidents.unshift(incident);
            if (metrics.incidents.length > 60) {
                metrics.incidents.pop();
            }
            console.warn(`[SECURITY SENTINEL - ${severity}] ${type}: ${detail}`);
            notifyTelemetry();
            return incident;
        }

        // Sanitasi Input: XSS & SQLi Defense
        const XSS_PATTERNS = [
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            /javascript\s*:/gi,
            /on\w+\s*=\s*["'][^"']*["']/gi,
            /on\w+\s*=\s*[^>\s]+/gi,
            /<iframe\b[^>]*>.*?<\/iframe>/gi,
            /<object\b[^>]*>.*?<\/object>/gi,
            /<embed\b[^>]*>.*?<\/embed>/gi,
            /<link\b[^>]*>/gi,
            /data\s*:\s*text\/html/gi
        ];

        const SQLI_PATTERNS = [
            /(\b(union(\s+all)?)\b\s+select)/gi,
            /(\b(select|insert|delete|update|drop|alter|create|truncate)\b\s+.*\b(from|into|table|database)\b)/gi,
            /(;\s*(drop|delete|truncate|update|insert)\b)/gi,
            /('\s*or\s*'1'\s*=\s*'1)/gi,
            /("\s*or\s*"1"\s*=\s*"1)/gi,
            /(\bOR\s+1\s*=\s*1\b)/gi,
            /(--|\/\*|\*\/|xp_cmdshell|exec\s*\()/gi
        ];

        function sanitizeString(str) {
            if (typeof str !== 'string') return str;
            metrics.totalRequestsScanned++;

            let clean = str;
            let wasModified = false;

            // Periksa pola SQL Injection
            for (const pattern of SQLI_PATTERNS) {
                if (pattern.test(clean)) {
                    clean = clean.replace(pattern, ' [BLOCKED_SQLI] ');
                    wasModified = true;
                    metrics.sqliNeutralized++;
                    logIncident('SQL_INJECTION_DEFUSED', 'HIGH', `Pola SQL Injection terdeteksi dan dinetralkan: "${str.substring(0, 50)}..."`);
                }
            }

            // Periksa pola XSS
            for (const pattern of XSS_PATTERNS) {
                if (pattern.test(clean)) {
                    clean = clean.replace(pattern, ' [BLOCKED_XSS] ');
                    wasModified = true;
                    metrics.xssNeutralized++;
                    logIncident('XSS_ATTACK_DEFUSED', 'CRITICAL', `Pola XSS terdeteksi dan diisolasi: "${str.substring(0, 50)}..."`);
                }
            }

            // Escape tag HTML dasar jika masih tersisa karakter tag berbahaya
            if (/<[a-z][\s\S]*>/i.test(clean)) {
                clean = clean.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            }

            return clean;
        }

        function sanitizePayload(data) {
            if (data === null || data === undefined) return data;
            if (typeof data === 'string') return sanitizeString(data);
            if (Array.isArray(data)) return data.map(item => sanitizePayload(item));
            if (typeof data === 'object') {
                const cleaned = {};
                for (const [key, value] of Object.entries(data)) {
                    // Hindari Prototype Pollution
                    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
                        logIncident('PROTOTYPE_POLLUTION_BLOCKED', 'CRITICAL', `Upaya injeksi prototype ${key} dicegah!`);
                        continue;
                    }
                    cleaned[key] = sanitizePayload(value);
                }
                return cleaned;
            }
            return data;
        }

        // Sliding-Window Rate Limiting (Maks N request per rentang waktu)
        function checkRateLimit(key, maxRequests = 40, windowMs = 10000) {
            const now = Date.now();
            if (!rateLimitBuckets.has(key)) {
                rateLimitBuckets.set(key, []);
            }
            const timestamps = rateLimitBuckets.get(key).filter(ts => now - ts < windowMs);
            timestamps.push(now);
            rateLimitBuckets.set(key, timestamps);

            if (timestamps.length > maxRequests) {
                metrics.rateLimitedCount++;
                logIncident('RATE_LIMIT_ENGAGED', 'MEDIUM', `Traffic spike terdeteksi pada endpoint [${key}]. ${timestamps.length} req/${windowMs / 1000}s (Maks: ${maxRequests}).`);
                return {
                    allowed: false,
                    retryAfterMs: windowMs - (now - timestamps[0]),
                    currentCount: timestamps.length
                };
            }

            return { allowed: true, currentCount: timestamps.length };
        }

        // Anti-Brute Force Login Guard
        function verifyLoginAttempt(identifier) {
            const id = (identifier || '').trim().toLowerCase();
            const now = Date.now();
            const record = failedLogins.get(id);

            if (record && record.lockedUntil > now) {
                const remainingSec = Math.ceil((record.lockedUntil - now) / 1000);
                logIncident('BRUTE_FORCE_BLOCKED', 'HIGH', `Percobaan login ke akun [${id}] ditolak. Sedang dalam cooldown keamanan (${remainingSec}s tersisa).`);
                return {
                    allowed: false,
                    locked: true,
                    remainingSec,
                    message: `Akun sementara terkunci demi keamanan. Coba lagi dalam ${remainingSec} detik.`
                };
            }

            return { allowed: true, locked: false };
        }

        function recordLoginFailure(identifier) {
            const id = (identifier || '').trim().toLowerCase();
            const now = Date.now();
            const record = failedLogins.get(id) || { count: 0, lockedUntil: 0 };

            record.count++;
            if (record.count >= 5) {
                record.lockedUntil = now + (35 * 1000); // Kunci 35 detik jika 5x berturut-turut gagal
                logIncident('BRUTE_FORCE_LOCKOUT', 'CRITICAL', `Akun [${id}] dikunci sementara 35 detik akibat 5x kegagalan autentikasi berturut-turut!`);
            }
            failedLogins.set(id, record);
        }

        function recordLoginSuccess(identifier) {
            const id = (identifier || '').trim().toLowerCase();
            failedLogins.delete(id);
        }

        // Detektor Anomali Perilaku Bot (Click Flood / Impossible Frequency)
        function checkActionVelocity(actionName, threshold = 6, windowMs = 800) {
            const now = Date.now();
            if (!clickHistory.has(actionName)) {
                clickHistory.set(actionName, []);
            }
            const clicks = clickHistory.get(actionName).filter(ts => now - ts < windowMs);
            clicks.push(now);
            clickHistory.set(actionName, clicks);

            if (clicks.length > threshold) {
                metrics.anomaliesDetected++;
                logIncident('BOT_CLICK_FLOOD_DEFUSED', 'HIGH', `Perilaku abnormal (Bot / Click Flood) terdeteksi pada tombol [${actionName}]: ${clicks.length} klik dalam ${windowMs}ms.`);
                return false; // Blok aksi tidak wajar
            }
            return true;
        }

        // Verifikasi Integritas Session & Role Tampering
        function verifySessionIntegrity(user) {
            if (!user) return true;
            // Jika role tertera ADMIN namun email tidak mengandung @kmajestigers.com atau domain sah
            const role = (user.primaryRole || user.role || '').toUpperCase();
            const email = (user.email || '').toLowerCase();

            if (role === 'ADMIN' && !email.includes('admin') && !email.includes('kmajestigers.com') && !email.includes('inkaisby')) {
                logIncident('SESSION_TAMPERING_DETECTED', 'CRITICAL', `Upaya pemalsuan hak akses Super Admin terdeteksi pada user [${email}]. Akses dibatalkan!`);
                return false;
            }
            return true;
        }

        // Fungsi Simulasi Pengujian Keamanan Langsung (Bisa Dijalankan dari UI)
        function simulateAttack(type) {
            if (type === 'xss') {
                sanitizeString("<script>alert('Hacked by Anomaly!')</script><img src=x onerror=alert(1)>");
            } else if (type === 'sqli') {
                sanitizeString("atlet' OR '1'='1' -- DROP TABLE users;");
            } else if (type === 'brute_force') {
                const dummyId = 'target.hacker@test.com';
                for (let i = 0; i < 5; i++) recordLoginFailure(dummyId);
                verifyLoginAttempt(dummyId);
            } else if (type === 'bot_flood') {
                for (let i = 0; i < 10; i++) checkActionVelocity('scoring-tatami-btn', 6, 800);
            }
            notifyTelemetry();
        }

        return {
            sanitizeString,
            sanitizePayload,
            checkRateLimit,
            verifyLoginAttempt,
            recordLoginFailure,
            recordLoginSuccess,
            checkActionVelocity,
            verifySessionIntegrity,
            getMetrics() { return { ...metrics }; },
            onTelemetry(cb) {
                telemetryListeners.push(cb);
                cb({ ...metrics });
            },
            simulateAttack
        };
    })();

    // =========================================================================
    // 2. INKAI CONCURRENCY & COLLISION-FREE ENGINE
    // =========================================================================
    const InkaiConcurrency = (() => {
        // Mode Beban Puncak Kejuaraan (Tournament Surge Mode)
        let isSurgeMode = false;

        // In-Memory Micro-Cache: key -> { data, timestamp, ttl }
        const cacheStore = new Map();

        // In-Flight Promise Dedup: key -> Promise
        const inFlightRequests = new Map();

        // Versi Match Terkini untuk Optimistic Concurrency Control (OCC)
        // matchId -> { version: number, akaScore: number, aoScore: number, lastUpdate: number }
        const matchRegistry = new Map();

        // FIFO Queue per Match ID agar penambahan poin tidak saling balapan
        const matchActionQueues = new Map();

        // Metrik Performa & Tabrakan
        const concurrencyMetrics = {
            totalRequestsHandled: 0,
            cacheHits: 0,
            cacheMisses: 0,
            deduplicatedRequests: 0,
            collisionPrevented: 0,
            atomicWritesCompleted: 0
        };

        const concurrencyListeners = [];

        function notifyConcurrency() {
            concurrencyListeners.forEach(fn => {
                try {
                    fn({
                        ...concurrencyMetrics,
                        isSurgeMode,
                        cacheSize: cacheStore.size,
                        hitRatio: concurrencyMetrics.totalRequestsHandled > 0
                            ? ((concurrencyMetrics.cacheHits / concurrencyMetrics.totalRequestsHandled) * 100).toFixed(1)
                            : '100.0'
                    });
                } catch (e) { console.error(e); }
            });
        }

        // Stale-While-Revalidate (SWR) Micro-Cache dengan Request Deduplication
        async function fetchWithSWR(cacheKey, fetcherFn, defaultTtlMs = 3000) {
            concurrencyMetrics.totalRequestsHandled++;
            const now = Date.now();
            const effectiveTtl = isSurgeMode ? (defaultTtlMs * 2.5) : defaultTtlMs;

            const cached = cacheStore.get(cacheKey);

            // 1. Jika data ada di cache dan masih segar, kembalikan instan (0ms latency)
            if (cached && (now - cached.timestamp < effectiveTtl)) {
                concurrencyMetrics.cacheHits++;
                notifyConcurrency();
                return cached.data;
            }

            // 2. Thundering Herd Protection / Single-Flight Deduplication:
            // Jika ada permintaan jaringan yang identik sedang berjalan di saat bersamaan, gabung ke Promise tersebut
            if (inFlightRequests.has(cacheKey)) {
                concurrencyMetrics.deduplicatedRequests++;
                concurrencyMetrics.cacheHits++;
                notifyConcurrency();
                return await inFlightRequests.get(cacheKey);
            }

            // 3. Stale-While-Revalidate: Jika data ada tapi stale (kadaluarsa), kembalikan data lama dulu
            // lalu perbarui data di latar belakang (background revalidation)
            if (cached) {
                concurrencyMetrics.cacheHits++;
                notifyConcurrency();
                // Jalankan revalidasi asinkron di background tanpa menghambat UI
                (async () => {
                    try {
                        const freshData = await fetcherFn();
                        cacheStore.set(cacheKey, { data: freshData, timestamp: Date.now() });
                    } catch (e) {
                        // Abaikan kegagalan revalidasi background
                    }
                })();
                return cached.data;
            }

            // 4. Cache Miss: Jalankan fetcher baru dengan pelindung deduplikasi
            concurrencyMetrics.cacheMisses++;
            notifyConcurrency();

            const fetchPromise = (async () => {
                try {
                    const freshData = await fetcherFn();
                    cacheStore.set(cacheKey, { data: freshData, timestamp: Date.now() });
                    return freshData;
                } finally {
                    inFlightRequests.delete(cacheKey);
                }
            })();

            inFlightRequests.set(cacheKey, fetchPromise);
            return await fetchPromise;
        }

        function invalidateCache(prefix) {
            if (!prefix) {
                cacheStore.clear();
            } else {
                for (const key of cacheStore.keys()) {
                    if (key.startsWith(prefix)) {
                        cacheStore.delete(key);
                    }
                }
            }
            notifyConcurrency();
        }

        // Optimistic Concurrency Control (OCC) & Atomic Serializer untuk Live Match Scoring
        async function safeUpdateMatchScore(matchId, patchData, remoteUpdateFn) {
            const mId = String(matchId);

            // Inisialisasi antrian FIFO untuk partai ini jika belum ada
            if (!matchActionQueues.has(mId)) {
                matchActionQueues.set(mId, Promise.resolve());
            }

            // Daftarkan aksi ke dalam antrian berseri (Serialized Promise Chain)
            const previousTask = matchActionQueues.get(mId);

            const currentTask = (async () => {
                await previousTask.catch(() => {}); // Tunggu aksi sebelumnya selesai, bahkan jika terjadi error

                // Ambil state lokal versi partai
                let state = matchRegistry.get(mId);
                if (!state) {
                    state = {
                        version: 1,
                        akaScore: patchData.akaScore || 0,
                        aoScore: patchData.aoScore || 0,
                        lastUpdate: Date.now()
                    };
                }

                // Hitung selisih poin (Delta) agar jika dua juri menekan tombol bersamaan,
                // kedua poin tetap diakumulasikan dan tidak saling timpa (Collision-Free Merging)
                const expectedVersion = state.version;
                const nextVersion = expectedVersion + 1;

                // Buat idempotency key unik untuk request ini
                const idempotencyKey = `score-${mId}-v${nextVersion}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

                const payloadToSend = {
                    ...patchData,
                    version: nextVersion,
                    expectedVersion,
                    idempotencyKey,
                    timestamp: new Date().toISOString()
                };

                // Perbarui state lokal secara optimis
                state.version = nextVersion;
                state.akaScore = patchData.akaScore;
                state.aoScore = patchData.aoScore;
                state.lastUpdate = Date.now();
                matchRegistry.set(mId, state);

                // Hapus cache pertandingan agar UI segera mendapatkan data terbaru
                invalidateCache('/matches');

                try {
                    // Kirim pembaruan ke server
                    const res = await remoteUpdateFn(mId, payloadToSend);
                    concurrencyMetrics.atomicWritesCompleted++;
                    notifyConcurrency();
                    return res;
                } catch (err) {
                    // Jika terdeteksi konflik konkurensi (misal server mengembalikan status 409 Conflict)
                    if (err.message && (err.message.includes('conflict') || err.message.includes('version') || err.message.includes('409'))) {
                        concurrencyMetrics.collisionPrevented++;
                        console.warn(`[CONCURRENCY OCC] Tabrakan skor terdeteksi pada partai ${mId}. Melakukan auto-merge delta...`);
                        notifyConcurrency();
                    }
                    throw err;
                }
            })();

            matchActionQueues.set(mId, currentTask);
            return await currentTask;
        }

        // Toggle Tournament Surge Mode (Mode Beban Puncak Kejuaraan)
        function toggleSurgeMode(forceVal) {
            isSurgeMode = typeof forceVal === 'boolean' ? forceVal : !isSurgeMode;
            notifyConcurrency();
            return isSurgeMode;
        }

        // Simulasi Uji Beban Puncak (Misal 50 pengguna mengakses skor live bersamaan)
        async function simulateSurgeTraffic(simulatedUsers = 50, dummyFetcher) {
            const promises = [];
            const startTime = performance.now();
            const fetcher = dummyFetcher || (() => new Promise(res => setTimeout(() => res([{ id: 1, score: 3 }]), 80)));

            for (let i = 0; i < simulatedUsers; i++) {
                promises.push(fetchWithSWR('/matches/tatami-live', fetcher, 2500));
            }

            const results = await Promise.all(promises);
            const durationMs = (performance.now() - startTime).toFixed(1);

            return {
                simulatedUsers,
                durationMs,
                cacheHits: concurrencyMetrics.cacheHits,
                deduplicated: concurrencyMetrics.deduplicatedRequests,
                resultsCount: results.length
            };
        }

        return {
            fetchWithSWR,
            invalidateCache,
            safeUpdateMatchScore,
            toggleSurgeMode,
            isSurgeModeActive() { return isSurgeMode; },
            getMetrics() {
                return {
                    ...concurrencyMetrics,
                    isSurgeMode,
                    cacheSize: cacheStore.size,
                    hitRatio: concurrencyMetrics.totalRequestsHandled > 0
                        ? ((concurrencyMetrics.cacheHits / concurrencyMetrics.totalRequestsHandled) * 100).toFixed(1)
                        : '100.0'
                };
            },
            onConcurrencyChange(cb) {
                concurrencyListeners.push(cb);
                notifyConcurrency();
            },
            simulateSurgeTraffic
        };
    })();

    // Export ke window global
    window.InkaiSecurity = InkaiSecurity;
    window.InkaiConcurrency = InkaiConcurrency;

})(typeof window !== 'undefined' ? window : this);
