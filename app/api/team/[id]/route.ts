import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// PATCH: Edit admin invite
export async function PATCH(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    const { data, error } = await supabaseAdmin
      .from('admin_invites')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE: Handle both Single Delete (via params) and Bulk Delete (via body IDs)
export async function DELETE(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    let bodyIds: string[] = [];
    
    // Try to parse body to see if it's a bulk delete request
    try {
      const body = await request.json();
      if (body && Array.isArray(body.ids)) {
        bodyIds = body.ids;
      }
    } catch {
      // Body might be empty for a standard single-delete call
    }

    // BULK DELETE
    if (bodyIds.length > 0) {
      const { error } = await supabaseAdmin
        .from('admin_invites')
        .delete()
        .in('id', bodyIds);

      if (error) throw error;

      return NextResponse.json({ 
        success: true, 
        message: `${bodyIds.length} admin invites deleted successfully` 
      });
    }

    // SINGLE DELETE
    const { id } = params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Invite ID is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('admin_invites')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      message: 'Admin invite deleted successfully' 
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}