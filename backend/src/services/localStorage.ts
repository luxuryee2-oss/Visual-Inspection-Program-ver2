import fs from 'fs/promises';
import path from 'path';

interface InspectionData {
  productName: string;
  inspector: string;
  notes: string;
  photos: {
    front: string | null;
    back: string | null;
    left: string | null;
    right: string | null;
  };
}

// Base64 이미지를 Buffer로 변환
function base64ToBuffer(base64: string): Buffer {
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(base64Data, 'base64');
}

// 로컬 파일 시스템에 데이터 저장
export async function saveToLocal(data: InspectionData): Promise<any> {
  try {
    // 저장 경로 설정
    const basePath = process.env.DATA_STORAGE_PATH || path.join(process.cwd(), 'data');
    const folderPath = process.env.DATA_FOLDER_PATH || 'InspectionData';
    const fullBasePath = path.join(basePath, folderPath);

    // 타임스탬프로 폴더명 생성
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const productFolderName = `${data.productName}_${timestamp}`;
    const productFolderPath = path.join(fullBasePath, productFolderName);

    // 폴더가 없으면 생성
    await fs.mkdir(productFolderPath, { recursive: true });

    // JSON 데이터 생성
    const jsonData = {
      productName: data.productName,
      inspector: data.inspector,
      notes: data.notes,
      timestamp: new Date().toISOString(),
    };

    // JSON 파일 저장
    const jsonFileName = 'inspection-data.json';
    const jsonFilePath = path.join(productFolderPath, jsonFileName);
    await fs.writeFile(jsonFilePath, JSON.stringify(jsonData, null, 2), 'utf-8');

    // 사진 저장
    const photoPaths: Record<string, string> = {};

    const photoDirections = [
      { key: 'front', label: '정면' },
      { key: 'back', label: '후면' },
      { key: 'left', label: '좌측' },
      { key: 'right', label: '우측' },
    ] as const;

    for (const { key, label } of photoDirections) {
      const photo = data.photos[key];
      if (photo) {
        try {
          const photoBuffer = base64ToBuffer(photo);
          const photoFileName = `${label}.jpg`;
          const photoFilePath = path.join(productFolderPath, photoFileName);
          await fs.writeFile(photoFilePath, photoBuffer);
          photoPaths[key] = photoFilePath;
        } catch (error) {
          console.error(`${label} 사진 저장 실패:`, error);
        }
      }
    }

    return {
      folderPath: productFolderPath,
      jsonFile: jsonFileName,
      photos: photoPaths,
      message: '데이터가 성공적으로 저장되었습니다.',
    };
  } catch (error: any) {
    console.error('로컬 저장 오류:', error);
    throw new Error(`파일 저장 실패: ${error.message}`);
  }
}

