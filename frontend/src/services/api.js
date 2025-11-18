import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const BACKEND_ALB_URL = import.meta.env.VITE_BACKEND_ALB_URL

const BACKEND_URL = API_BASE_URL

const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Old searchClips - commented out
// export const searchClips = async (query, topK = 10) => {
//   try {
//     const response = await api.post('/hybrid-search', {
//       query,
//       top_k: topK,
//     });
//     return response.data;
//   } catch (error) {
//     console.error('Error searching clips:', error);
//     throw error;
//   }
// };

// New searchClips using API Gateway endpoint
export const searchClips = async (query, topK = 10, searchType = 'vector') => {
  try {
    const response = await fetch(`${BACKEND_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query_text: query,
        top_k: 50,
        search_type: searchType
      }),
    });
    
    // Check if response is ok
    if (!response.ok) {
      throw new Error(`API returned status code: ${response.status}`);
    }
    
    // Parse the response body
    const data = await response.json();
    console.log('API Response:', data);
    
    // Parse Lambda response format: { statusCode, body: "...json.dumps..." }
    if (data) {
      // Parse the body string which contains JSON from python json.dumps
      return data
    } else {
      throw new Error(`API returned error`);
    }
  } catch (error) {
    console.error('Error searching clips:', error);
    throw error;
  }
};

// export const askQuestion = async (question) => {
//   try {
//     const response = await api.post('/ask', {
//       question,
//     });
//     return response.data;
//   } catch (error) {
//     console.error('Error asking question:', error);
//     throw error;
//   }
// };

export const listAllVideos = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/list`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    let data = await response.json();
    console.log(data)
    return data;
  } catch (error) {
    console.error('Error listing videos:', error);
    throw error;
  }
};

export const getPresignedUploadUrl = async (filename) => {
  try {
    const response = await fetch(`${BACKEND_URL}/generate-upload-presigned-url?filename=${encodeURIComponent(filename)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to generate presigned URL: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Presigned URL generated:', {
      s3_key: data.s3_key,
      expires_in: data.expires_in
    });
    
    return data;
  } catch (error) {
    console.error('Error getting presigned upload URL:', error);
    throw error;
  }
};

export default api;
