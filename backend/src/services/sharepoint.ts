import { ConfidentialClientApplication } from '@azure/msal-node';
import { Client } from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch';
import dotenv from 'dotenv';

dotenv.config();

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

// MSAL 설정 (지연 초기화)
let pca: ConfidentialClientApplication | null = null;

function getMSALClient(): ConfidentialClientApplication {
  if (!pca) {
    const clientId = process.env.AZURE_CLIENT_ID || '';
    const clientSecret = process.env.AZURE_CLIENT_SECRET || '';
    const tenantId = process.env.AZURE_TENANT_ID || '';

    if (!clientId || !clientSecret || !tenantId) {
      throw new Error('Azure 인증 설정이 완료되지 않았습니다. .env 파일을 확인해주세요.');
    }

    const msalConfig = {
      auth: {
        clientId,
        clientSecret,
        authority: `https://login.microsoftonline.com/${tenantId}`,
      },
    };

    pca = new ConfidentialClientApplication(msalConfig);
  }
  return pca;
}

// 액세스 토큰 가져오기
async function getAccessToken(): Promise<string> {
  try {
    const msalClient = getMSALClient();
    const clientCredentialRequest = {
      scopes: ['https://graph.microsoft.com/.default'],
    };

    const response = await msalClient.acquireTokenByClientCredential(clientCredentialRequest);
    
    if (!response || !response.accessToken) {
      throw new Error('액세스 토큰을 가져올 수 없습니다.');
    }

    return response.accessToken;
  } catch (error: any) {
    console.error('토큰 획득 오류:', error);
    throw new Error(`인증 실패: ${error.message}`);
  }
}

// Graph API 클라이언트 생성
function getGraphClient(accessToken: string): Client {
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });
}

// Base64 이미지를 파일로 변환
function base64ToBuffer(base64: string): Buffer {
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(base64Data, 'base64');
}

// SharePoint 폴더 생성 (없는 경우)
async function ensureFolderExists(
  client: Client,
  siteId: string,
  driveId: string,
  folderPath: string
): Promise<void> {
  try {
    const pathParts = folderPath.split('/').filter(Boolean);
    let currentPath = '';

    for (const part of pathParts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const folderUrl = `/sites/${siteId}/drives/${driveId}/root:/${currentPath}`;

      try {
        // 폴더가 이미 존재하는지 확인
        await client.api(folderUrl).get();
      } catch (error: any) {
        // 폴더가 없으면 생성
        if (error.statusCode === 404) {
          const parentPath = currentPath.split('/').slice(0, -1).join('/');
          const parentUrl = parentPath
            ? `/sites/${siteId}/drives/${driveId}/root:/${parentPath}:/children`
            : `/sites/${siteId}/drives/${driveId}/root/children`;

          await client.api(parentUrl).post({
            name: part,
            folder: {},
            '@microsoft.graph.conflictBehavior': 'rename',
          });
        }
      }
    }
  } catch (error: any) {
    console.error('폴더 생성 오류:', error);
    // 폴더 생성 실패해도 계속 진행 (파일 업로드 시 자동 생성될 수 있음)
  }
}

// SharePoint에 파일 업로드
async function uploadFileToSharePoint(
  client: Client,
  siteId: string,
  driveId: string,
  folderPath: string,
  fileName: string,
  fileContent: Buffer
): Promise<string> {
  try {
    // 폴더가 존재하는지 확인하고 없으면 생성
    if (folderPath) {
      await ensureFolderExists(client, siteId, driveId, folderPath);
    }

    const uploadPath = folderPath ? `${folderPath}/${fileName}` : fileName;
    const uploadUrl = `/sites/${siteId}/drives/${driveId}/root:/${uploadPath}:/content`;

    const response = await client
      .api(uploadUrl)
      .put(fileContent);

    return response.webUrl || '';
  } catch (error: any) {
    console.error(`파일 업로드 오류 (${fileName}):`, error);
    throw new Error(`파일 업로드 실패: ${error.message}`);
  }
}

// SharePoint에 데이터 저장
export async function saveToSharePoint(data: InspectionData): Promise<any> {
  try {
    // 환경 변수 확인
    const siteId = process.env.SHAREPOINT_SITE_ID;
    const driveId = process.env.SHAREPOINT_DRIVE_ID;
    const folderPath = process.env.SHAREPOINT_FOLDER_PATH || 'InspectionData';

    if (!siteId || !driveId) {
      throw new Error('SharePoint 설정이 완료되지 않았습니다. 환경 변수를 확인해주세요.');
    }

    // 액세스 토큰 가져오기
    const accessToken = await getAccessToken();
    const client = getGraphClient(accessToken);

    // 타임스탬프로 폴더명 생성
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const productFolderName = `${data.productName}_${timestamp}`;
    const productFolderPath = `${folderPath}/${productFolderName}`;

    // JSON 데이터 생성
    const jsonData = {
      productName: data.productName,
      inspector: data.inspector,
      notes: data.notes,
      timestamp: new Date().toISOString(),
    };

    // JSON 파일 업로드
    const jsonFileName = 'inspection-data.json';
    const jsonContent = Buffer.from(JSON.stringify(jsonData, null, 2), 'utf-8');
    await uploadFileToSharePoint(
      client,
      siteId,
      driveId,
      productFolderPath,
      jsonFileName,
      jsonContent
    );

    // 사진 업로드
    const photoUrls: Record<string, string> = {};

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
          const photoUrl = await uploadFileToSharePoint(
            client,
            siteId,
            driveId,
            productFolderPath,
            photoFileName,
            photoBuffer
          );
          photoUrls[key] = photoUrl;
        } catch (error) {
          console.error(`${label} 사진 업로드 실패:`, error);
        }
      }
    }

    return {
      folderPath: productFolderPath,
      jsonFile: jsonFileName,
      photos: photoUrls,
    };
  } catch (error: any) {
    console.error('SharePoint 저장 오류:', error);
    throw error;
  }
}

