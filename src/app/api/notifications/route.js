// File: /app/api/cron/notifications/route.js
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { sendWhatsAppMessage } from "@/lib/twilio";
import { sendEmail } from "../utlis/sendMail";

const prisma = new PrismaClient();

export async function GET(request) {
  // Check for cron secret key to secure the endpoint
  const authHeader = request.headers.get("authorization");

  if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  const twoWeeksFromNow = new Date(new Date().setDate(today.getDate() + 14));
  const twoMonthsFromNow = new Date(new Date().setMonth(today.getMonth() + 2));

  try {
    // Fetch payments due in 2 weeks
    const duePayments = await prisma.payment.findMany({
      where: {
        dueDate: {
          lte: twoWeeksFromNow,
          gte: today,
        },
        status: "PENDING",
      },
      include: {
        client: true,
        property: true,
      },
    });

    // Fetch contracts expiring in 2 months
    const expiringContracts = await prisma.rentAgreement.findMany({
      where: {
        endDate: {
          lte: twoMonthsFromNow,
          gte: today,
        },
        status: "ACTIVE",
      },
      include: {
        renter: true,
        unit: {
          include: {
            property: true,
          },
        },
      },
    });

    // Send WhatsApp messages and emails for due payments
    for (const payment of duePayments) {
      const message = `${payment.client.name}, دفعتك بالدرهم الإماراتي ${payment.amount} للممتلكات ${payment.property.name} ومن المقرر على ${payment.dueDate}.`;

      await sendWhatsAppMessage(payment.client.phone, message);

      // Using the updated Nodemailer sendEmail function
      await sendEmail(
        payment.client.email,
        "تذكير باستحقاق الدفع", // Subject: "Payment Due Reminder" in Arabic
        `<p dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.5;">${message}</p>`,
        message, // Plain text fallback
      );
    }

    // Send WhatsApp messages and emails for expiring contracts
    for (const contract of expiringContracts) {
      const templateVariables = {
        1: contract.renter.name, // اسم المستأجر
        2: contract.unit.number, // رقم الوحدة
        3: contract.unit.property.name, // اسم العقار
        4: contract.endDate, // تاريخ انتهاء العقد
      };

      // Send the WhatsApp message using the template
      await sendWhatsAppMessage(
        contract.renter.phone,
        templateVariables,
        true,
        "payment_reminder",
      );

      // Using the updated Nodemailer sendEmail function
      await sendEmail(
        contract.renter.email,
        "تذكير بانتهاء العقد", // Subject: "Contract Expiration Reminder" in Arabic
        `<p dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.5;">${message}</p>`,
        message, // Plain text fallback
      );
    }

    return NextResponse.json({
      success: true,
      paymentCount: duePayments.length,
      contractCount: expiringContracts.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in notification endpoint:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error.message,
      },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
