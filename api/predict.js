// 라이브러리가 @google/generative-ai에서 @google-cloud/vertexai로 변경됩니다.
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

    // --- 바로 이 부분! 새로운 환경 변수 이름을 사용합니다. ---
    const encodedCredentials = process.env.GCP_CREDENTIALS_BASE64;
    if (!encodedCredentials) {
      throw new Error('GCP credentials not found in environment variables.');
    }

    // Base64로 인코딩된 키를 원래의 JSON 객체로 디코딩합니다.
    const credentialsJson = Buffer.from(encodedCredentials, 'base64').toString('utf-8');
    const credentials = JSON.parse(credentialsJson);

    // 디코딩된 인증 정보로 Vertex AI 클라이언트를 초기화합니다.
    const vertexAI = new VertexAI({
      project: credentials.project_id,
      location: 'us-central1', // 또는 원하는 리전
      credentials,
    });
    // --- ---

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
    // Vertex AI 라이브러리의 응답 구조에 맞게 수정
    const predictionText = result.response.candidates[0].content.parts[0].text;

    response.status(200).json({ prediction: predictionText });

  } catch (error) {
    // 오류가 발생하면 좀 더 자세한 내용을 서버 로그에 출력합니다.
    console.error("API 호출 중 심각한 오류 발생:", error);
    response.status(500).json({ error: "승부 예측 중 서버에서 오류가 발생했습니다." });
  }
}