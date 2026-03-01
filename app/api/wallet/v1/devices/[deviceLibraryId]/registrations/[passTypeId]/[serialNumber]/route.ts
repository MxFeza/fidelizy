import { createServiceClient } from '@/lib/supabase/service'
import { verifyAuthToken } from '@/lib/wallet/generatePass'
import { NextRequest, NextResponse } from 'next/server'

type Params = {
  deviceLibraryId: string
  passTypeId: string
  serialNumber: string
}

function extractToken(request: NextRequest): string | null {
  const auth = request.headers.get('authorization') // "ApplePass <token>"
  if (!auth?.startsWith('ApplePass ')) return null
  return auth.slice('ApplePass '.length)
}

// POST — Apple registers a device for pass update notifications
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const { deviceLibraryId, passTypeId, serialNumber } = await params

  const token = extractToken(request)
  if (!token || !verifyAuthToken(token, serialNumber)) {
    return new NextResponse(null, { status: 401 })
  }

  let body: { pushToken?: string }
  try {
    body = await request.json()
  } catch {
    return new NextResponse(null, { status: 400 })
  }

  const { pushToken } = body
  if (!pushToken) return new NextResponse(null, { status: 400 })

  const supabase = createServiceClient()

  // Check if this registration already exists (to return 200 vs 201)
  const { data: existing } = await supabase
    .from('wallet_registrations')
    .select('id')
    .eq('device_library_id', deviceLibraryId)
    .eq('pass_type_id', passTypeId)
    .eq('serial_number', serialNumber)
    .maybeSingle()

  await supabase.from('wallet_registrations').upsert(
    {
      device_library_id: deviceLibraryId,
      push_token: pushToken,
      pass_type_id: passTypeId,
      serial_number: serialNumber,
    },
    { onConflict: 'device_library_id,pass_type_id,serial_number' }
  )

  return new NextResponse(null, { status: existing ? 200 : 201 })
}

// DELETE — Apple unregisters a device (user removed the pass)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const { deviceLibraryId, passTypeId, serialNumber } = await params

  const token = extractToken(request)
  if (!token || !verifyAuthToken(token, serialNumber)) {
    return new NextResponse(null, { status: 401 })
  }

  const supabase = createServiceClient()

  await supabase
    .from('wallet_registrations')
    .delete()
    .eq('device_library_id', deviceLibraryId)
    .eq('pass_type_id', passTypeId)
    .eq('serial_number', serialNumber)

  return new NextResponse(null, { status: 200 })
}
