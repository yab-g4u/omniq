import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const apiKey = process.env.ADDIS_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      success: false,
      error: 'ADDIS_API_KEY is not configured',
    });
  }

  const encodedKey = encodeURIComponent(apiKey);

  const wsUrl =
    'wss://relay.addisassistant.com/ws?apiKey=' + encodedKey;

  return res.status(200).json({
    success: true,
    wsUrl,
    inputRate: 16000,
    outputRate: 24000,
    voiceId: 'am-hamen',
    status: 'ready',
  });
}
