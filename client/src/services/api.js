import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create configured Axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically attach JWT authorization token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user?.email) {
        config.headers['X-User-Email'] = user.email;
      }
    } catch {}
    return config;
  },
  (error) => Promise.reject(error)
);

export const INITIAL_DUMMY_DEVICES = [
  {
    _id: 'sample-1',
    name: 'Living Room Air Conditioner',
    room: 'Living Room',
    type: 'ac',
    status: true,
    powerUsage: 1450,
    ratedPower: 1450,
    currentPower: 1450,
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'sample-2',
    name: 'Master Bedroom Ambient Light',
    room: 'Master Bedroom',
    type: 'light',
    status: true,
    powerUsage: 25,
    ratedPower: 25,
    currentPower: 25,
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'sample-3',
    name: 'Kitchen Smart Geyser',
    room: 'Kitchen',
    type: 'geyser',
    status: false,
    powerUsage: 2000,
    ratedPower: 2000,
    currentPower: 0,
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'sample-4',
    name: 'Balcony High-Speed Fan',
    room: 'Balcony',
    type: 'fan',
    status: true,
    powerUsage: 70,
    ratedPower: 70,
    currentPower: 70,
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'sample-5',
    name: 'Home Theater 4K Smart TV',
    room: 'Living Room',
    type: 'tv',
    status: false,
    powerUsage: 120,
    ratedPower: 120,
    currentPower: 0,
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'sample-6',
    name: 'Study Room Desk Lamp',
    room: 'Study Room',
    type: 'light',
    status: true,
    powerUsage: 15,
    ratedPower: 15,
    currentPower: 15,
    createdAt: new Date().toISOString(),
  },
];

// Helper to get cached local state if offline
const getLocalData = () => {
  const local = localStorage.getItem('controlhub_appliances');
  if (!local) {
    localStorage.setItem('controlhub_appliances', JSON.stringify(INITIAL_DUMMY_DEVICES));
    return INITIAL_DUMMY_DEVICES;
  }
  try {
    return JSON.parse(local);
  } catch (e) {
    return INITIAL_DUMMY_DEVICES;
  }
};

const saveLocalData = (data) => {
  localStorage.setItem('controlhub_appliances', JSON.stringify(data));
};

export const checkBackendStatus = async () => {
  try {
    const res = await api.get('/health', { timeout: 2000 });
    return { online: res.status === 200 };
  } catch (error) {
    return { online: false };
  }
};

export const fetchHealthStatus = checkBackendStatus;

export const fetchAppliances = async () => {
  try {
    const res = await api.get('/appliances');
    const result = res.data;
    if (result && result.success && Array.isArray(result.data)) {
      saveLocalData(result.data);
      return { data: result.data, isLive: true };
    }
    throw new Error('Invalid response structure');
  } catch (err) {
    // Fallback to local storage mock data
    const local = getLocalData();
    return { data: local, isLive: false };
  }
};

export const toggleApplianceStatus = async (id, currentStatus) => {
  try {
    let userEmail = null;
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      userEmail = user?.email;
    } catch {}

    const res = await api.patch(`/appliances/${id}/toggle`, {
      status: !currentStatus,
      userEmail,
    });
    const result = res.data;
    return { data: result.data, isLive: true, alertTriggered: result.alertTriggered };
  } catch (err) {
    // Fallback to updating local storage
    const local = getLocalData();
    const updated = local.map((item) =>
      item._id === id ? { ...item, status: !currentStatus } : item
    );
    saveLocalData(updated);
    const item = updated.find((d) => d._id === id);
    const isHighDraw = item && Number(item.powerUsage || 0) >= 1000;
    return { data: item, isLive: false, alertTriggered: !currentStatus && isHighDraw };
  }
};

export const createAppliance = async (applianceData) => {
  try {
    const res = await api.post('/appliances', applianceData);
    const result = res.data;
    return { data: result.data, isLive: true };
  } catch (err) {
    const local = getLocalData();
    const newItem = {
      _id: `local-${Date.now()}`,
      ...applianceData,
      createdAt: new Date().toISOString(),
    };
    const updated = [newItem, ...local];
    saveLocalData(updated);
    return { data: newItem, isLive: false };
  }
};

export const deleteAppliance = async (id) => {
  try {
    await api.delete(`/appliances/${id}`);
    return { success: true, isLive: true };
  } catch (err) {
    const local = getLocalData();
    const updated = local.filter((d) => d._id !== id);
    saveLocalData(updated);
    return { success: true, isLive: false };
  }
};

export default api;
