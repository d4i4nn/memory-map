// ==========================================
// 1. GLOBAL STATE & INITIALIZATION
// ==========================================

// Array to track active, approved incident markers currently displayed on the map
let allMarkers = [];

// Pointer to track the single interactive marker created when reporting a new incident
let activeCollabMarker = null;

// Safe retrieval of the JSON data injected by the Django template context
const incidentsDataElement = document.getElementById('incidents-data');
const incidents = incidentsDataElement ? JSON.parse(incidentsDataElement.textContent) : [];
/**
 * Helper function to generate custom colored Leaflet icons dynamically
 * using standard HTML/CSS marker shapes.
 * @param {string} pinColor - The primary color for the center dot/border
 */
function createColoredIcon(pinColor) {
    console.log("color")
    return L.divIcon({
        className: 'cat-pill',
        html: `<div style="
            background-color: ${pinColor}; 
            width: 14px; 
            height: 14px; 
            border-radius: 50%; 
            border: 2px solid white; 
            box-shadow: 0 0 6px rgba(0,0,0,0.4);
        "></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9]
    });
}
// ==========================================
// 2. MARKER RENDERING & FILTER LOGIC
// ==========================================

/**
 * Clears existing approved markers and paints the filtered incident dataset onto the map layer.
@param {string} filterId - The selected category database ID, or 'all' to show everything.
 */
function displayMarkers(filterId) {
    // Memory Management: Remove old layers from the map to prevent leaks
    allMarkers.forEach(marker => map.removeLayer(marker));
    allMarkers = [];

    incidents.forEach(incident => {
        // Safety Guard: Validate that coordinates fall within standard global bounding limits
        if (!incident.latitude || !incident.longitude
            || incident.latitude < -90  || incident.latitude > 90
            || incident.longitude < -180 || incident.longitude > 180) {
            console.warn("Skipping record due to out-of-bounds coordinates:", incident.title_es);
            return;
        }

        // Editorial Guard: Only render points authorized by the review state
        if (incident.status !== 'approved') return;

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
        const marker = L.marker([incident.latitude, incident.longitude]);
        
        // Bind sidebar display routine to the marker click interaction
        marker.on('click', () => openDetail(incident));
        
        marker.addTo(map);
        allMarkers.push(marker); // Track inside our runtime reference array
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
// 3. INTERACTIVE MAP CLICK (NEW CONTRIBUTIONS)
// ==========================================

/**
 * Event listener catching clicks on the map canvas to target coordinates for a new submission.
 */
map.on('click', function(event) {
    const clickedLatitude = event.latlng.lat;
    const clickedLongitude = event.latlng.lng;
    
    console.log(`Map interaction caught at: Lat ${clickedLatitude}, Lng ${clickedLongitude}`);

    // Verification Guard: Block execution if Leaflet fails to calculate valid geometric numbers
    if (clickedLatitude === undefined || clickedLongitude === undefined || isNaN(clickedLatitude) || isNaN(clickedLongitude)) {
        console.error("Geometry Engine Exception: Captured invalid coordinates.");
        return;
    }

    // Clean up any existing draft pinpoint before placing a new one
    if (activeCollabMarker) {
        map.removeLayer(activeCollabMarker);
    }

    // Generate a draggable pin so users can refine their placement accuracy manually
    activeCollabMarker = L.marker([clickedLatitude, clickedLongitude], {
        draggable: true
    }).addTo(map);

    activeCollabMarker.bindPopup("<b>Incident Target Location</b><br>Fill out the form fields to submit.").openPopup();

    // Map coordinates to your hidden form fields in the HTML layout
    const targetInputLat = document.getElementById('form-lat');
    const targetInputLng = document.getElementById('form-lng');

    if (targetInputLat && targetInputLng) {
        targetInputLat.value = clickedLatitude;
        targetInputLng.value = clickedLongitude;
    } else {
        console.warn("DOM Warning: Missing form target inputs with IDs 'form-lat' or 'form-lng'.");
    }

    // Re-bind coordinates on the fly if the user finishes dragging the pin around
    activeCollabMarker.on('dragend', function(dragEvent) {
        const updatedPosition = dragEvent.target.getLatLng();
        if (targetInputLat && targetInputLng) {
            targetInputLat.value = updatedPosition.lat;
            targetInputLng.value = updatedPosition.lng;
        }
        console.log(`Marker dragged to updated coordinates: ${updatedPosition.lat}, ${updatedPosition.lng}`);
    });
});

// ==========================================
// 4. SIDEBAR WORKSPACE INTERFACE
// ==========================================

/**
 * Populates and opens the sidebar to expose complete historical metadata for a clicked hito.
 * @param {Object} incident - The structured incident record dataset.
 */
function openDetail(incident) {
    const cat     = CATEGORIES.find(c => c.id === incident.category_id);
    const lang    = currentLang;
    const title   = lang === 'es' ? incident.title_es       : incident.title_en;
    const desc    = lang === 'es' ? incident.description_es  : incident.description_en;  // Incident.description_es / description_en
    const catName = lang === 'es' ? cat.name_es              : cat.name_en;
 
    /* category badge */
    const badge = document.getElementById('detail-cat-badge');
    badge.innerHTML        = `<span class="dot" style="background:${cat.color}"></span>${catName}`;
    badge.style.background = cat.bg;
    badge.style.color      = cat.color;
 
    document.getElementById('detail-title').textContent = title;
    // Incident.location_label + Incident.date_occurred year
    document.getElementById('detail-meta').textContent  = `${incident.year} · ${incident.location_label}`;
 
    /* status badge — maps Incident.status to UI labels */
    const vBadge = document.getElementById('detail-verified');
    if (incident.status === 'approved') {
        vBadge.textContent = STRINGS[lang].verified_badge;
        vBadge.className   = 'detail-verified yes';
    } else {
        vBadge.textContent = STRINGS[lang].pending_badge;
        vBadge.className   = 'detail-verified pending';
    }
 
    document.getElementById('detail-desc').textContent = desc;
 
    /* tags — derived from category name + year (no separate model field) */
    const tagsEl = document.getElementById('detail-tags');
    tagsEl.innerHTML = [catName, String(incident.year)]
        .map(t => `<span class="detail-tag">${t}</span>`).join('');
 
    /* cover image — IncidentImage (order=0) serialized as cover_image url */
    const imgEl = document.getElementById('detail-img');
    if (incident.cover_image) {
        imgEl.innerHTML = `<img src="${incident.cover_image}" alt="${title}" />`;
    } else {
        imgEl.innerHTML = `<span>${STRINGS[lang].no_image}</span>`;
    }
 
    /* sources — IncidentSource related objects */
    const sourcesEl = document.getElementById('detail-sources');
    if (incident.sources && incident.sources.length) {
        sourcesEl.innerHTML = `<div class="sb-label">Sources</div>` +
            incident.sources.map(s =>
                `<a href="${s.url}" target="_blank" rel="noopener">→ ${s.label}</a>`
            ).join('');
    } else {
        sourcesEl.innerHTML = '';
    }
 
    document.getElementById('detail-empty').style.display = 'none';
    document.getElementById('detail-content').classList.add('visible');
}
/**
 * Collapses the sidebar layout view.
 */
function closeSidebar() {
    const sidebar     = document.getElementById("sidebar-detail");
    const emptyState  = document.getElementById("detail-empty");
    const contentArea = document.getElementById("detail-content");

    if (sidebar) {
        sidebar.style.width = "0";
    }

    // Reset visibility states back to initial landing state after panel transition ends
    setTimeout(() => {
        if (emptyState)  emptyState.style.display = "block";
        if (contentArea) contentArea.style.display = "none";
        
        if (typeof map !== 'undefined' && map) {
            map.invalidateSize();
        }
    }, 500);
}

// ==========================================
// 5. ASYNCHRONOUS FORM SUBMISSION (AJAX/FETCH)
// ==========================================

/**
 * Interrupts standard form workflows to dispatch data payloads via AJAX asynchronously.
 * @param {Event} e - Form submission event context.
 */
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
displayMarkers('all');