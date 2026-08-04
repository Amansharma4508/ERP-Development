import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // Real Supabase query example:
    // const { data, error } = await supabase.from('prescriptions').select('*').single();

    const dummyPrescription = {
      id: "RX-98421",
      doctorName: "Dr. Sharma, M.D.",
      hospital: "City Multispeciality Hospital",
      date: "Today, 02:45 PM",
      diagnosis: "Viral Fever & Weakness",
      notes: "Take medicines after meals. Rest for 3 days and stay hydrated.",
      medicines: [
        { id: 1, name: "Paracetamol 650mg", unit: "15 Tablets", price: 35, dosage: "1-0-1", duration: "5 Days" },
        { id: 2, name: "Amoxicillin 500mg", unit: "10 Capsules", price: 120, dosage: "1-0-1", duration: "5 Days" },
        { id: 3, name: "Pantoprazole 40mg", unit: "10 Tablets", price: 55, dosage: "1-0-0", duration: "5 Days" },
        { id: 5, name: "Multivitamin Syrup", unit: "200 ml", price: 180, dosage: "0-1-1", duration: "10 Days" },
      ],
    };

    return NextResponse.json({ success: true, data: dummyPrescription }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}