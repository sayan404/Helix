import { NextRequest, NextResponse } from 'next/server';
import { generateServiceCode } from '@/lib/ai/gemini-client';

export async function POST(request: NextRequest) {
  try {
    const { serviceName, serviceType, technology } = await request.json();

    if (!serviceName || !serviceType) {
      return NextResponse.json(
        { error: 'Service name and type are required' },
        { status: 400 }
      );
    }

    const codeTemplate = await generateServiceCode(serviceName, serviceType, technology);

    return NextResponse.json({
      service_name: serviceName,
      files: codeTemplate.files || {},
    });
  } catch (error) {
    console.error('Error in generate-code API:', error);
    return NextResponse.json(
      { error: 'Failed to generate code' },
      { status: 500 }
    );
  }
}

