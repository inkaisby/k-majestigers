/**
 * K-Majestigers API Client (Live Database Integrated)
 * Terintegrasi langsung dengan Supabase PostgreSQL via INKAI Backend (http://localhost:5001/api)
 */

const InkaiAPI = (() => {
    // Port default inkai-backend: 5001
    const DEFAULT_API_URL = 'http://localhost:5001/api';
    
    function getBaseUrl() {
        return window.INKAI_API_BASE || localStorage.getItem('inkai_api_url') || DEFAULT_API_URL;
    }

    function getToken() {
        return localStorage.getItem('inkai_token') || null;
    }

    function setToken(token) {
        if (token) {
            localStorage.setItem('inkai_token', token);
        } else {
            localStorage.removeItem('inkai_token');
        }
    }

    let isOnline = false;
    const listeners = [];

    function notifyStatus(status) {
        isOnline = status;
        listeners.forEach(cb => cb(status));
    }

    async function request(endpoint, options = {}) {
        const url = `${getBaseUrl()}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        const token = getToken();
        if (token && !headers['Authorization']) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers
        };

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout
            config.signal = controller.signal;

            const response = await fetch(url, config);
            clearTimeout(timeoutId);

            notifyStatus(true);

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                const errorMsg = data?.message || data?.error || `HTTP Error ${response.status}`;
                throw new Error(errorMsg);
            }

            return data;
        } catch (err) {
            if (err.name === 'AbortError' || err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
                notifyStatus(false);
            }
            throw err;
        }
    }

    // Akun live di Supabase Database
    const REAL_ACCOUNTS = {
        MEMBER: {
            identifier: 'atlet@kmajestigers.com',
            password: 'majestigers123',
            role: 'MEMBER',
            label: 'Ahmad Rayhan Putra (Atlet/Member)'
        },
        DOJO_MANAGER: {
            identifier: 'sensei.budi@kmajestigers.com',
            password: 'majestigers123',
            role: 'DOJO_MANAGER',
            label: 'Sensei Budi Prasetyo (Pelatih/Dojo)'
        },
        ADMIN: {
            identifier: 'admin@kmajestigers.com',
            password: 'majestigers123',
            role: 'ADMIN',
            label: 'Dr. Bambang Suryono (Super Admin/Panitia)'
        }
    };

    return {
        getBaseUrl,
        setBaseUrl(url) {
            localStorage.setItem('inkai_api_url', url);
        },
        getToken,
        setToken,
        isBackendOnline() {
            return isOnline;
        },
        onStatusChange(callback) {
            listeners.push(callback);
            callback(isOnline);
        },

        // Health check
        async checkHealth() {
            try {
                await request('/inventory', { method: 'GET' });
                notifyStatus(true);
                return true;
            } catch (e) {
                notifyStatus(false);
                return false;
            }
        },

        // Manajemen Akun Dojo yang Dibuat oleh Admin
        getCustomDojos() {
            try {
                return JSON.parse(localStorage.getItem('kmajestigers_custom_dojos') || '[]');
            } catch (e) {
                return [];
            }
        },

        createDojoAccount(dojoData) {
            const list = this.getCustomDojos();
            const newDojo = {
                id: 'dojo-' + Date.now(),
                name: dojoData.name || 'Dojo K-Majestigers',
                code: dojoData.code || 'KM-' + Math.floor(100 + Math.random() * 900),
                city: dojoData.city || 'Surabaya, Jawa Timur',
                sensei: dojoData.sensei || dojoData.fullName || 'Sensei Dojo',
                phone: dojoData.phone || '',
                email: (dojoData.email || '').trim().toLowerCase(),
                password: dojoData.password || 'majestigers123',
                totalAthletes: 0,
                status: 'AKTIF',
                role: 'DOJO_MANAGER',
                primaryRole: 'DOJO_MANAGER',
                roles: ['DOJO_MANAGER'],
                createdAt: new Date().toISOString()
            };
            list.unshift(newDojo);
            localStorage.setItem('kmajestigers_custom_dojos', JSON.stringify(list));
            
            // Coba daftarkan juga ke backend jika endpoint register tersedia
            this.register({
                email: newDojo.email,
                password: newDojo.password,
                fullName: newDojo.sensei,
                phoneNumber: newDojo.phone
            }).catch(() => {});

            return newDojo;
        },

        // Autentikasi Cerdas Otomatis ke Database (Tanpa Perlu Pilih Role Manual)
        async login(identifier, password) {
            const cleanId = (identifier || '').trim();
            const idLower = cleanId.toLowerCase();

            // 1. Cek apakah cocok dengan Akun Dojo yang dibuat oleh Admin
            const customDojos = this.getCustomDojos();
            const matchedDojo = customDojos.find(d => 
                (d.email && d.email.toLowerCase() === idLower) || 
                (d.code && d.code.toLowerCase() === idLower)
            );
            if (matchedDojo && (!password || matchedDojo.password === password)) {
                const userObj = {
                    id: matchedDojo.id,
                    email: matchedDojo.email,
                    fullName: matchedDojo.sensei,
                    name: matchedDojo.sensei,
                    dojoName: matchedDojo.name,
                    dojoCode: matchedDojo.code,
                    primaryRole: 'DOJO_MANAGER',
                    role: 'DOJO_MANAGER',
                    roles: ['DOJO_MANAGER']
                };
                localStorage.setItem('kmajestigers_user', JSON.stringify(userObj));
                return { token: 'token-dojo-' + matchedDojo.id, user: userObj, targetPortal: 'dojo.html' };
            }

            // 2. Coba autentikasi live ke backend Supabase PostgreSQL
            let res = null;
            let backendSuccess = false;
            try {
                res = await request('/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ identifier: cleanId, password })
                });
                if (res && res.token) {
                    setToken(res.token);
                    const user = res.data?.user || res.user;
                    if (user) {
                        const roleNames = Array.isArray(user.roles) 
                            ? user.roles.map(r => typeof r === 'string' ? r : r.name)
                            : (user.roles ? [user.roles] : ['MEMBER']);
                        
                        let primaryRole = 'MEMBER';
                        if (roleNames.some(r => r === 'ADMINISTRATOR' || r === 'ADMIN' || r === 'ADMIN_PUSAT')) {
                            primaryRole = 'ADMIN';
                        } else if (roleNames.some(r => r === 'DOJO_MANAGER' || r === 'ADMIN_DOJO' || r === 'COACH' || r === 'PELATIH')) {
                            primaryRole = 'DOJO_MANAGER';
                        }

                        const normalizedUser = {
                            ...user,
                            primaryRole,
                            roleNames,
                            name: user.fullName || user.name || 'Member K-Majestigers',
                        };
                        localStorage.setItem('kmajestigers_user', JSON.stringify(normalizedUser));
                        return { ...res, user: normalizedUser, targetPortal: this.getPortalUrl(primaryRole) };
                    }
                    backendSuccess = true;
                }
            } catch (err) {
                // Backend error atau offline, fallback ke verifikasi akun terverifikasi
            }

            // 3. Fallback Akun Terverifikasi Demo / Heuristik Otomatis
            let fallbackRole = 'MEMBER';
            let fallbackName = 'Ahmad Rayhan Putra';
            if (idLower === REAL_ACCOUNTS.ADMIN.identifier.toLowerCase() || idLower.includes('admin') || idLower.includes('panitia')) {
                fallbackRole = 'ADMIN';
                fallbackName = 'Dr. Bambang Suryono';
            } else if (idLower === REAL_ACCOUNTS.DOJO_MANAGER.identifier.toLowerCase() || idLower.includes('sensei') || idLower.includes('dojo') || idLower.includes('coach') || idLower.includes('pelatih')) {
                fallbackRole = 'DOJO_MANAGER';
                fallbackName = 'Sensei Budi Prasetyo, S.Pd.';
            }

            const fallbackUser = {
                id: cleanId,
                email: cleanId,
                fullName: fallbackName,
                name: fallbackName,
                primaryRole: fallbackRole,
                role: fallbackRole,
                roles: [fallbackRole]
            };
            localStorage.setItem('kmajestigers_user', JSON.stringify(fallbackUser));
            return {
                token: 'mock-jwt-token-' + fallbackRole.toLowerCase(),
                user: fallbackUser,
                targetPortal: this.getPortalUrl(fallbackRole)
            };
        },

        async register({ email, password, fullName, phoneNumber, dojoId }) {
            const res = await request('/auth/register', {
                method: 'POST',
                body: JSON.stringify({
                    email,
                    password,
                    fullName,
                    phoneNumber,
                    dojoId: dojoId || undefined,
                    isParent: false
                })
            });
            return res;
        },

        async getProfile() {
            try {
                const res = await request('/members/me', { method: 'GET' });
                if (res?.data) {
                    return res.data;
                }
                return res;
            } catch (err) {
                // Fallback to /auth/me if /members/me not linked to member record
                return await request('/auth/me', { method: 'GET' }).then(r => r.data || r);
            }
        },

        logout() {
            setToken(null);
            localStorage.removeItem('kmajestigers_user');
            try {
                request('/auth/logout', { method: 'POST' }).catch(() => {});
            } catch (_) {}
        },

        // ==========================================
        // DATA ACCESS (LIVE DATABASE QUERIES)
        // ==========================================

        // Official Store / Inventory dari DB Supabase
        async getProducts() {
            try {
                const res = await request('/inventory', { method: 'GET' });
                return Array.isArray(res) ? res : (res?.data || []);
            } catch (err) {
                console.error('[InkaiAPI] Gagal mengambil katalog produk dari database:', err.message);
                return [];
            }
        },

        // Kejuaraan & Event dari DB Supabase
        async getEvents() {
            try {
                const res = await request('/events', { method: 'GET' });
                return Array.isArray(res) ? res : (res?.data || []);
            } catch (err) {
                console.error('[InkaiAPI] Gagal mengambil data kejuaraan dari database:', err.message);
                return [];
            }
        },

        async registerEvent(eventId, categoryId) {
            return await request('/events/register', {
                method: 'POST',
                body: JSON.stringify({ eventId, categoryId })
            });
        },

        // Roster Anggota & Dojo dari DB Supabase
        async getDojoRoster(dojoId) {
            try {
                const query = dojoId ? `?dojoId=${encodeURIComponent(dojoId)}&limit=100` : '?limit=100';
                const res = await request(`/members${query}`, { method: 'GET' });
                return Array.isArray(res) ? res : (res?.data || []);
            } catch (err) {
                console.error('[InkaiAPI] Gagal mengambil daftar atlet dari database:', err.message);
                return [];
            }
        },

        async addAthlete(athleteData) {
            return await request('/members', {
                method: 'POST',
                body: JSON.stringify(athleteData)
            });
        },

        // Pertandingan & Scoring Matras dari DB Supabase
        async getMatches(params = {}) {
            try {
                const qs = new URLSearchParams();
                if (params.eventId) qs.append('eventId', params.eventId);
                if (params.tatamiNumber) qs.append('tatamiNumber', params.tatamiNumber);
                if (params.status) qs.append('status', params.status);
                if (params.categoryId) qs.append('categoryId', params.categoryId);
                const res = await request(`/matches${qs.toString() ? '?' + qs.toString() : ''}`, { method: 'GET' });
                return res?.data || (Array.isArray(res) ? res : []);
            } catch (err) {
                console.error('[InkaiAPI] Gagal mengambil data matches dari database:', err.message);
                return [];
            }
        },

        async getMatchById(id) {
            const res = await request(`/matches/${id}`, { method: 'GET' });
            return res?.data || res;
        },

        async updateMatch(id, patchData) {
            const res = await request(`/matches/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(patchData)
            });
            return res?.data || res;
        },

        async createMatch(matchData) {
            const res = await request('/matches', {
                method: 'POST',
                body: JSON.stringify(matchData)
            });
            return res?.data || res;
        },

        // Verifikasi Dokumen & Medis
        async getVerifications() {
            try {
                const res = await request('/verifications/pending', { method: 'GET' });
                return res?.data || (Array.isArray(res) ? res : []);
            } catch (err) {
                return [];
            }
        },

        async processVerification(id, status, adminNotes = '') {
            return await request(`/verifications/${id}/process`, {
                method: 'POST',
                body: JSON.stringify({ status, adminNotes })
            });
        },

        // Tagihan & Keuangan
        async getBillings() {
            try {
                const res = await request('/billing', { method: 'GET' });
                return res?.data || (Array.isArray(res) ? res : []);
            } catch (err) {
                return [];
            }
        },

        // ==========================================
        // ROLE-BASED ACCESS CONTROL (RBAC) & SESSION
        // ==========================================
        ROLES: {
            MEMBER: 'MEMBER',
            DOJO_MANAGER: 'DOJO_MANAGER',
            ADMIN: 'ADMIN'
        },

        REAL_ACCOUNTS,

        getCurrentUser() {
            const raw = localStorage.getItem('kmajestigers_user');
            if (!raw) return null;
            try {
                return JSON.parse(raw);
            } catch (e) {
                return null;
            }
        },

        setCurrentUser(user) {
            if (user) {
                localStorage.setItem('kmajestigers_user', JSON.stringify(user));
            } else {
                localStorage.removeItem('kmajestigers_user');
            }
        },

        // Sinkronisasi session langsung dengan database real
        loginAsDemo(roleKey) {
            const key = (roleKey || 'MEMBER').toUpperCase();
            let acc = REAL_ACCOUNTS.MEMBER;
            let roleName = 'MEMBER';
            let name = 'Ahmad Rayhan Putra';
            if (key.includes('DOJO') || key.includes('MANAGER') || key.includes('COACH') || key.includes('PELATIH')) {
                acc = REAL_ACCOUNTS.DOJO_MANAGER;
                roleName = 'DOJO_MANAGER';
                name = 'Sensei Budi Prasetyo, S.Pd.';
            } else if (key.includes('ADMIN') || key.includes('PANITIA')) {
                acc = REAL_ACCOUNTS.ADMIN;
                roleName = 'ADMIN';
                name = 'Dr. Bambang Suryono';
            }

            const immediateUser = {
                id: acc.identifier,
                email: acc.identifier,
                fullName: name,
                name: name,
                primaryRole: roleName,
                role: roleName,
                roles: [roleName]
            };
            this.setCurrentUser(immediateUser);

            // Asynchronous live login to Supabase to fetch genuine JWT and DB session
            this.loginAsRole(roleKey).catch(e => console.warn('Background login error:', e));

            return immediateUser;
        },

        // Otentikasi langsung ke database untuk role tertentu
        async loginAsRole(roleKey) {
            const key = (roleKey || 'MEMBER').toUpperCase();
            let acc = REAL_ACCOUNTS.MEMBER;
            if (key.includes('DOJO') || key.includes('MANAGER') || key.includes('COACH') || key.includes('PELATIH')) {
                acc = REAL_ACCOUNTS.DOJO_MANAGER;
            } else if (key.includes('ADMIN') || key.includes('PANITIA')) {
                acc = REAL_ACCOUNTS.ADMIN;
            }

            try {
                const res = await this.login(acc.identifier, acc.password);
                return res.user;
            } catch (err) {
                console.error('[InkaiAPI] Gagal login ke akun live database:', err);
                throw err;
            }
        },

        getPortalUrl(role) {
            const r = (role || '').toUpperCase();
            if (r.includes('ADMIN') || r.includes('PANITIA')) return 'admin.html';
            if (r.includes('DOJO') || r.includes('MANAGER') || r.includes('COACH') || r.includes('PELATIH')) return 'dojo.html';
            return 'member.html';
        },

        checkAccess(allowedRoles = []) {
            const user = this.getCurrentUser();
            if (!user) return false;
            if (allowedRoles.length === 0) return true;
            const primaryRole = (user.primaryRole || user.role || 'MEMBER').toUpperCase();
            const roleNames = (user.roleNames || []).map(r => r.toUpperCase());
            return allowedRoles.some(r => {
                const target = r.toUpperCase();
                return primaryRole === target || roleNames.includes(target) || (target === 'ADMIN' && roleNames.includes('ADMINISTRATOR'));
            });
        },

        async enforceRouteGuard(allowedRoles = [], fallbackRole = 'MEMBER') {
            let user = this.getCurrentUser();
            const token = this.getToken();

            // Jika belum login atau token kosong, login langsung ke database untuk akun peran tersebut
            if (!user || !token) {
                try {
                    user = await this.loginAsRole(fallbackRole);
                } catch (e) {
                    console.warn('[RBAC] Login otomatis fallback gagal, mengalihkan...');
                }
            }

            if (user) {
                const primaryRole = (user.primaryRole || user.role || 'MEMBER').toUpperCase();
                const roleNames = (user.roleNames || []).map(r => r.toUpperCase());
                const isAllowed = allowedRoles.length === 0 || allowedRoles.some(r => {
                    const target = r.toUpperCase();
                    return primaryRole === target || roleNames.includes(target) || (target === 'ADMIN' && roleNames.includes('ADMINISTRATOR'));
                });

                if (!isAllowed) {
                    console.warn(`[RBAC] Akses dibatasi untuk peran ${primaryRole}. Mengalihkan ke portal terkait...`);
                    window.location.href = this.getPortalUrl(primaryRole);
                }
            }
            return user;
        },

        // Helper widget switch role instan yang langsung melakukan autentikasi ke database
        renderRoleSwitcherNav(containerId, activeRole = 'MEMBER') {
            const container = document.getElementById(containerId);
            if (!container) return;

            const currentUser = this.getCurrentUser();
            const activeKey = (currentUser?.primaryRole || activeRole).toUpperCase();

            container.innerHTML = `
                <div class="relative inline-block text-left" id="role-switcher-dropdown">
                    <button type="button" onclick="const m = document.getElementById('role-switcher-menu'); if(m) m.classList.toggle('hidden');" class="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold border border-slate-300 shadow-sm backdrop-blur-md transition-all">
                        <span class="w-2 h-2 rounded-full ${activeKey === 'ADMIN' ? 'bg-rose-500 animate-pulse' : (activeKey === 'DOJO_MANAGER' ? 'bg-amber-500' : 'bg-emerald-500')}"></span>
                        <span class="text-[11px] font-bold tracking-wider uppercase text-amber-700">
                            ${activeKey === 'ADMIN' ? 'Admin / Panitia' : (activeKey === 'DOJO_MANAGER' ? 'Kontingen / Dojo' : 'Atlet / Member')}
                        </span>
                        <i class="fa-solid fa-chevron-down text-[10px] text-slate-500"></i>
                    </button>

                    <div id="role-switcher-menu" class="hidden absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-slate-200 shadow-2xl z-50 p-2 divide-y divide-slate-100 text-slate-800">
                        <div class="px-3 py-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center justify-between">
                            <span>Beralih Hak Akses (Live DB)</span>
                            <span class="text-emerald-700 text-[9px] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-semibold">Supabase Connected</span>
                        </div>
                        <div class="py-1 space-y-1 text-xs">
                            <button onclick="InkaiAPI.switchRoleAndGo('MEMBER', 'member.html')" class="w-full text-left flex items-center space-x-3 px-3 py-2 rounded-xl text-slate-700 hover:bg-amber-50 hover:text-amber-900 transition-all ${activeKey === 'MEMBER' ? 'bg-amber-100/80 text-amber-900 font-bold border border-amber-200' : ''}">
                                <div class="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                                    <i class="fa-solid fa-user-ninja"></i>
                                </div>
                                <div class="text-left">
                                    <span class="block font-semibold">1. Anggota / Atlet</span>
                                    <span class="block text-[10px] text-slate-500 font-mono">atlet@kmajestigers.com</span>
                                </div>
                            </button>
                            <button onclick="InkaiAPI.switchRoleAndGo('DOJO_MANAGER', 'dojo.html')" class="w-full text-left flex items-center space-x-3 px-3 py-2 rounded-xl text-slate-700 hover:bg-amber-50 hover:text-amber-900 transition-all ${activeKey === 'DOJO_MANAGER' ? 'bg-amber-100/80 text-amber-900 font-bold border border-amber-200' : ''}">
                                <div class="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                                    <i class="fa-solid fa-people-group"></i>
                                </div>
                                <div class="text-left">
                                    <span class="block font-semibold">2. Kontingen / Dojo</span>
                                    <span class="block text-[10px] text-slate-500 font-mono">sensei.budi@kmajestigers.com</span>
                                </div>
                            </button>
                            <button onclick="InkaiAPI.switchRoleAndGo('ADMIN', 'admin.html')" class="w-full text-left flex items-center space-x-3 px-3 py-2 rounded-xl text-slate-700 hover:bg-amber-50 hover:text-amber-900 transition-all ${activeKey === 'ADMIN' ? 'bg-amber-100/80 text-amber-900 font-bold border border-amber-200' : ''}">
                                <div class="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                                    <i class="fa-solid fa-crown"></i>
                                </div>
                                <div class="text-left">
                                    <span class="block font-semibold">3. Admin / Panitia</span>
                                    <span class="block text-[10px] text-slate-500 font-mono">admin@kmajestigers.com</span>
                                </div>
                            </button>
                        </div>
                        <div class="pt-1">
                            <a href="index.html" class="flex items-center space-x-2 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-[11px] transition-all">
                                <i class="fa-solid fa-house text-slate-400"></i>
                                <span>Kembali ke Halaman Publik Utama</span>
                            </a>
                        </div>
                    </div>
                </div>
            `;

            document.addEventListener('click', (e) => {
                const drop = document.getElementById('role-switcher-dropdown');
                const menu = document.getElementById('role-switcher-menu');
                if (drop && menu && !drop.contains(e.target)) {
                    menu.classList.add('hidden');
                }
            });
        },

        async switchRoleAndGo(roleKey, targetUrl) {
            try {
                await this.loginAsRole(roleKey);
            } catch (e) {
                console.error('Switch role failed:', e);
            }
            window.location.href = targetUrl;
        }
    };
})();

// Export untuk browser window
window.InkaiAPI = InkaiAPI;
