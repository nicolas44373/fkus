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
  const testId = 56;
  const payload = {
    name: 'BASTON DE MUZZARELLA VFOOD EDIT TEST',
    price: '40000',
    unit: '5kg',
    category_id: '5',
    marca: 'VIDAL FOOD',
    in_stock: true
  };

  const updateData = {
    name: payload.name,
    price: payload.price !== '' ? payload.price : null,
    unit: payload.unit || null,
    category_id: Number(payload.category_id),
    marca: payload.marca || null,
    in_stock: payload.in_stock !== false
  };

  console.log('Sending updateData:', updateData);

  const { data, error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', testId)
    .select();

  if (error) {
    console.error('Update failed:');
    console.error(error);
  } else {
    console.log('Update succeeded:', data);
    
    // Revert
    console.log('Reverting to original values...');
    const revertData = {
      name: 'BASTON DE MUZZARELLA VFOOD',
      price: '40000',
      unit: '5kg',
      category_id: 5,
      marca: 'VIDAL FOOD',
      in_stock: true
    };
    const { error: revErr } = await supabase.from('products').update(revertData).eq('id', testId);
    if (revErr) {
      console.error('Revert failed:', revErr);
    } else {
      console.log('Reverted successfully.');
    }
  }
}

run();
