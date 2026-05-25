let allMarkers = []; // Pines saved
const incidentsDataElement = document.getElementById('incidents-data');
const incidents = incidentsDataElement ? JSON.parse(incidentsDataElement.textContent) : [];


/**
 * Dibuja los marcadores en el mapa aplicando el filtro seleccionado
 * @param {string} filterId - El ID de la categoría a filtrar o 'all'
 */

function displayMarkers(filterId) {
    console.log("Iniciando displayMarkers con filtro:", filterId);

    allMarkers.forEach(marker => map.removeLayer(marker));
    allMarkers = [];

    incidents.forEach(incident => {
        // Filtrar por ID de categoría (convertimos a string para comparar)
        if (filterId === 'all' || incident.category_id.toString() === filterId) {
            const marker = L.marker([incident.latitude, incident.longitude]);
            
            
            // Al hacer clic, abrimos la sidebar
            marker.on('click', () => {
                openSidebar(incident);
            });
            marker.addTo(map);
            console.log("click on each")
            allMarkers.push(marker);
        }
    });
    console.log('${allMarkers.length}')
}

function filterMarkers() {
    const selectedCategory = document.getElementById('category-filter').value;
    displayMarkers(selectedCategory);
}

displayMarkers('all');


function filterTime() {
    console.log("filter")
    const selected = document.getElementById('time-filter').value;
    displayMarkers(selected);
}

displayMarkers('all');
    console.log("filterTime")


function openSidebar(content) {
    console.log("Abriendo sidebar para:", incident.title_es);
    const sidebar = document.getElementById("sidebar");
    document.getElementById("content-area").innerHTML = content;

    contentArea.innerHTML = `
        <h2>${incident.title_es}</h2>
        <p class="text-muted">Categoría:${incidents.category_name || 'Sin categoría'}</p>
        <hr>
        <div class="description">
            ${incidents.description_es}
        </div>
        <p>Fecha del evento:${incidents.date_ocurred || 'Sin especificar'}</p>
    `;
    sidebar.style.width = "350px";
    setTimeout(function() { map.invalidateSize(); }, 500);

}

function closeSidebar() {
    document.getElementById("sidebar").style.width = "0";
    setTimeout(function() { map.invalidateSize(); }, 500);

}
