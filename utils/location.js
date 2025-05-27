const axios = require('axios');

// Google Maps API anahtarı
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Adres koordinatlarını bul
const getCoordinatesFromAddress = async (address) => {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${GOOGLE_MAPS_API_KEY}`
    );

    if (response.data.status === 'OK') {
      const { lat, lng } = response.data.results[0].geometry.location;
      return { latitude: lat, longitude: lng };
    }

    throw new Error('Adres bulunamadı');
  } catch (error) {
    throw new Error('Konum bilgisi alınamadı');
  }
};

// İki nokta arasındaki mesafeyi hesapla
const calculateDistance = async (origin, destination) => {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(
        origin
      )}&destinations=${encodeURIComponent(
        destination
      )}&key=${GOOGLE_MAPS_API_KEY}`
    );

    if (response.data.status === 'OK') {
      const distance = response.data.rows[0].elements[0].distance;
      return {
        distance: distance.text,
        distanceValue: distance.value // metre cinsinden
      };
    }

    throw new Error('Mesafe hesaplanamadı');
  } catch (error) {
    throw new Error('Mesafe bilgisi alınamadı');
  }
};

// Yakındaki ustaları bul
const findNearbyCraftsmen = async (location, radius, category) => {
  try {
    const { latitude, longitude } = location;
    
    // MongoDB'de konum bazlı sorgu için GeoJSON formatında nokta
    const point = {
      type: 'Point',
      coordinates: [longitude, latitude]
    };

    // Craftsman modelini kullanarak yakındaki ustaları bul
    const Craftsman = require('../models/Craftsman');
    
    const query = {
      location: {
        $near: {
          $geometry: point,
          $maxDistance: radius * 1000 // metre cinsinden
        }
      },
      isActive: true
    };

    // Kategori filtresi varsa ekle
    if (category) {
      query.categories = category;
    }

    const craftsmen = await Craftsman.find(query)
      .populate('user', 'name email phone')
      .populate('categories', 'name');

    return craftsmen;
  } catch (error) {
    throw new Error('Yakındaki ustalar bulunamadı');
  }
};

// Adres doğrulama
const validateAddress = async (address) => {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${GOOGLE_MAPS_API_KEY}`
    );

    if (response.data.status === 'OK') {
      const result = response.data.results[0];
      return {
        isValid: true,
        formattedAddress: result.formatted_address,
        components: result.address_components
      };
    }

    return {
      isValid: false,
      error: 'Geçersiz adres'
    };
  } catch (error) {
    throw new Error('Adres doğrulanamadı');
  }
};

// Rota hesaplama
const getDirections = async (origin, destination) => {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
        origin
      )}&destination=${encodeURIComponent(
        destination
      )}&key=${GOOGLE_MAPS_API_KEY}`
    );

    if (response.data.status === 'OK') {
      const route = response.data.routes[0];
      return {
        distance: route.legs[0].distance,
        duration: route.legs[0].duration,
        steps: route.legs[0].steps.map(step => ({
          instruction: step.html_instructions,
          distance: step.distance,
          duration: step.duration
        }))
      };
    }

    throw new Error('Rota hesaplanamadı');
  } catch (error) {
    throw new Error('Rota bilgisi alınamadı');
  }
};

module.exports = {
  getCoordinatesFromAddress,
  calculateDistance,
  findNearbyCraftsmen,
  validateAddress,
  getDirections
}; 