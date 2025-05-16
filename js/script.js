const map = L.map('map').setView([48.8566, 2.3522], 13);

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
  maxZoom: 19
}).addTo(map);

const violetIcon = L.icon({
  iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-violet.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  shadowSize: [41, 41]
});

let markers = [];

function addMarkers(filteredFriperies) {
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  filteredFriperies.forEach(f => {
    const marker = L.marker([f.latitude, f.longitude], { icon: violetIcon }).addTo(map);

    marker.bindPopup(`
      <div class="popup" style="max-width: 250px;">
        <strong>${f.nom}</strong><br />
        <small style="color: gray;">${f.adresse || ''}</small><br />
        <img src="${f.image}" alt="${f.nom}" style="width: 100%; height: auto; margin: 8px 0; border-radius: 6px;" /><br />
        <em>${f.description}</em>
      </div>
    `);

    marker.bindTooltip(f.nom, {
      permanent: true,
      direction: 'top',
      offset: [0, -40],
      className: 'custom-tooltip'
    }).openTooltip();

    marker.on('click', () => {
      map.flyTo([f.latitude, f.longitude], 16);
    });

    markers.push(marker);
  });
}



function updateList(filteredFriperies) {
  const list = document.getElementById('friperieList');
  list.innerHTML = '';

  filteredFriperies.forEach((f, i) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px;">
        <img src="${f.image}" alt="${f.nom}" style="width:60px; height:auto; border-radius:6px; flex-shrink:0;" />
        <div>
          <strong>${f.nom}</strong><br />
          <small style="color:gray;">${f.adresse ? f.adresse : ''}</small><br />
          <p style="margin:4px 0; font-size: 14px; color:#333;">${f.description}</p>
        </div>
      </div>
    `;
    li.style.cursor = 'pointer';
    li.addEventListener('click', () => {
      map.setView([f.latitude, f.longitude], 16);
      markers[i].openPopup();
    });
    list.appendChild(li);
  });
}


function filterFriperies(query) {
  const filtre = query.toLowerCase();
  return friperies.filter(f =>
    f.nom.toLowerCase().includes(filtre) || f.description.toLowerCase().includes(filtre)
  );
}

// Initial affichage de toutes les friperies
addMarkers(friperies);
updateList(friperies);

// Écoute sur la barre de recherche
document.getElementById('searchBar').addEventListener('input', (e) => {
  const filtered = filterFriperies(e.target.value);
  addMarkers(filtered);
  updateList(filtered);
});
