import * as ImageManipulator from 'expo-image-manipulator';

export const diagnosePlant = async (imageUri: string): Promise<string> => {
  const apiKey = 'RtOmpzkXDHszTrYyIMWMSNJBsDXEJuT8C5nCNTnECnusKkbXml';

  try {
    // Convert image to JPEG and get a proper URI
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

    formData.append('organs', JSON.stringify(['leaf']));

    const response = await fetch('https://plant.id/api/v3/health_assessment', {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
      },
      body: formData,
    });

    const data = await response.json();

    if (data?.health_assessment?.diseases?.length > 0) {
      return data.health_assessment.diseases[0].name;
    } else {
      return 'No disease detected';
    }
  } catch (error) {
    console.error('Diagnosis error:', error);
    return 'Error diagnosing plant';
  }
};
