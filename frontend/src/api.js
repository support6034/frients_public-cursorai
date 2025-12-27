// API 설정 파일
// 백엔드 URL 자동 감지 (GitLab CI/CD에서 설정 불필요)
import axios from 'axios';

// 백엔드 URL 자동 감지 함수
const getBackendURL = () => {
  // 1. 환경 변수에서 읽기 (GitLab CI/CD에서 설정된 경우 - 우선순위 최고)
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // 2. 개발 환경: Vite proxy 설정 사용 (localhost:5000)
  if (import.meta.env.DEV) {
    return ''; // proxy 사용
  }
  
  // 3. 프로덕션: Railway 백엔드 URL
  // changups.kr 또는 Vercel 도메인에서 실행 중인 경우
  if (window.location.hostname.includes('changups.kr') ||
      window.location.hostname.includes('vercel.app')) {
    return 'https://workflow-backend-production-cdd6.up.railway.app';
  }

  // GitLab Pages 도메인에서 실행 중인 경우 (개발용)
  if (window.location.hostname.includes('gitlab.io')) {
    return 'https://workflow-backend-production-cdd6.up.railway.app';
  }
  
  // 4. 기본값: 빈 문자열
  console.warn('[API] 백엔드 URL이 설정되지 않았습니다.');
  return '';
};

const API_BASE_URL = getBackendURL();

// axios 인스턴스 생성
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 120초 타임아웃 (Render 무료 플랜 콜드 스타트 대응 - 2분)
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 (디버깅용)
api.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터 (에러 처리)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error(`[API] ${error.response.status} ${error.response.statusText}:`, error.response.data);
    } else if (error.request) {
      console.error('[API] No response received:', error.request);
    } else {
      console.error('[API] Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;

