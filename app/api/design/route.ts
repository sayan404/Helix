import { NextRequest, NextResponse } from 'next/server';
import { generateArchitecture } from '@/lib/ai/gemini-client';
import { estimateCost } from '@/lib/utils/cost-estimator';
import { ArchitectureBlueprint } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Generate architecture using Gemini
    const architecture = await generateArchitecture(prompt);

    // Create the full blueprint
    const blueprint: ArchitectureBlueprint = {
      id: `arch-${Date.now()}`,
      prompt,
      services: architecture.services || [],
      connections: architecture.connections || [],
      patterns: architecture.patterns || [],
      scaling_model: architecture.scaling_model || 'horizontal',
      summary: architecture.summary || 'System architecture generated',
      estimated_cost: estimateCost(architecture),
      created_at: new Date().toISOString(),
    };

    return NextResponse.json(blueprint);
  } catch (error) {
    console.error('Error in design API:', error);
    return NextResponse.json(
      { error: 'Failed to generate architecture' },
      { status: 500 }
    );
  }
}

