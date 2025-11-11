import { NextRequest, NextResponse } from 'next/server';
import { simulateLoad } from '@/lib/utils/cost-estimator';
import { ArchitectureBlueprint } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const architecture: ArchitectureBlueprint = await request.json();

    if (!architecture || !architecture.services) {
      return NextResponse.json(
        { error: 'Valid architecture blueprint required' },
        { status: 400 }
      );
    }

    const metrics = simulateLoad(architecture);

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error in simulate API:', error);
    return NextResponse.json(
      { error: 'Failed to simulate load' },
      { status: 500 }
    );
  }
}

