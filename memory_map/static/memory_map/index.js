 /* ═══════════════════════════════════════════════════════════
   MAP SETUP
   ═══════════════════════════════════════════════════════════ */
// Variables globales
let allMarkers = [];
let activeCollabMarker = null;
let markerWasClicked = false;
let isSelectingLocation = false;

const incidentsDataElement = document.getElementById('incidents-data');
const incidents = incidentsDataElement ? JSON.parse(incidentsDataElement.textContent) : [];

console.log("Incidents loaded:", incidents.length);

L.Browser.touch = false;
L.Browser.pointer = false;

const map = L.map('map', {
    tap: false,
    dragging: true,
    clickTolerance: 10,
}).setView([-38.4, -63.6], 4.5);

L.tileLayer('https://wms.ign.gob.ar/geoserver/gwc/service/tms/1.0.0/mapabase_gris@EPSG:3857@png/{z}/{x}/{-y}.png', {
    attribution: '© Instituto Geográfico Nacional Argentina',
    maxZoom: 18,
    minZoom: 3,
    // Opciones para suavizar la carga lenta:
    updateWhenIdle: true,     // No descarga tiles mientras te arrastrás por el mapa, espera a que te detengas
    updateWhenZooming: false,  // Espera a terminar el zoom antes de pedir imágenes nuevas
    keepBuffer: 2
}).addTo(map);


// 1. button + Contribute an incident"
window.startCollaborationMode = function() {
    isSelectingLocation = true;
    console.log("selection mood activated");

    if (typeof closeModal === 'function') {
        closeModal();
    } else {
        const modalOverlay = document.getElementById('modal-overlay');
        if (modalOverlay) modalOverlay.classList.remove('open');
    }
    
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
        mapContainer.style.cursor = 'crosshair';
    }
};

function enableMapPicker(){
    startCollaborationMode();
}

map.on('click', function(event) {
    if (!isSelectingLocation) return;

    if (!event || !event.latlng) {
        console.error("El evento de Leaflet no contiene coordenadas válidas.", event);
        return;
    }

    const latitude = event.latlng.lat;
    const longitude = event.latlng.lng;

    const latInput = document.getElementById('form-lat');
    const lngInput = document.getElementById('form-lng');

    if (latInput && lngInput) {
        latInput.value = latitude.toFixed(6);
        lngInput.value = longitude.toFixed(6);
        console.log(`Coordenadas asignadas al formulario: Lat ${latitude}, Lng ${longitude}`);
    } else {
        console.error("input didnt found")
    }

    isSelectingLocation = false;
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
        mapContainer.style.cursor = '';
    }

    const coordsIndicator = document.getElementById('coords-indicator');
    if (coordsIndicator) {
        coordsIndicator.style.display = 'inline';
    }

    if (typeof openModal === 'function') {
        openModal();
    } else {
        const modalOverlay = document.getElementById('modal-overlay');
        if (modalOverlay) modalOverlay.style.display = 'flex';
    }
});

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
        iconSize: [12, 12],
        iconAnchor: [6, 6]
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
        console.log("Evaluando incidente para el mapa:", incident.title_es, {
        year: incident.year,
        category: incident.category_id,
        status: incident.status
        });

        // Editorial Guard: Only render points authorized by the review state
        // if (incident.status !== 'approved') return;
        
        if (typeof state !== 'undefined' && state.maxYear) {
        const incidentYear = parseInt(incident.year, 10);
        const maxMapYear = parseInt(state.maxYear, 10);
        if (!isNaN(incidentYear) && !isNaN(maxMapYear) && incidentYear > maxMapYear) {
            return; // Se pasa del año de la línea de tiempo
        }
    }

    // 3. Filtro de Categorías Activas Seguro
    if (typeof state !== 'undefined' && state.activeCats) {
        // Convertimos a string por las dudas para comparar peras con peras
        const activeIdsAsStrings = Array.from(state.activeCats).map(id => id.toString());
        if (!activeIdsAsStrings.includes(incident.category_id.toString())) {
            return; // La categoría está desmarcada en el mapa
        }
    }

    // 4. Filtro del Dropdown Select
    if (filterId !== 'all' && incident.category_id.toString() !== filterId.toString()) {
        return;
    }
        let pinColor = "orange"; // Default fallback color
        
        if (typeof CATEGORIES !== 'undefined' && Array.isArray(CATEGORIES)) {
        const matchedCategory = CATEGORIES.find(cat => cat.id.toString() === incident.category_id.toString());
        if (matchedCategory && matchedCategory.color) {
            pinColor = matchedCategory.color; 
        }
    }

    const customIcon = createColoredIcon(pinColor);
    const marker = L.marker([parseFloat(incident.latitude), parseFloat(incident.longitude)], {
        icon: customIcon
    });
    
    // data inciddent
    marker.incidentData = incident;

    // Vinculamos el click para abrir el detalle en la barra lateral
    (function(capturedIncident) {
        marker.on('click', function(e) {
            markerWasClicked = true;
            L.DomEvent.stopPropagation(e);
            if (typeof openDetail === 'function') {
                openDetail(capturedIncident);
            }
        });
    })(incident);

    marker.addTo(map);
    allMarkers.push(marker); 
});
}

/**
 * Change handler triggered when the user alters the category selection dropdown element.
 */
function filterCategory() {
    const selectedCategory = document.getElementById('category-filter').value;
    displayMarkers(selectedCategory);
}

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
    e.preventDefault(); 

    const formData = new FormData(e.target);

    fetch('/contribute/', {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value 
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error en el servidor de Django');
        }
        return response.json(); // Convierte la respuesta a un objeto JS
    })
    
    .then(data => { 
        console.log("Respuesta del servidor:", data);
        
        // Ahora sí podés usar 'data' de forma segura porque existe acá adentro
        if (data.status === 'success') {
            alert('¡Formulario enviado con éxito! Queda a la espera de aprobación.');
            
            // Si tenés una función para cerrar el modal y limpiar el mapa, llamala acá:
            if (typeof closeModal === 'function') {
                closeModal();
            }
            
            // Opcional: resetea los campos del formulario
            e.target.reset();
        }
    })
    .catch(error => {
        console.error('Network communication exception:', error);
    });
}// ==========================================
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


function renderSearchResults(matchingMarkers) {
    const listContainer = document.getElementById('search-results-list');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    if (matchingMarkers.length === 0) {
        listContainer.innerHTML = '<p class="no-results">No se encontraron resultados</p>';
        return;
    }

    matchingMarkers.forEach(marker => {
        const data = marker.incidentData;
        if (!data) return;

        const item = document.createElement('div');
        item.className = 'search-result-item';
        
        item.innerHTML = `
            <div class="res-title">${data.title_es}</div>
            <div class="res-sub">${data.year || ''} · ${data.location_label || ''}</div>
        `;

        item.addEventListener('click', () => {
            map.flyTo([data.latitude, data.longitude], 12);
            
            openDetail(data);
        });

        listContainer.appendChild(item);
    });
}

function applyFilters() {

    // form html
    const inputEl = document.getElementById('search-input');
    const query = inputEl ? inputEl.value.toLowerCase().trim() : '';

    const matchingMarkers = [];

    allMarkers.forEach(marker => {

        const incident = marker.incidentData || marker.options;

        const title = (incident.title_es || '').toLowerCase();
        const desc  = (incident.description_es || '').toLowerCase();
        const place = (incident.location_label || '').toLowerCase();
        const year  = String(incident.year || '');
        
        // it match?
        const isMatch = !query ||
                title.includes(query) || 
               desc.includes(query)  || 
               place.includes(query) || 
               year.includes(query);

        if (isMatch) {
            marker.addTo(map);
            matchingMarkers.push(marker);
        } else {
            map.removeLayer(marker);
        }
    });

    if (!query) {
        document.getElementById('search-results-list').innerHTML = '';
    } else {
            renderSearchResults(matchingMarkers);
    }
}
