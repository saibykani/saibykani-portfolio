import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, email, subject, message } = data;

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // TODO: Add your Email provider integration here (e.g., Resend, SendGrid, NodeMailer)
    // Example (Resend):
    // await resend.emails.send({ from: '...', to: '...', subject, text: message });

    // TODO: Add your SMS provider integration here (e.g., Twilio)
    // Example (Twilio):
    // await twilioClient.messages.create({ body: `New Contact: ${name}`, from: '...', to: '...' });

    console.log("Mock Contact Submission:", { name, email, subject, message });

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
