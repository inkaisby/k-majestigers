/**
 * K-Majestigers - Client Environment & Runtime Configuration
 * -----------------------------------------------------------
 * Berkas ini mengatur deteksi otomatis environment (Localhost vs Vercel/Production)
 * dan mencegah terjadinya Mixed Content Error (HTTPS memanggil HTTP) saat di-deploy.
 */

(function () {
    const hostname = (typeof window !== 'undefined' && window.location.hostname) || '';
    const protocol = (typeof window !== 'undefined' && window.location.protocol) || 'http:';

    // Deteksi apakah sedang di lingkungan development lokal
    const isLocalhost = Boolean(
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '[::1]' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.endsWith('.local') ||
        hostname === ''
    );

    // Konfigurasi Environment K-Majestigers
    window.__ENV = Object.assign({
        // Mode aplikasi
        IS_LOCAL: isLocalhost,
        ENVIRONMENT: isLocalhost ? 'development' : 'production',

        // Base URL RESTful API:
        // - Di Localhost: Langsung ke inkai-backend port 5001 (http://localhost:5001/api)
        // - Di Vercel / Live HTTPS: Gunakan relative path '/api' (via Vercel reverse proxy)
        //   atau gunakan URL backend publik jika sudah di-host di cloud (misal Railway/Render).
        API_URL: isLocalhost
            ? 'http://localhost:5001/api'
            : (window.INKAI_API_BASE || '/api'),

        // Project Supabase Cloud:
        SUPABASE_PROJECT_REF: 'ecmafwuuuviesytcnorv',
        SUPABASE_REGION: 'ap-northeast-2',
        SUPABASE_URL: 'https://ecmafwuuuviesytcnorv.supabase.co',
        SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_YJ9fZDi927TyfuRo-M8nUQ_7HtcB_1F',
        SUPABASE_ANON_KEY: 'sb_publishable_YJ9fZDi927TyfuRo-M8nUQ_7HtcB_1F',
    }, window.__ENV || {});

    // Sinkronkan ke global hook inkai-backend
    if (!window.INKAI_API_BASE) {
        window.INKAI_API_BASE = window.__ENV.API_URL;
    }

    // Helper untuk developer / admin mengganti endpoint API saat pengujian di browser
    window.setBackendUrl = function (customUrl) {
        if (!customUrl) {
            localStorage.removeItem('inkai_api_url');
            console.log('[K-Majestigers] Reset API URL ke default:', window.__ENV.API_URL);
        } else {
            localStorage.setItem('inkai_api_url', customUrl);
            console.log('[K-Majestigers] API URL diperbarui ke:', customUrl);
        }
        if (typeof InkaiAPI !== 'undefined' && InkaiAPI.checkHealth) {
            InkaiAPI.checkHealth();
        }
    };

    console.log(
        `%c🥋 K-MAJESTIGERS %c Env: ${window.__ENV.ENVIRONMENT} | API: ${window.INKAI_API_BASE}`,
        'background: #d97706; color: #fff; font-weight: bold; padding: 2px 6px; border-radius: 4px 0 0 4px;',
        'background: #0f172a; color: #fbbf24; padding: 2px 6px; border-radius: 0 4px 4px 0;'
    );
})();
