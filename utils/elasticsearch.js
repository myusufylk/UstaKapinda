const { Client } = require('@elastic/elasticsearch');

const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
});

// Elasticsearch indekslerini oluştur
const createIndices = async () => {
  try {
    // Craftsmen indeksi
    await client.indices.create({
      index: 'craftsmen',
      body: {
        mappings: {
          properties: {
            name: { type: 'text' },
            description: { type: 'text' },
            categories: { type: 'keyword' },
            location: { type: 'geo_point' },
            rating: { type: 'float' },
            experienceYears: { type: 'integer' },
            hourlyRate: { type: 'float' },
            skills: { type: 'keyword' },
            languages: { type: 'keyword' },
            isVerified: { type: 'boolean' }
          }
        }
      }
    });

    // Jobs indeksi
    await client.indices.create({
      index: 'jobs',
      body: {
        mappings: {
          properties: {
            title: { type: 'text' },
            description: { type: 'text' },
            category: { type: 'keyword' },
            location: { type: 'geo_point' },
            budget: { type: 'float' },
            status: { type: 'keyword' },
            deadline: { type: 'date' },
            skills: { type: 'keyword' }
          }
        }
      }
    });

    console.log('Elasticsearch indeksleri oluşturuldu');
  } catch (error) {
    if (error.meta?.body?.error?.type === 'resource_already_exists_exception') {
      console.log('İndeksler zaten mevcut');
    } else {
      console.error('Elasticsearch indeks oluşturma hatası:', error);
    }
  }
};

// Döküman ekle/güncelle
const indexDocument = async (index, id, document) => {
  try {
    await client.index({
      index,
      id,
      body: document,
      refresh: true
    });
  } catch (error) {
    console.error('Döküman indeksleme hatası:', error);
    throw error;
  }
};

// Döküman sil
const deleteDocument = async (index, id) => {
  try {
    await client.delete({
      index,
      id,
      refresh: true
    });
  } catch (error) {
    console.error('Döküman silme hatası:', error);
    throw error;
  }
};

// Gelişmiş arama
const search = async (index, query) => {
  try {
    const { body } = await client.search({
      index,
      body: {
        query: {
          bool: {
            must: query.must || [],
            filter: query.filter || [],
            should: query.should || [],
            must_not: query.must_not || []
          }
        },
        sort: query.sort || [],
        from: query.from || 0,
        size: query.size || 10
      }
    });

    return body.hits;
  } catch (error) {
    console.error('Arama hatası:', error);
    throw error;
  }
};

// Otomatik tamamlama
const suggest = async (index, field, prefix) => {
  try {
    const { body } = await client.search({
      index,
      body: {
        suggest: {
          suggestions: {
            prefix,
            completion: {
              field,
              size: 5,
              skip_duplicates: true
            }
          }
        }
      }
    });

    return body.suggest.suggestions[0].options;
  } catch (error) {
    console.error('Öneri hatası:', error);
    throw error;
  }
};

// Popüler aramalar
const getPopularSearches = async (index, size = 10) => {
  try {
    const { body } = await client.search({
      index,
      body: {
        size: 0,
        aggs: {
          popular_searches: {
            terms: {
              field: 'search_terms.keyword',
              size
            }
          }
        }
      }
    });

    return body.aggregations.popular_searches.buckets;
  } catch (error) {
    console.error('Popüler aramalar hatası:', error);
    throw error;
  }
};

module.exports = {
  client,
  createIndices,
  indexDocument,
  deleteDocument,
  search,
  suggest,
  getPopularSearches
}; 