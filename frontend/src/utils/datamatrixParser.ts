/**
 * 데이터 매트릭스에서 제품명을 추출하는 함수
 * 
 * 파싱 규칙:
 * - VSBH4 다음 P 필드에서 10글자 추출
 * - SH 다음 E 필드에서 2글자 추출
 * - C 필드에서 C 다음 7-9번째 숫자 추출
 * 
 * @param dataMatrix - 스캔된 데이터 매트릭스 문자열
 * @returns 추출된 제품명 (예: 91958CU810JW007)
 */
export function parseDataMatrix(dataMatrix: string): string | null {
  try {
    if (!dataMatrix || dataMatrix.trim().length === 0) {
      throw new Error('스캔된 데이터가 비어있습니다');
    }

    console.log('원본 스캔 데이터:', dataMatrix);
    console.log('데이터 길이:', dataMatrix.length);
    console.log('데이터 문자 코드:', Array.from(dataMatrix).map(c => c.charCodeAt(0)).slice(0, 50));

    // 필드 구분자: GS 문자(\x1D) 또는 ␝ 문자를 모두 지원
    // 실제 스캔된 데이터는 GS 문자를 사용하지만, 예시에서는 ␝로 표시됨
    const gsChar = '\x1D'; // GS (Group Separator, ASCII 29)
    
    // ␝ 문자를 GS 문자로 정규화 (혹시 모를 경우 대비)
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
  } catch (error: any) {
    console.error('데이터 매트릭스 파싱 오류:', error);
    console.error('오류 메시지:', error?.message);
    console.error('스캔된 원본 데이터:', dataMatrix);
    return null;
  }
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

