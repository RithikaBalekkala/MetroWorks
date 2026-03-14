import { NextRequest, NextResponse } from 'next/server';
import type {
  RushGetResponse,
  RushUpdatePayload,
  RushUpdateResponse,
} from '@/lib/rush-types';
import {
  autoRefreshAllStations,
  getCriticalStations,
  getRushStore,
  updateStationRush,
} from '@/lib/rush-state-store';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stationId = searchParams.get('stationId');
    const autoRefresh = searchParams.get('autoRefresh');

    if (autoRefresh === 'true') {
      autoRefreshAllStations();
    }

    const store = getRushStore();

    if (stationId) {
      const station = store.stations[stationId];
      if (!station) {
        return NextResponse.json(
          { success: false, error: 'Station not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          stations: { [stationId]: station },
          lastGlobalUpdate: store.lastGlobalUpdate,
          totalStationsMonitored: 1,
          criticalCount: station.isCriticalAlert ? 1 : 0,
          heavyCount: station.crowdLevel === 'HEAVY' ? 1 : 0,
          averageSystemLoad: station.rushPercent,
        },
        timestamp: new Date().toISOString(),
      } satisfies RushGetResponse);
    }

    return NextResponse.json({
      success: true,
      data: store,
      timestamp: new Date().toISOString(),
    } satisfies RushGetResponse);
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch rush status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<RushUpdatePayload>;
    const errors: string[] = [];

    if (!body.stationId || typeof body.stationId !== 'string') {
      errors.push('stationId is required and must be a string');
    }

    if (
      body.rushPercent === undefined ||
      typeof body.rushPercent !== 'number' ||
      body.rushPercent < 0 ||
      body.rushPercent > 100
    ) {
      errors.push('rushPercent is required and must be a number between 0-100');
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, errors },
        { status: 400 }
      );
    }

    const updated = updateStationRush(body as RushUpdatePayload);

    let alertTriggered = false;
    let alertMessage: string | undefined;

    if (updated.isCriticalAlert && updated.alertMessage) {
      alertTriggered = true;
      alertMessage = updated.alertMessage;
      const mod = await import('@/lib/notification-service');
      mod.triggerRushManagementAlert({
        stationId: updated.stationId,
        stationName: updated.stationName,
        rushPercent: updated.rushPercent,
        crowdLevel: updated.crowdLevel,
        message: updated.alertMessage,
      });
    }

    return NextResponse.json({
      success: true,
      stationId: updated.stationId,
      stationName: updated.stationName,
      crowdLevel: updated.crowdLevel,
      rushPercent: updated.rushPercent,
      alertTriggered,
      alertMessage,
      timestamp: new Date().toISOString(),
    } satisfies RushUpdateResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function PATCH() {
  try {
    autoRefreshAllStations();
    const store = getRushStore();
    const critical = getCriticalStations();

    if (critical.length > 0) {
      const mod = await import('@/lib/notification-service');
      critical.forEach(station => {
        if (station.alertMessage) {
          mod.triggerRushManagementAlert({
            stationId: station.stationId,
            stationName: station.stationName,
            rushPercent: station.rushPercent,
            crowdLevel: station.crowdLevel,
            message: station.alertMessage,
          });
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: store,
      criticalAlertsFired: critical.length,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Simulation failed' },
      { status: 500 }
    );
  }
}
