// ==================== CONFIGURACIÓN ====================

const API_URL = 'http://' + window.location.hostname + ':5000';
let currentTab = 'init';

// ==================== TAB SWITCHING ====================

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    
    document.getElementById(tabName + '-tab').classList.add('active');
    event.target.classList.add('active');
    
    currentTab = tabName;
    
    if (tabName === 'realpos') refreshRealpos();
    if (tabName === 'summary') refreshSummary();
    if (tabName === 'drivers') refreshDrivers();
}

// ==================== INICIALIZACIÓN ====================

async function loadConfig() {
    try {
        const response = await fetch(API_URL + '/api/config');
        const data = await response.json();
        
        if (data.initialized) {
            updateStatus('Inicializado ✅', 'green');
        } else {
            updateStatus('No inicializado ❌', 'red');
        }
    } catch (error) {
        console.error('Error loading config:', error);
        updateStatus('Error de conexión ❌', 'red');
    }
}

async function initServer() {
    const circuit = document.getElementById('circuit').value;
    const mode = document.getElementById('mode').value;
    const num_boxes = parseInt(document.getElementById('num_boxes').value);
    const required_pits = parseInt(document.getElementById('required_pits').value);
    const pit_min_seconds = parseInt(document.getElementById('pit_min_seconds').value);
    
    try {
        const response = await fetch(API_URL + '/api/init', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                circuit,
                mode,
                num_boxes,
                required_pits,
                pit_min_seconds,
                stint_max_minutes: 0
            })
        });
        
        const data = await response.json();
        
        if (data.status === 'ok') {
            showAlert('✅ Servidor inicializado correctamente', 'success');
            updateStatus('Conectado ✅', 'green');
            setTimeout(() => {
                document.querySelectorAll('.tab-btn')[1].click();
            }, 500);
        } else {
            showAlert('❌ ' + data.message, 'error');
        }
    } catch (error) {
        console.error('Init error:', error);
        showAlert('❌ Error al inicializar', 'error');
    }
}

async function resetAll() {
    if (!confirm('¿Seguro de que quieres reiniciar todo?')) return;
    
    try {
        await fetch(API_URL + '/api/reset', { method: 'POST' });
        showAlert('✅ Sistema reiniciado', 'success');
        updateStatus('Desconectado ❌', 'red');
        loadConfig();
    } catch (error) {
        showAlert('❌ Error al reiniciar', 'error');
    }
}

// ==================== DATOS MANUALES ====================

async function addLapManual() {
    const dorsal = document.getElementById('manual_dorsal').value.trim();
    const equipo = document.getElementById('manual_equipo').value.trim();
    const lap_time = parseFloat(document.getElementById('manual_lap_time').value);
    const laps_count = parseInt(document.getElementById('manual_laps_count').value);
    
    if (!dorsal || !lap_time || !laps_count) {
        showAlert('⚠️ Completa todos los campos', 'info');
        return;
    }
    
    try {
        const response = await fetch(API_URL + '/api/add-lap', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                dorsal,
                equipo,
                lap_time,
                laps_count
            })
        });
        
        if (response.ok) {
            showAlert(`✅ Vuelta agregada: ${dorsal} - ${lap_time}s`, 'success');
            document.getElementById('manual_dorsal').value = '';
            document.getElementById('manual_equipo').value = '';
            document.getElementById('manual_lap_time').value = '';
            document.getElementById('manual_laps_count').value = '';
            refreshDrivers();
            refreshRealpos();
            refreshSummary();
        } else {
            showAlert('❌ Error al agregar vuelta', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('❌ Error de conexión', 'error');
    }
}

async function pitIn() {
    const dorsal = document.getElementById('pit_control_dorsal').value.trim();
    
    if (!dorsal) {
        showAlert('⚠️ Ingresa el dorsal', 'info');
        return;
    }
    
    try {
        const response = await fetch(API_URL + '/api/pit-in', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dorsal })
        });
        
        const data = await response.json();
        showAlert(`🔴 PIT IN: ${dorsal}`, 'info');
        document.getElementById('pit_control_dorsal').value = '';
        refreshDrivers();
        refreshSummary();
    } catch (error) {
        console.error('Error:', error);
        showAlert('❌ Error en PIT IN', 'error');
    }
}

async function pitOut() {
    const dorsal = document.getElementById('pit_control_dorsal').value.trim();
    
    if (!dorsal) {
        showAlert('⚠️ Ingresa el dorsal', 'info');
        return;
    }
    
    try {
        const response = await fetch(API_URL + '/api/pit-out', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dorsal })
        });
        
        const data = await response.json();
        showAlert(`🟢 PIT OUT: ${dorsal}`, 'info');
        document.getElementById('pit_control_dorsal').value = '';
        refreshDrivers();
        refreshSummary();
    } catch (error) {
        console.error('Error:', error);
        showAlert('❌ Error en PIT OUT', 'error');
    }
}

async function addPenalty() {
    const dorsal = document.getElementById('penalty_dorsal').value.trim();
    const seconds = parseFloat(document.getElementById('penalty_seconds').value) || 0;
    const laps = parseInt(document.getElementById('penalty_laps').value) || 0;
    const reason = document.getElementById('penalty_reason').value.trim();
    
    if (!dorsal) {
        showAlert('⚠️ Ingresa el dorsal', 'info');
        return;
    }
    
    try {
        const response = await fetch(API_URL + '/api/penalty', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dorsal, seconds, laps, reason })
        });
        
        if (response.ok) {
            showAlert(`⚠️ Penalización agregada: ${dorsal}`, 'success');
            document.getElementById('penalty_dorsal').value = '';
            document.getElementById('penalty_seconds').value = '';
            document.getElementById('penalty_laps').value = '';
            document.getElementById('penalty_reason').value = '';
            refreshRealpos();
            refreshSummary();
        } else {
            showAlert('❌ Error al agregar penalización', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('❌ Error de conexión', 'error');
    }
}

// ==================== POSICIÓN REAL ====================

async function refreshRealpos() {
    try {
        const response = await fetch(API_URL + '/api/realpos');
        const data = await response.json();
        
        if (!data.data || data.data.length === 0) {
            document.getElementById('realpos-tbody').innerHTML = 
                '<tr><td colspan="10" style="text-align:center">📭 Sin datos aún</td></tr>';
            return;
        }
        
        let html = '';
        data.data.forEach(driver => {
            html += `
                <tr>
                    <td><strong>${driver.pos}</strong></td>
                    <td>${driver.dorsal}</td>
                    <td>${driver.equipo}</td>
                    <td>${driver.laps}</td>
                    <td>${formatTime(driver.race_time)}</td>
                    <td>${formatTime(driver.time_proj)}</td>
                    <td>${driver.gap_display}</td>
                    <td>${driver.interval_display}</td>
                    <td>${driver.pits_done}/${data.config.required_pits}</td>
                    <td>${driver.penalty_seconds > 0 ? '+' + driver.penalty_seconds + 's' : '—'}</td>
                </tr>
            `;
        });
        
        document.getElementById('realpos-tbody').innerHTML = html;
    } catch (error) {
        console.error('Error:', error);
    }
}

// ==================== RESUMEN ====================

async function refreshSummary() {
    try {
        const response = await fetch(API_URL + '/api/summary');
        const data = await response.json();
        
        if (data.error) {
            document.getElementById('summary-tbody').innerHTML = 
                '<tr><td colspan="6" style="text-align:center">⚠️ No inicializado</td></tr>';
            return;
        }
        
        // Actualizar stats
        document.getElementById('summary-circuit').textContent = data.circuit.toUpperCase();
        document.getElementById('summary-drivers').textContent = data.total_drivers;
        document.getElementById('summary-pista').textContent = data.total_drivers - data.drivers_in_pit;
        document.getElementById('summary-pit').textContent = data.drivers_in_pit;
        document.getElementById('summary-queue').textContent = data.pit_queue_length;
        document.getElementById('summary-ws-lines').textContent = data.ws_stats.lines_total;
        document.getElementById('summary-ws-parsed').textContent = data.ws_stats.lines_parsed;
        document.getElementById('summary-mapped').textContent = data.ws_stats.rows_mapped;
        
        // Top 5
        let html = '';
        const top5 = data.classification.slice(0, 5);
        
        if (top5.length === 0) {
            html = '<tr><td colspan="6" style="text-align:center">📭 Sin datos</td></tr>';
        } else {
            top5.forEach(driver => {
                html += `
                    <tr>
                        <td><strong>${driver.pos}</strong></td>
                        <td>${driver.dorsal}</td>
                        <td>${driver.equipo}</td>
                        <td>${driver.laps}</td>
                        <td>${formatTime(driver.time_proj)}</td>
                        <td>${driver.gap_display}</td>
                    </tr>
                `;
            });
        }
        
        document.getElementById('summary-tbody').innerHTML = html;
    } catch (error) {
        console.error('Error:', error);
    }
}

// ==================== DRIVERS EN PISTA ====================

async function refreshDrivers() {
    try {
        const response = await fetch(API_URL + '/api/state');
        const data = await response.json();
        
        if (!data.drivers || data.drivers.length === 0) {
            document.getElementById('drivers-list').innerHTML = 
                '<p style="text-align:center;grid-column:1/-1">👥 Sin drivers aún</p>';
            return;
        }
        
        let html = '';
        data.drivers.forEach(driver => {
            const status = driver.en_pit ? '🔴 EN PIT' : '🟢 EN PISTA';
            const statusClass = driver.en_pit ? 'pit' : 'pista';
            
            html += `
                <div class="driver-card">
                    <h4>#${driver.dorsal} - ${driver.equipo}</h4>
                    <div class="driver-info">
                        <span class="label">Vueltas:</span>
                        <span class="value">${driver.laps_count}</span>
                    </div>
                    <div class="driver-info">
                        <span class="label">Mejor:</span>
                        <span class="value">${formatTime(driver.mejor)}</span>
                    </div>
                    <div class="driver-info">
                        <span class="label">Media:</span>
                        <span class="value">${formatTime(driver.media)}</span>
                    </div>
                    <div class="driver-info">
                        <span class="label">Stint:</span>
                        <span class="value">${driver.stint_laps} vueltas</span>
                    </div>
                    <div class="driver-info">
                        <span class="label">Boxes:</span>
                        <span class="value">${driver.pits}/12</span>
                    </div>
                    <div class="driver-status ${statusClass}">${status}</div>
                </div>
            `;
        });
        
        document.getElementById('drivers-list').innerHTML = html;
    } catch (error) {
        console.error('Error:', error);
    }
}

// ==================== UTILIDADES ====================

function formatTime(seconds) {
    if (!seconds || seconds === 0) return '—';
    const sec = Math.floor(seconds);
    const ms = Math.floor((seconds - sec) * 1000);
    return `${sec}:${ms.toString().padStart(3, '0')}`;
}

function updateStatus(text, color) {
    const status = document.getElementById('status');
    status.textContent = text;
    status.style.backgroundColor = color === 'green' ? 'rgba(81,207,102,0.3)' : 'rgba(255,107,107,0.3)';
}

function showAlert(message, type) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    const container = document.querySelector('.container');
    container.insertBefore(alert, container.firstChild);
    
    setTimeout(() => {
        alert.style.opacity = '0';
        alert.style.transition = 'opacity 0.3s';
        setTimeout(() => alert.remove(), 300);
    }, 3000);
}

// ==================== INICIALIZACIÓN ====================

window.addEventListener('load', () => {
    loadConfig();
    setInterval(loadConfig, 5000);
    setInterval(refreshRealpos, 2000);
    setInterval(refreshSummary, 2000);
    setInterval(refreshDrivers, 2000);
});
