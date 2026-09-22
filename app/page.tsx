"use client";

import { useEffect, useState } from "react";
import { Special_Elite } from "next/font/google";

const typewriterFont = Special_Elite({ weight: "400", subsets: ["latin"] });

export default function Home() {
  const fullText = "Hello World";
  const [text, setText] = useState("");

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      index++;
      setText(fullText.slice(0, index));
      if (index === fullText.length) clearInterval(interval);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <h1
            className={`${typewriterFont.className} text-6xl font-bold text-zinc-900 text-left`}
            style={{ width: `${fullText.length}ch` }}
        >
          {text}
        </h1>
      </div>
  );
}