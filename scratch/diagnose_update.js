const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Disable SSL certificate validation for Node fetch in this proxy/VPN environment
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
  console.log('Fetching a product...');
  const { data: products, error: fetchError } = await supabase.from('products').select('*').limit(1);
  if (fetchError) {
    console.error('Error fetching product:', fetchError);
    return;
  }
  if (!products || products.length === 0) {
    console.log('No products found.');
    return;
  }

  const product = products[0];
  console.log('Found product:', product.id, product.name);
  console.log('Attempting to update the name of product ID:', product.id);

  const { error: updateError } = await supabase
    .from('products')
    .update({ name: product.name + ' (Temp)' })
    .eq('id', product.id);

  if (updateError) {
    console.error('Update failed with error:');
    console.error(JSON.stringify(updateError, null, 2));
  } else {
    console.log('Update succeeded! Reverting changes...');
    const { error: revertError } = await supabase
      .from('products')
      .update({ name: product.name })
      .eq('id', product.id);
    if (revertError) {
      console.error('Revert failed:', revertError);
    } else {
      console.log('Reverted successfully!');
    }
  }
}

run();
