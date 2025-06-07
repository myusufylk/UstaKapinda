// Haritayı başlat (Ankara merkezli)
window.initRepairMap = function() {
    const mapDiv = document.getElementById('map');
    if (!mapDiv) return;
    mapDiv.style.display = 'block';
    const map = L.map('map').setView([39.9334, 32.8597], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);
    const markers = L.markerClusterGroup();
    map.addLayer(markers);
    const repairShops = [
        {id: 1, name: "Oto Tamir Ali Usta", lat: 39.919, lng: 32.854, type: "genel", phone: "0555 123 4567"},
        {id: 2, name: "Lastikçi Ahmet", lat: 39.925, lng: 32.851, type: "lastik", phone: "0555 765 4321"},
        {id: 3, name: "Kaporta Center", lat: 39.928, lng: 32.848, type: "kaporta", phone: "0555 111 2233"},
        {id: 4, name: "Elektrikçi Mehmet", lat: 39.931, lng: 32.862, type: "elektrik", phone: "0555 444 5566"},
        {id: 5, name: "Oto Yıkama & Tamir", lat: 39.935, lng: 32.855, type: "genel", phone: "0555 777 8899"}
    ];
    const iconTypes = {
        genel: L.icon({iconUrl: 'https://cdn-icons-png.flaticon.com/512/484/484167.png', iconSize: [32, 32]}),
        lastik: L.icon({iconUrl: 'https://cdn-icons-png.flaticon.com/512/3659/3659898.png', iconSize: [32, 32]}),
        kaporta: L.icon({iconUrl: 'https://cdn-icons-png.flaticon.com/512/2936/2936886.png', iconSize: [32, 32]}),
        elektrik: L.icon({iconUrl: 'https://cdn-icons-png.flaticon.com/512/3659/3659899.png', iconSize: [32, 32]})
    };
    repairShops.forEach(shop => {
        const marker = L.marker([shop.lat, shop.lng], {
            icon: iconTypes[shop.type] || iconTypes.genel
        }).bindPopup(`
            <b>${shop.name}</b><br>
            Tür: ${shop.type}<br>
            Tel: ${shop.phone}<br>
            <button onclick="window.navigateToShop(${shop.id})">Yol Tarifi Al</button>
        `);
        markers.addLayer(marker);
    });
    document.getElementById('locate-btn')?.addEventListener('click', () => {
        map.locate({setView: true, maxZoom: 15});
    });
    map.on('locationfound', (e) => {
        L.marker(e.latlng, {
            icon: L.icon({
                iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
                iconSize: [32, 32]
            })
        }).addTo(map)
        .bindPopup("Şu an buradasınız").openPopup();
        const nearestShops = findNearestShops(e.latlng, repairShops, 3);
        alert(`En yakın tamirci: ${nearestShops[0].name}`);
    });
    map.on('locationerror', (e) => {
        alert("Konum alınamadı: " + e.message);
    });
    window.findNearestShops = function(userLocation, shops, count = 3) {
        function getDistance(lat1, lon1, lat2, lon2) {
            const R = 6371;
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = 
                Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return R * c;
        }
        return [...shops]
            .sort((a, b) => 
                getDistance(userLocation.lat, userLocation.lng, a.lat, a.lng) - 
                getDistance(userLocation.lat, userLocation.lng, b.lat, b.lng)
            )
            .slice(0, count);
    }
    window.navigateToShop = function(shopId) {
        const shop = repairShops.find(s => s.id === shopId);
        if(shop && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(userPos => {
                const userLatLng = [userPos.coords.latitude, userPos.coords.longitude];
                const shopLatLng = [shop.lat, shop.lng];
                alert(`${shop.name} için yol tarifi:\nKullanıcı konumu: ${userLatLng}\nTamirci konumu: ${shopLatLng}`);
                L.polyline([userLatLng, shopLatLng], {color: 'red'}).addTo(map);
            });
        } else {
            alert("Konum bilgisi alınamadı veya tamirci bulunamadı");
        }
    }
} 