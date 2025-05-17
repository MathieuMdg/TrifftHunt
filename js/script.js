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
let friperieActive = null;

// === GESTION UTILISATEUR ET SESSION ===
function mettreAJourInterfaceUtilisateur() {
  const userInfo = document.getElementById('user-info');
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const avisSection = document.getElementById('avisSection');

  const connectedUser = JSON.parse(localStorage.getItem('connectedUser'));

  if (connectedUser && connectedUser.username) {
    userInfo.textContent = `Bienvenue, ${connectedUser.username} !`;
    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
    if (avisSection) avisSection.style.display = 'block';
  } else {
    userInfo.textContent = '';
    loginBtn.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
    if (avisSection) avisSection.style.display = 'none';
  }
}

// === AFFICHAGE DES MARQUEURS SUR LA CARTE ===
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
      marker.openPopup();
      friperieActive = f.nom;
      afficherAvis(friperieActive);
    });

    markers.push(marker);
  });
}

// === LISTE À DROITE ===
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
          <small style="color:gray;">${f.adresse || ''}</small><br />
          <p style="margin:4px 0; font-size: 14px; color:#333;">${f.description}</p>
        </div>
      </div>
    `;
    li.style.cursor = 'pointer';
    li.addEventListener('click', () => {
      map.setView([f.latitude, f.longitude], 16);
      markers[i].openPopup();
      friperieActive = f.nom;
      afficherAvis(friperieActive);
    });
    list.appendChild(li);
  });
}

// === RECHERCHE ===
function filterFriperies(query) {
  const filtre = query.toLowerCase();
  return friperies.filter(f =>
    f.nom.toLowerCase().includes(filtre) || f.description.toLowerCase().includes(filtre)
  );
}

// === AFFICHAGE DES AVIS ===
function afficherAvis(nomFriperie) {
  const avisList = document.getElementById('avisList');
  const avisForm = document.getElementById('avisForm');
  const avisTitle = document.getElementById('avisTitle');
  const connectedUser = JSON.parse(localStorage.getItem('connectedUser'));

  avisTitle.textContent = `Avis pour "${nomFriperie}"`;

  const allAvis = JSON.parse(localStorage.getItem('avisFriperies')) || {};
  const avisFriperie = allAvis[nomFriperie] || [];

  avisList.innerHTML = avisFriperie.length
    ? avisFriperie.map(a => `<div class="avis"><strong>${a.user}</strong> : ${a.message}</div>`).join('')
    : "<p>Pas encore d'avis pour cette friperie.</p>";

  avisForm.style.display = connectedUser ? 'block' : 'none';
}

// === ENVOI AVIS ===
document.getElementById('envoyerAvisBtn')?.addEventListener('click', () => {
  const textarea = document.getElementById('avisTexte');
  const message = textarea.value.trim();
  const connectedUser = JSON.parse(localStorage.getItem('connectedUser'));

  if (!message || !friperieActive || !connectedUser) return;

  const allAvis = JSON.parse(localStorage.getItem('avisFriperies')) || {};
  if (!allAvis[friperieActive]) allAvis[friperieActive] = [];

  allAvis[friperieActive].push({
    user: connectedUser.username,
    message
  });

  localStorage.setItem('avisFriperies', JSON.stringify(allAvis));
  textarea.value = '';
  afficherAvis(friperieActive);
});

// === DOM PRÊT ===
window.addEventListener('DOMContentLoaded', () => {
  mettreAJourInterfaceUtilisateur();
  addMarkers(friperies);
  updateList(friperies);

  document.getElementById('searchBar')?.addEventListener('input', (e) => {
    const filtered = filterFriperies(e.target.value);
    addMarkers(filtered);
    updateList(filtered);
  });

  document.getElementById('loginBtn')?.addEventListener('click', () => {
    window.location.href = 'auth.html';
  });

  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('connectedUser');
    location.reload();
  });
});

