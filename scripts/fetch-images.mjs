// Downloads royalty-free photos as optimised WebP into public/images.
// Plain strings are Unsplash photo ids; { pexels: 'id' } entries come from Pexels.
// Property, interior, city and team photos are from Pakistan.
// Each image is saved at two widths (-sm / -lg) for responsive srcset.
import { mkdir, writeFile, access } from 'node:fs/promises';

const OUT = new URL('../public/images/', import.meta.url);
const IMAGES = {
  hero: { pexels: '18273285', md: 1600, lg: 2400 },
  villa9: { pexels: '35984674' },
  dusk2: { pexels: '27937606' },
  plans: '1503387762-592deb58ef4e',
  build: '1541888946425-d81bb19240f5',
  keys: '1560518883-ce09059eeffa',
  int8: '1600585154084-4e5fe7c39198',
  villa1: { pexels: '23947751' },
  villa2: '1686164748327-f659bf9cdba0',
  villa3: { pexels: '18559086' },
  villa4: { pexels: '16240077' },
  villa5: { pexels: '39909213' },
  villa6: '1727803391477-a13869aaa776',
  villa7: { pexels: '36871546' },
  villa8: { pexels: '15435426' },
  house1: '1715615990733-5e43c7dd5511',
  house2: '1602388753263-2540776be9f1',
  apt1: { pexels: '14297175' },
  apt2: { pexels: '18559073' },
  int1: { pexels: '18246434' },
  int2: { pexels: '27822512' },
  int3: { pexels: '27923187' },
  int4: { pexels: '27822509' },
  int5: { pexels: '18246428' },
  int6: '1507089947368-19c1da9775ae',
  city: { pexels: '12912453' },
  mountains: { pexels: '33302320' },
  dusk1: '1686164748261-33e13eef70b6',
  night1: '1686164748506-4311ba437c24',
  glass1: '1572099158036-8304be15d73f',
  int7: '1613545325278-f24b0cae1224',
  agent1: { pexels: '15200105' },
  agent2: { pexels: '33848342' },
  agent3: { pexels: '28243069' },
  agent4: { pexels: '36965908' },
  agent5: { pexels: '35152184' },
  agent6: { pexels: '35576577' },
};
const SIZES = { sm: 860, lg: 1600 };

await mkdir(OUT, { recursive: true });
const failed = [];
for (const [name, entry] of Object.entries(IMAGES)) {
  const { id, pexels, ...sizes } = typeof entry === 'string' ? { id: entry } : entry;
  const portrait = name.startsWith('agent');
  for (const [suffix, w] of Object.entries({ ...SIZES, ...sizes })) {
    const file = new URL(`${name}-${suffix}.webp`, OUT);
    try { await access(file); continue; } catch {}
    const width = portrait ? Math.round(w / 2) : w;
    const crop = portrait ? `&h=${Math.round(width * 1.2)}&fit=crop&crop=faces` : '';
    const url = pexels
      ? `https://images.pexels.com/photos/${pexels}/pexels-photo-${pexels}.jpeg?auto=compress&cs=tinysrgb&w=${width}${portrait ? `&h=${Math.round(width * 1.2)}&fit=crop` : ''}&q=72&fm=webp`
      : `https://images.unsplash.com/photo-${id}?w=${width}${crop}&q=72&fm=webp&auto=format`;
    const res = await fetch(url);
    if (!res.ok) { failed.push(`${name} (${res.status})`); break; }
    await writeFile(file, Buffer.from(await res.arrayBuffer()));
  }
}
console.log(failed.length ? `Failed: ${failed.join(', ')}` : 'All images downloaded');
