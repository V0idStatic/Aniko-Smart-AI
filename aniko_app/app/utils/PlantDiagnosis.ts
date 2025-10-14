import * as ImageManipulator from "expo-image-manipulator";

export const diagnosePlant = async (
  imageUri: string
): Promise<{
  isHealthy: boolean;
  isPlant: boolean;
  message?: string;
  diseases: {
    id: string;
    name: string;
    probability: string;
    description: string;
    treatment: string;
    cause: string;
  }[];
}> => {
  const apiKey = "c1jg3HSCnJdrhbhy3HY5pD0dVLlDW4wGq5IGx1wHhbZkYgYkap"; // Plant.id key

  try {
    // Resize/compress image
    const manipulated = await ImageManipulator.manipulateAsync(
      imageUri,
      [],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );

    const formData = new FormData();
    formData.append("images", {
      uri: manipulated.uri,
      name: "plant.jpg",
      type: "image/jpeg",
    } as any);

    // 🟢 Step 1: Identify if it's a plant
    const identifyResponse = await fetch("https://plant.id/api/v3/identification", {
      method: "POST",
      headers: {
        "Api-Key": apiKey,
      },
      body: formData,
    });

    const identifyData = await identifyResponse.json();
    console.log("Identify response:", JSON.stringify(identifyData, null, 2));

    const isPlant = identifyData?.result?.is_plant?.binary ?? false;

    if (!isPlant) {
      // ❌ Not a plant — stop here
      return {
        isPlant: false,
        isHealthy: false,
        message: "This image does not appear to contain a plant. Please try again with a clear plant photo.",
        diseases: [],
      };
    }

    // 🟢 Step 2: Proceed with health diagnosis
    const healthForm = new FormData();
    healthForm.append("images", {
      uri: manipulated.uri,
      name: "plant.jpg",
      type: "image/jpeg",
    } as any);
    healthForm.append("health", "auto");

    const response = await fetch("https://plant.id/api/v3/health_assessment", {
      method: "POST",
      headers: {
        "Api-Key": apiKey,
      },
      body: healthForm,
    });

    const rawText = await response.text();
    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      console.error("Unexpected response:", rawText);
      throw new Error("Unexpected response from Plant.id");
    }

    const data = JSON.parse(rawText);
    console.log("Plant.id Health API response:", JSON.stringify(data, null, 2));

    const suggestions = data?.result?.disease?.suggestions ?? [];
    const firstSuggestion = suggestions.length > 0 ? suggestions[0] : null;

    if (!firstSuggestion) {
      return { isPlant: true, isHealthy: data?.result?.is_healthy?.binary ?? false, diseases: [] };
    }

    const diseaseName = firstSuggestion.name || "Unknown disease";

    // 🧠 Enrich disease info via OpenRouter AI
    const aiResp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.EXPO_PUBLIC_DIAGNOSIS_API_KEY}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an AI assistant named Aniko specialized in agriculture. Provide structured responses.",
          },
          {
            role: "user",
            content: `Give a short structured response about the plant disease "${diseaseName}". Include:
                      1. Description
                      2. Cause
                      3. Treatment.`,
          },
        ],
      }),
    });

    const aiData = await aiResp.json();
    console.log("AI response:", aiData);

    let description = "No description available";
    let cause = "Cause not specified";
    let treatment = "No treatment info available";

    if (aiData?.choices?.[0]?.message?.content) {
      const aiText = aiData.choices[0].message.content;
      description = aiText.match(/Description[:\-]?\s*(.*)/i)?.[1] || description;
      cause = aiText.match(/Cause[:\-]?\s*(.*)/i)?.[1] || cause;
      treatment = aiText.match(/Treatment[:\-]?\s*(.*)/i)?.[1] || treatment;
    }

    return {
      isPlant: true,
      isHealthy: data?.result?.is_healthy?.binary ?? false,
      diseases: [
        {
          id: firstSuggestion.id || "",
          name: diseaseName,
          probability: `${Math.round((firstSuggestion.probability || 0) * 100)}%`,
          description,
          cause,
          treatment,
        },
      ],
    };
  } catch (error) {
    console.error("Diagnosis error:", error);
    throw new Error("Error diagnosing plant");
  }
};
