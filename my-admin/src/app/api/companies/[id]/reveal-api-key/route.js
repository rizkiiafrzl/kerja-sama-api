import { NextResponse } from "next/server";
import { API_CONFIG } from "@/lib/config";

export async function GET(request, { params }) {
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

    const backendUrl = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.partners.reveal(id)}`;
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
      return NextResponse.json(
        {
          success: false,
          message: `Network error: ${fetchError.message || "Failed to connect to backend"}`,
        },
        { status: 500 }
      );
    }

    let data = {};
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : {};
    } catch (parseError) {
      return NextResponse.json(
        { success: false, message: `Invalid response from backend (${response.status})` },
        { status: response.status || 500 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || data.error || "Failed to reveal API key" },
        { status: response.status }
      );
    }

    return NextResponse.json(
      { success: true, data: data.data || {} },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}



