import { NextRequest, NextResponse } from 'next/server';
import { simulateLoad } from '@/lib/utils/cost-estimator';
import { ArchitectureBlueprint } from '@/lib/types';
import { monitorApiRoute } from "@/lib/monitoring/api-monitoring";
import * as Sentry from "@sentry/nextjs";

export async function POST(request: NextRequest) {
  return monitorApiRoute(
    { route: "/api/simulate", method: "POST", request },
    async () => {
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
        Sentry.captureException(error);
        return NextResponse.json(
          { error: 'Failed to simulate load' },
          { status: 500 }
        );
      }
    }
  );
}

