import { ImageResponse } from "next/og.js";
import { writeFile, mkdir } from "node:fs/promises";

const FOREST = "#0E6B4C";
const FOREST_STRONG = "#0B5A40";

function iconElement(size) {
  return {
    type: "div",
    props: {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(155deg, ${FOREST} 0%, ${FOREST_STRONG} 100%)`,
        borderRadius: size * 0.22,
      },
      children: {
        type: "div",
        props: {
          style: {
            color: "#EAF6EF",
            fontSize: size * 0.56,
            fontWeight: 800,
            fontFamily: "sans-serif",
          },
          children: "$",
        },
      },
    },
  };
}

async function generate(size, outPath) {
  const res = new ImageResponse(iconElement(size), { width: size, height: size });
  const buffer = Buffer.from(await res.arrayBuffer());
  await writeFile(outPath, buffer);
  console.log("wrote", outPath);
}

await mkdir("public/icons", { recursive: true });
await generate(192, "public/icons/icon-192.png");
await generate(512, "public/icons/icon-512.png");
await generate(180, "public/icons/apple-touch-icon.png");
