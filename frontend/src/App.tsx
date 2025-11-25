import { ProductForm } from './components/ProductForm';
import type { InspectionData } from './components/ProductForm';
import { saveInspectionData } from './utils/api';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    console.log('App 컴포넌트가 마운트되었습니다.');
  }, []);

  const handleSubmit = async (data: InspectionData) => {
    try {
      await saveInspectionData(data);
    } catch (error) {
      console.error('저장 오류:', error);
      throw error;
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--background)',
        color: 'var(--foreground)',
        padding: '1rem',
      }}
    >
      <ProductForm onSubmit={handleSubmit} />
      </div>
  );
}

export default App;
