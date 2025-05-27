const mongoose = require('mongoose');

// Arama sorgusu oluştur
const buildSearchQuery = (params) => {
  const query = {};

  // Anahtar kelime araması
  if (params.keyword) {
    query.$or = [
      { title: { $regex: params.keyword, $options: 'i' } },
      { description: { $regex: params.keyword, $options: 'i' } }
    ];
  }

  // Kategori filtresi
  if (params.category) {
    query.category = mongoose.Types.ObjectId(params.category);
  }

  // Şehir filtresi
  if (params.city) {
    query.city = { $regex: params.city, $options: 'i' };
  }

  // Fiyat aralığı
  if (params.minPrice || params.maxPrice) {
    query.budget = {};
    if (params.minPrice) query.budget.$gte = Number(params.minPrice);
    if (params.maxPrice) query.budget.$lte = Number(params.maxPrice);
  }

  // Durum filtresi
  if (params.status) {
    query.status = params.status;
  }

  // Tarih aralığı
  if (params.startDate || params.endDate) {
    query.createdAt = {};
    if (params.startDate) query.createdAt.$gte = new Date(params.startDate);
    if (params.endDate) query.createdAt.$lte = new Date(params.endDate);
  }

  return query;
};

// Sıralama seçenekleri
const getSortOptions = (sortBy) => {
  const sortOptions = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    priceAsc: { budget: 1 },
    priceDesc: { budget: -1 },
    ratingDesc: { rating: -1 },
    ratingAsc: { rating: 1 }
  };

  return sortOptions[sortBy] || sortOptions.newest;
};

// Sayfalama parametreleri
const getPaginationParams = (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return { skip, limit: Number(limit) };
};

// Usta arama sorgusu
const buildCraftsmanSearchQuery = (params) => {
  const query = { isActive: true };

  // Anahtar kelime araması
  if (params.keyword) {
    query.$or = [
      { 'user.name': { $regex: params.keyword, $options: 'i' } },
      { profession: { $regex: params.keyword, $options: 'i' } },
      { description: { $regex: params.keyword, $options: 'i' } }
    ];
  }

  // Kategori filtresi
  if (params.category) {
    query.categories = mongoose.Types.ObjectId(params.category);
  }

  // Şehir filtresi
  if (params.city) {
    query.city = { $regex: params.city, $options: 'i' };
  }

  // Minimum puan
  if (params.minRating) {
    query.rating = { $gte: Number(params.minRating) };
  }

  // Maksimum fiyat
  if (params.maxPrice) {
    query.hourlyRate = { $lte: Number(params.maxPrice) };
  }

  // Deneyim yılı
  if (params.minExperience) {
    query.experienceYears = { $gte: Number(params.minExperience) };
  }

  // Sertifika filtresi
  if (params.hasCertification) {
    query.hasCertification = true;
  }

  return query;
};

// İş arama sorgusu
const buildJobSearchQuery = (params) => {
  const query = {};

  // Anahtar kelime araması
  if (params.keyword) {
    query.$or = [
      { title: { $regex: params.keyword, $options: 'i' } },
      { description: { $regex: params.keyword, $options: 'i' } }
    ];
  }

  // Kategori filtresi
  if (params.category) {
    query.category = mongoose.Types.ObjectId(params.category);
  }

  // Şehir filtresi
  if (params.city) {
    query.city = { $regex: params.city, $options: 'i' };
  }

  // Bütçe aralığı
  if (params.minBudget || params.maxBudget) {
    query.budget = {};
    if (params.minBudget) query.budget.$gte = Number(params.minBudget);
    if (params.maxBudget) query.budget.$lte = Number(params.maxBudget);
  }

  // Durum filtresi
  if (params.status) {
    query.status = params.status;
  }

  // Tarih aralığı
  if (params.startDate || params.endDate) {
    query.deadline = {};
    if (params.startDate) query.deadline.$gte = new Date(params.startDate);
    if (params.endDate) query.deadline.$lte = new Date(params.endDate);
  }

  // Aciliyet durumu
  if (params.isUrgent) {
    query.isUrgent = true;
  }

  return query;
};

module.exports = {
  buildSearchQuery,
  getSortOptions,
  getPaginationParams,
  buildCraftsmanSearchQuery,
  buildJobSearchQuery
}; 