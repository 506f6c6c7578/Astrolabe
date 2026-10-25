import sharp from "sharp";

const icoHeaderSize = 22;

function toPng(svg: string): Promise<Buffer> {
    return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}

export async function renderPng(svg: string): Promise<Response> {
    return new Response(new Uint8Array(await toPng(svg)),
        { headers: { "Content-Type": "image/png" } });
}

export async function renderIco(svg: string, size: number): Promise<Response> {
    const png = await toPng(svg);
    const header = Buffer.alloc(icoHeaderSize);
    header.writeUInt16LE(1, 2);
    header.writeUInt16LE(1, 4);
    header.writeUInt8(size, 6);
    header.writeUInt8(size, 7);
    header.writeUInt16LE(1, 10);
    header.writeUInt16LE(32, 12);
    header.writeUInt32LE(png.length, 14);
    header.writeUInt32LE(icoHeaderSize, 18);

    return new Response(new Uint8Array(Buffer.concat([header, png])),
        { headers: { "Content-Type": "image/x-icon" } });
}
