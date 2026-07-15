import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// एडमिन क्लाइंट जो RLS नियमों के तहत सर्विस रोल कुंजी के साथ सुरक्षित रूप से डेटा इन्सर्ट करेगा
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, formData, photoBase64, photoName } = body;

    // बुनियादी वैलिडेशन
    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID missing' }, { status: 400 });
    }

    let finalPhotoUrl = '';

    // 1. अगर फ्रंटएंड से लाइव फोटो का बेस64 आया है, तो उसे स्टोरेज में अपलोड करें
    if (photoBase64 && photoName) {
      const buffer = Buffer.from(photoBase64.split(',')[1], 'base64');
      const fileExt = photoName.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;

      const { data: storageData, error: storageError } = await supabaseAdmin
        .storage
        .from('live-photos')
        .upload(fileName, buffer, {
          contentType: `image/${fileExt}`,
          upsert: true
        });

      if (storageError) {
        console.error('Storage Upload Error:', storageError);
        throw new Error('फोटो बकेट में अपलोड नहीं हो सकी।');
      }

      // स्टोरेज से सही पब्लिक URL प्राप्त करना
      const { data: urlData } = supabaseAdmin
        .storage
        .from('live-photos')
        .getPublicUrl(fileName);

      finalPhotoUrl = urlData.publicUrl;
    }

    // 2. गोपनीयता सुरक्षा के लिए फैमिली मेंबर्स के संवेदनशील डेटा को सुरक्षित रूप से व्यवस्थित करना
    const cleanFamilyMembers = (formData.familyMembers || []).map((member: any) => ({
      name: member.name,
      dob: member.dob,
      gender: member.gender,
      relationship: member.relationship, 
      uid_provided: !!member.uid // प्राइवेसी सुरक्षा के लिए अंकों के बजाय केवल उपस्थिति स्टोर करें
    }));

    // 3. डेटाबेस पेलोड मैपिंग (आपकी SQL स्कीमा की सभी NOT NULL आवश्यकताओं के अनुसार सटीक मिलान)
    const { data, error } = await supabaseAdmin
      .from('wallet_applications')
      .insert([
        {
          user_id: userId,
          
          // Personal
          full_name: formData.fullName,
          father_name: formData.fatherName,
          mother_name: formData.motherName,
          dob: formData.dob, // YYYY-MM-DD फॉर्मेट में होना चाहिए
          gender: formData.gender,
          qualification: formData.qualification,
          spouse_name: formData.spouseName || null, // Optional field
          blood_group: formData.bloodGroup,
          occupation: formData.occupation,

          // Family
          family_members_count: Number(formData.familyMembersCount || 0),
          male_count: Number(formData.maleCount || 0),
          female_count: Number(formData.femaleCount || 0),
          head_of_family: formData.headOfFamily,
          family_members: cleanFamilyMembers, // JSONB एरे

          // Address
          house_number: formData.houseNumber,
          ward_number: formData.wardNumber,
          village_city: formData.villageCity,
          gram_panchayat: formData.gramPanchayat,
          block: formData.block,
          district: formData.district,
          state: formData.state,
          pin_code: formData.pinCode,
          address_id: formData.addressId,

          // Identity & Lifestyle
          // गोपनीयता और NOT NULL एरर से बचने के लिए एनोनिमाइज्ड वैल्यू पास करें
          uid_number: formData.uidNumber ? '[UID Provided]' : '[Not Provided]', 
          pan_card: formData.panCard || '[PAN Omitted]', // अनुमत आईडी विवरण सुरक्षित रूप से हैंडल किया गया
          food_intake: formData.foodIntake,
          smoking: formData.smoking,
          alcohol_consumption: formData.alcoholConsumption,
          medical_expenses_monthly: Number(formData.medicalExpensesMonthly || 0),
          drinking_water_source: formData.drinkingWaterSource,
          food_source: formData.foodSource,
          pollution_level: formData.pollutionLevel,

          // Verification / Meta
          live_photo_url: finalPhotoUrl || null, // Optional field in database
          application_date: formData.applicationDate || new Date().toISOString().split('T')[0],
          place: formData.place,
          application_time: formData.applicationTime || formData.time || new Date().toLocaleTimeString(), // 'time' को स्कीमा के 'application_time' से बदला गया
          coordinator_id: formData.coordinatorId,
          field_officer_id: formData.fieldOfficerId,
          area_code: formData.areaCode,
          vending_id: formData.vendingId,

          // Meta default / explicit fields
          consent_given: formData.consentGiven === undefined ? true : !!formData.consentGiven, 
          status: formData.status || 'submitted'
        }
      ])
      .select();

    if (error) {
      console.error('Database Insert Error Detail:', error);
      throw error;
    }

    // फ्रंटएंड रिस्पॉन्स हैंडलिंग को सुचारू बनाने के लिए स्पष्ट रिस्पॉन्स भेजें
    return NextResponse.json({ success: true, data }, { status: 200 });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}