export const ISTANBUL_DISTRICTS = {
  "adalar": {"latitude": 40.8678, "longitude": 29.1331, "address": "Adalar, İstanbul"},
  "arnavutkoy": {"latitude": 41.1856, "longitude": 28.7406, "address": "Arnavutköy, İstanbul"},
  "atasehir": {"latitude": 40.9833, "longitude": 29.1167, "address": "Ataşehir, İstanbul"},
  "avcilar": {"latitude": 40.9791, "longitude": 28.7194, "address": "Avcılar, İstanbul"},
  "bagcilar": {"latitude": 41.0390, "longitude": 28.8567, "address": "Bağcılar, İstanbul"},
  "bahcelievler": {"latitude": 40.9975, "longitude": 28.8505, "address": "Bahçelievler, İstanbul"},
  "bakirkoy": {"latitude": 40.9833, "longitude": 28.8667, "address": "Bakırköy, İstanbul"},
  "basaksehir": {"latitude": 41.0931, "longitude": 28.8020, "address": "Başakşehir, İstanbul"},
  "bayrampasa": {"latitude": 41.0450, "longitude": 28.9031, "address": "Bayrampaşa, İstanbul"},
  "besiktas": {"latitude": 41.0431, "longitude": 29.0089, "address": "Beşiktaş, İstanbul"},
  "beykoz": {"latitude": 41.1280, "longitude": 29.1020, "address": "Beykoz, İstanbul"},
  "beylikduzu": {"latitude": 40.9820, "longitude": 28.6399, "address": "Beylikdüzü, İstanbul"},
  "beyoglu": {"latitude": 41.0369, "longitude": 28.9850, "address": "Beyoğlu, İstanbul"},
  "buyukcekmece": {"latitude": 41.0194, "longitude": 28.5714, "address": "Büyükçekmece, İstanbul"},
  "catalca": {"latitude": 41.1432, "longitude": 28.4615, "address": "Çatalca, İstanbul"},
  "cekmekoy": {"latitude": 41.0369, "longitude": 29.1786, "address": "Çekmeköy, İstanbul"},
  "esenler": {"latitude": 41.0531, "longitude": 28.8753, "address": "Esenler, İstanbul"},
  "esenyurt": {"latitude": 41.0270, "longitude": 28.6773, "address": "Esenyurt, İstanbul"},
  "eyupsultan": {"latitude": 41.0483, "longitude": 28.9283, "address": "Eyüpsultan, İstanbul"},
  "fatih": {"latitude": 41.0055, "longitude": 28.9769, "address": "Fatih, İstanbul"},
  "gaziosmanpasa": {"latitude": 41.0717, "longitude": 28.9133, "address": "Gaziosmanpaşa, İstanbul"},
  "gungoren": {"latitude": 41.0225, "longitude": 28.8719, "address": "Güngören, İstanbul"},
  "kadikoy": {"latitude": 40.9906, "longitude": 29.0256, "address": "Kadıköy, İstanbul"},
  "kagithane": {"latitude": 41.0825, "longitude": 28.9708, "address": "Kağıthane, İstanbul"},
  "kartal": {"latitude": 40.9019, "longitude": 29.1892, "address": "Kartal, İstanbul"},
  "kucukcekmece": {"latitude": 41.0167, "longitude": 28.7833, "address": "Küçükçekmece, İstanbul"},
  "maltepe": {"latitude": 40.9333, "longitude": 29.1500, "address": "Maltepe, İstanbul"},
  "pendik": {"latitude": 40.8953, "longitude": 29.2553, "address": "Pendik, İstanbul"},
  "sancaktepe": {"latitude": 41.0119, "longitude": 29.2133, "address": "Sancaktepe, İstanbul"},
  "sariyer": {"latitude": 41.1667, "longitude": 29.0500, "address": "Sarıyer, İstanbul"},
  "silivri": {"latitude": 41.0736, "longitude": 28.2464, "address": "Silivri, İstanbul"},
  "sultanbeyli": {"latitude": 40.9631, "longitude": 29.2783, "address": "Sultanbeyli, İstanbul"},
  "sultangazi": {"latitude": 41.1250, "longitude": 28.8833, "address": "Sultangazi, İstanbul"},
  "sile": {"latitude": 41.1761, "longitude": 29.6139, "address": "Şile, İstanbul"},
  "sisli": {"latitude": 41.0608, "longitude": 28.9877, "address": "Şişli, İstanbul"},
  "tuzla": {"latitude": 40.8258, "longitude": 29.3242, "address": "Tuzla, İstanbul"},
  "umraniye": {"latitude": 41.0219, "longitude": 29.1353, "address": "Ümraniye, İstanbul"},
  "uskudar": {"latitude": 41.0214, "longitude": 29.0008, "address": "Üsküdar, İstanbul"},
  "zeytinburnu": {"latitude": 40.9881, "longitude": 28.9003, "address": "Zeytinburnu, İstanbul"}
};

// Helper function to get district options for select
export const getDistrictOptions = () => {
  return Object.entries(ISTANBUL_DISTRICTS).map(([key, value]) => ({
    value: key,
    label: value.address,
    latitude: value.latitude,
    longitude: value.longitude
  }));
};
