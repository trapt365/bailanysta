import { NextApiRequest, NextApiResponse } from 'next';
import { getEnvConfig } from '../../server/middleware/envValidation';

interface AnalyticsEvent {
  name: string;
  data: string;
  timestamp?: string;
  sessionId?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const env = getEnvConfig();
    const event: AnalyticsEvent = req.body;

    // Validate event structure
    if (!event.name || !event.data) {
      return res.status(400).json({ error: 'Invalid event structure' });
    }

    // Add timestamp if not provided
    event.timestamp = event.timestamp || new Date().toISOString();

    // In production, process analytics events
    if (env.NODE_ENV === 'production') {
      // Log structured event for Vercel Analytics
      console.log('Analytics Event:', {
        name: event.name,
        timestamp: event.timestamp,
        environment: env.NODE_ENV,
        data: JSON.parse(event.data),
      });

      // Future: Send to external monitoring service (Sentry, DataDog, etc.)
      // await sendToExternalService(event);
    } else {
      // In development, just log the event
      console.log('Dev Analytics Event:', event);
    }

    // Respond with success
    res.status(200).json({ 
      success: true, 
      eventId: generateEventId(),
      timestamp: event.timestamp,
    });

  } catch (error) {
    console.error('Analytics processing error:', error);
    res.status(500).json({ 
      error: 'Failed to process analytics event',
      timestamp: new Date().toISOString(),
    });
  }
}

function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}