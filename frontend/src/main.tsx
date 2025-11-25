import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('root element를 찾을 수 없습니다.');
}

try {
  const root = createRoot(rootElement);
  root.render(
  <StrictMode>
    <App />
    </StrictMode>
  );
  console.log('React 앱이 성공적으로 렌더링되었습니다.');
} catch (error) {
  console.error('앱 렌더링 오류:', error);
  rootElement.innerHTML = `
    <div style="padding: 2rem; font-family: sans-serif;">
      <h1>오류가 발생했습니다</h1>
      <p>${error instanceof Error ? error.message : '알 수 없는 오류'}</p>
      <p>브라우저 콘솔을 확인해주세요.</p>
    </div>
  `;
}
