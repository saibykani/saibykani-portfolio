import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, email, subject, message } = data;

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    console.log("Contact form submission received:", { name, email, subject, message });
    
    const errors: string[] = [];

    // 1. Send Email Notification using Nodemailer
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    const toEmail = process.env.MY_EMAIL_ADDRESS; // Your email address to receive notifications

    if (emailUser && emailPass && toEmail) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail', // or your preferred email provider
          auth: {
            user: emailUser,
            pass: emailPass,
          },
        });

        await transporter.sendMail({
          from: `Portfolio Contact Form <${emailUser}>`,
          to: toEmail,
          subject: `Portfolio Alert: Message from ${name}`,
          text: `You have received a new message from your portfolio website.\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
        });
        console.log("Email alert sent successfully.");
      } catch (emailErr) {
        console.error("Failed to send Email alert:", emailErr);
        errors.push("Email Delivery Failed");
      }
    } else {
      console.warn("Email environment variables not configured. Email notification skipped.");
    }

    // 2. Twilio SMS & WhatsApp Integrations
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_PHONE_NUMBER;
    const toPhone = process.env.MY_PHONE_NUMBER;
    const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886"; // Twilio Sandbox Number

    if (accountSid && authToken && fromPhone && toPhone) {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
      const messageBody = `Portfolio Alert: Message from ${name} (${email}): ${message}`;

      // 2A. Send SMS
      try {
        const smsBody = new URLSearchParams();
        smsBody.append("To", toPhone);
        smsBody.append("From", fromPhone);
        smsBody.append("Body", messageBody);

        const smsRes = await fetch(url, {
          method: "POST",
          headers: {
            "Authorization": `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: smsBody.toString()
        });

        if (!smsRes.ok) {
          const errText = await smsRes.text();
          console.error("Twilio SMS dispatch failed:", errText);
          errors.push("SMS Delivery Failed");
        } else {
          console.log("Twilio SMS alert sent successfully.");
        }
      } catch (smsErr) {
        console.error("Failed to send Twilio SMS:", smsErr);
        errors.push("SMS Dispatch Error");
      }

      // 2B. Send WhatsApp
      try {
        const waBody = new URLSearchParams();
        waBody.append("To", `whatsapp:${toPhone.replace("whatsapp:", "")}`);
        waBody.append("From", twilioWhatsAppNumber);
        waBody.append("Body", messageBody);

        const waRes = await fetch(url, {
          method: "POST",
          headers: {
            "Authorization": `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: waBody.toString()
        });

        if (!waRes.ok) {
          const errText = await waRes.text();
          console.error("Twilio WhatsApp dispatch failed:", errText);
          errors.push("WhatsApp Delivery Failed");
        } else {
          console.log("Twilio WhatsApp alert sent successfully.");
        }
      } catch (waErr) {
        console.error("Failed to send Twilio WhatsApp:", waErr);
        errors.push("WhatsApp Dispatch Error");
      }
    } else {
      console.warn("Twilio environment variables not configured. SMS & WhatsApp notifications skipped.");
    }

    if (errors.length > 0) {
      // We can still return 200 since the API logic ran, but log warnings.
      console.warn("Some notifications failed:", errors);
    }

    return NextResponse.json({ success: true, alertsAttempted: true }, { status: 200 });
  } catch (error) {
    console.error("Contact API handler error:", error);
    return NextResponse.json(
      { error: "Failed to process contact message" },
      { status: 500 }
    );
  }
}
