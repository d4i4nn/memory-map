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
L.Browser.touch = false;
L.Browser.pointer = false;
const map = L.map('map', {
    tap: false,
    dragging: true,
    clickTolerance: 10,
}).setView([-38.4, -63.6], 4.5);
map.getContainer().style.cursor = 'crosshair';

document.getElementById('map').addEventListener('click', function(e) {
    console.log("RAW MAP CLICK");
    
    const rect = this.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const point = L.point(x, y);
    const latlng = map.containerPointToLatLng(point);
    
    console.log("Calculated latlng:", latlng);
    
    document.getElementById('form-lat').value = latlng.lat;
    document.getElementById('form-lng').value = latlng.lng;
    openModal();
});

L.tileLayer('https://api.maptiler.com/maps/streets-v4/{z}/{x}/{y}.png?key=IrUrEsVpqSAIcot1VC8h', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18,
}).addTo(map);
// 1. Escuchamos el click en el mapa de Leaflet
map.on('click', function(event) {
    if (!event || !event.latlng) {
        console.error("El evento de Leaflet no contiene coordenadas válidas.", event);
        return;
    }
    const latitude = event.latlng.lat;
    const longitude = event.latlng.lng;
    const latInput = document.getElementById('form-lat');
    const lngInput = document.getElementById('form-lng');
    if (latInput && lngInput) {
        latInput.value = latitude;
        lngInput.value = longitude;
        console.log(`Coordenadas asignadas al formulario: Lat ${latitude}, Lng ${longitude}`);
    }
    openModal(); 
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

// ==========================================
// 3. INTERACTIVE MAP CLICK 
// ==========================================

// map.on('click', function(e) {
//     const clickedLatitude  = e.latlng.lat;
//     const clickedLongitude = e.latlng.lng;
    
//     console.log("Clic en el mapa. Coordenadas capturadas:", clickedLatitude, clickedLongitude);

//     if (markerWasClicked) {
//         console.log("MAP CLICK - markerWasClicked:", markerWasClicked);
//         markerWasClicked = false; // Reset
//         return;
//     }

//     const userConfirmed = window.confirm(
//         typeof currentLang !== 'undefined' && currentLang === 'es'
//         ? "¿Querés agregar un hito en este lugar?"
//         : "Do you want to add an incident at this location?"
//     );

//     if (!userConfirmed) return;

//     // 2. coord saved
//     const latField = document.getElementById('form-lat');
//     const lngField = document.getElementById('form-lng');
    
//     if (latField && lngField) {
//         latField.value = clickedLatitude.toFixed(6);
//         lngField.value = clickedLongitude.toFixed(6);
//         console.log("Inputs del formulario cargados con éxito.");
//     } else {
//         console.error("No se encontraron los inputs 'form-lat' o 'form-lng' en el HTML. Revisá los IDs.");
//     }

//     // 3. RENDER draft pin
//     if (activeCollabMarker) {
//         map.removeLayer(activeCollabMarker);
//     }
    
//     activeCollabMarker = L.marker([clickedLatitude, clickedLongitude], {
//         draggable: true,
//         icon: L.divIcon({
//             className: '',
//             html: `<div style="
//                 width:14px;height:14px;border-radius:50%;
//                 background:#2c2c2a;border:2px solid white;
//                 box-shadow:0 0 6px rgba(0,0,0,0.5);">
//             </div>`,
//             iconSize: [14, 14],
//             iconAnchor: [7, 7]
//         })
//     }).addTo(map);

//     // Listener to update the pointer
//     activeCollabMarker.on('dragend', function(dragEvent) {
//         const pos = dragEvent.target.getLatLng();
//         if (latField && lngField) {
//             latField.value = pos.lat.toFixed(6);
//             lngField.value = pos.lng.toFixed(6);
//         }
//     });

//     if (typeof openModal === 'function') {
//         openModal(); 
//     } 
// });
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
    // ¡OJO ACÁ!: Asegurate de que acá diga 'data' adentro del paréntesis
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
// map.setView([-38.4, -63.6], 5);
