// Downloads royalty-free Unsplash photos as optimised WebP into public/images.
// Each image is saved at two widths (-sm / -lg) for responsive srcset.
import { mkdir, writeFile, access } from 'node:fs/promises';

const OUT = new URL('../public/images/', import.meta.url);
const IMAGES = {
  hero: { id: '1599809275671-b5942cabc7a2', md: 1600, lg: 2400 },
  villa9: '1600596542815-ffad4c1539a9',
  dusk2: '1600585153490-76fb20a32601',
  plans: '1503387762-592deb58ef4e',
  build: '1541888946425-d81bb19240f5',
  keys: '1560518883-ce09059eeffa',
  int8: '1600585154084-4e5fe7c39198',
  villa1: '1613490493576-7fde63acd811',
  villa2: '1600585154340-be6161a56a0c',
  villa3: '1512917774080-9991f1c4c750',
  villa4: '1564013799919-ab600027ffc6',
  villa5: '1580587771525-78b9dba3b914',
  villa6: '1605276374104-dee2a0ed3cd6',
  villa7: '1613977257363-707ba9348227',
  villa8: '1600047509807-ba8f99d2cdde',
  house1: '1568605114967-8130f3a36994',
  house2: '1570129477492-45c003edd2be',
  apt1: '1502672260266-1c1ef2d93688',
  apt2: '1522708323590-d24dbb6b0267',
  int1: '1600607687939-ce8a6c25118c',
  int2: '1600566753190-17f0baa2a6c3',
  int3: '1600210492486-724fe5c67fb0',
  int4: '1493809842364-78817add7ffb',
  int5: '1560448204-e02f11c3d0e2',
  int6: '1507089947368-19c1da9775ae',
  city: '1477959858617-67f85cf4f1df',
  mountains: '1506905925346-21bda4d32df4',
  dusk1: '1600585154526-990dced4db0d',
  night1: '1416331108676-a22ccb276e35',
  glass1: '1582268611958-ebfd161ef9cf',
  int7: '1613545325278-f24b0cae1224',
  agent1: '1507003211169-0a1dd7228f2d',
  agent2: '1494790108377-be9c29b29330',
  agent3: '1500648767791-00dcc994a43e',
  agent4: '1438761681033-6461ffad8d80',
  agent5: '1472099645785-5658abf4ff4e',
  agent6: '1544005313-94ddf0286df2',
};
const SIZES = { sm: 860, lg: 1600 };

await mkdir(OUT, { recursive: true });
const failed = [];
for (const [name, entry] of Object.entries(IMAGES)) {
  const { id, ...sizes } = typeof entry === 'string' ? { id: entry } : entry;
  const portrait = name.startsWith('agent');
  for (const [suffix, w] of Object.entries({ ...SIZES, ...sizes })) {
    const file = new URL(`${name}-${suffix}.webp`, OUT);
    try { await access(file); continue; } catch {}
    const width = portrait ? Math.round(w / 2) : w;
    const crop = portrait ? `&h=${Math.round(width * 1.2)}&fit=crop&crop=faces` : '';
    const url = `https://images.unsplash.com/photo-${id}?w=${width}${crop}&q=72&fm=webp&auto=format`;
    const res = await fetch(url);
    if (!res.ok) { failed.push(`${name} (${res.status})`); break; }
    await writeFile(file, Buffer.from(await res.arrayBuffer()));
  }
}
console.log(failed.length ? `Failed: ${failed.join(', ')}` : 'All images downloaded');
