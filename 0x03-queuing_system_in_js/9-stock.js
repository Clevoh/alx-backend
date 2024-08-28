import express from 'express';
import { createClient } from 'redis';
import { promisify } from 'util';

const app = express();
const client = createClient();
const HOST = '127.0.0.1';
const PORT = 1245;

// List of available products with their details
const listProducts = [
  { id: 1, name: 'Suitcase 250', price: 50, stock: 4 },
  { id: 2, name: 'Suitcase 450', price: 100, stock: 10 },
  { id: 3, name: 'Suitcase 650', price: 350, stock: 2 },
  { id: 4, name: 'Suitcase 1050', price: 550, stock: 5 },
];

/**
 * Finds a product by its ID from the list of products.
 * @param {number} id - The ID of the product to find.
 * @returns {object|undefined} - The product object if found, otherwise undefined.
 */
function getItemById(id) {
  return listProducts.find((product) => product.id === id);
}

// Error handling for Redis client connection issues
client.on('error', (error) => {
  console.error(`Redis client not connected to server: ${error.message}`);
});

/**
 * Saves the reserved stock for a product in Redis.
 * @param {number} itemId - The ID of the product.
 * @param {number} stock - The quantity of stock to reserve.
 */
function reserveStockById(itemId, stock) {
  client.set(`item.${itemId}`, stock);
}

/**
 * Retrieves the reserved stock for a product from Redis.
 * @param {number} itemId - The ID of the product.
 * @returns {Promise<number|null>} - The reserved stock of the product or null if not set.
 */
async function getCurrentReservedStockById(itemId) {
  const getAsync = promisify(client.get).bind(client);
  const value = await getAsync(`item.${itemId}`);
  return value;
}

// Express routes

// Route to get the list of all products
app.get('/list_products', (_req, res) => {
  res.json(listProducts.map((product) => ({
    itemId: product.id,
    itemName: product.name,
    price: product.price,
    initialAvailableQuantity: product.stock,
  })));
});

// Route to get a specific product by its ID
app.get('/list_products/:itemId', async (req, res) => {
  const { itemId } = req.params;
  const product = getItemById(Number(itemId));
  if (product === undefined) {
    res.status(404).json({ status: 'Product not found' });
  } else {
    const reservedStock = await getCurrentReservedStockById(product.id);
    res.json({
      itemId: product.id,
      itemName: product.name,
      price: product.price,
      initialAvailableQuantity: product.stock,
      currentQuantity: reservedStock === null ? product.stock : Number(reservedStock),
    });
  }
});

// Route to reserve a product by its ID
app.get('/reserve_product/:itemId', async (req, res) => {
  const { itemId } = req.params;
  const product = getItemById(Number(itemId));
  if (product === undefined) {
    res.status(404).json({ status: 'Product not found' });
    return;
  }
  let reservedStock = await getCurrentReservedStockById(product.id);
  reservedStock = reservedStock === null ? product.stock : Number(reservedStock);
  if (reservedStock <= 0) {
    res.json({ status: 'Not enough stock available', itemId: product.id });
  } else {
    reserveStockById(product.id, reservedStock - 1);
    res.json({ status: 'Reservation confirmed', itemId: product.id });
  }
});

// Start the Express server
app.listen(PORT, HOST, () => {
  console.log(`Server is running at http://${HOST}:${PORT}`);
});

