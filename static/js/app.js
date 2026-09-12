// ==================== CONFIGURACIÓN ====================

const API_URL = 'http://' + window.location.hostname + ':5000';
let currentTab = 'track';
let selectedCircuit = '';
let selectedMode = '';
const DRIVER_COLOR_GREEN_CUTOFF = 7;
const DRIVER_COLOR_ORANGE_CUTOFF = 14;

// ==================== CIRCUIT SELECTION ====================

document.addEventListener('DOMContentLoaded', () => {
    // Circuit buttons
    document.getElementById('btn-circuit-santos')?.addEventListener('click', () => selectCircuit('santos'));
    document.getElementById('btn-circuit-henakart')?.addEventListener('click', () => selectCircuit('henakart'));
    document.getElementById('btn-circuit-alcanede')?.addEventListener('click', () => selectCircuit('alcanede'));
    document.getElementById('btn-circuit-kartland')?.addEventListener('click', () => selectCircuit('kartland'));
    document.getElementById('btn-circuit-kip-palmela')?.addEventListener('click', () => selectCircuit('kip-palmela'));

    // Mode buttons
    document.getElementById('btn-sim')?.addEventListener('click', () => selectMode('sim'));
    document.getElementById('btn-real')?.addEventListener('click', () => selectMode('real'));

    // Start button
    document.getElementById('btn-start')?.addEventListener('click', initServer);

    // Reset button
    document.getElementById('btn-reset-hard')?.addEventListener('click', resetAll);

    // Reconnect button
    document.getElementById('btn-reconnect')?.addEventListener('click', () => {
        fetch(API_URL + '/api/reconnect', { method: 'POST' })
            .then(r => r.json())
            .then(d => showAlert(d.message, d.status === 'ok' ? 'success' : 'error'))
            .catch(e => showAlert('Error: ' + e, 'error'));
    });

    // Tab buttons
    document.getElementById('tab-track')?.addEventListener('click', () => switchTab('track'));
    document.getElementById('tab-summary')?.addEventListener('click', () => switchTab('summary'));
    document.getElementById('tab-realpos')?.addEventListener('click', () => switchTab('realpos'));

    // Box assignment buttons
    document.getElementById('btn-assign-left')?.addEventListener('click', () => {
        fetch(API_URL + '/api/assign-left', { method: 'POST' })
            .then(r => r.json())
            .then(d => {
                showAlert(d.message, d.status === 'ok' ? 'success' : 'error');
                refreshState();
            })
            .catch(e => showAlert('Error: ' + e, 'error'));
    });

    document.getElementById('btn-assign-center')?.addEventListener('click', () => {
        fetch(API_URL + '/api/assign-center', { method: 'POST' })
            .then(r => r.json())
            .then(d => {
                showAlert(d.message, d.status === 'ok' ? 'success' : 'error');
                refreshState();
            })
            .catch(e => showAlert('Error: ' + e, 'error'));
    });

    document.getElementById('btn-assign-right')?.addEventListener('click', () => {
        fetch(API_URL + '/api/assign-right', { method: 'POST' })
            .then(r => r.json())
            .then(d => {
                showAlert(d.message, d.status === 'ok' ? 'success' : 'error');
                refreshState();
            })
            .catch(e => showAlert('Error: ' + e, 'error'));
    });

    // Penalty button
    document.getElementById('btn-add-penalty')?.addEventListener('click', addPenalty);

    // Initial load
    loadConfig();
    setInterval(loadConfig, 5000);
});

function selectCircuit(circuit) {
    selectedCircuit = circuit;
    document.querySelectorAll('.circuit-btn').forEach(b => b.style.background = '');
    event.target.style.background = '#00bcd4';
    document.getElementById('circuit-title').textContent = circuit.toUpperCase();
}

function selectMode(mode) {
    selectedMode = mode;
    document.querySelectorAll('.mode-btn').forEach(b => b.style.background = '');
    event.target.style.background = '#00bcd4';
}

// ==================== TAB SWITCHING ====================

function switchTab(tabName) {
    currentTab = tabName;
    
    // Hide all views
    document.getElementById('view-track').style.display = 'none';
    document.getElementById('view-summary').style.display = 'none';
    document.getElementById('view-realpos').style.display = 'none';

    // Remove active from all tabs
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    // Show selected view
    if (tabName === 'track') {
        document.getElementById('view-track').style.display = 'block';
        document.getElementById('tab-track').classList.add('active');
        refreshDrivers();
    } else if (tabName === 'summary') {
        document.getElementById('view-summary').style.display = 'block';
        document.getElementById('tab-summary').classList.add('active');
        refreshSummary();
    } else if (tabName === 'realpos') {
        document.getElementById('view-realpos').style.display = 'block';
        document.getElementById('tab-realpos').classList.add('active');
        refreshRealpos();
    }
}

// ==================== INICIALIZACIÓN ====================

async function loadConfig() {
    try {
        const response = await fetch(API_URL + '/api/config');
        const data = await response.json();
        
        if (data.initialized) {
            document.getElementById('menu-screen').style.display = 'none';
            document.getElementById('app-screen').style.display = 'block';
            
            const config = data.config;
            document.getElementById('app-circuit-title').textContent = (config.circuit || 'CIRCUITO').toUpperCase();
            
            const badge = document.getElementById('data-mode-badge');
            if (config.mode === 'sim') {
                badge.textContent = 'SIMULACIÓN';
                badge.className = 'data-mode-badge sim';
            } else {
                badge.textContent = 'DATOS REALES';
                badge.className = 'data-mode-badge real';
            }
            
            refreshState();
        } else {
            document.getElementById('menu-screen').style.display = 'block';
            document.getElementById('app-screen').style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading config:', error);
    }
}

async function initServer() {
    if (!selectedCircuit) {
        showAlert('⚠️ Selecciona circuito', 'info');
        return;
    }
    if (!selectedMode) {
        showAlert('⚠️ Selecciona modo', 'info');
        return;
    }

    const num_boxes = parseInt(document.getElementById('num-boxes').value) || 6;
    const required_pits = parseInt(document.getElementById('required-pits').value) || 12;
    const pit_min_seconds = parseInt(document.getElementById('pit-min-seconds').value) || 180;
    const stint_max_minutes = parseInt(document.getElementById('stint-max-minutes').value) || 0;

    try {
        const response = await fetch(API_URL + '/api/init', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                circuit: selectedCircuit,
                mode: selectedMode,
                num_boxes,
                required_pits,
                pit_min_seconds,
                stint_max_minutes
            })
        });
        
        const data = await response.json();
        
        if (data.status === 'ok') {
            showAlert('✅ Servidor inicializado', 'success');
            loadConfig();
        } else {
            showAlert('❌ ' + data.message, 'error');
        }
    } catch (error) {
        console.error('Init error:', error);
        showAlert('❌ Error al inicializar', 'error');
    }
}

async function resetAll() {
    if (!confirm('¿Reiniciar carrera?')) return;
    
    try {
        await fetch(API_URL + '/api/reset', { method: 'POST' });
        showAlert('✅ Sistema reiniciado', 'success');
        loadConfig();
    } catch (error) {
        showAlert('❌ Error al reiniciar', 'error');
    }
}

// ==================== STATE REFRESH ====================

async function refreshState() {
    try {
        const response = await fetch(API_URL + '/api/state');
        if (!response.ok) return;
        const data = await response.json();
        
        renderDrivers(data.drivers);
        renderPitQueue(data.pit_queue);
        renderBoxes(data.boxes);
    } catch (error) {
        console.error('Error refreshState:', error);
    }
}

// ==================== DRIVERS RENDERING ====================

function normalizeDriverColor(color) {
    const normalized = (color || '').toString().trim().toLowerCase();
    if (normalized === 'green' || normalized === 'orange' || normalized === 'red' || normalized === 'neutral') {
        return normalized;
    }
    return 'neutral';
}

function getNumericMetric(driver, keys) {
    for (const key of keys) {
        const value = Number(driver?.[key] ?? 0);
        if (value > 0) return value;
    }
    return 0;
}

function getBestLap(driver) {
    return getNumericMetric(driver, ['mejor_vuelta', 'best_lap', 'mejor']);
}

function getAverageStint(driver) {
    return getNumericMetric(driver, ['media_stint', 'media_vuelta', 'media']);
}

function getStintLapCount(driver) {
    if (Array.isArray(driver?.stint_laps)) return driver.stint_laps.length;
    return Number(driver?.stint_laps ?? driver?.stint_lap_count ?? 0);
}

function getRankColor(rank) {
    if (!rank) return 'neutral';
    if (rank <= DRIVER_COLOR_GREEN_CUTOFF) return 'green';
    if (rank <= DRIVER_COLOR_ORANGE_CUTOFF) return 'orange';
    return 'red';
}

function calculateMetricRanks(drivers, metricGetter) {
    const rankedDrivers = drivers
        .map(entry => ({ id: entry.rankId, value: metricGetter(entry.driver) }))
        .filter(entry => entry.value > 0)
        .sort((left, right) => left.value - right.value);

    return new Map(rankedDrivers.map((entry, index) => [entry.id, index + 1]));
}

function resolveTrackDriverColor(driverEntry, averageRanks, bestLapRanks) {
    const { driver, rankId } = driverEntry;
    const backendColor = normalizeDriverColor(driver?.color);
    if (backendColor !== 'neutral') return backendColor;

    const averageColor = getRankColor(averageRanks.get(rankId));
    const bestLapColor = getRankColor(bestLapRanks.get(rankId));
    const severity = { neutral: 99, red: 3, orange: 2, green: 1 };

    return severity[averageColor] < severity[bestLapColor] ? averageColor : bestLapColor;
}

function getColorStyles(color) {
    if (color === 'green') {
        return {
            cardBorder: 'rgba(81, 207, 102, 0.7)',
            cardBackground: 'rgba(81, 207, 102, 0.12)',
            valueColor: '#51cf66'
        };
    }
    if (color === 'orange') {
        return {
            cardBorder: 'rgba(255, 212, 59, 0.7)',
            cardBackground: 'rgba(255, 212, 59, 0.12)',
            valueColor: '#ffd43b'
        };
    }
    if (color === 'red') {
        return {
            cardBorder: 'rgba(255, 107, 107, 0.7)',
            cardBackground: 'rgba(255, 107, 107, 0.12)',
            valueColor: '#ff8787'
        };
    }
    return {
        cardBorder: 'rgba(255,255,255,0.1)',
        cardBackground: 'rgba(0,0,0,0.3)',
        valueColor: '#4dabf7'
    };
}

function renderDrivers(drivers) {
    const container = document.getElementById('drivers-list');
    if (!container) return;
    
    if (!drivers || drivers.length === 0) {
        container.innerHTML = '<p style="text-align:center;grid-column:1/-1">👥 Sin drivers</p>';
        return;
    }

    const driverEntries = drivers.map((driver, index) => ({ driver, rankId: `${driver?.dorsal ?? 'unknown'}-${index}` }));
    const trackDrivers = driverEntries.filter(entry => !entry.driver?.en_pit);
    const averageRanks = calculateMetricRanks(trackDrivers, getAverageStint);
    const bestLapRanks = calculateMetricRanks(trackDrivers, getBestLap);
    
    let html = '';
    driverEntries.forEach(driverEntry => {
        const { driver, rankId } = driverEntry;
        const status = driver.en_pit ? '🔴 EN PIT' : '🟢 EN PISTA';
        const statusClass = driver.en_pit ? 'pit' : 'pista';
        const driverColor = driver.en_pit
            ? normalizeDriverColor(driver.frozen_color || driver.color)
            : resolveTrackDriverColor(driverEntry, averageRanks, bestLapRanks);
        const bestLapColor = driver.en_pit
            ? driverColor
            : getRankColor(bestLapRanks.get(rankId));
        const driverStyles = getColorStyles(driverColor);
        const bestLapStyles = getColorStyles(bestLapColor);
        const bestLap = getBestLap(driver);
        const average = getAverageStint(driver);
        const stintLaps = getStintLapCount(driver);
        
        html += `
            <div class="driver-card" style="border-color:${driverStyles.cardBorder};background:${driverStyles.cardBackground};">
                <h4>#${driver.dorsal} - ${driver.equipo}</h4>
                <div class="driver-info">
                    <span class="label">Vueltas:</span>
                    <span class="value">${driver.laps_count}</span>
                </div>
                <div class="driver-info">
                    <span class="label">Mejor:</span>
                    <span class="value" style="color:${bestLapStyles.valueColor}">${formatTime(bestLap)}</span>
                </div>
                <div class="driver-info">
                    <span class="label">Media:</span>
                    <span class="value" style="color:${driverStyles.valueColor}">${formatTime(average)}</span>
                </div>
                <div class="driver-info">
                    <span class="label">Stint:</span>
                    <span class="value">${stintLaps} vueltas</span>
                </div>
                <div class="driver-info">
                    <span class="label">Boxes:</span>
                    <span class="value">${driver.pits}</span>
                </div>
                <div class="driver-status ${statusClass}">${status}</div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ==================== PIT QUEUE RENDERING ====================

function renderPitQueue(queue) {
    const container = document.getElementById('pit-queue');
    if (!container) return;
    
    if (!queue || queue.length === 0) {
        container.innerHTML = '<p>—</p>';
        return;
    }
    
    let html = '<div style="display:flex;gap:0.5rem;flex-wrap:wrap;">';
    queue.forEach(car => {
        const color = car.color || 'neutral';
        let bgColor = '#333';
        if (color === 'green') bgColor = '#00aa00';
        if (color === 'orange') bgColor = '#ff9900';
        if (color === 'red') bgColor = '#cc0000';
        
        html += `<div style="padding:0.4rem 0.6rem;background:${bgColor};border-radius:6px;font-size:0.9rem;">
            K${car.dorsal} (${car.equipo}) - ${car.tiempo}s
        </div>`;
    });
    html += '</div>';
    
    container.innerHTML = html;
}

// ==================== BOXES RENDERING ====================

function renderBoxes(boxes) {
    if (!boxes) return;
    
    const renderColumn = (column, boxArray) => {
        let html = '';
        if (boxArray) {
            boxArray.forEach(box => {
                if (!box) {
                    html += '<div class="box-item">—</div>';
                } else {
                    const color = box.color || 'neutral';
                    let bgColor = 'rgba(255,255,255,0.02)';
                    if (color === 'green') bgColor = 'rgba(0,200,0,0.15)';
                    if (color === 'orange') bgColor = 'rgba(255,150,0,0.15)';
                    if (color === 'red') bgColor = 'rgba(200,0,0,0.15)';
                    
                    html += `<div class="box-item" style="background:${bgColor};">
                        <strong>${box.dorsal}</strong><br/>
                        ${box.equipo}<br/>
                        <small>${box.tiempo}s</small>
                    </div>`;
                }
            });
        }
        return html;
    };
    
    const leftBox = document.getElementById('boxes-left');
    const centerBox = document.getElementById('boxes-center');
    const rightBox = document.getElementById('boxes-right');
    
    if (leftBox) leftBox.innerHTML = renderColumn('left', boxes.left);
    if (centerBox) centerBox.innerHTML = renderColumn('center', boxes.center);
    if (rightBox) rightBox.innerHTML = renderColumn('right', boxes.right);
}

// ==================== POSICIÓN REAL ====================

async function refreshRealpos() {
    try {
        const response = await fetch(API_URL + '/api/realpos');
        const data = await response.json();
        
        if (!data.data || data.data.length === 0) {
            const body = document.getElementById('realpos-body');
            if (body) body.innerHTML = '<tr><td colspan="11" style="text-align:center">📭 Sin datos</td></tr>';
            return;
        }
        
        let html = '';
        data.data.forEach(driver => {
            html += `
                <tr>
                    <td>${driver.pos}</td>
                    <td><strong>${driver.dorsal}</strong></td>
                    <td>${driver.laps}</td>
                    <td>${driver.laps_real}</td>
                    <td>${formatTime(driver.race_time)}</td>
                    <td>${formatTime(driver.pit_excess)}</td>
                    <td>${driver.penalty_seconds > 0 ? '+' + driver.penalty_seconds.toFixed(1) + 's' : '—'}</td>
                    <td>${driver.penalty_laps > 0 ? '+' + driver.penalty_laps : '—'}</td>
                    <td>${formatTime(driver.time_proj)}</td>
                    <td>${driver.interval_display}</td>
                    <td>${driver.gap_display}</td>
                </tr>
            `;
        });
        
        const body = document.getElementById('realpos-body');
        if (body) body.innerHTML = html;
        
        const summary = document.getElementById('realpos-summary');
        if (summary && data.config) {
            summary.innerHTML = `<strong>${data.data.length} drivers | Pit mín: ${data.config.pit_min_effective}s | Paradas: ${data.config.required_pits}</strong>`;
        }
    } catch (error) {
        console.error('Error refreshRealpos:', error);
        const body = document.getElementById('realpos-body');
        if (body) body.innerHTML = '<tr><td colspan="11">❌ Error al cargar</td></tr>';
    }
}

// ==================== RESUMEN ====================

async function refreshSummary() {
    try {
        const response = await fetch(API_URL + '/api/summary');
        const data = await response.json();
        
        if (data.error) {
            const body = document.getElementById('summary-top10-body');
            if (body) body.innerHTML = '<tr><td colspan="4">⚠️ No inicializado</td></tr>';
            return;
        }
        
        // Top 10
        let html = '';
        const top10 = data.classification.slice(0, 10);
        
        if (top10.length === 0) {
            html = '<tr><td colspan="4">📭 Sin datos</td></tr>';
        } else {
            top10.forEach(driver => {
                html += `
                    <tr>
                        <td>${driver.pos}</td>
                        <td><strong>${driver.dorsal}</strong></td>
                        <td>${driver.equipo}</td>
                        <td>${driver.interval_display}</td>
                    </tr>
                `;
            });
        }
        
        const body = document.getElementById('summary-top10-body');
        if (body) body.innerHTML = html;
        
    } catch (error) {
        console.error('Error refreshSummary:', error);
        const body = document.getElementById('summary-top10-body');
        if (body) body.innerHTML = '<tr><td colspan="4">❌ Error al cargar</td></tr>';
    }
}

// ==================== PENALTIES ====================

async function addPenalty() {
    const dorsal = (document.getElementById('penalty-dorsal')?.value || '').trim();
    const seconds = parseFloat(document.getElementById('penalty-seconds')?.value || 0);
    const laps = parseInt(document.getElementById('penalty-laps')?.value || 0);
    
    if (!dorsal) {
        showAlert('⚠️ Ingresa KART', 'info');
        return;
    }
    
    try {
        const response = await fetch(API_URL + '/api/penalty', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dorsal, seconds, laps, reason: 'Manual' })
        });
        
        if (response.ok) {
            showAlert('✅ Sanción agregada', 'success');
            document.getElementById('penalty-dorsal').value = '';
            document.getElementById('penalty-seconds').value = '';
            document.getElementById('penalty-laps').value = '';
            refreshRealpos();
        }
    } catch (error) {
        showAlert('❌ Error', 'error');
    }
}

// ==================== UTILIDADES ====================

function formatTime(seconds) {
    if (!seconds || seconds === 0) return '—';
    const sec = Math.floor(seconds);
    const ms = Math.floor((seconds - sec) * 1000);
    return `${sec}:${ms.toString().padStart(3, '0')}`;
}

function showAlert(message, type) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    alert.style.cssText = `
        position: fixed;
        top: 12px;
        right: 12px;
        padding: 0.8rem 1rem;
        background: ${type === 'success' ? '#00aa00' : type === 'error' ? '#cc0000' : '#0066cc'};
        color: #fff;
        border-radius: 6px;
        z-index: 9999;
        font-weight: 600;
    `;
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.style.opacity = '0';
        alert.style.transition = 'opacity 0.3s';
        setTimeout(() => alert.remove(), 300);
    }, 3000);
}

// ==================== AUTO REFRESH ====================

setInterval(() => {
    if (document.getElementById('app-screen').style.display === 'block') {
        refreshState();
        if (currentTab === 'realpos') refreshRealpos();
        if (currentTab === 'summary') refreshSummary();
        if (currentTab === 'track') refreshDrivers();
    }
}, 2000);
