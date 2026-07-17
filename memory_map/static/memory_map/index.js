/* ═══════════════════════════════════════════════════════════
 /* ═══════════════════════════════════════════════════════════
   MAP SETUP (Configuración Segura)
   ═══════════════════════════════════════════════════════════ */
// Variables globales
let allMarkers = [];
let activeCollabMarker = null;
let markerWasClicked = false;
const incidentsDataElement = document.getElementById('incidents-data');
const incidents = incidentsDataElement ? JSON.parse(incidentsDataElement.textContent) : [];

console.log("Incidents loaded:", incidents.length);
const map = L.map('map', {
    preferCanvas: true,
    tap: false,
    dragging: true,
    clickTolerance: 3,
}).setView([-38.4, -63.6], 4.5);

L.tileLayer('https://api.maptiler.com/maps/streets-v4/{z}/{x}/{y}.png?key=IrUrEsVpqSAIcot1VC8h', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18,
}).addTo(map);

function createColoredIcon(pinColor) {
    return L.divIcon({
        className: 'cat-pill-icon',
        html: `<div style="
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: ${pinColor}; 
            width: 14px; 
            height: 14px; 
            border-radius: 50%; 
            border: 2px solid white; 
            box-shadow: 0 0 6px rgba(0,0,0,0.4);
        "></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
    });
}
// ==========================================
// 2. MARKER RENDERING & FILTER LOGIC
// ==========================================

/**
 * Clears existing approved markers and paints the filtered incident dataset onto the map layer.
 */
function displayMarkers(filterId) {
    // Memory Management: Remove old layers from the map to prevent leaks
    allMarkers.forEach(marker => map.removeLayer(marker));

    incidents.forEach(function(incident) {  
              // Safety Guard: Validate that coordinates fall within standard global bounding limits
        if (!incident.latitude || !incident.longitude
            || incident.latitude < -90  || incident.latitude > 90
            || incident.longitude < -180 || incident.longitude > 180) {
            console.warn("Skipping record due to out-of-bounds coordinates:", incident.title_es);
            return;
        }

        // Editorial Guard: Only render points authorized by the review state
        if (incident.status !== 'approved') return;
        
        if (typeof state !== 'undefined' && incident.year > state.maxYear) return;

        // use state.activeCats from inline script
        if (typeof state !== 'undefined' && !state.activeCats.has(incident.category_id)) return;

        // Category Guard: Filter records based on selected dropdown options
        if (filterId !== 'all' && incident.category_id.toString() !== filterId) return;
        let pinColor = "orange"; // Default fallback color
        
        if (typeof CATEGORIES !== 'undefined' && Array.isArray(CATEGORIES)) {
            const matchedCategory = CATEGORIES.find(cat => cat.id.toString() === incident.category_id.toString());
            if (matchedCategory && matchedCategory.color) {
                pinColor = matchedCategory.color; // Extract the dynamic hex color string
            }
        }

        // Generate the custom map point configuration using the matching color
        const customIcon = createColoredIcon(pinColor);

        // Instantiate Leaflet standard marker
        const marker = L.marker([incident.latitude, incident.longitude], {
            icon: customIcon
        });
        
        // Bind sidebar display routine to the marker click interaction
        (function(capturedIncident) {
            console.log("registering marker :", capturedIncident.id, capturedIncident.title_es);
            marker.on('click', function(e) {
                markerWasClicked = true;
                L.DomEvent.stopPropagation(e);
                openDetail(capturedIncident);
            });
        })(incident);

        marker.addTo(map);
        allMarkers.push(marker); // Track inside our runtime reference array
    });
    if (typeof updateResultsCount === 'function') {
        updateResultsCount(allMarkers.length);
    }
}

/**
 * Change handler triggered when the user alters the category selection dropdown element.
 */
function filterCategory() {
    const selectedCategory = document.getElementById('category-filter').value;
    displayMarkers(selectedCategory);
}

// ==========================================
// 3. INTERACTIVE MAP CLICK 
// ==========================================

// Aseguramos un registro limpio del evento sobre el objeto 'map'


map.on('click', function(event) {
    // CAPA DE GUARDIA: Si el clic proviene de un marcador existente,
    // consumimos la bandera 'markerWasClicked', la reseteamos y salimos.
    if (markerWasClicked) {
        
        console.log("MAP CLICK - markerWasClicked:", markerWasClicked);
        console.log("MAP CLICK - event._stopped:", event.originalEvent._stopped);
        markerWasClicked = false; // Reseteo crucial para el próximo clic
        return;
    }

    // Si la propagación interna de Leaflet fue detenida de manera nativa
    if (event.originalEvent && event.originalEvent._stopped) return;

    const clickedLatitude  = event.latlng.lat;
    const clickedLongitude = event.latlng.lng;
    
    console.log(`Global map registration / Lat: ${clickedLatitude}, Lng: ${clickedLongitude}`);

    // Ventana de diálogo para confirmar la creación del nuevo hito
    const userConfirmed = window.confirm(
        typeof currentLang !== 'undefined' && currentLang === 'es'
        ? "¿Querés agregar un hito en este lugar?"
        : "Do you want to add an incident at this location?"
    );

    if (!userConfirmed) return;

    // Referencias a los campos del formulario inyectado
    const latField = document.getElementById('form-lat');
    const lngField = document.getElementById('form-lng');
    if (latField && lngField) {
        latField.value = clickedLatitude.toFixed(6);
        lngField.value = clickedLongitude.toFixed(6);
    }

    // Renderizado del marcador temporal (Draft Pin)
    if (activeCollabMarker) {
        map.removeLayer(activeCollabMarker);
    }
    
    activeCollabMarker = L.marker([clickedLatitude, clickedLongitude], {
        draggable: true,
        icon: L.divIcon({
            className: '',
            html: `<div style="
                width:14px;height:14px;border-radius:50%;
                background:#2c2c2a;border:2px solid white;
                box-shadow:0 0 6px rgba(0,0,0,0.5);">
            </div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7]
        })
    }).addTo(map);

    // Listener para actualizar coordenadas en tiempo real al arrastrar el marcador borrador
    activeCollabMarker.on('dragend', function(dragEvent) {
        const pos = dragEvent.target.getLatLng();
        if (latField && lngField) {
            latField.value = pos.lat.toFixed(6);
            lngField.value = pos.lng.toFixed(6);
        }
    });

    // Apertura visual del contenedor del formulario
    if (typeof openModal === 'function') {
        openModal(); 
    } 
});

// ==========================================
// 4. SIDEBAR WORKSPACE INTERFACE
// ==========================================

function openDetail(incident) {
    console.log("openDetail called with:", incident.id, incident.title_es);
    currentIncident = incident;
    
    const cat     = CATEGORIES.find(c => c.id === incident.category_id);
    const lang    = currentLang;
    const title   = lang === 'es' ? incident.title_es : incident.title_en;
    const desc    = lang === 'es' ? incident.description_es : incident.description_en;  
    const catName = lang === 'es' ? cat.name_es : cat.name_en;
    
    const badge = document.getElementById('detail-cat-badge');
    badge.innerHTML = `<span class="dot" style="background:${cat.color}"></span>${catName}`;
    badge.style.background = cat.bg;
    badge.style.color = cat.color;
    
    document.getElementById('detail-title').textContent = title;
    document.getElementById('detail-meta').textContent = `${incident.year} · ${incident.location_label}`;
    
    const vBadge = document.getElementById('detail-verified');
    if (incident.status === 'approved') {
        vBadge.textContent = STRINGS[lang].verified_badge;
        vBadge.className = 'detail-verified yes';
    } else {
        vBadge.textContent = STRINGS[lang].pending_badge;
        vBadge.className = 'detail-verified pending';
    }
    
    document.getElementById('detail-desc').textContent = desc;
    
    const tagsEl = document.getElementById('detail-tags');
    tagsEl.innerHTML = [catName, String(incident.year)]
        .map(t => `<span class="detail-tag">${t}</span>`).join('');
    
    const imgEl = document.getElementById('detail-img');
    if (incident.cover_image) {
        imgEl.innerHTML = `<img src="${incident.cover_image}" alt="${title}" />`;
    } else {
        imgEl.innerHTML = `<span>${STRINGS[lang].no_image}</span>`;
    }
    
    const sourcesEl = document.getElementById('detail-sources');
    if (incident.sources && incident.sources.length) {
        sourcesEl.innerHTML = `<div class="sb-label">Sources</div>` +
            incident.sources.map(s => `<a href="${s.url}" target="_blank" rel="noopener">→ ${s.label}</a>`).join('');
    } else {
        sourcesEl.innerHTML = '';
    }
    
    // OPEN the sidebar
    const sidebar = document.getElementById("sidebar-detail");
    if (sidebar) sidebar.style.width = "350px";
    
    document.getElementById('detail-empty').style.display = 'none';
    document.getElementById('detail-content').classList.add('visible');
}
// ==========================================
// 5. ASYNCHRONOUS FORM SUBMISSION (AJAX/FETCH)
// ==========================================

function submitForm(e) {
    e.preventDefault(); // HALT standard browser page-reload processing
    const formData = new FormData(e.target);
    
    fetch('/contribute/', {
        method: 'POST',
        body: formData,
        headers: { 
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value 
        }
    })
    .then(response => {
        if (response.ok) {
            alert('Thank you! Sent for review.');
            e.target.reset(); // Wipe all input entries from the visual form
            if (typeof closeModal === 'function') {
                closeModal();
            }
            // Clean up the draft map pin on success
            if (activeCollabMarker) {
                map.removeLayer(activeCollabMarker);
                activeCollabMarker = null;
            }
        } else {
            alert('Something went wrong. Please try again.');
        }
    })
    .catch(error => {
        console.error("Network communication exception:", error);
    });
}

// ==========================================
// 6. INITIAL RUNTIME RUN
// ==========================================
// Render all approved markers across all categories immediately upon loading
document.addEventListener("DOMContentLoaded", function() {
    displayMarkers('all');
    const formEl = document.querySelector('#modal-overlay form');
    if (formEl) {
        formEl.addEventListener('submit', submitForm);
    }
});
// map.setView([-38.4, -63.6], 5);
