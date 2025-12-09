import { NextResponse } from "next/server";
import { API_CONFIG } from "@/lib/config";
import { convertScopesToBackend } from "@/lib/scopes";

export async function POST(request) {
  try {
    const body = await request.json();
    console.log("Received request body:", body);
    
    // Get admin token from cookie or header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Convert frontend scopes to backend format
    const scopes = convertScopesToBackend(body.access_scopes || {});
    
    // Ensure scopes is always an array
    const validScopes = Array.isArray(scopes) ? scopes : [];

    // Prepare request body for backend (only include defined values)
    const backendPayload = {
      company_name: (body.name || body.company_name || "").trim(),
      pic_name: (body.pic_name || "").trim(),
      pic_email: (body.pic_email || "").trim(),
      pic_phone: (body.pic_phone || "").trim(),
      notes: (body.notes || "").trim(),
      scopes: validScopes,
    };

    // Add optional fields only if they have values (and not empty string)
    if (body.company_id && typeof body.company_id === 'string' && body.company_id.trim()) {
      backendPayload.company_id = body.company_id.trim();
    }
    
    // Only add contract dates if they are valid date strings
    if (body.contract_start && typeof body.contract_start === 'string' && body.contract_start.trim()) {
      backendPayload.contract_start = body.contract_start.trim();
    }
    if (body.contract_end && typeof body.contract_end === 'string' && body.contract_end.trim()) {
      backendPayload.contract_end = body.contract_end.trim();
    }
    
    // Remove undefined/null values from payload
    Object.keys(backendPayload).forEach(key => {
      if (backendPayload[key] === undefined || backendPayload[key] === null) {
        delete backendPayload[key];
      }
    });

    // Validate required fields
    if (!backendPayload.company_name || !backendPayload.company_name.trim()) {
      return NextResponse.json(
        { success: false, message: "company_name is required" },
        { status: 400 }
      );
    }
    if (!backendPayload.pic_name || !backendPayload.pic_name.trim()) {
      return NextResponse.json(
        { success: false, message: "pic_name is required" },
        { status: 400 }
      );
    }
    if (!backendPayload.pic_email || !backendPayload.pic_email.trim()) {
      return NextResponse.json(
        { success: false, message: "pic_email is required" },
        { status: 400 }
      );
    }

    console.log("Backend payload:", JSON.stringify(backendPayload, null, 2));

    // Call backend API
    const backendUrl = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.partners.create}`;
    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(backendPayload),
    });

    let data;
    try {
      data = await response.json();
    } catch (e) {
      console.error("Failed to parse backend response:", e);
      const text = await response.text();
      return NextResponse.json(
        { success: false, message: `Backend error: ${text || response.statusText}` },
        { status: response.status }
      );
    }
    
    console.log("Backend response:", { status: response.status, data });

    if (!response.ok) {
      console.error("Backend error:", data);
      // Backend returns { success: false, message: "...", error: "..." }
      const errorMessage = data?.message || data?.error || data?.detail || `Backend returned ${response.status}: ${response.statusText}`;
      console.error("Extracted error message:", errorMessage);
      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: response.status }
      );
    }

    // Backend returns { success: true, data: {...} } or direct data
    // Handle both formats
    if (data.success && data.data) {
      return NextResponse.json(
        { success: true, data: data.data },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { success: true, data: data },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error creating partner:", err);
    const errorMessage = err?.message || err?.toString() || "Internal server error";
    console.error("Error message:", errorMessage);
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    // Get admin token from cookie or header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Call backend API
    const backendUrl = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.partners.list}`;
    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || "Failed to fetch partners" },
        { status: response.status }
      );
    }

    // Backend returns { success: true, data: [...] } or direct array
    // Handle both formats
    if (data.success && data.data) {
      return NextResponse.json(
        { success: true, data: data.data },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: true, data: Array.isArray(data) ? data : [] },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error fetching partners:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
