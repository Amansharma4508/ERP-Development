import { NextResponse } from 'next/server';
// process.env ko hata kar seedhe aapke central client file ko import kar liya hai
import { supabase } from '@/lib/supabase/client'; 

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, formData, photoBase64, photoName } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID missing' }, { status: 400 });
    }

    let finalPhotoUrl = '';

    // 1. Storage Upload logic (Ensure 'live-photos' bucket exists in your Supabase Dashboard)
    if (photoBase64 && photoName) {
      const buffer = Buffer.from(photoBase64.split(',')[1], 'base64');
      const fileExt = photoName.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;

      const { data: storageData, error: storageError } = await supabase
        .storage
        .from('live-photos')
        .upload(fileName, buffer, {
          contentType: `image/${fileExt}`,
          upsert: true
        });

      if (storageError) {
        console.error('Storage Upload Error Detail:', storageError);
        return NextResponse.json({ success: false, error: 'Storage upload failed' }, { status: 500 });
      }

      const { data: urlData } = supabase
        .storage
        .from('live-photos')
        .getPublicUrl(fileName);

      finalPhotoUrl = urlData.publicUrl;
    }

    const cleanFamilyMembers = (formData.familyMembers || []).map((member: any) => ({
      name: member.name,
      dob: member.dob,
      gender: member.gender,
      relationship: member.relationship, 
      uid_provided: !!member.uid 
    }));

    // 2. Database Insertion Schema Mapping
    const { data, error } = await supabase
      .from('wallet_applications')
      .insert([
        {
          user_id: userId,
          
          // Personal Details
          full_name: formData.fullName,
          father_name: formData.fatherName,
          mother_name: formData.motherName,
          dob: formData.dob, 
          gender: formData.gender,
          qualification: formData.qualification,
          spouse_name: formData.spouseName || null, 
          blood_group: formData.bloodGroup,
          occupation: formData.occupation,

          // Family Details
          family_members_count: Number(formData.familyMembersCount || 0),
          male_count: Number(formData.maleCount || 0),
          female_count: Number(formData.femaleCount || 0),
          head_of_family: formData.headOfFamily,
          family_members: cleanFamilyMembers, 

          // Address Details
          house_number: formData.houseNumber,
          ward_number: formData.wardNumber,
          village_city: formData.villageCity,
          gram_panchayat: formData.gramPanchayat,
          block: formData.block,
          district: formData.district,
          state: formData.state,
          pin_code: formData.pinCode,
          address_id: formData.addressId,

          // Identity & Lifestyle Details
          uid_number: formData.uidNumber ? '[UID Provided]' : '[Not Provided]', 
          pan_card: formData.panCard || '[PAN Omitted]', 
          food_intake: formData.foodIntake,
          smoking: formData.smoking,
          alcohol_consumption: formData.alcoholConsumption,
          medical_expenses_monthly: Number(formData.medicalExpensesMonthly || 0),
          drinking_water_source: formData.drinkingWaterSource,
          food_source: formData.foodSource,
          pollution_level: formData.pollutionLevel,

          // Meta & Verification
          live_photo_url: finalPhotoUrl || null, 
          application_date: formData.applicationDate || new Date().toISOString().split('T')[0],
          place: formData.place,
          
          // Vercel Serverless environment support time format
          application_time: formData.applicationTime || formData.time || new Date().toISOString().split('T')[1].substring(0,8), 
          
          coordinator_id: formData.coordinatorId,
          field_officer_id: formData.fieldOfficerId,
          area_code: formData.areaCode,
          vending_id: formData.vendingId,

          consent_given: formData.consentGiven === undefined ? true : !!formData.consentGiven, 
          status: formData.status || 'submitted'
        }
      ])
      .select();

    if (error) {
      console.error('Database Operation Error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data }, { status: 200 });

  } catch (error: any) {
    console.error('Fatal API Route Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}