-- Múltiples imágenes por producto
alter table products add column if not exists image_urls text[] default '{}';

-- Stock por cantidad
alter table products add column if not exists stock_quantity integer default 0;

-- Backfill: migrar la imagen única existente al nuevo array
update products
  set image_urls = array[image_url]
  where image_url is not null and (image_urls is null or array_length(image_urls, 1) is null);

-- Backfill: productos marcados in_stock=true sin cantidad definida pasan a tener 1 unidad
update products
  set stock_quantity = 1
  where in_stock is true and (stock_quantity is null or stock_quantity = 0);

-- Función atómica para descontar stock al confirmar un pedido (evita condiciones de carrera)
create or replace function decrement_stock(product_id bigint, qty integer)
returns integer
language sql
as $$
  update products
  set stock_quantity = greatest(stock_quantity - qty, 0)
  where id = product_id
  returning stock_quantity;
$$;
