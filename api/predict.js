import { VertexAI } from '@google-cloud/vertexai';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { sport, teamA, teamB } = request.body;

    if (!sport || !teamA || !teamB) {
      return response.status(400).json({ error: "모든 필드를 입력해주세요." });
    }

    // --- 인증 블록 시작 ---
    // 1. Vercel 환경 변수에서 Base64로 인코딩된 키를 가져옵니다.
    const encodedCredentials = process.env.GCP_CREDENTIALS_BASE64;
    if (!encodedCredentials) {
      throw new Error('GCP credentials not found in environment variables.');
    }

    // 2. Base64 문자열을 디코딩하여 원래의 JSON 텍스트로 되돌립니다.
    const credentialsJson = Buffer.from(encodedCredentials, 'base64').toString('utf-8');
    
    // 3. JSON 텍스트를 실제 자바스크립트 객체로 변환합니다.
    const credentials = JSON.parse(credentialsJson);

    // 4. (디버깅용) Vercel 로그에서 project_id가 올바르게 읽혔는지 확인합니다.
    console.log('VertexAI Client Initializing with Project ID:', credentials.project_id);

    // 5. 변환된 자격 증명(credentials)을 사용하여 Vertex AI 클라이언트를 생성합니다.
    const vertexAI = new VertexAI({
      project: credentials.project_id,
      location: 'us-central1',
      credentials, // 이 부분이 가장 중요합니다!
    });
    // --- 인증 블록 끝 ---

    const model = vertexAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });

    const prompt = `
      당신은 세계 최고의 스포츠 데이터 분석가입니다.
      다음 경기의 승자를 예측하고, 그 이유를 간결하게 3~4문장으로 설명해주세요.
      - 종목: ${sport}
      - 팀 A: ${teamA}
      - 팀 B: ${teamB}
      예측 결과는 아래 형식으로만 답변해주세요.
      예상 승리팀: [팀 이름]
      분석:
      [여기에 분석 내용을 작성]
    `;

    const result = await model.generateContent(prompt);
    const predictionText = result.response.candidates[0].content.parts[0].text;

    response.status(200).json({ prediction: predictionText });

  } catch (error) {
    console.error("API 호출 중 심각한 오류 발생:", error);
    response.status(500).json({ error: "승부 예측 중 서버에서 오류가 발생했습니다." });
  }
}