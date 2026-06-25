// ====================
// THEME TOGGLE — full-screen flash overlay
// ====================

(function initTheme() {
    const saved = localStorage.getItem('ct-theme') || 'dark';
    applyTheme(saved, false);
})();

function applyTheme(theme, animate = true) {
    const isLight = theme === 'light';
    const flash   = document.getElementById('theme-flash');

    function commit() {
        if (isLight) {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        localStorage.setItem('ct-theme', theme);
        updateThemeBtn(isLight);
    }

    if (!animate || !flash) {
        commit();
        return;
    }

    // Phase 1: fade overlay IN (covers entire screen)
    flash.classList.remove('flash-out');
    flash.classList.add('flash-in');

    setTimeout(() => {
        // Phase 2: swap theme while hidden
        commit();

        // Phase 3: fade overlay OUT revealing new theme
        flash.classList.remove('flash-in');
        flash.classList.add('flash-out');

        setTimeout(() => flash.classList.remove('flash-out'), 200);
    }, 180);
}

function updateThemeBtn(isLight) {
    const btn = document.getElementById('themeBtn');
    if (!btn) return;
    const moonSvg = `<svg class="theme-icon" viewBox="0 0 15 15" fill="none"><path d="M2.9 8.5a5 5 0 006.6 1 4.5 4.5 0 01-5.1-5.6A5 5 0 002.9 8.5z" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    const sunSvg  = `<svg class="theme-icon" viewBox="0 0 15 15" fill="none"><path d="M7.5 1v1.5M7.5 12.5V14M14 7.5h-1.5M2.5 7.5H1m10.3-5.8-1.1 1.1M4.3 10.7l-1.1 1.1M11.3 11.3l-1.1-1.1M4.3 4.3 3.2 3.2" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"/><circle cx="7.5" cy="7.5" r="2.5" stroke="currentColor" stroke-width="1.25"/></svg>`;
    btn.innerHTML = (isLight ? moonSvg : sunSvg) + `<span id="themeBtnLabel">${isLight ? 'Dark Mode' : 'Light Mode'}</span>`;
}

document.addEventListener('click', (e) => {
    if (e.target.closest('#themeBtn')) {
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        applyTheme(isLight ? 'dark' : 'light', true);
    }
});

// ====================
// SIDEBAR TOGGLE
// ====================

(function initSidebar() {
    const saved = localStorage.getItem('ct-sidebar');
    if (saved === 'collapsed') collapseSidebar(false);
})();

function collapseSidebar(animate = true) {
    const sidebar = document.getElementById('sidebar');
    const toggle  = document.getElementById('sidebarToggle');
    if (!sidebar) return;

    if (!animate) {
        sidebar.style.transition = 'none';
        toggle && (toggle.style.transition = 'none');
        requestAnimationFrame(() => {
            sidebar.classList.add('collapsed');
            document.body.classList.add('sidebar-collapsed');
            requestAnimationFrame(() => {
                sidebar.style.transition = '';
                toggle && (toggle.style.transition = '');
            });
        });
    } else {
        sidebar.classList.add('collapsed');
        document.body.classList.add('sidebar-collapsed');
    }
    localStorage.setItem('ct-sidebar', 'collapsed');
}

function expandSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    sidebar.classList.remove('collapsed');
    document.body.classList.remove('sidebar-collapsed');
    localStorage.setItem('ct-sidebar', 'expanded');
}

document.addEventListener('click', (e) => {
    if (e.target.closest('#sidebarToggle')) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar.classList.contains('collapsed')) {
            expandSidebar();
        } else {
            collapseSidebar();
        }
    }
});


const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "login.html";
}

// ====================
// SMOOTH SCROLL — 60–144hz adaptive
// ====================

(function () {
    const main = document.getElementById("mainScroll");
    if (!main) return;

    let scrollTarget = 0;
    let scrollCurrent = 0;
    let rafId = null;

    function smoothStep() {
        const diff = scrollTarget - scrollCurrent;
        if (Math.abs(diff) < 0.5) {
            scrollCurrent = scrollTarget;
            main.scrollTop = scrollCurrent;
            rafId = null;
            return;
        }
        scrollCurrent += diff * 0.11;
        main.scrollTop = scrollCurrent;
        rafId = requestAnimationFrame(smoothStep);
    }

    main.addEventListener("wheel", (e) => {
        e.preventDefault();
        const max = main.scrollHeight - main.clientHeight;
        scrollTarget = Math.max(0, Math.min(scrollTarget + e.deltaY * 0.85, max));
        scrollCurrent = main.scrollTop;
        if (!rafId) rafId = requestAnimationFrame(smoothStep);
    }, { passive: false });
})();

// ====================
// ELEMENT
// ====================

const modal = document.getElementById("taskModal");
const addBtn = document.querySelector(".add-task-btn");

let allTasks = [];

// ====================
// LOAD DATA
// ====================

loadGreeting();
loadStats();
loadTasks();
loadNearestDeadline();

// ====================
// OPEN / CLOSE MODAL — animated in + out
// ====================

function openModal() {
    modal.classList.add("show");
}

function closeModal() {
    modal.classList.remove("show");
    // reset everything after transition completes
    setTimeout(() => {
        document.getElementById("taskForm").reset();
        document.getElementById("taskId").value = "";
        document.getElementById("modalTitle").textContent = "New Task";
    }, 300);
}

addBtn.addEventListener("click", () => {
    openModal();
});

modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
});

// ====================
// ANIMATE COUNTER — ease-out cubic count-up
// ====================

function animateCounter(el, target, duration = 900) {
    const raw     = String(target);
    const suffix  = raw.includes('%') ? '%' : '';
    const num     = parseInt(raw) || 0;

    if (num === 0) { el.textContent = '0' + suffix; return; }

    const start = performance.now();
    function tick(now) {
        const t      = Math.min((now - start) / duration, 1);
        const eased  = 1 - Math.pow(1 - t, 3); // ease-out cubic
        el.textContent = Math.round(eased * num) + suffix;
        if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}

// ====================
// LOAD STATS
// ====================

async function loadStats() {
    const response = await fetch("http://localhost:5000/api/tasks/stats", {
        headers: { Authorization: `Bearer ${token}` }
    });

    const data = await response.json();

    document.getElementById("stats").innerHTML = `
        <div class="stat-card"><span>Total</span><h2 class="stat-num">0</h2></div>
        <div class="stat-card"><span>Selesai</span><h2 class="stat-num">0</h2></div>
        <div class="stat-card"><span>Pending</span><h2 class="stat-num">0</h2></div>
        <div class="stat-card"><span>Progress</span><h2 class="stat-num">0%</h2></div>
    `;

    // Delay slightly so the card spring-in animation plays first
    setTimeout(() => {
        const nums    = document.querySelectorAll('.stat-num');
        const targets = [data.total, data.selesai, data.belum, data.progress + '%'];
        nums.forEach((el, i) => {
            setTimeout(() => animateCounter(el, targets[i], 900), i * 70);
        });
    }, 380);
}

// ====================
// LOAD TASKS
// ====================

async function loadTasks() {
    const response = await fetch("http://localhost:5000/api/tasks", {
        headers: { Authorization: `Bearer ${token}` }
    });

    allTasks = await response.json();
    renderTasks();
}

function renderTasks() {
    let tasks = [...allTasks];

    const search   = document.getElementById("searchInput").value.toLowerCase();
    const priority = getCdValue("priorityFilter");
    const status   = getCdValue("statusFilter");
    const sort     = getCdValue("sortSelect") || "deadline-asc";

    tasks = tasks.filter(t =>
        t.nama_tugas.toLowerCase().includes(search) ||
        t.mata_kuliah.toLowerCase().includes(search)
    );

    if (priority) tasks = tasks.filter(t => t.prioritas === priority);
    if (status)   tasks = tasks.filter(t => t.status === status);

    const rank = { Tinggi: 3, Sedang: 2, Rendah: 1 };

    switch (sort) {
        case "deadline-asc":   tasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline)); break;
        case "deadline-desc":  tasks.sort((a, b) => new Date(b.deadline) - new Date(a.deadline)); break;
        case "priority-high":  tasks.sort((a, b) => rank[b.prioritas] - rank[a.prioritas]); break;
        case "priority-low":   tasks.sort((a, b) => rank[a.prioritas] - rank[b.prioritas]); break;
        case "name-asc":       tasks.sort((a, b) => a.nama_tugas.localeCompare(b.nama_tugas)); break;
        case "name-desc":      tasks.sort((a, b) => b.nama_tugas.localeCompare(a.nama_tugas)); break;
    }

    const active    = tasks.filter(t => t.status !== "Selesai");
    const completed = tasks.filter(t => t.status === "Selesai");

    if (tasks.length === 0) {
        document.getElementById("tasks").innerHTML = `
            <div class="empty-state">
                <h2>📝</h2>
                <h3>Belum Ada Tugas</h3>
                <p>Klik New Task untuk memulai</p>
            </div>
        `;
        return;
    }

    let html = buildGroup("active-group", "Active", active.length, false, active);
    html    += buildGroup("completed-group", "Completed", completed.length, true, completed);

    document.getElementById("tasks").innerHTML = html;
}

function buildGroup(id, label, count, collapsed, tasks) {
    const collapseClass = collapsed ? "collapsed" : "";
    const hiddenStyle   = collapsed ? 'style="height:0;opacity:0;overflow:hidden"' : 'style="height:auto;overflow:visible"';

    const chevron = `
        <svg class="group-chevron" width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M2 4.5l4.5 4.5 4.5-4.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `;

    const cards = tasks.map((t, i) => createTaskCard(t, i)).join("");

    return `
    <div class="task-group">
        <div class="group-header ${collapseClass}" onclick="toggleGroup('${id}', this)">
            ${chevron}
            ${label}
            <span class="group-count">${count}</span>
            <div class="group-line"></div>
        </div>
        <div class="group-content ${collapseClass}" ${hiddenStyle}>
            <div class="group-grid">
                ${count === 0 ? `<p style="color:var(--tx3);font-size:12px;padding:8px 2px">Kosong</p>` : cards}
            </div>
        </div>
    </div>
    `;
}

function createTaskCard(task, index = 0) {
    const tanggal      = new Date(task.deadline).toLocaleDateString("id-ID");
    const waktu        = new Date(task.deadline).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    const urgentClass  = task.status !== "Selesai" && isUrgent(task.deadline) ? "urgent-card" : "";
    const priorityCls  = task.prioritas === "Tinggi" ? "high" : task.prioritas === "Sedang" ? "medium" : "low";
    const doneStyle    = task.status === "Selesai" ? "opacity:.5;" : "";
    const delayStyle   = `animation-delay:${Math.min(index * 45, 400)}ms;`;

    return `
    <div class="card ${urgentClass}" data-task-id="${task.id}" style="${doneStyle}${delayStyle}">
        <div>
            <h3>${task.nama_tugas}</h3>
            <p class="card-course">${task.mata_kuliah}</p>
        </div>

        <div class="card-meta">
            <span class="card-date">📅 ${tanggal}</span>
            <span class="card-time">
                <svg width="11" height="11" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.4" stroke="currentColor" stroke-width="1.2"/><path d="M7 4.2V7l2 1.2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                ${waktu}
            </span>
            <span class="priority ${priorityCls}">${task.prioritas}</span>
        </div>

        <div class="status-cd" id="scd-${task.id}">
            <div class="status-cd-trigger" onclick="toggleStatusCd(${task.id})">
                <span class="status-cd-trigger-label" id="scd-label-${task.id}">${statusLabel(task.status)}</span>
                <span class="status-cd-chevron"><svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
            </div>
            <div class="status-cd-menu">
                <div class="status-cd-item ${task.status === 'Belum Dikerjakan' ? 'selected' : ''}" onclick="selectStatus(${task.id}, 'Belum Dikerjakan')">
                    <span class="status-cd-item-dot status-dot-belum"></span>Belum Dikerjakan
                </div>
                <div class="status-cd-item ${task.status === 'Sedang Dikerjakan' ? 'selected' : ''}" onclick="selectStatus(${task.id}, 'Sedang Dikerjakan')">
                    <span class="status-cd-item-dot status-dot-sedang"></span>Sedang Dikerjakan
                </div>
                <div class="status-cd-item ${task.status === 'Selesai' ? 'selected' : ''}" onclick="selectStatus(${task.id}, 'Selesai')">
                    <span class="status-cd-item-dot status-dot-selesai"></span>Selesai
                </div>
            </div>
        </div>

        <div class="task-actions">
            <button onclick="editTask(${task.id})"   class="edit-btn">Edit</button>
            <button onclick="deleteTask(${task.id})" class="delete-btn">Delete</button>
        </div>
    </div>
    `;
}

// ====================
// TOGGLE GROUP — explicit height via rAF for 360hz smooth
// ====================

function toggleGroup(id, hdrEl) {
    const content = hdrEl.nextElementSibling;
    const isCollapsed = content.classList.contains("collapsed");

    if (isCollapsed) {
        // OPEN: measure natural height, set it, then animate from 0
        content.style.overflow = "hidden";
        content.classList.remove("collapsed");
        const fullHeight = content.scrollHeight;
        content.style.height = "0px";
        content.style.opacity = "0";

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                content.style.height = fullHeight + "px";
                content.style.opacity = "1";
            });
        });

        content.addEventListener("transitionend", function onEnd(e) {
            if (e.propertyName !== "height") return;
            content.style.height = "auto";
            content.style.overflow = "visible"; // let dropdowns escape after animation
            content.removeEventListener("transitionend", onEnd);
        });
    } else {
        // CLOSE: clip with overflow before animating to 0
        const fullHeight = content.scrollHeight;
        content.style.overflow = "hidden";
        content.style.height = fullHeight + "px";

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                content.classList.add("collapsed");
            });
        });
    }

    hdrEl.classList.toggle("collapsed", !isCollapsed);
}

// ====================
// TOAST
// ====================

function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2200);
}

// ====================
// GREETING — time-aware, with icon
// ====================

function renderGreeting(nama) {
    const el = document.getElementById("greeting");
    if (!el) return;
    el.textContent = `Halo${nama ? ", " + nama : ""} 👋`;
}

async function loadGreeting() {
    renderGreeting(); // instant time-aware greeting, no placeholder flash

    try {
        const response = await fetch("http://localhost:5000/api/auth/profile", {
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await response.json();
        renderGreeting(data.user.nama);

    } catch (err) {
        console.log(err);
    }
}

// ====================
// STATUS DROPDOWN (card)
// ====================

function statusLabel(status) {
    if (status === 'Sedang Dikerjakan') return '⚙ Sedang Dikerjakan';
    if (status === 'Selesai')           return '✓ Selesai';
    return '· Belum Dikerjakan';
}

function toggleStatusCd(taskId) {
    const el = document.getElementById('scd-' + taskId);
    if (!el) return;
    const isOpen = el.classList.contains('open');
    closeAllCd();
    if (!isOpen) el.classList.add('open');
}

function selectStatus(taskId, status) {
    const el = document.getElementById('scd-' + taskId);
    if (el) {
        el.querySelectorAll('.status-cd-item').forEach(i => i.classList.remove('selected'));
        const items = el.querySelectorAll('.status-cd-item');
        const vals  = ['Belum Dikerjakan', 'Sedang Dikerjakan', 'Selesai'];
        items.forEach((item, idx) => {
            if (vals[idx] === status) item.classList.add('selected');
        });
        const labelEl = document.getElementById('scd-label-' + taskId);
        if (labelEl) labelEl.textContent = statusLabel(status);
        el.classList.remove('open');
    }
    updateStatus(taskId, status);
}

// ====================
// UPDATE STATUS
// ====================

async function updateStatus(id, status) {
    const task = allTasks.find(t => t.id == id);
    if (!task) return;

    await fetch(`http://localhost:5000/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...task, status })
    });

    refreshAll();
    showToast("✏️ Status tugas diupdate");
}

// ====================
// DELETE TASK — animate card out, then remove
// ====================

function animateCardOut(card) {
    return new Promise((resolve) => {
        let done = false;
        const finish = () => {
            if (done) return;
            done = true;
            resolve();
        };
        card.style.pointerEvents = "none";
        card.addEventListener("transitionend", finish, { once: true });
        // safety net in case transitionend doesn't fire (e.g. element removed mid-flight)
        setTimeout(finish, 260);
        requestAnimationFrame(() => card.classList.add("card-out"));
    });
}

async function deleteTask(id) {
    if (!confirm("Hapus tugas ini?")) return;

    const card = document.querySelector(`.card[data-task-id="${id}"]`);
    if (card) await animateCardOut(card);

    await fetch(`http://localhost:5000/api/tasks/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
    });

    refreshAll();
    showToast("🗑 Task berhasil dihapus");
}

// ====================
// EDIT TASK
// ====================

async function editTask(id) {
    const task = allTasks.find(t => t.id === id);
    if (!task) return;

    document.getElementById("taskId").value       = task.id;
    document.getElementById("mataKuliah").value   = task.mata_kuliah;
    document.getElementById("namaTugas").value    = task.nama_tugas;
    document.getElementById("deskripsi").value    = task.deskripsi;
    document.getElementById("dosen").value        = task.dosen;
    document.getElementById("deadline").value     = task.deadline.slice(0, 16);
    document.getElementById("prioritas").value    = task.prioritas;
    document.getElementById("modalTitle").textContent = "Edit Task";

    modal.classList.add("show");
}
// ====================

async function markDone(id) {
    const response = await fetch("http://localhost:5000/api/tasks", {
        headers: { Authorization: `Bearer ${token}` }
    });

    const tasks = await response.json();
    const task  = tasks.find(t => t.id === id);
    if (!task) return;

    await fetch(`http://localhost:5000/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...task, status: "Selesai" })
    });

    refreshAll();
    showToast("✅ Task ditandai selesai");
}

// ====================
// NEAREST DEADLINE
// ====================

let _countdownInterval = null;
let _countdownDeadline = null;

async function loadNearestDeadline() {
    try {
        const response = await fetch("http://localhost:5000/api/tasks/nearest", {
            headers: { Authorization: `Bearer ${token}` }
        });

        const task = await response.json();
        const card = document.getElementById("deadlineCard");
        if (!card) return;

        if (!task) {
            stopCountdown();
            card.innerHTML = `
                <div class="deadline-card-inner">
                    <span class="deadline-label">Deadline terdekat</span>
                    <h3 class="deadline-title">🎉 Tidak ada deadline</h3>
                    <p class="deadline-course">Semua tugas sudah selesai</p>
                </div>
            `;
            return;
        }

        // Only restart interval if the task deadline actually changed
        const newDeadline = new Date(task.deadline).getTime();
        const titleEl  = card.querySelector(".deadline-title");
        const courseEl = card.querySelector(".deadline-course");

        if (titleEl)  titleEl.textContent  = task.nama_tugas;
        if (courseEl) courseEl.textContent = task.mata_kuliah;

        if (_countdownDeadline !== newDeadline) {
            _countdownDeadline = newDeadline;
            startCountdown(task.deadline);
        }

    } catch (err) {
        console.log(err);
    }
}

// ====================
// COUNTDOWN
// ====================

function stopCountdown() {
    if (_countdownInterval !== null) {
        clearInterval(_countdownInterval);
        _countdownInterval = null;
    }
    _countdownDeadline = null;
}

function startCountdown(deadline) {
    // Always clear previous interval first
    if (_countdownInterval !== null) {
        clearInterval(_countdownInterval);
        _countdownInterval = null;
    }

    const target = new Date(deadline).getTime();
    const el = document.getElementById("countdown");
    if (!el) return;

    let lastText = '';

    function tickFlip(el, newText) {
        if (el.textContent === newText) return;
        el.classList.remove('tick');
        void el.offsetWidth; // force reflow
        el.textContent = newText;
        el.classList.add('tick');
        lastText = newText;
    }

    function update() {
        const el = document.getElementById("countdown");
        if (!el) {
            clearInterval(_countdownInterval);
            _countdownInterval = null;
            return;
        }

        const diff = target - Date.now();

        if (diff <= 0) {
            tickFlip(el, "Deadline lewat");
            clearInterval(_countdownInterval);
            _countdownInterval = null;
            return;
        }

        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);

        const newText = d > 0 ? `${d}h ${h}j ${m}m` : `${h}j ${m}m ${s}d`;
        tickFlip(el, newText);
    }

    update();
    _countdownInterval = setInterval(update, 1000);
}

// ====================
// HELPERS
// ====================

function isUrgent(deadline) {
    return new Date(deadline) - new Date() <= 86400000;
}

function refreshAll() {
    loadGreeting();
    loadTasks();
    loadStats();
    loadNearestDeadline();
}

// ====================
// TOOLBAR LISTENERS
// ====================

document.addEventListener("input", (e) => {
    if (e.target.id === "searchInput") renderTasks();
});

// ====================
// CUSTOM DROPDOWN ENGINE
// ====================

function createDropdown({ id, options, defaultValue, placeholder, onChange }) {
    const chevronSvg = `<svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    const checkSvg   = `<svg class="cd-item-check" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

    const current = defaultValue;

    const items = options.map(opt => {
        const isSelected = opt.value === current;
        return `<div class="cd-item ${isSelected ? 'selected' : ''}" data-value="${opt.value}" data-cd="${id}">
            ${checkSvg}
            ${opt.label}
        </div>`;
    }).join('');

    const currentLabel = options.find(o => o.value === current)?.label || placeholder;

    return `<div class="cd" id="cd-${id}">
        <div class="cd-trigger" onclick="toggleCd('cd-${id}')">
            <span class="cd-trigger-label" id="cd-label-${id}">${currentLabel}</span>
            <span class="cd-chevron">${chevronSvg}</span>
        </div>
        <div class="cd-menu">
            ${items}
        </div>
    </div>`;
}

function toggleCd(cdId) {
    const el = document.getElementById(cdId);
    if (!el) return;
    const isOpen = el.classList.contains('open');
    closeAllCd();
    if (!isOpen) el.classList.add('open');
}

function closeAllCd() {
    document.querySelectorAll('.cd.open, .status-cd.open').forEach(el => el.classList.remove('open'));
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('.cd') && !e.target.closest('.status-cd')) closeAllCd();
});

document.addEventListener('click', (e) => {
    const item = e.target.closest('.cd-item');
    if (!item) return;
    const cdId = item.dataset.cd;
    const val  = item.dataset.value;
    const cd   = document.getElementById('cd-' + cdId);
    if (!cd) return;

    cd.querySelectorAll('.cd-item').forEach(i => i.classList.remove('selected'));
    item.classList.add('selected');

    const label = item.textContent.trim();
    const labelEl = document.getElementById('cd-label-' + cdId);
    if (labelEl) labelEl.textContent = label;

    closeAllCd();

    if (cdId === 'sortSelect')      { renderTasks(); }
    if (cdId === 'priorityFilter')  { renderTasks(); }
    if (cdId === 'statusFilter')    { renderTasks(); }
});

function getCdValue(id) {
    const cd = document.getElementById('cd-' + id);
    if (!cd) return '';
    const sel = cd.querySelector('.cd-item.selected');
    return sel ? sel.dataset.value : '';
}

// Inject toolbar dropdowns once DOM is ready
(function injectToolbarDropdowns() {
    const sortEl     = document.getElementById('sortSelect');
    const priorityEl = document.getElementById('priorityFilter');
    const statusEl   = document.getElementById('statusFilter');

    const sortHtml = createDropdown({
        id: 'sortSelect',
        defaultValue: 'deadline-asc',
        options: [
            { value: 'deadline-asc',  label: 'Deadline Terdekat' },
            { value: 'deadline-desc', label: 'Deadline Terjauh' },
            { value: 'priority-high', label: 'Prioritas Tertinggi' },
            { value: 'priority-low',  label: 'Prioritas Terendah' },
            { value: 'name-asc',      label: 'Nama A–Z' },
            { value: 'name-desc',     label: 'Nama Z–A' },
        ]
    });

    const priorityHtml = createDropdown({
        id: 'priorityFilter',
        defaultValue: '',
        options: [
            { value: '',       label: 'Semua Prioritas' },
            { value: 'Tinggi', label: '🔴 Tinggi' },
            { value: 'Sedang', label: '🟡 Sedang' },
            { value: 'Rendah', label: '🟢 Rendah' },
        ]
    });

    const statusHtml = createDropdown({
        id: 'statusFilter',
        defaultValue: '',
        options: [
            { value: '',                  label: 'Semua Status' },
            { value: 'Belum Dikerjakan',  label: '📋 Belum Dikerjakan' },
            { value: 'Sedang Dikerjakan', label: '⚙️ Sedang Dikerjakan' },
            { value: 'Selesai',           label: '✅ Selesai' },
        ]
    });

    sortEl.outerHTML     = sortHtml;
    priorityEl.outerHTML = priorityHtml;
    statusEl.outerHTML   = statusHtml;
})();

// ====================
// TASK FORM SUBMIT
// ====================

document.getElementById("taskForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const taskId = document.getElementById("taskId").value;

    const taskData = {
        mata_kuliah: document.getElementById("mataKuliah").value,
        nama_tugas:  document.getElementById("namaTugas").value,
        deskripsi:   document.getElementById("deskripsi").value,
        dosen:       document.getElementById("dosen").value,
        deadline:    document.getElementById("deadline").value,
        prioritas:   document.getElementById("prioritas").value
    };

    if (taskId) {
        const task = allTasks.find(t => t.id == taskId);
        await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ ...task, ...taskData })
        });
    } else {
        await fetch("http://localhost:5000/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(taskData)
        });
    }

    document.getElementById("taskForm").reset();
    document.getElementById("taskId").value = "";
    document.getElementById("modalTitle").textContent = "New Task";
    closeModal();

    refreshAll();
    showToast(taskId ? "✏️ Task berhasil diupdate" : "✅ Task berhasil ditambahkan");
});

// ====================
// LOGOUT
// ====================

document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "login.html";
});

// ====================
// CARD 3D TILT — mouse tracking with spring return
// ====================

function initCardTilt() {
    let hovered = null;

    function applyTilt(card, e) {
        const r  = card.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width;   // 0 → 1
        const ny = (e.clientY - r.top) / r.height;    // 0 → 1
        const rx = (0.5 - ny) * 12;   // ±6 deg vertical
        const ry = (nx - 0.5) * 16;   // ±8 deg horizontal

        card.style.transition = 'transform 70ms linear, box-shadow 70ms linear';
        card.style.transform  = `perspective(650px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-7px) scale(1.018)`;
        card.style.boxShadow  = `0 22px 60px rgba(0,0,0,.45), 0 4px 16px rgba(0,0,0,.2)`;
    }

    function resetCard(card) {
        card.style.transition = 'transform 500ms cubic-bezier(.34,1.56,.64,1), box-shadow 300ms ease, background 220ms ease, border-color 220ms ease';
        card.style.transform  = '';
        card.style.boxShadow  = '';
        setTimeout(() => {
            if (card.style.transition.startsWith('transform 500ms')) {
                card.style.transition = '';
            }
        }, 500);
    }

    document.addEventListener('mousemove', e => {
        const card = e.target.closest?.('.card');

        if (!card) {
            if (hovered) { resetCard(hovered); hovered = null; }
            return;
        }
        if (hovered && hovered !== card) { resetCard(hovered); }
        hovered = card;
        applyTilt(card, e);
    });

    // Safety reset when mouse leaves the viewport
    document.addEventListener('mouseleave', () => {
        if (hovered) { resetCard(hovered); hovered = null; }
    });
}

// ====================
// RIPPLE — click wave on primary buttons
// ====================

function createRipple(e) {
    const btn  = e.currentTarget;
    const old  = btn.querySelector('.ripple-wave');
    if (old) old.remove();

    const d    = Math.max(btn.clientWidth, btn.clientHeight);
    const rect = btn.getBoundingClientRect();
    const wave = document.createElement('span');

    wave.className   = 'ripple-wave';
    wave.style.cssText = `
        width:  ${d}px;
        height: ${d}px;
        left:   ${e.clientX - rect.left  - d / 2}px;
        top:    ${e.clientY - rect.top   - d / 2}px;
    `;
    btn.appendChild(wave);
    setTimeout(() => wave?.remove(), 700);
}

function initRipples() {
    document.querySelectorAll('.add-task-btn, .submit-btn').forEach(btn => {
        btn.addEventListener('click', createRipple);
    });
    // Re-attach when modal opens (submit button may have been reset)
    document.getElementById('taskModal')?.addEventListener('transitionend', () => {
        document.querySelectorAll('.submit-btn').forEach(btn => {
            btn.removeEventListener('click', createRipple);
            btn.addEventListener('click', createRipple);
        });
    });
}

// ====================
// INITIALISE ANIMATIONS
// ====================
initCardTilt();
initRipples();