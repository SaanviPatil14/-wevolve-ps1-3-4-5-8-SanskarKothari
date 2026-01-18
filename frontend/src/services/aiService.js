// Groq AI service (OpenAI-compatible endpoint)
// Uses free/fast Groq models like LLaMA 3

export async function generateJobDescriptionAI(input, variations = 1) {
  const key = import.meta.env.VITE_GROQ_API_KEY;
  if (!key) {
    console.warn('Groq API key not configured');
    return [];
  }

  const system = `
You are a helpful assistant that generates professional, ATS-optimized job descriptions.
Respond ONLY with valid JSON.

Required JSON format:
{
  "variations": [
    {
      "title": string,
      "about": string,
      "responsibilities": string[],
      "requiredSkills": string[],
      "preferredSkills": string[],
      "experience": string,
      "benefits": string[],
      "aboutCompany": string,
      "specialRequirements": string
    }
  ]
}
`;

  const user = `
Input:
${JSON.stringify(input, null, 2)}

Create ${variations} distinct variations.
Keep responsibilities 5–7 bullets.
Keep text concise and ATS-friendly.
`;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        temperature: 0.6,
        max_tokens: 900
      })
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('Groq error:', res.status, text);
      return [];
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) return [];

    // Parse JSON safely
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed?.variations)) return parsed.variations;
      if (parsed?.title) return [parsed];
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          if (Array.isArray(parsed?.variations)) return parsed.variations;
          if (parsed?.title) return [parsed];
        } catch {}
      }
    }

    console.warn('Groq response not parseable');
    return [];

  } catch (err) {
    console.error('Groq request failed:', err);
    return [];
  }
}

export default { generateJobDescriptionAI };
