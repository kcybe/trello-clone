import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for demo (replace with database in production)
const integrations = new Map<
  string,
  {
    id: string;
    type: 'slack' | 'discord';
    name: string;
    webhookUrl: string;
    channelId?: string;
    enabled: boolean;
    events: string[];
    createdAt: string;
    updatedAt: string;
  }
>();

export async function GET() {
  const allIntegrations = Array.from(integrations.values());
  return NextResponse.json({ integrations: allIntegrations });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { type, name, webhookUrl, channelId, events } = body;

  if (!type || !name || !webhookUrl || !events) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (!['slack', 'discord'].includes(type)) {
    return NextResponse.json({ error: 'Invalid integration type' }, { status: 400 });
  }

  const id = `integration-${Date.now()}`;

  const integration = {
    id,
    type,
    name,
    webhookUrl,
    channelId,
    enabled: true,
    events,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  integrations.set(id, integration);

  return NextResponse.json({ integration });
}
