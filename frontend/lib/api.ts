import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface ChatResponse {
  response: string;
  status: string;
}

export interface StatusResponse {
  message: string;
  status: string;
}

export interface DocumentItem {
  id: string;
  source: string;
  type: string;
  content_preview: string;
  chunk_index: number;
  metadata: Record<string, any>;
}

export interface DocumentsResponse {
  documents: DocumentItem[];
  grouped_documents: Record<string, DocumentItem[]>;
  total_count: number;
}

export interface StatsResponse {
  total_chunks: number;
  sources: Record<string, number>;
  raw_stats: string;
}

export const chatAPI = {
  sendMessage: async (message: string): Promise<ChatResponse> => {
    const response = await api.post('/chat', { message });
    return response.data;
  },

  sendMessageStream: async function* (message: string): AsyncGenerator<string, void, unknown> {
    const response = await fetch(`${API_BASE_URL}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.error) {
                throw new Error(data.error);
              }
              if (data.content) {
                yield data.content;
              }
              if (data.done) {
                return;
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  },

  uploadPDF: async (file: File): Promise<StatusResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/upload-pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  addWebsite: async (url: string, maxPages: number = 5): Promise<StatusResponse> => {
    const response = await api.post('/add-website', { url, max_pages: maxPages });
    return response.data;
  },

  clearKnowledgeBase: async (): Promise<StatusResponse> => {
    const response = await api.delete('/clear-knowledge-base');
    return response.data;
  },
  deleteBySource: async (sourceType: string): Promise<StatusResponse> => {
    const response = await api.delete(`/delete-by-source?source_type=${sourceType}`);
    return response.data;
  },

  getDocuments: async (): Promise<DocumentsResponse> => {
    const response = await api.get('/documents');
    return response.data;
  },

  deleteDocument: async (documentId: string): Promise<StatusResponse> => {
    const response = await api.delete(`/documents/${documentId}`);
    return response.data;
  },

  deleteDocumentsBatch: async (documentIds: string[]): Promise<StatusResponse> => {
    const response = await api.delete('/documents/batch', { data: documentIds });
    return response.data;
  },

  getStats: async (): Promise<StatsResponse> => {
    const response = await api.get('/stats');
    return response.data;
  },

  healthCheck: async (): Promise<{ status: string; chatbot_ready: boolean }> => {
    const response = await api.get('/health');
    return response.data;
  },
};
