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
export async function getAccessToken(): Promise<string> {
  try {
    console.log('🔐 액세스 토큰 획득 시도 중...');
    const msalClient = getMSALClient();
    const clientCredentialRequest = {
      scopes: ['https://graph.microsoft.com/.default'],
    };

    const response = await msalClient.acquireTokenByClientCredential(clientCredentialRequest);
    
    if (!response || !response.accessToken) {
      console.error('❌ 액세스 토큰이 응답에 없습니다.');
      throw new Error('액세스 토큰을 가져올 수 없습니다.');
    }

    console.log('✅ 액세스 토큰 획득 성공');
    return response.accessToken;
  } catch (error: any) {
    console.error('❌ 토큰 획득 오류:', error);
    console.error('오류 상세:', {
      message: error.message,
      errorCode: error.errorCode,
      statusCode: error.statusCode,
      errorDescription: error.errorDescription,
    });
    
    // 더 자세한 오류 메시지
    let errorMessage = `인증 실패: ${error.message || '알 수 없는 오류'}`;
    
    if (error.errorCode === 'invalid_client' || error.message?.includes('invalid_client')) {
      errorMessage += '\n\n가능한 원인:\n1. AZURE_CLIENT_ID가 잘못되었습니다.\n2. AZURE_CLIENT_SECRET이 잘못되었습니다.\n3. AZURE_TENANT_ID가 잘못되었습니다.';
    }
    
    if (error.statusCode === 401 || error.message?.includes('Unauthorized')) {
      errorMessage += '\n\n가능한 원인:\n1. Azure AD 앱의 클라이언트 시크릿이 만료되었습니다.\n2. Azure AD 앱에 필요한 권한(Application 권한: Sites.ReadWrite.All)이 없습니다.\n3. 권한이 부여되었지만 관리자 동의가 완료되지 않았습니다.';
    }
    
    throw new Error(errorMessage);
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

// SharePoint 사이트 ID 가져오기 (URL에서 자동 조회)
async function getSiteIdFromUrl(client: Client, siteUrl: string): Promise<string> {
  try {
    console.log('🔍 사이트 URL 정규화 중... 원본 URL:', siteUrl);
    
    // URL 정규화
    let normalizedUrl = siteUrl
      .replace(/^https?:\/\//, '') // http:// 또는 https:// 제거
      .replace(/\/$/, '') // 끝의 / 제거
      .split('/Lists/')[0] // Lists/List45 같은 부분 제거
      .split('/AllItems.aspx')[0] // AllItems.aspx 같은 부분 제거
      .split('/:l:/')[0] // :l:/ 같은 부분 제거
      .split('/:l:')[0] // :l: 같은 부분 제거
      .split('/?')[0] // 쿼리 스트링 제거
      .split('#')[0]; // 해시 제거
    
    console.log('🔍 정규화된 URL:', normalizedUrl);
    
    // URL 파싱
    const parts = normalizedUrl.split('/');
    const host = parts[0]; // 예: kyungshino365.sharepoint.com
    const sitePath = parts.slice(1).join('/'); // 예: sites/checksheet
    
    console.log('🔍 파싱된 URL:', { host, sitePath });
    
    // 여러 방법으로 시도
    const methods = [
      // 방법 1: Graph API 표준 형식 (호스트:/경로:) - 올바른 형식
      () => {
        const apiPath = sitePath ? `/sites/${host}:/${sitePath}:` : `/sites/${host}:`;
        console.log('  시도 1:', apiPath);
        return client.api(apiPath).get();
      },
      
      // 방법 2: 서버 상대 경로 형식
      () => {
        const apiPath = `/sites/${host}:/${sitePath}`;
        console.log('  시도 2:', apiPath);
        return client.api(apiPath).get();
      },
      
      // 방법 3: 경로 없이 호스트만
      () => {
        const apiPath = `/sites/${host}:`;
        console.log('  시도 3:', apiPath);
        return client.api(apiPath).get();
      },
      
      // 방법 4: URL 인코딩된 형식
      () => {
        const encodedPath = encodeURIComponent(sitePath);
        const apiPath = `/sites/${host}:/${encodedPath}:`;
        console.log('  시도 4:', apiPath);
        return client.api(apiPath).get();
      }
    ];
    
    for (let i = 0; i < methods.length; i++) {
      try {
        console.log(`🔍 방법 ${i + 1} 시도 중...`);
        const response = await methods[i]();
        if (response && response.id) {
          console.log(`✅ 방법 ${i + 1} 성공! 사이트 ID: ${response.id}`);
          return response.id;
        }
      } catch (methodError: any) {
        const statusCode = methodError.statusCode || methodError.code;
        console.log(`❌ 방법 ${i + 1} 실패:`, methodError.message);
        console.log(`   상태 코드: ${statusCode}`);
        
        // 401 오류는 인증 문제이므로 바로 중단
        if (statusCode === 401) {
          console.error('❌ 401 Unauthorized 오류 - 인증 문제입니다!');
          console.error('사이트 ID 조회 상세 오류:', {
            message: methodError.message,
            code: methodError.code,
            statusCode: methodError.statusCode,
            body: methodError.body,
          });
          throw new Error(`인증 오류(401): SharePoint에 접근할 수 있는 권한이 없습니다.\n\n가능한 원인:\n1. Azure AD 앱에 "Application" 권한으로 "Sites.ReadWrite.All"이 부여되지 않았습니다.\n2. 관리자 동의가 완료되지 않았습니다.\n3. 클라이언트 시크릿이 만료되었습니다.\n\n해결 방법:\n1. Azure Portal → 앱 등록 → API 권한에서 "애플리케이션 권한"으로 Sites.ReadWrite.All 추가\n2. "관리자 동의 부여" 클릭\n3. .env 파일의 AZURE_CLIENT_SECRET 확인`);
        }
        
        if (i === methods.length - 1) {
          // 마지막 방법도 실패하면 상세 오류 출력
          console.error('사이트 ID 조회 상세 오류:', {
            message: methodError.message,
            code: methodError.code,
            statusCode: methodError.statusCode,
            body: methodError.body,
          });
          throw methodError;
        }
      }
    }
    
    throw new Error('모든 방법으로 사이트 ID 조회 실패');
  } catch (error: any) {
    console.error('❌ 사이트 ID 조회 최종 오류:', {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      body: error.body,
      stack: error.stack,
    });
    
    // 더 자세한 오류 메시지 생성
    let errorMessage = `SharePoint 사이트를 찾을 수 없습니다.`;
    if (error.body && typeof error.body === 'object') {
      if (error.body.error) {
        errorMessage += `\n오류: ${error.body.error.message || error.message}`;
      }
    } else {
      errorMessage += `\n오류: ${error.message}`;
    }
    errorMessage += `\n\n시도한 URL: ${siteUrl}`;
    errorMessage += `\n\n해결 방법:\n1. SharePoint 사이트 URL이 올바른지 확인\n2. Azure 앱이 해당 사이트에 접근 권한이 있는지 확인\n3. Graph API 권한(Sites.ReadWrite.All)이 부여되었는지 확인`;
    
    throw new Error(errorMessage);
  }
}

// SharePoint 드라이브 ID 가져오기 (기본 문서 라이브러리)
async function getDriveId(client: Client, siteId: string): Promise<string> {
  try {
    const response = await client
      .api(`/sites/${siteId}/drives`)
      .get();
    
    // 보통 첫 번째 드라이브가 "문서" 라이브러리
    if (response.value && response.value.length > 0) {
      return response.value[0].id;
    }
    
    throw new Error('드라이브를 찾을 수 없습니다');
  } catch (error: any) {
    console.error('드라이브 ID 조회 오류:', error);
    throw new Error(`SharePoint 드라이브를 찾을 수 없습니다: ${error.message}`);
  }
}

// SharePoint 리스트 ID 가져오기 (리스트 이름 또는 ID로 조회)
async function getListId(client: Client, siteId: string, listNameOrId: string): Promise<string> {
  try {
    // 먼저 리스트 이름으로 조회 시도
    try {
      const response = await client
        .api(`/sites/${siteId}/lists`)
        .filter(`displayName eq '${listNameOrId}'`)
        .get();
      
      if (response.value && response.value.length > 0) {
        return response.value[0].id;
      }
    } catch (error) {
      // 리스트 이름으로 찾지 못한 경우 무시
    }

    // 리스트 ID로 직접 조회 시도 (GUID 형식)
    try {
      const response = await client
        .api(`/sites/${siteId}/lists/${listNameOrId}`)
        .get();
      
      if (response.id) {
        return response.id;
      }
    } catch (error) {
      // 리스트 ID로도 찾지 못한 경우 무시
    }

    // 모든 리스트를 조회하여 일치하는 것 찾기
    const allListsResponse = await client
      .api(`/sites/${siteId}/lists`)
      .get();
    
    if (allListsResponse.value) {
      // 리스트 이름으로 찾기
      const foundByName = allListsResponse.value.find((list: any) => 
        list.displayName === listNameOrId || list.name === listNameOrId
      );
      if (foundByName) {
        return foundByName.id;
      }

      // 리스트 ID로 찾기
      const foundById = allListsResponse.value.find((list: any) => 
        list.id === listNameOrId
      );
      if (foundById) {
        return foundById.id;
      }
    }

    throw new Error(`리스트를 찾을 수 없습니다: ${listNameOrId}`);
  } catch (error: any) {
    console.error('리스트 ID 조회 오류:', error);
    throw new Error(`SharePoint 리스트를 찾을 수 없습니다: ${error.message}`);
  }
}

// SharePoint 리스트에 아이템 추가
async function addListItem(
  client: Client,
  siteId: string,
  listId: string,
  fields: Record<string, any>
): Promise<any> {
  try {
    console.log(`리스트 아이템 추가 API 호출: /sites/${siteId}/lists/${listId}/items`);
    const response = await client
      .api(`/sites/${siteId}/lists/${listId}/items`)
      .post({
        fields: fields,
      });
    
    return response;
  } catch (error: any) {
    // 상세한 오류 정보 추출
    let errorDetails = error.message || '알 수 없는 오류';
    
    if (error.body) {
      try {
        const errorBody = typeof error.body === 'string' ? JSON.parse(error.body) : error.body;
        if (errorBody.error) {
          errorDetails = errorBody.error.message || errorDetails;
          if (errorBody.error.code) {
            errorDetails = `[${errorBody.error.code}] ${errorDetails}`;
          }
        }
      } catch (parseError) {
        // 파싱 실패 시 원본 메시지 사용
      }
    }
    
    console.error('리스트 아이템 추가 API 오류:', {
      message: error.message,
      statusCode: error.statusCode,
      body: error.body,
      code: error.code,
    });
    
    throw new Error(`리스트 아이템 추가 실패: ${errorDetails}`);
  }
}

// SharePoint 리스트 컬럼 정보 가져오기
async function getListColumns(client: Client, siteId: string, listId: string): Promise<any[]> {
  try {
    const response = await client
      .api(`/sites/${siteId}/lists/${listId}/columns`)
      .get();
    
    return response.value || [];
  } catch (error: any) {
    console.error('리스트 컬럼 조회 오류:', error);
    return [];
  }
}

// 리스트 정보 조회 (디버깅용)
export async function getListInfo(): Promise<any> {
  try {
    const siteUrl = process.env.SHAREPOINT_SITE_URL;
    const siteId = process.env.SHAREPOINT_SITE_ID;
    const listNameOrId = process.env.SHAREPOINT_LIST_ID || 'List45';

    const accessToken = await getAccessToken();
    const client = getGraphClient(accessToken);

    let finalSiteId = siteId;
    if (!finalSiteId && siteUrl) {
      finalSiteId = await getSiteIdFromUrl(client, siteUrl);
    }

    if (!finalSiteId) {
      throw new Error('사이트 ID를 찾을 수 없습니다.');
    }

    const listId = await getListId(client, finalSiteId, listNameOrId);
    const columns = await getListColumns(client, finalSiteId, listId);
    
    // 리스트 정보 조회
    const listInfo = await client
      .api(`/sites/${finalSiteId}/lists/${listId}`)
      .get();

    return {
      siteId: finalSiteId,
      listId: listId,
      listName: listInfo.displayName,
      listWebUrl: listInfo.webUrl,
      columns: columns.map((col: any) => ({
        name: col.name,
        displayName: col.displayName,
        type: col.text ? 'text' : col.choice ? 'choice' : col.dateTime ? 'dateTime' : col.number ? 'number' : 'other',
        readOnly: col.readOnly,
        required: col.required,
        description: col.description,
      })),
    };
  } catch (error: any) {
    console.error('리스트 정보 조회 오류:', error);
    throw error;
  }
}

// SharePoint에 데이터 저장
export async function saveToSharePoint(data: InspectionData): Promise<any> {
  console.log('🔐 SharePoint 저장 함수 시작');
  
  try {
    // 환경 변수 확인
    const siteUrl = process.env.SHAREPOINT_SITE_URL;
    const siteId = process.env.SHAREPOINT_SITE_ID;
    const driveId = process.env.SHAREPOINT_DRIVE_ID;
    const folderPath = process.env.SHAREPOINT_FOLDER_PATH || 'InspectionData';
    const listNameOrId = process.env.SHAREPOINT_LIST_ID || 'List45';
    
    console.log('환경 변수 확인:', {
      hasSiteUrl: !!siteUrl,
      hasSiteId: !!siteId,
      hasDriveId: !!driveId,
      folderPath: folderPath,
      listNameOrId: listNameOrId,
    }); // 기본값: List45

    // 액세스 토큰 가져오기
    console.log('🔑 Azure 액세스 토큰 가져오는 중...');
    const accessToken = await getAccessToken();
    console.log('✅ 액세스 토큰 획득 성공');
    const client = getGraphClient(accessToken);

    // 사이트 ID와 드라이브 ID 자동 조회
    let finalSiteId = siteId;
    let finalDriveId = driveId;

    if (!finalSiteId && siteUrl) {
      console.log('사이트 ID 자동 조회 중...');
      finalSiteId = await getSiteIdFromUrl(client, siteUrl);
      console.log('사이트 ID:', finalSiteId);
    }

    if (!finalDriveId && finalSiteId) {
      console.log('드라이브 ID 자동 조회 중...');
      finalDriveId = await getDriveId(client, finalSiteId);
      console.log('드라이브 ID:', finalDriveId);
    }

    if (!finalSiteId || !finalDriveId) {
      throw new Error('SharePoint 설정이 완료되지 않았습니다. SHAREPOINT_SITE_URL 또는 SHAREPOINT_SITE_ID를 확인해주세요.');
    }

    // 리스트 ID 조회
    let finalListId: string | null = null;
    try {
      console.log('리스트 ID 조회 중...');
      finalListId = await getListId(client, finalSiteId, listNameOrId);
      console.log('리스트 ID:', finalListId);
    } catch (error: any) {
      console.warn('리스트 ID 조회 실패 (리스트 저장 건너뜀):', error.message);
    }

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
    console.log('📄 JSON 파일 업로드 시작...');
    const jsonFileName = 'inspection-data.json';
    const jsonContent = Buffer.from(JSON.stringify(jsonData, null, 2), 'utf-8');
    let jsonFileUrl = '';
    try {
      jsonFileUrl = await uploadFileToSharePoint(
        client,
        finalSiteId,
        finalDriveId,
        productFolderPath,
        jsonFileName,
        jsonContent
      );
      console.log('✅ JSON 파일 업로드 성공:', jsonFileUrl);
    } catch (error) {
      console.error('❌ JSON 파일 업로드 실패:', error);
      throw error; // JSON 파일 업로드 실패는 전체 실패로 간주
    }

    // 사진 업로드
    const photoUrls: Record<string, string> = {};

    const photoDirections = [
      { key: 'front', label: '정면' },
      { key: 'back', label: '후면' },
      { key: 'left', label: '좌측' },
      { key: 'right', label: '우측' },
    ] as const;

    console.log('📸 사진 업로드 시작...');
    let photoUploadCount = 0;
    for (const { key, label } of photoDirections) {
      const photo = data.photos[key];
      if (photo) {
        try {
          console.log(`  - ${label} 사진 업로드 중...`);
          const photoBuffer = base64ToBuffer(photo);
          const photoFileName = `${label}.jpg`;
          const photoUrl = await uploadFileToSharePoint(
            client,
            finalSiteId,
            finalDriveId,
            productFolderPath,
            photoFileName,
            photoBuffer
          );
          photoUrls[key] = photoUrl;
          photoUploadCount++;
          console.log(`  ✅ ${label} 사진 업로드 성공`);
        } catch (error) {
          console.error(`  ❌ ${label} 사진 업로드 실패:`, error);
        }
      }
    }
    console.log(`📸 사진 업로드 완료 (${photoUploadCount}/${photoDirections.length}개 성공)`);

    // 리스트에 아이템 추가
    let listItem: any = null;
    let listError: string | null = null;
    if (finalListId) {
      try {
        console.log('리스트 저장 시작...');
        
        // 리스트 컬럼 정보 가져오기
        const columns = await getListColumns(client, finalSiteId, finalListId);
        console.log('리스트 컬럼 조회 완료. 컬럼 수:', columns.length);
        console.log('사용 가능한 컬럼 목록:', columns.map((c: any) => ({
          name: c.name,
          displayName: c.displayName,
          type: c.text ? 'text' : c.choice ? 'choice' : c.dateTime ? 'dateTime' : c.number ? 'number' : c.url ? 'url' : 'other',
          required: c.required,
          readOnly: c.readOnly,
        })));
        
        // 기본 필드로 아이템 생성
        // SharePoint 리스트의 기본 필드는 Title입니다
        const fields: Record<string, any> = {
          Title: data.productName || '검사 이력',
        };

        // 실제 컬럼 이름으로 매핑
        // 컬럼 목록에서 정확한 컬럼 이름 찾기
        const findColumn = (targetNames: string[]): string | null => {
          for (const col of columns) {
            const colName = col.name || '';
            const colDisplayName = col.displayName || '';
            for (const targetName of targetNames) {
              if (colName === targetName || 
                  colDisplayName === targetName ||
                  colName.toLowerCase() === targetName.toLowerCase() ||
                  colDisplayName.toLowerCase() === targetName.toLowerCase()) {
                console.log(`컬럼 매핑 성공: "${targetName}" → "${colName}"`);
                return colName;
              }
            }
          }
          return null;
        };

        // 제품명 필드 설정
        const productNameColumn = findColumn(['제품명', 'ProductName', 'Title']);
        if (productNameColumn && data.productName) {
          fields[productNameColumn] = data.productName;
        } else {
          // 기본 Title 필드 사용
          fields.Title = data.productName || '검사 이력';
          console.log('제품명 필드 매핑: Title 필드 사용');
        }

        // 검사자 필드 설정
        const inspectorColumn = findColumn(['검사자', 'Inspector', '작성자']);
        if (inspectorColumn && data.inspector) {
          fields[inspectorColumn] = data.inspector;
          console.log(`검사자 필드 매핑 성공: "${inspectorColumn}"`);
        } else {
          console.warn('검사자 컬럼을 찾을 수 없습니다.');
        }

        // 비고 필드 설정
        const notesColumn = findColumn(['비고', 'Notes', '메모', '설명', 'Description']);
        if (notesColumn && data.notes) {
          fields[notesColumn] = data.notes;
          console.log(`비고 필드 매핑 성공: "${notesColumn}"`);
        } else if (data.notes) {
          console.warn('비고 컬럼을 찾을 수 없습니다.');
        }

        // 사진 링크 필드 설정 (정면, 후면, 좌측, 우측 별도 컬럼)
        const photoColumnMapping: Record<string, string[]> = {
          front: ['정면', 'Front', '정면사진', 'FrontPhoto'],
          back: ['후면', 'Back', '후면사진', 'BackPhoto'],
          left: ['좌측', 'Left', '좌측사진', 'LeftPhoto'],
          right: ['우측', 'Right', '우측사진', 'RightPhoto'],
        };

        for (const { key, label } of photoDirections) {
          const photoUrl = photoUrls[key];
          if (photoUrl) {
            const columnNames = photoColumnMapping[key] || [];
            const photoColumn = findColumn(columnNames);
            if (photoColumn) {
              fields[photoColumn] = photoUrl;
              console.log(`${label} 사진 링크 필드 매핑 성공: "${photoColumn}"`);
            } else {
              console.warn(`${label} 사진 링크를 저장할 컬럼을 찾을 수 없습니다. 시도한 컬럼 이름: ${columnNames.join(', ')}`);
            }
          }
        }

        console.log('=== 리스트 아이템 추가 시도 ===');
        console.log('리스트 ID:', finalListId);
        console.log('추가할 필드:', JSON.stringify(fields, null, 2));
        console.log('사용 가능한 모든 컬럼:', columns.map((c: any) => c.name).join(', '));
        
        listItem = await addListItem(client, finalSiteId, finalListId, fields);
        console.log('✅ 리스트 아이템 추가 완료! ID:', listItem.id);
      } catch (error: any) {
        console.error('❌ 리스트 아이템 추가 실패 ==========');
        console.error('오류 메시지:', error.message);
        
        // Graph API 오류 응답 상세 분석
        if (error.body) {
          try {
            const errorBody = typeof error.body === 'string' ? JSON.parse(error.body) : error.body;
            console.error('오류 응답 본문:', JSON.stringify(errorBody, null, 2));
            if (errorBody.error) {
              console.error('오류 코드:', errorBody.error.code);
              console.error('오류 메시지:', errorBody.error.message);
              if (errorBody.error.innerError) {
                console.error('내부 오류:', errorBody.error.innerError);
              }
            }
          } catch (parseError) {
            console.error('오류 응답 (원본):', error.body);
          }
        }
        
        if (error.response) {
          console.error('오류 응답 상태:', error.response.status);
          console.error('오류 응답 데이터:', error.response.data);
        }
        
        // 오류를 저장하지만 전체 저장을 중단하지 않음
        listError = error.message || '알 수 없는 오류';
        console.error('리스트 저장은 실패했지만 파일 저장은 계속 진행합니다.');
      }
    } else {
      console.warn('리스트 ID를 찾을 수 없어 리스트 저장을 건너뜁니다.');
    }

    return {
      folderPath: productFolderPath,
      jsonFile: jsonFileName,
      jsonFileUrl: jsonFileUrl,
      photos: photoUrls,
      listItem: listItem ? {
        id: listItem.id,
        webUrl: listItem.webUrl,
      } : null,
      listError: listError || undefined,
      warning: listError ? '파일은 저장되었지만 리스트 저장에 실패했습니다. 서버 로그를 확인해주세요.' : undefined,
    };
  } catch (error: any) {
    console.error('SharePoint 저장 오류:', error);
    throw error;
  }
}

