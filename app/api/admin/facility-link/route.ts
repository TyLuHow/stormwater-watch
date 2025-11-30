import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Fetch facilities or eSMR facilities
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'facilities') {
      const facilities = await prisma.facility.findMany({
        select: {
          id: true,
          name: true,
          permitId: true,
          county: true,
          esmrFacilityId: true,
          esmrFacility: {
            select: {
              facilityPlaceId: true,
              facilityName: true,
              regionCode: true,
            },
          },
        },
        orderBy: [
          { esmrFacilityId: 'asc' }, // Unlinked first (nulls first)
          { name: 'asc' },
        ],
      });

      return NextResponse.json(facilities);
    }

    if (type === 'esmr') {
      const esmrFacilities = await prisma.eSMRFacility.findMany({
        select: {
          facilityPlaceId: true,
          facilityName: true,
          regionCode: true,
          receivingWaterBody: true,
        },
        orderBy: {
          facilityName: 'asc',
        },
      });

      return NextResponse.json(esmrFacilities);
    }

    return NextResponse.json(
      { error: 'Invalid type parameter. Use "facilities" or "esmr"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}

// POST - Link a facility to an eSMR facility
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { facilityId, esmrFacilityId } = body;

    if (!facilityId || !esmrFacilityId) {
      return NextResponse.json(
        { error: 'facilityId and esmrFacilityId are required' },
        { status: 400 }
      );
    }

    // Verify the facility exists
    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
    });

    if (!facility) {
      return NextResponse.json(
        { error: 'Facility not found' },
        { status: 404 }
      );
    }

    // Verify the eSMR facility exists
    const esmrFacility = await prisma.eSMRFacility.findUnique({
      where: { facilityPlaceId: esmrFacilityId },
    });

    if (!esmrFacility) {
      return NextResponse.json(
        { error: 'eSMR facility not found' },
        { status: 404 }
      );
    }

    // Check if facility is already linked to a different eSMR facility
    if (facility.esmrFacilityId && facility.esmrFacilityId !== esmrFacilityId) {
      return NextResponse.json(
        { error: 'Facility is already linked to a different eSMR facility. Unlink it first.' },
        { status: 400 }
      );
    }

    // Link the facilities
    const updatedFacility = await prisma.facility.update({
      where: { id: facilityId },
      data: { esmrFacilityId },
      include: {
        esmrFacility: {
          select: {
            facilityPlaceId: true,
            facilityName: true,
            regionCode: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      facility: updatedFacility,
    });
  } catch (error) {
    console.error('Error linking facilities:', error);
    return NextResponse.json(
      { error: 'Failed to link facilities' },
      { status: 500 }
    );
  }
}

// DELETE - Unlink a facility from its eSMR facility
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { facilityId } = body;

    if (!facilityId) {
      return NextResponse.json(
        { error: 'facilityId is required' },
        { status: 400 }
      );
    }

    // Verify the facility exists
    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
    });

    if (!facility) {
      return NextResponse.json(
        { error: 'Facility not found' },
        { status: 404 }
      );
    }

    // Unlink the facility
    const updatedFacility = await prisma.facility.update({
      where: { id: facilityId },
      data: { esmrFacilityId: null },
    });

    return NextResponse.json({
      success: true,
      facility: updatedFacility,
    });
  } catch (error) {
    console.error('Error unlinking facility:', error);
    return NextResponse.json(
      { error: 'Failed to unlink facility' },
      { status: 500 }
    );
  }
}
