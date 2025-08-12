import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }
  try {
    const { sport, teamA, teamB } = request.body;
    if (!sport || !teamA || !teamB) {
      return response.status(400).json({ error: "모든 필드를 입력해주세요." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY not found in environment variables.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
    const predictionText = result.response.text();
    response.status(200).json({ prediction: predictionText });
  } catch (error) {
    console.error("API 호출 중 오류 발생:", error);
    response.status(500).json({ error: "승부 예측 중 서버에서 오류가 발생했습니다." });
  }
}