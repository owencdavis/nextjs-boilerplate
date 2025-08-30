import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message } = (await req.json()) as {
      message: string;
      history?: { role: string; text: string }[];
    };

    // Very lightweight “style engine” placeholder:
    const tipBank = [
      "Try a column silhouette: high-waist, straight-leg trousers + tucked silk tank + cropped jacket.",
      "Use texture as color: ribbed knit, silk satin, and brushed wool can add depth without busy prints.",
      "Balance proportions: voluminous top → slimmer bottom; relaxed pant → fitted top.",
      "Pick a hero piece (jacket/shoe/bag) and keep everything else quiet for an elevated look.",
      "Monochrome base + one contrasting accessory feels modern and photo-ready.",
    ];
    const pick = tipBank[Math.floor(Math.random() * tipBank.length)];

    const reply =
      `You said: “${message}”. ${pick} ` +
      `If you share your preferred palette (Monochrome, Jewel Tones, Earthy Neutrals, etc.), I’ll tailor this further.`;

    return NextResponse.json({ reply });
  } catch (e) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
