import { NextApiRequest, NextApiResponse } from 'next';
import { Groq } from 'groq';

const groq = new Groq(process.env.GROQ_API_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;

    const chatCompletion = await groq.chat.completions.create({
      messages: messages,
      model: "llama3-8b-8192",
      temperature: 0.5,
      max_tokens: 1024,
    });

    const reply = chatCompletion.choices[0].message.content;
    res.status(200).json({ message: reply });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'An error occurred while processing your request.' });
  }
}
