import { NextApiRequest, NextApiResponse } from 'next';
import Groq from "groq-sdk";
import presets from "@/data/presets.json";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { prompt, preset } = req.body;

  if (!prompt || !preset) {
    return res.status(400).json({ message: 'Prompt and preset are required' });
  }

  const systemPrompt = presets[preset as keyof typeof presets];

  if (!systemPrompt) {
    return res.status(400).json({ message: 'Invalid preset' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
  });

  try {
    const stream = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      model: "llama3-8b-8192",
      temperature: 0.7,
      max_tokens: 1024,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      res.write(content);
    }
  } catch (error) {
    console.error('Error:', error);
    res.write('An error occurred while processing your request.');
  } finally {
    res.end();
  }
}
