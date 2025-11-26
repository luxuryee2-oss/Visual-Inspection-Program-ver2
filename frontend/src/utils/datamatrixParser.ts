/**
 * 데이터 매트릭스/QR 코드에서 제품명을 추출하는 함수
 * 
 * 지원하는 형식:
 * 1. 데이터 매트릭스 형식:
 *    - VSBH4 다음 P 필드에서 10글자 추출
 *    - SH 다음 E 필드에서 2글자 추출
 *    - C 필드에서 C 다음 7-9번째 숫자 추출
 * 
 * 2. QR 코드 형식 (라벨 텍스트 기반):
 *    - 91958-PI010 형식에서 91958PI010 추출
 *    - 또는 다른 형식 지원
 * 
 * @param scannedData - 스캔된 데이터 매트릭스/QR 코드 문자열
 * @returns 추출된 제품명 (예: 91958CU810JW007 또는 91958PI010)
 */
export function parseDataMatrix(scannedData: string): string | null {
  try {
    if (!scannedData || scannedData.trim().length === 0) {
      throw new Error('스캔된 데이터가 비어있습니다');
    }

    console.log('원본 스캔 데이터:', scannedData);
    console.log('데이터 길이:', scannedData.length);
    console.log('데이터 문자 코드:', Array.from(scannedData).map(c => c.charCodeAt(0)).slice(0, 50));

    // 먼저 데이터 매트릭스 형식 시도
    try {
      return parseDataMatrixFormat(scannedData);
    } catch (error) {
      console.log('데이터 매트릭스 형식 파싱 실패, QR 코드 형식 시도:', error);
      // 데이터 매트릭스 형식이 아니면 QR 코드 형식 시도
      return parseQRCodeFormat(scannedData);
    }
  } catch (error: any) {
    console.error('데이터 매트릭스 파싱 오류:', error);
    console.error('오류 메시지:', error?.message);
    console.error('스캔된 원본 데이터:', scannedData);
    return null;
  }
}

/**
 * 데이터 매트릭스 형식 파싱
 */
function parseDataMatrixFormat(dataMatrix: string): string {
  // 필드 구분자: GS 문자(\x1D) 또는 ␝ 문자를 모두 지원
  const gsChar = '\x1D'; // GS (Group Separator, ASCII 29)
  
  // ␝ 문자를 GS 문자로 정규화
  const normalizedData = dataMatrix.replace(/␝/g, gsChar);
  
  console.log('정규화된 데이터:', normalizedData);
    
    // 데이터 매트릭스 예시: [)>␞06␝VSBH4␝P91958CU810PD␝SHB81␝EJW124052␝T241017KKH1@OX15901W␝C020100007000000A2␝␞␄
    
    // 1. VSBH4 다음 P 필드에서 10글자 추출
    const vsbh4Index = normalizedData.indexOf('VSBH4');
    if (vsbh4Index === -1) {
      throw new Error('VSBH4 필드를 찾을 수 없습니다');
    }
    
    // VSBH4 다음 필드 구분자를 찾아서 P 필드 시작 위치 찾기
    const afterVSBH4 = normalizedData.substring(vsbh4Index + 5);
    const pFieldRegex = new RegExp(`${gsChar}P([^${gsChar}]+)`);
    const pFieldMatch = afterVSBH4.match(pFieldRegex);
    if (!pFieldMatch) {
      throw new Error('P 필드를 찾을 수 없습니다');
    }
    
    const pFieldValue = pFieldMatch[1];
    const part1 = pFieldValue.substring(0, 10); // 첫 10글자
    
    // 2. SH 다음 E 필드에서 2글자 추출
    const shIndex = normalizedData.indexOf('SH');
    if (shIndex === -1) {
      throw new Error('SH 필드를 찾을 수 없습니다');
    }
    
    const afterSH = normalizedData.substring(shIndex + 2);
    const eFieldRegex = new RegExp(`${gsChar}E([^${gsChar}]+)`);
    const eFieldMatch = afterSH.match(eFieldRegex);
    if (!eFieldMatch) {
      throw new Error('E 필드를 찾을 수 없습니다');
    }
    
    const eFieldValue = eFieldMatch[1];
    const part2 = eFieldValue.substring(0, 2); // 첫 2글자
    
    // 3. C 필드에서 C 다음 7-9번째 숫자 추출
    const cFieldRegex = new RegExp(`${gsChar}C([^${gsChar}]+)`);
    const cFieldMatch = normalizedData.match(cFieldRegex);
    if (!cFieldMatch) {
      throw new Error('C 필드를 찾을 수 없습니다');
    }
    
    const cFieldValue = cFieldMatch[1];
    // C 다음 7번째부터 9번째 (인덱스 6-8)
    if (cFieldValue.length < 9) {
      throw new Error('C 필드가 너무 짧습니다');
    }
    
    const part3 = cFieldValue.substring(6, 9); // 7-9번째 (0-based 인덱스 6-8)
    
    // 숫자만 추출 (007 형식)
    const part3Numbers = part3.replace(/\D/g, '');
    if (part3Numbers.length < 3) {
      throw new Error('C 필드에서 숫자를 추출할 수 없습니다');
    }
    
    // 결과 조합
    const productName = `${part1}${part2}${part3Numbers.substring(0, 3)}`;
    
    return productName;
}

/**
 * QR 코드 형식 파싱 (라벨 텍스트 기반)
 * 예: 91958-PI010 -> 91958PI010
 */
function parseQRCodeFormat(qrData: string): string | null {
  console.log('QR 코드 형식 파싱 시도:', qrData);
  
  // 형식 1: 91958-PI010 형식
  // 하이픈을 제거하고 숫자+문자 조합 추출
  const format1Match = qrData.match(/(\d{5})-?([A-Z]{2}\d{3})/);
  if (format1Match) {
    const part1 = format1Match[1]; // 91958
    const part2 = format1Match[2]; // PI010
    return `${part1}${part2}`;
  }
  
  // 형식 2: 91958PI010 (하이픈 없음)
  const format2Match = qrData.match(/(\d{5}[A-Z]{2}\d{3})/);
  if (format2Match) {
    return format2Match[1];
  }
  
  // 형식 3: PY24672W 형식에서 숫자 추출
  const format3Match = qrData.match(/PY(\d+)/);
  if (format3Match) {
    return `PY${format3Match[1]}`;
  }
  
  // 형식 4: 라벨의 첫 번째 제품 번호 추출 (91958-PI010)
  const labelMatch = qrData.match(/(\d{5})-?([A-Z]+)(\d{3})/);
  if (labelMatch) {
    return `${labelMatch[1]}${labelMatch[2]}${labelMatch[3]}`;
  }
  
  // 형식 5: 숫자로 시작하는 제품명 추출
  const numberStartMatch = qrData.match(/(\d{5,}[A-Z0-9]+)/);
  if (numberStartMatch) {
    return numberStartMatch[1].replace(/[^A-Z0-9]/g, '').substring(0, 15);
  }
  
  throw new Error('QR 코드 형식을 인식할 수 없습니다');
}

/**
 * 데이터 매트릭스 문자열을 테스트하기 위한 헬퍼 함수
 */
export function testDataMatrixParser() {
  const testData = '[)>␞06␝VSBH4␝P91958CU810PD␝SHB81␝EJW124052␝T241017KKH1@OX15901W␝C020100007000000A2␝␞␄';
  const result = parseDataMatrix(testData);
  console.log('테스트 결과:', result); // 예상: 91958CU810JW007
  return result;
}

