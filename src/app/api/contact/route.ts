import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, email, subject, message } = data;

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    console.log("Contact form submission received:", { name, email, subject, message });

    // Twilio SMS integration via HTTP REST API (no npm package install needed!)
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_PHONE_NUMBER;
    const toPhone = process.env.MY_PHONE_NUMBER;

    if (accountSid && authToken && fromPhone && toPhone) {
      try {
        const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
        const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
        
        const body = new URLSearchParams();
        body.append("To", toPhone);
        body.append("From", fromPhone);
        body.append("Body", `Portfolio Alert: Message from ${name} (${email}): ${message}`);

        const smsRes = await fetch(url, {
          method: "POST",
          headers: {
            "Authorization": `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: body.toString()
        });

        if (!smsRes.ok) {
          const errText = await smsRes.text();
          console.error("Twilio SMS dispatch failed:", errText);
        } else {
          console.log("Twilio SMS alert sent successfully.");
        }
      } catch (smsErr) {
        console.error("Failed to send Twilio SMS:", smsErr);
      }
    } else {
      console.warn("Twilio SMS environment variables not configured. SMS notification skipped.");
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Contact API handler error:", error);
    return NextResponse.json(
      { error: "Failed to submit contact message" },
      { status: 500 }
    );
  }
}
