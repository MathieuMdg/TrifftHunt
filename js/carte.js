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
let friperiesDansRayon = null

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
        <img src="${f.image}" alt="${f.nom}" style="width: 100%; max-height: 150px; object-fit: cover; border-radius: 6px; margin: 8px 0;" /><br />
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
        <img src="${f.image}" alt="${f.nom}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px; flex-shrink: 0;" />
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
function filterFriperiesBySearch(query) {
  const filtre = query.toLowerCase();
  const baseList = friperiesDansRayon || friperies;
  return baseList.filter(f =>
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
    const filtered = filterFriperiesBySearch(e.target.value);
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

let userPosition = null;
let userMarker = null;
let radiusCircle = null;
let filteredMarkers = [];

// Calcul distance Haversine en km
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Filtrer les friperies dans le rayon choisi
function filterFriperiesByRadius(radiusKm) {
  if (!userPosition) return;

  filteredMarkers.forEach(marker => map.removeLayer(marker));
  filteredMarkers = [];

  if (radiusCircle) {
    map.removeLayer(radiusCircle);
  }

  radiusCircle = L.circle([userPosition.lat, userPosition.lng], {
    radius: radiusKm * 1000,
    color: '#a76aff',
    fillColor: '#a76aff99',
    fillOpacity: 0.3,
  }).addTo(map);

  // Liste des friperies dans le rayon
  friperiesDansRayon = friperies.filter(shop => {
    const dist = getDistanceFromLatLonInKm(userPosition.lat, userPosition.lng, shop.latitude, shop.longitude);
    return dist <= radiusKm;
  });

  // Ajouter les marqueurs filtrés
  friperiesDansRayon.forEach(shop => {
    const dist = getDistanceFromLatLonInKm(userPosition.lat, userPosition.lng, shop.latitude, shop.longitude);
    const marker = L.marker([shop.latitude, shop.longitude], { icon: violetIcon }).addTo(map)
      .bindPopup(`${shop.nom}<br>${dist.toFixed(2)} km`);
    filteredMarkers.push(marker);
  });

  // Met à jour la liste à droite avec les friperies filtrées
  addMarkers(friperiesDansRayon);
  updateList(friperiesDansRayon);
}

// Bouton pour géolocaliser
document.getElementById('locate-btn').addEventListener('click', () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      userPosition = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      };

      map.setView([userPosition.lat, userPosition.lng], 13);

      if (userMarker) {
        map.removeLayer(userMarker);
      }

      userMarker = L.marker([userPosition.lat, userPosition.lng], {
        icon: L.icon({
          iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
          iconSize: [30, 30],
          iconAnchor: [15, 30],
          popupAnchor: [0, -30]
        })
      }).addTo(map).bindPopup("Vous êtes ici").openPopup();

    }, () => alert("Impossible de récupérer votre position."));
  } else {
    alert("La géolocalisation n'est pas supportée par ce navigateur.");
  }
});

// Ouverture/fermeture du bloc filtres
document.getElementById('filtrerBtn').addEventListener('click', () => {
  const filters = document.getElementById('filters');
  filters.style.display = filters.style.display === 'none' ? 'block' : 'none';
});

// Bouton "Valider" pour appliquer le filtre sur le rayon
document.getElementById('applyFiltersBtn').addEventListener('click', () => {
  if (!userPosition) {
    alert("Cliquez d'abord sur 'Ma position' ou définissez votre position manuellement.");
    return;
  }
  const radius = Number(document.getElementById('radius-select').value);
  filterFriperiesByRadius(radius);
});

// Mode localisation manuelle
let manualLocateActive = false;

document.getElementById('manual-locate-btn').addEventListener('click', () => {
  manualLocateActive = !manualLocateActive;
  alert(manualLocateActive 
    ? "Cliquez sur la carte pour définir votre position." 
    : "Mode de localisation manuelle désactivé.");
});

map.on('click', function (e) {
  if (!manualLocateActive) return;

  userPosition = {
    lat: e.latlng.lat,
    lng: e.latlng.lng
  };

  map.setView([userPosition.lat, userPosition.lng], 13);

  if (userMarker) {
    map.removeLayer(userMarker);
  }

  userMarker = L.marker([userPosition.lat, userPosition.lng], {
    icon: L.icon({
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      popupAnchor: [0, -30]
    })
  }).addTo(map).bindPopup("Position définie manuellement").openPopup();

  manualLocateActive = false; // désactive mode après clic
});


document.getElementById('resetRadiusBtn').addEventListener('click', resetRadiusFilter);

function resetRadiusFilter() {
  if (radiusCircle) map.removeLayer(radiusCircle);
  if (filteredMarkers.length) {
    filteredMarkers.forEach(m => map.removeLayer(m));
    filteredMarkers = [];
  }
  friperiesDansRayon = null;
  addMarkers(friperies);
  updateList(friperies);
}



function afficherEtoiles(note) {
  const pleine = "★";
  const vide = "☆";
  const arrondi = Math.round(note);
  return pleine.repeat(arrondi) + vide.repeat(5 - arrondi);
}


// Pour afficher un message lorsque de nouvelles friperies sont ajoutées
  function afficherNotification(message) {
  const notif = document.querySelector('.notification');
  notif.textContent = message;
  notif.classList.add('show');

  setTimeout(() => {
    notif.classList.remove('show');
  }, 10000); // disparaît après 4 secondes
}


  // Pour ajouter une nouvelle friperie
  function ajouterFriperie(nouvelleFriperie) {
  // Ajouter à la liste principale
  friperies.push(nouvelleFriperie);

  // Ajouter le marqueur à la carte
  const marker = L.marker([nouvelleFriperie.latitude, nouvelleFriperie.longitude]).addTo(map);
  marker.bindPopup(`
    <strong>${nouvelleFriperie.nom}</strong><br>
    ${nouvelleFriperie.adresse || ''}<br>
    <img src="${nouvelleFriperie.image}" alt="${nouvelleFriperie.nom}" style="width: 100px;"><br>
    ${nouvelleFriperie.description}<br>
    Note : ${nouvelleFriperie.note || 'Non notée'} ⭐
  `);

  // Afficher la notification
  afficherNotification(`Nouvelle friperie ajoutée : ${nouvelleFriperie.nom}`);
}


setTimeout(() => {
    ajouterFriperie({
      nom: "The King of Frip",
      latitude: 48.865,
      longitude: 2.357,
      image: "../images/KingOfFrip.jpg",
      adresse: "33 Rue du Roi de Sicile, 75004 Paris",
      description: "Une petite friperie éthique et chic en plein centre de Paris.",
      note: 4.5
    });
    addMarkers(friperies);
    updateList(friperies);
  }, 10000); // apparait après 10 secondes


function supprimerAvisFriperie(nomFriperie) {
  // Récupérer les avis depuis le localStorage
  const avisJSON = localStorage.getItem("avisFriperies");

  if (!avisJSON) return;

  const avis = JSON.parse(avisJSON);

  // Supprimer l'entrée de la friperie souhaitée
  if (avis[nomFriperie]) {
    delete avis[nomFriperie];

    // Réenregistrer l'objet modifié dans le localStorage
    localStorage.setItem("avisFriperies", JSON.stringify(avis));
  }
}

// Appel de la fonction pour "The King of Frip"
supprimerAvisFriperie("The King of Frip");