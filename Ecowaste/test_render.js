
const document = { createElement: () => ({ style: {} }), appendChild: () => {},  getElementById: () => ({ innerHTML: '' }), querySelectorAll: () => [] };
const window = { location: { protocol: 'http:', host: 'localhost:3002' } };
const localStorage = { getItem: () => null, setItem: () => {} };
function escapeHtml(value) { return String(value); }
function normalizeMedia(url) { return { type: 'image', url: url || '' }; }
function formatDate(value) { return 'Just now'; }


        // Leaf Confetti Effect
        function throwLeaves() {
            for(let i=0; i<40; i++) {
                const leaf = document.createElement('div');
                leaf.className = 'leaf-confetti';
                leaf.style.left = (Math.random() * 100) + 'vw';
                leaf.style.animationDuration = (Math.random() * 3 + 2) + 's';
                leaf.style.animationDelay = (Math.random() * 0.5) + 's';
                // Randomize leaf colors slightly
                leaf.style.filter = `hue-rotate(${Math.random() * 80 - 40}deg)`;
                document.body.appendChild(leaf);
                setTimeout(() => leaf.remove(), 5000);
            }
        }

        // Create animated particles
        function createParticles() {
            const container = document.getElementById('particles');
            for(let i=0; i<20; i++) {
                const p = document.createElement('div');
                p.className = 'particle';
                const size = Math.random() * 10 + 4;
                p.style.width = size + 'px';
                p.style.height = size + 'px';
                p.style.left = Math.random() * 100 + 'vw';
                p.style.animationDuration = (Math.random() * 15 + 10) + 's';
                p.style.animationDelay = (Math.random() * 10) + 's';
                container.appendChild(p);
            }
        }
        createParticles();

        // Rotating Slogans
        const slogans = [
            "Small acts, when multiplied by millions of people, can transform the world.",
            "Recycle today for a better tomorrow.",
            "Nature provides a free lunch, but only if we control our appetites.",
            "Be a part of the solution, not part of the pollution.",
            "Every leaf counts. Every bottle sorted matters.",
            "Let's nurture the nature so that we can have a better future."
        ];
        let currentSloganIdx = 0;
        setInterval(() => {
            currentSloganIdx = (currentSloganIdx + 1) % slogans.length;
            const el = document.getElementById('slogan-text');
            if(el) {
                el.style.animation = 'none';
                el.offsetHeight; 
                el.style.animation = null; 
                el.textContent = `"${slogans[currentSloganIdx]}"`;
            }
        }, 8000);

        function resolveApiBase() {
            if (window.location.protocol === 'file:') return 'http://localhost:3002/api';
            const host = window.location.host.toLowerCase();
            if (host === 'localhost:3002' || host === '127.0.0.1:3002') return '/api';
            return 'http://localhost:3002/api';
        }

        const API_BASE = resolveApiBase();
        let selectedImageData = '';
        let currentFilter = 'all';

        function escapeHtml(value) {
            return String(value ?? '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        function applyTheme(mode) {
            const dark = mode === 'dark';
            document.body.classList.toggle('dark-mode', dark);
            const button = document.getElementById('theme-toggle');
            if (button) {
                button.innerHTML = dark
                    ? '<i class="fa-solid fa-sun mr-2 text-yellow-300"></i> Light Mode'
                    : '<i class="fa-solid fa-moon mr-2 text-slate-300"></i> Dark Mode';
                button.className = dark 
                    ? "px-5 py-2.5 rounded-xl font-bold bg-slate-100 text-slate-800 hover:bg-white transition-all shadow-md"
                    : "px-5 py-2.5 rounded-xl font-bold bg-slate-800 text-white hover:bg-slate-700 transition-all shadow-md";
            }
        }

        function initThemeToggle() {
            const button = document.getElementById('theme-toggle');
            if (!button) return;
            applyTheme(localStorage.getItem('ecoSortTheme') || 'light');
            button.addEventListener('click', () => {
                const next = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
                localStorage.setItem('ecoSortTheme', next);
                applyTheme(next);
            });
        }

        function communityEndpoints() {
            const root = API_BASE.endsWith('/api') ? API_BASE.slice(0, -4) : API_BASE;
            return [`${API_BASE}/community/posts`, `${root}/community/posts`];
        }

        async function communityRequest(method = 'GET', body = null) {
            const endpoints = communityEndpoints();
            let lastError = null;
            for (const url of endpoints) {
                try {
                    const response = await fetch(url, {
                        method,
                        headers: { 'Content-Type': 'application/json' },
                        body: body ? JSON.stringify(body) : undefined
                    });
                    const data = await response.json().catch(() => ({}));
                    if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
                    return data;
                } catch (error) {
                    lastError = error;
                }
            }
            throw lastError || new Error('Community service unavailable');
        }

        function formatDate(value) {
            const d = new Date(value);
            if (Number.isNaN(d.getTime())) return 'Just now';
            return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        }

        function normalizeMedia(url) {
            const val = String(url || '').trim();
            if (!val) return { type: 'none', url: '' };
            if (val.startsWith('data:image/')) return { type: 'image', url: val };
            if (val.startsWith('assets/')) return { type: 'image', url: val };
            
            const ytMatch = val.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
            if(ytMatch) {
                return { type: 'youtube', url: `https://www.youtube.com/embed/${ytMatch[1]}` };
            }
            if(val.toLowerCase().endsWith('.mp4')) {
                return { type: 'video', url: val };
            }
            if (/^https?:\/\//i.test(val)) return { type: 'image', url: val };
            return { type: 'none', url: '' };
        }

        window.toggleLike = function(btn) {
            btn.classList.toggle('liked');
            const icon = btn.querySelector('i');
            if(btn.classList.contains('liked')) {
                icon.classList.remove('fa-regular');
                icon.classList.add('fa-solid');
                let countSpan = btn.querySelector('.count');
                if(countSpan) countSpan.textContent = parseInt(countSpan.textContent || '0') + 1;
                // Add a micro burst
                btn.style.transform = 'scale(1.2)';
                setTimeout(()=> btn.style.transform = '', 200);
            } else {
                icon.classList.remove('fa-solid');
                icon.classList.add('fa-regular');
                let countSpan = btn.querySelector('.count');
                if(countSpan) countSpan.textContent = Math.max(0, parseInt(countSpan.textContent || '1') - 1);
            }
        }

        // Logic for voting on a poll
        window.votePoll = function(element, text) {
            const bar = element.querySelector('.poll-bar');
            const pctText = element.querySelector('.pct-text');
            if(!bar.dataset.voted) {
                bar.style.width = bar.dataset.targetWidth;
                pctText.classList.remove('hidden');
                bar.dataset.voted = 'true';
                element.style.background = 'rgba(16, 185, 129, 0.3)';
                throwLeaves(); // Small confetti for voting
            }
        }

        window.deletePost = async function(id, author) {
            if(!confirm('Are you sure you want to delete this post?')) return;
            
            try {
                const url = (API_BASE.endsWith('/api') ? API_BASE.slice(0, -4) : API_BASE) + `/community/posts/${id}?author=${encodeURIComponent(author)}`;
                const res = await fetch(url, { method: 'DELETE' });
                if (!res.ok) throw new Error('Delete failed');
                
                if (window.__communityPosts) {
                    window.__communityPosts = window.__communityPosts.filter(p => p.id !== id);
                    renderPosts(window.__communityPosts);
                    setFeedback('Post deleted successfully.', true);
                }
            } catch (err) {
                console.error(err);
                // Fallback local delete
                if (window.__communityPosts) {
                    window.__communityPosts = window.__communityPosts.filter(p => p.id !== id);
                    renderPosts(window.__communityPosts);
                    setFeedback('Post deleted locally (Backend offline).', true);
                }
            }
        };

        function renderPosts(posts) {
            const feed = document.getElementById('community-feed');
            if (!feed) return;

            const filtered = (posts || []).filter((p) => currentFilter === 'all' || p.type === currentFilter);
            if (!filtered.length) {
                feed.innerHTML = '<div class="text-center py-10 text-color-muted font-bold">No posts here yet. Be the first! 🌱</div>';
                return;
            }

            let currentUserName = 'EcoWarrior';
            const storedUserStr = localStorage.getItem('ecoSortUser');
            if (storedUserStr) {
                try {
                    const parsedUser = JSON.parse(storedUserStr);
                    currentUserName = parsedUser.name || parsedUser.email || 'EcoWarrior';
                } catch(e) {}
            }

            feed.innerHTML = filtered.reverse().map((post, i) => {
                const media = normalizeMedia(post.imageUrl);
                const type = post.isPoll ? 'poll' : (post.type === 'story' ? 'story' : 'chat');
                const author = post.author || 'Anonymous';
                const initial = author.charAt(0).toUpperCase();
                
                // Add a crown to top users
                const isTopUser = ['Sarah J.', 'Sarah Jenkins'].includes(author);
                const avatarClass = isTopUser ? 'avatar top-user' : 'avatar';

                let mediaHtml = '';
                if(media.type === 'image') {
                    mediaHtml = `<img src="${escapeHtml(media.url)}" onerror="this.style.display='none'" class="mt-4 w-full max-h-96 object-cover rounded-xl shadow-md border border-emerald-500/10" alt="Post media">`;
                } else if(media.type === 'youtube') {
                    mediaHtml = `<div class="video-container mt-4 shadow-md border border-emerald-500/10"><iframe src="${media.url}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
                } else if(media.type === 'video') {
                    mediaHtml = `<div class="video-container mt-4 shadow-md border border-emerald-500/10"><video controls src="${escapeHtml(media.url)}"></video></div>`;
                }

                let pollHtml = '';
                if(post.isPoll && post.pollOptions) {
                    const totalVotes = post.pollOptions.reduce((acc, o) => acc + o.votes, 0) + 1; // +1 for user
                    pollHtml = '<div class="poll-container space-y-2 mt-4">';
                    post.pollOptions.forEach(opt => {
                        const pct = Math.round((opt.votes / totalVotes) * 100);
                        pollHtml += `
                            <div class="poll-option flex items-center" onclick="votePoll(this, '${escapeHtml(opt.text)}')">
                                <div class="poll-bar" data-target-width="${pct}%"></div>
                                <div class="flex justify-between items-center w-full poll-content">
                                    <span class="text-color-main">${escapeHtml(opt.text)}</span>
                                    <span class="pct-text hidden text-emerald-700 font-extrabold">${pct}%</span>
                                </div>
                            </div>
                        `;
                    });
                    pollHtml += '</div>';
                }

                const dummyLikes = Math.floor(Math.random() * 40);
                const dummyComments = Math.floor(Math.random() * 15);

                let typeLabel = '💬 Chat';
                if(type === 'story') typeLabel = '📸 Story';
                if(type === 'poll') typeLabel = '📊 Poll';

                const deleteBtnHtml = (author === currentUserName) ? 
                    `<button class="text-red-500 hover:text-red-700 transition ml-3" onclick="deletePost('${post.id}', '${escapeHtml(author)}')" title="Delete Post"><i class="fa-solid fa-trash"></i></button>` : '';

                return `
                    <article class="feed-card" style="animation-delay: ${i * 0.1}s">
                        <div class="flex items-center justify-between mb-3">
                            <div class="flex items-center gap-3">
                                <div class="${avatarClass}">${initial}</div>
                                <div>
                                    <h3 class="font-extrabold text-color-main text-base leading-none">${escapeHtml(author)}</h3>
                                    <span class="text-xs font-bold text-color-muted">${formatDate(post.createdAt)}</span>
                                </div>
                            </div>
                            <div class="flex items-center">
                                <span class="chip ${type}">${typeLabel}</span>
                                ${deleteBtnHtml}
                            </div>
                        </div>
                        <p class="text-[15px] text-color-main font-medium leading-relaxed mt-2">${escapeHtml(post.text || '')}</p>
                        ${mediaHtml}
                        ${pollHtml}
                        <div class="mt-4 pt-4 border-t border-emerald-500/10 flex gap-2">
                            <button class="post-action" onclick="toggleLike(this)">
                                <i class="fa-regular fa-heart text-lg"></i> <span class="count">${dummyLikes}</span>
                            </button>
                            <button class="post-action" onclick="alert('Comments feature coming soon!')">
                                <i class="fa-regular fa-comment text-lg"></i> ${dummyComments}
                            </button>
                            <button class="post-action ml-auto" onclick="alert('Shared to your network!')">
                                <i class="fa-solid fa-share text-lg"></i> Share
                            </button>
                        </div>
                    </article>
                `;
            }).join('');
        }

        function setFeedback(message, ok) {
            const el = document.getElementById('community-feedback');
            if (!el) return;
            el.textContent = message;
            el.className = `text-sm font-extrabold mt-3 p-2 rounded-lg ${ok ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}`;
            el.classList.remove('hidden');
            setTimeout(() => el.classList.add('hidden'), 4000);
        }

        const DUMMY_POSTS = [
            { author: "Sarah Jenkins", type: "story", text: "We had a great time at the Riverside Park cleanup today! Collected 20 bags of plastic. 🌿💚", imageUrl: "assets/images/cleanup-drive-new.png", createdAt: new Date(Date.now() - 3600000).toISOString() },
            { author: "Community Mod", type: "chat", isPoll: true, text: "Hey Eco-Warriors! What should our next major community event focus on?", pollOptions: [{text: "River Cleanup", votes: 45}, {text: "Tree Planting", votes: 82}, {text: "E-Waste Collection", votes: 20}], imageUrl: "", createdAt: new Date(Date.now() - 5000000).toISOString() },
            { author: "EcoDude", type: "chat", text: "Does anyone know if the new smart bins accept type 5 plastics?", imageUrl: "", createdAt: new Date(Date.now() - 7200000).toISOString() },
            { author: "City Council", type: "story", text: "New smart bins deployed across downtown! Watch the video of the installation.", imageUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", createdAt: new Date(Date.now() - 86400000).toISOString() },
            { author: "GreenLife", type: "story", text: "Our community garden is blooming! First batch of organic tomatoes is ready.", imageUrl: "assets/images/eco-bins-new.png", createdAt: new Date(Date.now() - 172800000).toISOString() }
        ];

        async function loadPosts() {
            const updated = document.getElementById('community-updated');
            try {
                const data = await communityRequest('GET');
                window.__communityPosts = data.posts && data.posts.length > 0 ? data.posts : DUMMY_POSTS;
                renderPosts(window.__communityPosts);
                if (updated) updated.textContent = `Live Updates • ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
            } catch (error) {
                window.__communityPosts = DUMMY_POSTS;
                renderPosts(window.__communityPosts);
                if (updated) updated.textContent = 'Offline (Cached)';
            }
        }

        

        function initFilterButtons() {
            const chatBtn = document.getElementById('filter-chat');
            const storyBtn = document.getElementById('filter-story');
            if (chatBtn) chatBtn.addEventListener('click', () => { currentFilter = 'chat'; renderPosts(window.__communityPosts || []); });
            if (storyBtn) storyBtn.addEventListener('click', () => { currentFilter = 'story'; renderPosts(window.__communityPosts || []); });
            document.querySelectorAll('button').forEach(btn => {
                if(btn.textContent.includes('All Posts')) {
                    btn.addEventListener('click', () => { currentFilter = 'all'; renderPosts(window.__communityPosts || []); });
                }
            });
        }

        function initImageInput() {
            const input = document.getElementById('community-image-file');
            const preview = document.getElementById('community-image-preview');
            if (!input || !preview) return;

            input.addEventListener('change', () => {
                const file = input.files && input.files[0];
                if (!file) {
                    selectedImageData = '';
                    preview.classList.add('hidden');
                    preview.src = '';
                    return;
                }
                if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
                    setFeedback('Please choose an image or video file.', false);
                    input.value = '';
                    return;
                }
                if (file.size > 20 * 1024 * 1024) {
                    setFeedback('File is too large. Please use a file under 20MB.', false);
                    input.value = '';
                    return;
                }

                const reader = new FileReader();
                reader.onload = (event) => {
                    selectedImageData = String(event.target?.result || '');
                    if(file.type.startsWith('image/')) {
                        preview.src = selectedImageData;
                        preview.classList.remove('hidden');
                    } else {
                        preview.src = 'https://via.placeholder.com/400x200.png?text=Video+Ready+to+Upload';
                        preview.classList.remove('hidden');
                    }
                };
                reader.readAsDataURL(file);
            });
        }

        function initForm() {
            const form = document.getElementById('community-form');
            if (!form) return;

            form.addEventListener('submit', async (event) => {
                event.preventDefault();
                const submitBtn = document.getElementById('community-submit');
                const originalHtml = submitBtn.innerHTML;
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Publishing...';

                let fallbackName = 'EcoWarrior';
                const storedUserStr = localStorage.getItem('ecoSortUser');
                if (storedUserStr) {
                    try {
                        const parsedUser = JSON.parse(storedUserStr);
                        fallbackName = parsedUser.name || parsedUser.email || 'EcoWarrior';
                    } catch(e) {}
                }
                localStorage.setItem('ecoSortCommunityName', fallbackName);

                const payload = {
                    author: fallbackName,
                    type: document.getElementById('community-type').value,
                    text: document.getElementById('community-text').value.trim(),
                    imageUrl: selectedImageData || document.getElementById('community-image-url').value.trim()
                };

                if (!payload.text || payload.text.length < 3) {
                    setFeedback('Message must be at least 3 characters long.', false);
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalHtml;
                    return;
                }

                // Validate imageUrl if provided
                if (payload.imageUrl && !payload.imageUrl.startsWith('data:')) {
                    try {
                        new URL(payload.imageUrl);
                    } catch (_) {
                        setFeedback('Image URL is not a valid URL. Please check and try again.', false);
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalHtml;
                        return;
                    }
                }

                try {
                    await communityRequest('POST', payload);
                    setFeedback('Awesome! Post shared successfully. 🌱', true);
                    form.reset();
                    selectedImageData = '';
                    const preview = document.getElementById('community-image-preview');
                    preview.src = '';
                    preview.classList.add('hidden');
                    throwLeaves(); // CONFETTI EFFECT
                    await loadPosts();
                } catch (error) {
                    const newPost = {
                        author: fallbackName,
                        type: payload.type,
                        text: payload.text,
                        imageUrl: payload.imageUrl,
                        createdAt: new Date().toISOString()
                    };
                    if(!window.__communityPosts) window.__communityPosts = [];
                    window.__communityPosts.push(newPost);
                    renderPosts(window.__communityPosts);
                    setFeedback('Post shared locally (Backend offline). 🌱', true);
                    form.reset();
                    selectedImageData = '';
                    const preview = document.getElementById('community-image-preview');
                    preview.src = '';
                    preview.classList.add('hidden');
                    throwLeaves(); // CONFETTI EFFECT
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalHtml;
                }
            });
        }

        document.addEventListener('DOMContentLoaded', () => {
            initThemeToggle();
            
            initFilterButtons();
            initImageInput();
            initForm();
            loadPosts();

            // Intermittent typing indicator logic
            setInterval(() => {
                const typingEl = document.getElementById('live-typing');
                const textEl = document.getElementById('live-typing-text');
                const names = ['EcoDude', 'Sarah J.', 'GreenQueen', 'PlantLover99'];
                if(Math.random() > 0.5) {
                    textEl.innerText = names[Math.floor(Math.random() * names.length)] + ' is typing...';
                    typingEl.style.opacity = '1';
                } else {
                    typingEl.style.opacity = '0';
                }
            }, 6000);
        });
    

try {
    renderPosts([{ author: 'Test', type: 'chat', text: 'Hello', createdAt: new Date().toISOString() }]);
    console.log('renderPosts SUCCESS');
} catch (e) {
    console.error('renderPosts ERROR:', e);
}
