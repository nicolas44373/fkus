const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.substring(1, value.length - 1);
    else if (value.startsWith("'") && value.endsWith("'")) value = value.substring(1, value.length - 1);
    env[match[1]] = value;
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  console.log('Fetching all products...');
  const { data: products, error: fetchErr } = await supabase.from('products').select('*');
  if (fetchErr) {
    console.error('Fetch failed:', fetchErr);
    return;
  }

  console.log(`Found ${products.length} products. Testing updates...`);
  
  let successCount = 0;
  let failCount = 0;

  for (const p of products) {
    const updateData = {
      name: p.name,
      price: p.price !== null ? String(p.price) : null,
      unit: p.unit,
      category_id: p.category_id,
      marca: p.marca,
      in_stock: p.in_stock
    };

    const { error: updateErr } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', p.id);

    if (updateErr) {
      console.error(`FAILED updating product ID ${p.id} (${p.name}):`, updateErr);
      failCount++;
    } else {
      successCount++;
    }
  }

  console.log(`Test finished. Successes: ${successCount}, Failures: ${failCount}`);
}

run();
