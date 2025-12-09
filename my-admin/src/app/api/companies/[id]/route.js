import { NextResponse } from "next/server";
import { API_CONFIG } from "@/lib/config";

export async function DELETE(request, { params }) {
  try {
    // In Next.js 16+, params is a Promise and must be awaited
    const { id } = await params;

    // Get admin token from header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Validate ID
    if (!id || id === "undefined" || id === "null") {
      console.error("Invalid ID in params:", id);
      return NextResponse.json(
        { success: false, message: "Invalid company ID" },
        { status: 400 }
      );
    }

    // Call backend API
    const backendUrl = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.partners.delete(id)}`;
    let response;
    try {
      response = await fetch(backendUrl, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (fetchError) {
      console.error("Network error calling backend:", fetchError);
      return NextResponse.json(
        { success: false, message: `Network error: ${fetchError.message || "Failed to connect to backend"}` },
        { status: 500 }
      );
    }

    // Try to parse response body
    let data;
    try {
      const responseText = await response.text();
      if (responseText) {
        data = JSON.parse(responseText);
      } else {
        data = {};
      }
    } catch (parseError) {
      console.error("Failed to parse backend response:", parseError);
      return NextResponse.json(
        { success: false, message: `Invalid response from backend (${response.status})` },
        { status: response.status || 500 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || data.error || "Failed to delete partner" },
        { status: response.status }
      );
    }

    return NextResponse.json(
      { success: true, message: data.message || "Partner deleted successfully" },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error deleting partner:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request, { params }) {
  try {
    // In Next.js 16+, params is a Promise and must be awaited
    const { id } = await params;

    // Validate ID
    if (!id || id === "undefined" || id === "null") {
      console.error("Invalid ID in params:", id);
      return NextResponse.json(
        { success: false, message: "Invalid company ID" },
        { status: 400 }
      );
    }

    console.log("Fetching company with ID:", id);

    // Get admin token from header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Call backend API
    const backendUrl = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.partners.get(id)}`;
    console.log("Backend URL:", backendUrl, "ID:", id);
    
    let response;
    try {
      response = await fetch(backendUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (fetchError) {
      console.error("Network error calling backend:", fetchError);
      return NextResponse.json(
        { success: false, message: `Network error: ${fetchError.message || "Failed to connect to backend"}` },
        { status: 500 }
      );
    }

    // Try to parse response body
    let data;
    try {
      const responseText = await response.text();
      console.log("Backend response text:", responseText, "Status:", response.status);
      
      if (responseText) {
        data = JSON.parse(responseText);
      } else {
        data = {};
      }
    } catch (parseError) {
      console.error("Failed to parse backend response:", parseError);
      return NextResponse.json(
        { success: false, message: `Invalid response from backend (${response.status})` },
        { status: response.status || 500 }
      );
    }

    console.log("Backend response parsed:", { status: response.status, data });

    if (!response.ok) {
      console.error("Backend error:", { 
        status: response.status, 
        message: data.message || data.error || "Unknown error", 
        data,
        id 
      });
      return NextResponse.json(
        { 
          success: false, 
          message: data.message || data.error || `Failed to fetch partner (${response.status})` 
        },
        { status: response.status }
      );
    }

    if (data.success && data.data) {
      return NextResponse.json(
        { success: true, data: data.data },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: true, data: data },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error fetching partner:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;

    if (!id || id === "undefined" || id === "null") {
      return NextResponse.json(
        { success: false, message: "Invalid company ID" },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    const token = authHeader.replace("Bearer ", "");

    let body;
    try {
      body = await request.json();
    } catch (parseErr) {
      console.error("Failed to parse payload:", parseErr);
      return NextResponse.json(
        { success: false, message: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    console.log("PUT /api/companies/[id] - Request body:", body);
    
    const updatePayload = {};
    if (body.company_name || body.name) {
      updatePayload.company_name = (body.company_name || body.name || "").trim();
    }
    // Include company_id if provided (even if empty string, to allow clearing it)
    // But we'll only update if it's not empty (handled in backend)
    if (body.company_id !== undefined && body.company_id !== null) {
      const trimmed = String(body.company_id).trim();
      // Only include if not empty (empty means don't update)
      if (trimmed !== "") {
        updatePayload.company_id = trimmed;
        console.log("Including company_id in payload:", trimmed);
      } else {
        console.log("company_id is empty, skipping");
      }
    } else {
      console.log("company_id is undefined or null, skipping");
    }
    if (body.pic_name) {
      updatePayload.pic_name = body.pic_name.trim();
    }
    if (body.pic_email) {
      updatePayload.pic_email = body.pic_email.trim();
    }
    if (typeof body.pic_phone === "string") {
      updatePayload.pic_phone = body.pic_phone.trim();
    }
    if (body.status) {
      updatePayload.status = body.status;
    }
    if (body.contract_start) {
      updatePayload.contract_start = body.contract_start;
    }
    if (body.contract_end) {
      updatePayload.contract_end = body.contract_end;
    }
    if (Object.prototype.hasOwnProperty.call(body, "notes")) {
      updatePayload.notes = body.notes;
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { success: false, message: "No fields to update" },
        { status: 400 }
      );
    }

    console.log("Sending to backend:", { 
      url: `${API_CONFIG.baseURL}${API_CONFIG.endpoints.partners.update(id)}`, 
      payload: updatePayload,
      id 
    });

    const backendUrl = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.partners.update(id)}`;
    let response;
    try {
      response = await fetch(backendUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatePayload),
      });
    } catch (fetchError) {
      console.error("Network error calling backend:", fetchError);
      return NextResponse.json(
        { success: false, message: `Network error: ${fetchError.message || "Failed to connect to backend"}` },
        { status: 500 }
      );
    }

    let data = {};
    try {
      const responseText = await response.text();
      if (responseText) {
        data = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.error("Failed to parse backend response:", parseError);
      return NextResponse.json(
        { success: false, message: `Invalid response from backend (${response.status})` },
        { status: response.status || 500 }
      );
    }

    if (!response.ok) {
      console.error("Failed to update partner:", {
        status: response.status,
        data,
        backendUrl,
        id,
        payload: updatePayload,
      });
      return NextResponse.json(
        { success: false, message: data.message || data.error || "Failed to update partner" },
        { status: response.status }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: data.message || "Partner updated successfully",
        data: data.data || null,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error updating partner:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

