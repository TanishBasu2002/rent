// File:/api/notifications/whatsapp/route.js
import { sendWhatsAppMessage } from "@/lib/twilio";

export async function POST(request) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.renterPhone || !data.renterName) {
      console.error("Missing required fields for WhatsApp message");
      return Response.json(
        { error: "Missing required fields for WhatsApp message" },
        { status: 400 },
      );
    }

    // Construct the template variables
    const templateVariables = {
      1: data.renterName, // اسم المستأجر
    };

    // Send the WhatsApp message and await the result
    const result = await sendWhatsAppMessage(
      data.renterPhone,
      templateVariables,
      true,
      "rent_aggrement_creation",
    );

    console.log("WhatsApp message sent successfully with SID:", result.sid);
    return Response.json({ success: true, messageSid: result.sid });
  } catch (error) {
    console.error("Failed to send WhatsApp message:", error.toString());

    // Return detailed error for debugging
    return Response.json(
      {
        error: "Failed to send WhatsApp message",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}
