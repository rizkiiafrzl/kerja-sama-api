import { NextResponse } from "next/server";
import { API_CONFIG } from "@/lib/config";

export async function GET(request, { params }) {
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
    const backendUrl = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.partners.scopes(id)}`;
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
        { success: false, message: data.message || data.error || "Failed to fetch scopes" },
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
      { success: true, data: Array.isArray(data) ? data : [] },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error fetching scopes:", err);
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
      console.error("Failed to parse scopes payload:", parseErr);
      return NextResponse.json(
        { success: false, message: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    if (!body || !Array.isArray(body.scopes)) {
      return NextResponse.json(
        { success: false, message: "Scopes payload is missing or invalid" },
        { status: 400 }
      );
    }

    const backendUrl = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.partners.scopes(id)}`;
    let response;
    try {
      response = await fetch(backendUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
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
      return NextResponse.json(
        { success: false, message: data.message || data.error || "Failed to update scopes" },
        { status: response.status }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: data.message || "Scopes updated successfully",
        data: data.data || null,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error updating scopes:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

