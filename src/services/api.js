import axios from 'axios';

const API_BASE_URL = '/api';

export const fetchMarketData = async (date) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/market-data`, {
      params: { date }
    });
    // 后端返回格式: { success: true, data: {...} }
    return response.data.data;
  } catch (error) {
    console.error('API Error:', error);
    throw new Error(error.response?.data?.message || '获取数据失败');
  }
};
