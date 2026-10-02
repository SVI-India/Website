// ============================================================
// PARTICLES BACKGROUND — Random moving blue particles
// ============================================================
(function () {
    const canvas = document.createElement('canvas');
    canvas.id = 'particles-canvas';
    document.body.insertBefore(canvas, document.body.firstChild);

    const ctx = canvas.getContext('2d');
    let particles = [], w, h;
    const COUNT = 60;
    const COLORS = ['#3b82f6', '#60a5fa', '#1e40af', '#93c5fd', '#2563eb'];

    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function rand(min, max) {
        return Math.random() * (max - min) + min;
    }

    function init() {
        particles = [];
        for (let i = 0; i < COUNT; i++) {
            particles.push({
                x: rand(0, w),
                y: rand(0, h),
                vx: rand(-0.4, 0.4),
                vy: rand(-0.4, 0.4),
                r: rand(1.5, 4),
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                alpha: rand(0.15, 0.5)
            });
        }
    }
    init();

    function draw() {
        ctx.clearRect(0, 0, w, h);

        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > w) p.vx *= -1;
            if (p.y < 0 || p.y > h) p.vy *= -1;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.alpha;
            ctx.fill();
        });

        ctx.globalAlpha = 1;
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 130) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = '#3b82f6';
                    ctx.globalAlpha = (1 - dist / 130) * 0.15;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(draw);
    }
    draw();
})();