// File:/api/notification/email/route.js
import { render } from "@react-email/render";
import RentAgreementEmail from "@/helpers/functions/sentEmail";
import { sendEmail } from "../../utlis/sendMail";

// API route handler for rent agreement emails
export async function POST(request) {
  try {
    const data = await request.json();

    // Validate required fields
    const requiredFields = [
      "renterName",
      "unitNumber",
      "propertyName",
      "startDate",
      "endDate",
      "totalContractPrice",
      "rentCollectionType",
      "renterEmail",
    ];
    for (const field of requiredFields) {
      if (!data[field]) {
        console.error(`Missing required field: ${field}`);
        return Response.json(
          { error: `Missing required field: ${field}` },
          { status: 400 },
        );
      }
    }

    // Create the email component
    const emailComponent = (
      <RentAgreementEmail
        renterName={data.renterName}
        unitNumber={data.unitNumber}
        propertyName={data.propertyName}
        startDate={data.startDate}
        endDate={data.endDate}
        totalPrice={data.totalContractPrice}
        rentCollectionType={data.rentCollectionType}
      />
    );

    // Render the email HTML and ensure it's resolved
    let emailHtml = render(emailComponent);
    // Make sure we await if it's a promise
    if (emailHtml instanceof Promise) {
      emailHtml = await emailHtml;
    }

    // Create a simple plain text version
    const plainText = `
            إشعار اتفاقية إيجار جديدة
            
            عزيزي/عزيزتي ${data.renterName}،
            
            نود إعلامكم بأنه تم إنشاء اتفاقية إيجار جديدة للوحدة رقم ${data.unitNumber} في ${data.propertyName}.
            
            تفاصيل الاتفاقية:
            • تاريخ البدء: ${data.startDate}
            • تاريخ الانتهاء: ${data.endDate}
            • إجمالي سعر العقد: ${data.totalContractPrice} درهم
            • نوع تحصيل الإيجار: كل ${data.rentCollectionType} أشهر
            
            نشكركم على ثقتكم بنا ونتطلع إلى خدمتكم بشكل مستمر.
        `;

    // Send the email with resolved content
    const result = await sendEmail(
      data.renterEmail,
      "تم إنشاء اتفاقية إيجار جديدة",
      emailHtml,
      plainText,
    );

    return Response.json({ success: true, messageId: result?.messageId });
  } catch (error) {
    console.error("Failed to send email:", error);
    return Response.json(
      { error: "Failed to send email", details: error.message },
      { status: 500 },
    );
  }
}
