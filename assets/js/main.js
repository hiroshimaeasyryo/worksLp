/**
 * 全体LP用スクリプト - ヒュッテワークス
 * data/main.json を読み込み、[data-content] で指定した要素に反映する
 */
(function () {
    'use strict';

    function getByPath(obj, path) {
        return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : null), obj);
    }

    function applyContent(data) {
        if (!data) return;
        document.querySelectorAll('[data-content]').forEach(el => {
            const key = el.getAttribute('data-content');
            const val = getByPath(data, key);
            if (val == null) return;
            // 画像用: images.xxx の場合は Data URL / URL / 相対パス(ローカル) で img を表示
            if (key && key.startsWith('images.')) {
                var inner = el.querySelector('.photo-placeholder-inner');
                if (inner) {
                    var isImageSrc = val && typeof val === 'string' && val.trim().length > 0;
                    if (isImageSrc && (val.startsWith('data:') || val.startsWith('http') || val.startsWith('https') || val.indexOf('://') < 0)) {
                        inner.style.display = 'none';
                        var img = el.querySelector('img.photo-content-img');
                        if (!img) {
                            img = document.createElement('img');
                            img.className = 'photo-content-img';
                            img.setAttribute('alt', '');
                            el.insertBefore(img, inner);
                        }
                        img.src = val;
                        img.style.display = '';
                    } else {
                        var img = el.querySelector('img.photo-content-img');
                        if (img) img.style.display = 'none';
                        inner.style.display = '';
                    }
                }
                return;
            }
            const useBr = el.hasAttribute('data-content-br');
            const hrefKey = el.getAttribute('data-content-href');
            if (hrefKey) {
                const url = getByPath(data, hrefKey);
                if (url != null) el.setAttribute('href', url);
            }
            if (el.classList.contains('cta-line-link')) {
                el.innerHTML = (typeof val === 'string' ? val : '') + ' <i class="fab fa-line text-3xl group-hover:rotate-12 transition-transform"></i>';
                return;
            }
            if (useBr) {
                el.innerHTML = String(val).replace(/\n/g, '<br>');
            } else {
                el.textContent = val;
            }
        });
        var marqueeContainer = document.getElementById('marqueeStats');
        if (marqueeContainer && data.marquee && Array.isArray(data.marquee.stats)) {
            var icons = ['fa-users', 'fa-location-dot', 'fa-user-plus'];
            var html = '';
            for (var i = 0; i < 2; i++) {
                data.marquee.stats.forEach(function (text, j) {
                    html += '<div class="flex items-center gap-4"><i class="fas ' + (icons[j % icons.length]) + ' text-3xl"></i><span class="font-heading text-2xl font-bold">' + text + '</span></div>';
                });
            }
            marqueeContainer.innerHTML = html;
        }
        var footerLocations = document.getElementById('footerLocations');
        if (footerLocations && data.footer && Array.isArray(data.footer.locations)) {
            footerLocations.innerHTML = data.footer.locations.map(function (name) {
                return '<li class="text-white/60 flex items-center gap-3"><i class="fas fa-building text-primary"></i>' + name + '</li>';
            }).join('');
        }
        var companyLogos = document.getElementById('companyLogos');
        if (companyLogos && data.companies && Array.isArray(data.companies)) {
            companyLogos.innerHTML = data.companies.map(function (c) {
                var nameEscaped = (c.name || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
                var hasLogo = c.logo && typeof c.logo === 'string' && c.logo.trim().length > 0;
                var logoImgHtml = '';
                if (hasLogo) {
                    var srcEscaped = c.logo.replace(/\\/g, '\\\\').replace(/"/g, '&quot;');
                    logoImgHtml = '<img src="' + srcEscaped + '" alt="' + nameEscaped + '" class="company-logo-bg-img" onerror="this.style.display=\'none\';var s=this.parentElement.querySelector(\'.company-logo-fallback\');if(s)s.style.display=\'flex\';">';
                }
                var fallbackHtml = '<div class="company-logo-fallback text-4xl text-white/10 absolute inset-0 flex items-center justify-center" style="' + (hasLogo ? 'display:none' : 'display:flex') + '"><i class="fas fa-briefcase"></i></div>';

                return '<div class="company-logo glass rounded-2xl overflow-hidden flex items-center justify-center aspect-video hover:border-primary/50 border border-transparent transition-all cursor-pointer relative group">' +
                    logoImgHtml + fallbackHtml +
                    '<div class="relative z-10 w-full h-full flex items-center justify-center bg-dark/20 group-hover:bg-dark/0 transition-colors duration-500">' +
                    '<p class="company-name text-white/60 group-hover:text-white font-bold text-sm tracking-wider text-center px-4 transition-all duration-300">' + nameEscaped + '</p></div></div>';
            }).join('');
        }
    }

    /** モバイル時: ヒーロー背景を左端表示し、スクロールに応じて緩やかに右へパン */
    function initHeroBgScroll() {
        var hero = document.getElementById('hero-section');
        var heroBg = document.querySelector('.hero-bg-placeholder .photo-content-img');
        if (!hero || !heroBg) return;

        var ticking = false;
        var mobileQuery = window.matchMedia('(max-width: 768px)');
        var panEndPercent = 45;

        function updateHeroBgPosition() {
            if (!mobileQuery.matches) {
                heroBg.style.objectPosition = 'center center';
                return;
            }
            var heroHeight = hero.offsetHeight;
            var scrollY = window.scrollY || window.pageYOffset;
            var progress = Math.min(1, Math.max(0, scrollY / heroHeight));
            var x = progress * panEndPercent;
            heroBg.style.objectPosition = x + '% 50%';
        }

        function onScrollOrResize() {
            if (!ticking) {
                requestAnimationFrame(function () {
                    updateHeroBgPosition();
                    ticking = false;
                });
                ticking = true;
            }
        }

        window.addEventListener('scroll', onScrollOrResize, { passive: true });
        window.addEventListener('resize', onScrollOrResize);
        updateHeroBgPosition();
    }

    function loadMainData() {
        fetch('data/main.json')
            .then(function (res) { return res.ok ? res.json() : null; })
            .then(function (data) {
                applyContent(data);
                initHeroBgScroll();
                return data;
            })
            .catch(function () { });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadMainData);
    } else {
        loadMainData();
    }

    // スクロールプログレスバー
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        window.addEventListener('scroll', () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = (scrollTop / docHeight) * 100;
            progressBar.style.transform = `scaleX(${scrollPercent / 100})`;
        });
    }

    // Intersection Observer
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('[data-scroll]').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(50px)';
        el.style.transition = 'all 1s cubic-bezier(0.22, 1, 0.36, 1)';
        observer.observe(el);
    });

    // パララックス効果
    const heroTextLines = document.querySelectorAll('.hero-text-line');
    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        heroTextLines.forEach(line => {
            const speed = parseFloat(line.dataset.scrollSpeed) || 0;
            line.style.transform = `translateY(${scrolled * speed}px)`;
        });
    });

    // ヒーロー要素のアニメーション
    const animateHero = () => {
        const subtitle = document.getElementById('heroSubtitle');
        const cta = document.getElementById('heroCTA');
        if (!subtitle || !cta) return;

        setTimeout(() => {
            subtitle.style.opacity = '1';
            subtitle.style.transform = 'translateY(0)';
        }, 800);

        setTimeout(() => {
            cta.style.opacity = '1';
            cta.style.transform = 'translateY(0)';
        }, 1200);
    };

    const heroSubtitle = document.getElementById('heroSubtitle');
    const heroCTA = document.getElementById('heroCTA');
    if (heroSubtitle) heroSubtitle.style.cssText = 'opacity: 0; transform: translateY(30px); transition: all 0.8s ease-out;';
    if (heroCTA) heroCTA.style.cssText = 'opacity: 0; transform: translateY(30px); transition: all 0.8s ease-out;';

    window.addEventListener('load', animateHero);

    // スムーススクロール
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // 3Dカードホバー
    document.querySelectorAll('.problem-card, .story-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
        });
    });
})();
