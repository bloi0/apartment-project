import axios from 'axios'

const API_BASE_URL = 'http://localhost:8080/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept-Encoding': 'gzip, deflate',
  },
  timeout: 8000, // 8 second timeout (reduced from 10)
})

// Add request interceptor for debugging
apiClient.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method.toUpperCase(), config.url)
    return config
  },
  (error) => {
    console.error('API Request Error:', error)
    return Promise.reject(error)
  }
)

// Add response interceptor for better error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url)
    return response
  },
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout - backend may be slow or down')
      error.message = 'Request timed out. Backend server may be starting up or under heavy load.'
    } else if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
      console.error('Network error - backend server may not be running')
      error.message = 'Cannot connect to backend server. Please ensure it is running on port 8080.'
    } else if (error.response) {
      console.error('API Error Response:', error.response.status, error.response.data)
      error.message = error.response.data?.message || `Server error: ${error.response.status}`
    }
    return Promise.reject(error)
  }
)

export default apiClient
