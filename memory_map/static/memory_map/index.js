let allMarkers = []; // Pines saved
const incidentsDataElement = document.getElementById('incidents-data');
const incidents = incidentsDataElement ? JSON.parse(incidentsDataElement.textContent) : [];


/**
 * Dibuja los marcadores en el mapa aplicando el filtro seleccionado
 * @param {string} filterId - El ID de la categoría a filtrar o 'all'
 */

function displayMarkers(filterId) {
    console.log("Iniciando displayMarkers con filtro:", filterId);
// clear marks to prevent duplicates
    allMarkers.forEach(marker => map.removeLayer(marker));
    allMarkers = [];
// loop and draw
    incidents.forEach(incident => {
      // only show incidents appproved
      // Guard Clause = clean code
      if (incident.approved !== true){
        return;//skip thin incident and move on
      }
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

//UI Eventt Handlers
function filterCategory() {
    const selectedCategory = document.getElementById('category-filter').value;
    displayMarkers(selectedCategory);
}


function filterTime() {
    const selected = document.getElementById('time-filter').value;
    //TODO
    displayMarkers(selected);
}

displayMarkers('all');
    console.log("filterTime")


function openSidebar(incident) {
    console.log("Abriendo sidebar para:", incident.title_es);
    const sidebar = document.getElementById("sidebar");
    const contentArea = document.getElementById("content-area");

    contentArea.innerHTML = `
        <h2>${incident.title_es}</h2>
        <p class="text-muted">Categoría:${incident.category__name_es || 'Sin categoría'}</p>
        <hr>
        <div class="description">
            ${incident.description_es}
        </div>
        <p>Fecha del evento:${incident.date_ocurred || 'Sin especificar'}</p>
    `;
    sidebar.style.width = "350px";
    setTimeout(function() { map.invalidateSize(); }, 500);

}

function closeSidebar() {
    document.getElementById("sidebar").style.width = "0";
    setTimeout(function() { map.invalidateSize(); }, 500);

}

displayMarkers('all');

function contribute() {

  // Get form data
  const postBody = document.querySelector('#collab-form');
  const bodyContent = postBody.value;

  // Send email via API
  fetch('/contribute', {
    method: 'POST',
    body: JSON.stringify({
      body: bodyContent
    }),
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCookie('csrftoken')
    }
  })
  console.log("here")
  .then(async response => {
    if (!response.ok){
      const err = await response.json();
      throw err;
    }
    return response.json();
  })
  .then(result => {
    // Print result
    postBody.value = '';
    console.log("Success:", result);
    load_posts('all-posts');
  })
  .catch(error => {
    console.error("Error creating post:", error);
    alert("Something went wrong");
  });
}