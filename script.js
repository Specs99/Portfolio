document.addEventListener('DOMContentLoaded', () => {
    // Premium Custom Cursor Logic
    const cursorDot = document.getElementById('cursor-dot');
    const cursorOutline = document.getElementById('cursor-outline');

    if (cursorDot && cursorOutline) {
        let mouseX = 0, mouseY = 0;
        let outlineX = 0, outlineY = 0;

        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            cursorDot.style.left = mouseX + 'px';
            cursorDot.style.top = mouseY + 'px';
        });

        // Smooth follow animation for outline cursor
        const animateOutline = () => {
            let ease = 0.15; // Smoothness factor
            outlineX += (mouseX - outlineX) * ease;
            outlineY += (mouseY - outlineY) * ease;
            cursorOutline.style.left = outlineX + 'px';
            cursorOutline.style.top = outlineY + 'px';
            requestAnimationFrame(animateOutline);
        };
        animateOutline();

        // Add hover classes
        const interactiveElements = document.querySelectorAll('a, button, input, textarea, select, summary, details');
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
            el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
        });
    }

    // Custom Sliding Loading Screen Logic
    const loader = document.getElementById('loader');
    const loaderBar = loader ? loader.querySelector('.loader-bar') : null;
    const loaderStatus = loader ? loader.querySelector('.loader-status') : null;

    if (loader && loaderBar) {
        let progress = 0;
        const statusMessages = [
            "Initializing Neural Interface...",
            "Loading Graphic Synthesizers...",
            "Optimizing Core Layout...",
            "Establishing Secure Tunnel...",
            "Ready."
        ];

        const interval = setInterval(() => {
            progress += Math.floor(Math.random() * 15) + 5;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                loaderBar.style.width = '100%';
                if (loaderStatus) loaderStatus.textContent = "Ready.";
                setTimeout(() => {
                    loader.classList.add('loaded');
                }, 400);
            } else {
                loaderBar.style.width = progress + '%';
                // Rotate status message
                const msgIndex = Math.min(Math.floor(progress / 25), statusMessages.length - 1);
                if (loaderStatus) loaderStatus.textContent = statusMessages[msgIndex];
            }
        }, 120);
    }

    // Intersection Observer for scroll animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    const fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach(el => observer.observe(el));

    // Grid overlay + WebGL fade + Navbar Disappear on Scroll logic
    const gridOverlay = document.getElementById('grid-overlay');
    const webglCanvas = document.getElementById('webgl-bg');
    const heroSection = document.getElementById('hero');
    const navbar = document.querySelector('.navbar');
    let lastScrollY = window.scrollY;

    // Mobile Menu Toggle Logic
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const navLinks = document.getElementById('nav-links');

    if (mobileMenuToggle && navLinks) {
        mobileMenuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const icon = mobileMenuToggle.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.className = 'fas fa-times';
            } else {
                icon.className = 'fas fa-bars';
            }
        });

        // Close menu when a link is clicked
        const links = navLinks.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                const icon = mobileMenuToggle.querySelector('i');
                if (icon) icon.className = 'fas fa-bars';
            });
        });
    }

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;

        // Hide/Show Navbar on Scroll Direction
        if (navbar) {
            if (scrollY > lastScrollY && scrollY > 100) {
                navbar.classList.add('nav-hidden');
            } else {
                navbar.classList.remove('nav-hidden');
            }
        }
        lastScrollY = scrollY;

        if (gridOverlay && webglCanvas && heroSection) {
            const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
            // Calculate transition progress (0 at hero top, 1 when past hero)
            const progress = Math.min(Math.max((scrollY - heroBottom * 0.4) / (heroBottom * 0.6), 0), 1);

            // Fade in grid lines as you scroll past hero
            if (progress > 0.1) {
                gridOverlay.classList.add('active');
            } else {
                gridOverlay.classList.remove('active');
            }

            // Fade out WebGL canvas as you scroll down
            webglCanvas.style.opacity = 1 - progress * 0.85;
            
            // Pause WebGL rendering when scrolled out of view to optimize mobile performance
            window.isWebGLPaused = scrollY > heroBottom;
        }
    }, { passive: true });

    // WebGL Background
    initWebGLBg();
});

function initWebGLBg() {
    const canvas = document.getElementById('webgl-bg');
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) {
        console.warn('WebGL fallback to 2D context');
        initCanvas2D(canvas);
        return;
    }

    // Vertex Shader Source
    const vsSource = `
        attribute vec3 aPosition;
        uniform float uTime;
        uniform vec2 uResolution;
        uniform vec2 uMouse;
        uniform float uAlphaMultiplier;
        varying float vAlpha;
        void main() {
            // Gentle wave motions
            float waveX = sin(uTime * 0.3 + aPosition.y * 0.002) * 40.0;
            float waveY = cos(uTime * 0.35 + aPosition.x * 0.002) * 40.0;
            
            vec3 pos = aPosition;
            pos.x += waveX;
            pos.y += waveY;
            
            // Smooth mouse repulsion
            vec2 screenPos = pos.xy / uResolution;
            vec2 mousePos = uMouse / uResolution;
            float dist = distance(screenPos, mousePos);
            
            if (dist < 0.25) {
                float force = (1.0 - (dist / 0.25)) * 60.0;
                vec2 dir = normalize(screenPos - mousePos);
                pos.xy += dir * force;
            }
            
            // Convert to clip space [-1.0, 1.0]
            vec2 clipSpace = (pos.xy / uResolution) * 2.0 - 1.0;
            gl_Position = vec4(clipSpace * vec2(1.0, -1.0), 0.0, 1.0);
            
            // Dynamic sizing
            gl_PointSize = aPosition.z + sin(uTime * 2.0 + aPosition.x) * 0.5;
            
            // Gentle alpha pulsing with theme multiplier
            vAlpha = uAlphaMultiplier * (0.08 + sin(uTime * 0.5 + aPosition.y) * 0.04);
        }
    `;

    // Fragment Shader Source
    const fsSource = `
        precision mediump float;
        varying float vAlpha;
        uniform vec3 uColor;
        void main() {
            // Draw soft round dots
            float dist = distance(gl_PointCoord, vec2(0.5, 0.5));
            if (dist > 0.5) discard;
            gl_FragColor = vec4(uColor, vAlpha * (1.0 - dist * 2.0));
        }
    `;

    function createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compiler error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Shader linking failed:', gl.getProgramInfoLog(program));
        return;
    }

    gl.useProgram(program);

    // Attribute/Uniform locations
    const positionLoc = gl.getAttribLocation(program, 'aPosition');
    const timeLoc = gl.getUniformLocation(program, 'uTime');
    const resolutionLoc = gl.getUniformLocation(program, 'uResolution');
    const mouseLoc = gl.getUniformLocation(program, 'uMouse');
    const colorLoc = gl.getUniformLocation(program, 'uColor');
    const alphaMultiplierLoc = gl.getUniformLocation(program, 'uAlphaMultiplier');

    let particles = [];
    const isMobile = window.innerWidth < 768;
    const count = isMobile ? 75 : 280; // Performance optimized for mobile screen processors

    function generateParticles() {
        particles = [];
        const width = canvas.width;
        const height = canvas.height;
        for (let i = 0; i < count; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = 1.0 + Math.random() * 2.0;
            particles.push(x, y, size);
        }
    }

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
        generateParticles();
    }
    window.addEventListener('resize', resize);
    resize();

    let mouse = { x: -9999, y: -9999 };
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });
    window.addEventListener('mouseleave', () => {
        mouse.x = -9999;
        mouse.y = -9999;
    });

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    const startTime = Date.now();

    function render() {
        // Pause loop if scrolled past viewport (performance safeguard for mobile devices)
        if (window.isWebGLPaused) {
            requestAnimationFrame(render);
            return;
        }

        const time = (Date.now() - startTime) / 1000.0;
        
        gl.useProgram(program);

        // Dynamically toggle colors based on light/dark mode
        if (document.body.classList.contains('light-mode')) {
            gl.clearColor(0.988, 0.988, 0.988, 1.0); // #fcfcfc (pure light)
            gl.uniform3f(colorLoc, 0.05, 0.05, 0.05); // black particles
            gl.uniform1f(alphaMultiplierLoc, 4.0); // 4x opacity boost for high visibility on light background
        } else {
            gl.clearColor(0.02, 0.02, 0.03, 1.0); // #060608 (pure dark)
            gl.uniform3f(colorLoc, 0.6, 0.6, 0.7); // light blueish glowing particles
            gl.uniform1f(alphaMultiplierLoc, 1.0); // normal glow
        }
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(particles), gl.DYNAMIC_DRAW);

        gl.enableVertexAttribArray(positionLoc);
        gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);

        gl.uniform1f(timeLoc, time);
        gl.uniform2f(resolutionLoc, canvas.width, canvas.height);
        gl.uniform2f(mouseLoc, mouse.x, mouse.y);

        gl.drawArrays(gl.POINTS, 0, count);

        requestAnimationFrame(render);
    }
    render();
}

// Resilient fallback implementation using 2D Canvas in case WebGL is blocked/disabled
function initCanvas2D(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles = [];
    const isMobile = window.innerWidth < 768;
    const count = isMobile ? 30 : 80; // Performance friendly particle pool on mobiles

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        particles = [];
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                radius: 1 + Math.random() * 2
            });
        }
    }
    window.addEventListener('resize', resize);
    resize();

    let mouse = { x: -9999, y: -9999 };
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    function draw() {
        // Pause loop if scrolled past viewport (performance safeguard for mobile devices)
        if (window.isWebGLPaused) {
            requestAnimationFrame(draw);
            return;
        }

        // Dynamically toggle colors based on light/dark mode
        if (document.body.classList.contains('light-mode')) {
            ctx.fillStyle = '#fcfcfc'; // #fcfcfc (pure light)
        } else {
            ctx.fillStyle = '#060608'; // #060608 (pure dark)
        }
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Dynamically set particle colors based on light/dark mode
        if (document.body.classList.contains('light-mode')) {
            ctx.fillStyle = 'rgba(20, 20, 30, 0.45)'; // dark particles (opacity boosted for light background)
        } else {
            ctx.fillStyle = 'rgba(150, 150, 165, 0.15)'; // light glowing particles
        }
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;

            // Bounce check
            if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

            // Mouse interaction
            let dx = p.x - mouse.x;
            let dy = p.y - mouse.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150) {
                let force = (150 - dist) / 150;
                p.x += (dx / dist) * force * 2;
                p.y += (dy / dist) * force * 2;
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
        });

        requestAnimationFrame(draw);
    }
    draw();
}


// --- Theme Toggle Logic ---
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;

// Function to set the theme
const setTheme = (isDark) => {
    if (isDark) {
        body.classList.add('dark-mode');
        body.classList.remove('light-mode');
        localStorage.setItem('theme', 'dark');
        document.getElementById('theme-icon').className = 'fas fa-moon'; // Change icon to moon
    } else {
        body.classList.add('light-mode');
        body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
        document.getElementById('theme-icon').className = 'fas fa-sun'; // Change icon to sun
    }
};

// 1. Check for saved theme preference on load
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    setTheme(true);
} else if (savedTheme === 'light') {
    setTheme(false);
} else {
    // Default to light mode if no preference is set
    setTheme(false);
}

// 2. Add event listener for the toggle button
if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const isCurrentlyDark = body.classList.contains('dark-mode');
        // Toggle the theme state
        setTheme(!isCurrentlyDark);
    });
}


// --- Contact Form Handling (Hardened) ---
document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        // Inject hidden honeypot field (bots fill this, humans don't see it)
        const honeypot = document.createElement('input');
        honeypot.type = 'text';
        honeypot.name = '_honeypot';
        honeypot.id = '_honeypot';
        honeypot.tabIndex = -1;
        honeypot.autocomplete = 'off';
        honeypot.style.cssText = 'opacity:0;position:absolute;top:0;left:0;height:0;width:0;z-index:-1;overflow:hidden;pointer-events:none;';
        honeypot.setAttribute('aria-hidden', 'true');
        contactForm.prepend(honeypot);

        // Client-side rate limiter
        let submitTimestamps = [];
        const CLIENT_RATE_LIMIT = 3;        // max submissions
        const CLIENT_RATE_WINDOW = 60000;   // per minute

        // Sanitizer
        function sanitizeInput(str) {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML.trim();
        }

        // Email validator
        function isValidEmail(email) {
            return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(email) && email.length <= 254;
        }

        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Honeypot check — if filled, silently reject
            if (honeypot.value) {
                contactForm.reset();
                return;
            }

            // Client-side rate limit
            const now = Date.now();
            submitTimestamps = submitTimestamps.filter(ts => now - ts < CLIENT_RATE_WINDOW);
            if (submitTimestamps.length >= CLIENT_RATE_LIMIT) {
                alert('You are submitting too quickly. Please wait a moment.');
                return;
            }
            submitTimestamps.push(now);

            const name = document.getElementById('form-name').value.trim();
            const email = document.getElementById('form-email').value.trim();
            const message = document.getElementById('form-message').value.trim();
            const submitBtn = contactForm.querySelector('button[type="submit"]');

            // Field validation
            if (!name || !email || !message) {
                alert('Please fill in all fields.');
                return;
            }
            if (name.length > 100) {
                alert('Name must be under 100 characters.');
                return;
            }
            if (!isValidEmail(email)) {
                alert('Please enter a valid email address.');
                return;
            }
            if (message.length > 2000) {
                alert('Message must be under 2000 characters.');
                return;
            }

            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;

            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: sanitizeInput(name),
                        email: sanitizeInput(email),
                        message: sanitizeInput(message),
                        _honeypot: honeypot.value
                    })
                });

                if (response.ok) {
                    alert('Message sent successfully! Thank you for reaching out.');
                    contactForm.reset();
                } else if (response.status === 429) {
                    alert('Too many requests. Please wait a moment before trying again.');
                } else {
                    const data = await response.json().catch(() => ({}));
                    alert(data.error || 'Failed to send message. Please try again later.');
                }
            } catch (error) {
                alert('An error occurred. Please check your connection and try again.');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // --- Music Player Handling ---
    const musicToggleBtn = document.getElementById('music-toggle');
    const musicIcon = document.getElementById('music-icon');
    const bgMusic = document.getElementById('bg-music');
    
    if (musicToggleBtn && bgMusic) {
        // Original tracks from the user's directory
        const playlist = [
            "Music By Me/Forest of Little Wonders.mp3",
            "Music By Me/Skybound Overture.mp3",
            "Music By Me/Skyward Promise.mp3",
            "Music By Me/Untitled (4).mp3"
        ];
        
        let currentTrackIndex = 0;
        let isPlaying = false;

        // Initialize first track
        bgMusic.src = playlist[currentTrackIndex];
        bgMusic.volume = 0.4; // Set a pleasant background volume

        musicToggleBtn.addEventListener('click', () => {
            if (isPlaying) {
                bgMusic.pause();
                musicIcon.classList.replace('fa-pause', 'fa-music');
                musicIcon.classList.remove('fa-spin'); // Optional: stop spinning if you added animations
                isPlaying = false;
            } else {
                bgMusic.play().catch(e => {
                    console.error("Audio playback failed:", e);
                    alert("Audio playback was blocked by the browser. Please interact with the document first.");
                });
                musicIcon.classList.replace('fa-music', 'fa-pause');
                isPlaying = true;
            }
        });

        // Automatically play next track when current one ends
        bgMusic.addEventListener('ended', () => {
            currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
            bgMusic.src = playlist[currentTrackIndex];
            bgMusic.play().catch(e => console.error("Audio playback failed:", e));
        });
    }
});
