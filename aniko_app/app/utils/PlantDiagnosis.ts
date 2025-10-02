import * as ImageManipulator from 'expo-image-manipulator';

export const diagnosePlant = async (imageUri: string): Promise<{
  isHealthy: boolean;
  diseases: {
    name: string;
    probability: string;
    description: string;
    treatment: string;
    cause: string;
  }[];
}> => {
  const apiKey = 'RtOmpzkXDHszTrYyIMWMSNJBsDXEJuT8C5nCNTnECnusKkbXml';

  try {
    const manipulated = await ImageManipulator.manipulateAsync(
      imageUri,
      [],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );

    const formData = new FormData();
    formData.append('images', {
      uri: manipulated.uri,
      name: 'plant.jpg',
      type: 'image/jpeg',
    } as any);

    formData.append('health', 'auto');
    formData.append('symptoms', 'true');
    formData.append('similar_images', 'true');

    const response = await fetch('https://plant.id/api/v3/health_assessment', {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
      },
      body: formData,
    });

    const rawText = await response.text();
    const contentType = response.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
      console.error('Unexpected response:', rawText);
      throw new Error('Unexpected response from server');
    }

    const data = JSON.parse(rawText);
    console.log('✅ Parsed response:', JSON.stringify(data, null, 2));

    const isHealthy = data?.health_assessment?.is_healthy?.probability > data?.health_assessment?.is_healthy?.threshold;

    const diseases = (data?.health_assessment?.disease_suggestions || []).map((d: any) => ({
      name: d.name,
      probability: `${Math.round(d.score * 100)}%`,
      description: d.description?.en || 'No description available',
      treatment: d.treatment?.en || 'No treatment info available',
      cause: d.cause?.en || 'Cause not specified',
    }));

    return { isHealthy, diseases };
  } catch (error) {
    console.error('❌ Diagnosis error:', error);
    throw new Error('Error diagnosing plant');
  }
};
