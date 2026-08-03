// import { NextRequest } from 'next/server';
// import { createClient } from '@supabase/supabase-js';

// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole);

// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json();
//     const { email, password } = body;

//     if (!email || !password) {
//       return new Response(JSON.stringify({ error: 'Email and password are required' }), {
//         status: 400,
//         headers: { 'Content-Type': 'application/json' },
//       });
//     }

//     // 1. Supabase Auth se authenticate karein
//     const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
//       email,
//       password,
//     });

//     if (authError) {
//       return new Response(JSON.stringify({ error: authError.message }), {
//         status: 401,
//         headers: { 'Content-Type': 'application/json' },
//       });
//     }

//     const session = authData.session;
//     const authUser = authData.user;

//     // 2. Profiles table se aapke exact columns (full_name, account_type) fetch karein
//     const { data: profile, error: profileError } = await supabaseAdmin
//       .from('profiles')
//       .select('full_name, account_type')
//       .eq('id', authUser.id)
//       .single();

//     if (profileError) {
//       console.error('Profile fetch error:', profileError.message);
//     }

//     const role = profile?.account_type || 'user';

//     // 3. Agar role 'user' hai, to real DB check karein ki wallet application already submit hai ya nahi
//     let walletOnboardingStatus: 'none' | 'pending' | 'in-progress' | 'approved' = 'none';

//     if (role === 'user') {
//       const { data: application, error: applicationError } = await supabaseAdmin
//         .from('wallet_applications')
//         .select('status')
//         .eq('user_id', authUser.id)
//         .maybeSingle();

//       if (applicationError) {
//         console.error('Wallet application check error:', applicationError.message);
//       }

//       if (!application) {
//         walletOnboardingStatus = 'pending'; // form abhi tak fill nahi hua
//       } else if (application.status === 'approved') {
//         walletOnboardingStatus = 'approved';
//       } else {
//         walletOnboardingStatus = 'in-progress'; // submitted, review pending
//       }
//     }

//     // 4. Map account_type to role and full_name to fullName for frontend context
//     const responseBody = {
//       success: true,
//       data: {
//         token: session?.access_token || '',
//         user: {
//           id: authUser.id,
//           email: authUser.email || '',
//           fullName: profile?.full_name || 'ERP User',
//           role,
//         },
//         walletOnboardingStatus,
//       },
//     };

//     return new Response(JSON.stringify(responseBody), {
//       status: 200,
//       headers: { 'Content-Type': 'application/json' },
//     });

//   } catch (error: any) {
//     console.error('Login Route Error:', error);
//     return new Response(JSON.stringify({ error: 'Login failed internally' }), {
//       status: 500,
//       headers: { 'Content-Type': 'application/json' },
//     });
//   }
// }
import { NextRequest } from 'next/server';
import { generateToken } from '@/lib/auth'; 
import { signInWithPassword } from '@/lib/supabase/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json();
//     const { email, password } = body;

//     if (!email || !password) {
//       return new Response(JSON.stringify({ error: 'Email and password are required' }), {
//         status: 400,
//         headers: { 'Content-Type': 'application/json' },
//       });
//     }

//     // 1. Supabase Auth se login verify karein
//     const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
//       email,
//       password,
//     });

//     if (authError) {
//       return new Response(JSON.stringify({ error: authError.message }), {
//         status: 401,
//         headers: { 'Content-Type': 'application/json' },
//       });
//     }

//     const session = authData.session;
//     const authUser = authData.user;
//     const userEmail = authUser.email?.toLowerCase().trim();

//     // -------------------------------------------------------------
//     // 2. CHECK 1: Pehle 'admin_members' table mein check karo
//     // -------------------------------------------------------------
//     const { data: adminMember, error: adminError } = await supabaseAdmin
//       .from('admin_members')
//       .select('id, full_name, email')
//       .ilike('email', userEmail || '') // Case-insensitive match (Capital/small letter issue handle karne ke liye)
//       .maybeSingle();

//     let role = 'user';
//     let fullName = 'ERP User';

//     if (adminMember) {
//       // ✅ Admin match ho gaya!
//       role = 'admin';
//       fullName = adminMember.full_name || 'Super Admin';
//     } else {
//       // ❌ Agar admin_members mein nahi mila tabhi profiles check karein
//       const { data: profile } = await supabaseAdmin
//         .from('profiles')
//         .select('full_name, account_type')
//         .eq('id', authUser.id)
//         .maybeSingle();

//       fullName = profile?.full_name || 'ERP User';
      
//       // Security Guardrail: Normal registration se bana banda kabhi admin role na le sake
//       const profileRole = profile?.account_type;
//       role = profileRole === 'admin' ? 'user' : (profileRole || 'user');
//     }

//     // 3. Wallet status check (sirf normal users ke liye)
//     let walletOnboardingStatus: 'none' | 'pending' | 'in-progress' | 'approved' = 'none';

//     if (role === 'user') {
//       const { data: application } = await supabaseAdmin
//         .from('wallet_applications')
//         .select('status')
//         .eq('user_id', authUser.id)
//         .maybeSingle();

//       if (!application) {
//         walletOnboardingStatus = 'pending';
//       } else if (application.status === 'approved') {
//         walletOnboardingStatus = 'approved';
//       } else {
//         walletOnboardingStatus = 'in-progress';
//       }
//     }

//     // 4. Final Response
//     const responseBody = {
//       success: true,
//       data: {
//         token: session?.access_token || '',
//         user: {
//           id: authUser.id,
//           email: authUser.email || '',
//           fullName,
//           role,
//           isApproved: true,
//         },
//         walletOnboardingStatus,
//       },
//     };

//     return new Response(JSON.stringify(responseBody), {
//       status: 200,
//       headers: { 'Content-Type': 'application/json' },
//     });

//   } catch (error: any) {
//     console.error('Login Route Error:', error);
//     return new Response(JSON.stringify({ error: 'Login failed internally' }), {
//       status: 500,
//       headers: { 'Content-Type': 'application/json' },
//     });
//   }
// }



export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 1. Supabase Auth (must go through the shared auth wrapper)
    const { data: authData, error: authError } = await signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const session = authData.session;
    const authUser = authData.user;
    const cleanEmail = authUser.email?.trim().toLowerCase() || '';

    let role = 'user';
    let fullName = 'ERP User';

    // 2. CHECK 1: admin_members lookup
    const { data: adminMember, error: adminMemberError } = await supabaseAdmin
      .from('admin_members')
      .select('*')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (adminMemberError) {
      console.error('Admin member lookup failed:', adminMemberError.message);
    }

    if (adminMember) {
      role = 'admin';
      fullName = adminMember.full_name || adminMember.name || 'Super Admin';
    } else {
      // 3. CHECK 2: admin_invites lookup
      const { data: inviteMember, error: inviteError } = await supabaseAdmin
        .from('admin_invites')
        .select('*')
        .ilike('email', cleanEmail)
        .maybeSingle();

      if (inviteError) {
        console.error('Admin invite lookup failed:', inviteError.message);
      }

      if (inviteMember) {
        role = inviteMember.role || 'admin';
        fullName = inviteMember.name || 'Team Member';
      } else {
        // 4. CHECK 3: profiles fallback
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('full_name, account_type')
          .eq('id', authUser.id)
          .maybeSingle();

        if (profileError) {
          console.error('Profile lookup failed:', profileError.message);
        }

        fullName = profile?.full_name || 'ERP User';
        role = profile?.account_type ? String(profile.account_type).toLowerCase() : 'user';
      }
    }

    let walletOnboardingStatus: 'none' | 'pending' | 'in-progress' | 'approved' = 'none';
    if (role === 'user' || role === 'wallet_user') {
      const { data: application, error: applicationError } = await supabaseAdmin
        .from('wallet_applications')
        .select('status')
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (applicationError) {
        console.error('Wallet status lookup failed:', applicationError.message);
      }

      if (!application) {
        walletOnboardingStatus = 'pending';
      } else if (application.status === 'approved') {
        walletOnboardingStatus = 'approved';
      } else {
        walletOnboardingStatus = 'in-progress';
      }
    }

    // 5. Apna khud ka JWT generate karo (role properly embedded hoga isme)
    const appToken = generateToken({
      id: authUser.id,
      userId: authUser.id,
      email: authUser.email || '',
      fullName,
      role: role as any,
    });

    // 6. Final Response
    return new Response(JSON.stringify({
      success: true,
      data: {
        token: appToken,
        user: {
          id: authUser.id,
          email: authUser.email || '',
          fullName,
          role,
          isApproved: true,
        },
        walletOnboardingStatus,
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Login Route Error:', error);
    const message = error instanceof Error ? error.message : 'Login failed internally';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}