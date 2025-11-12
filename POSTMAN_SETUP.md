# Postman Collection Setup Guide

## Import Instructions

1. **Import Collection:**
   - Open Postman
   - Click "Import" button
   - Select `Food_Ordering_API.postman_collection.json`
   - Click "Import"

2. **Import Environment:**
   - Click "Import" again
   - Select `Food_Ordering_API.postman_environment.json`
   - Click "Import"
   - Select the environment from the dropdown (top right): "Food Ordering API - Local"

## Environment Variables Setup

Update these variables in the environment:

- `base_url`: Your API base URL (default: `http://localhost:3000`)
- `admin_secret_key`: Your `ADMIN_SECRET_KEY` from `.env` file
- `user_email`: Your test user email (default: `admin@example.com`)

**Note:** The following variables are automatically set by the collection:
- `auth_token`: Set automatically after login/register
- `user_id`: Set automatically after login/register
- `product_id`: Set automatically after creating a product
- `variant_id`: Set automatically after creating a product
- `cart_item_id`: Set automatically after adding to cart
- `order_id`: Set automatically after placing an order

## Quick Start Workflow

### 1. Register/Login
- Run **"Register User"** or **"Login"** request
- Token will be automatically saved to `auth_token` variable

### 2. Create Admin User (Optional)
- After registering, run **"Promote to Admin"** request
- Make sure `admin_secret_key` matches your `.env` `ADMIN_SECRET_KEY`

### 3. Create Products (Admin)
- Run **"Create Product"** request
- Product ID and variant ID will be automatically saved

### 4. Browse Products (Public)
- Run **"Get All Products"** or **"Get Product by ID"**
- No authentication required

### 5. Add to Cart
- Run **"Add to Cart"** request
- Use the `product_id` and `variant_id` from created products

### 6. Place Order
- Run **"Place Order"** request
- Order ID will be automatically saved

### 7. View Orders
- Run **"Get All Orders"** or **"Get Order by ID"**

## Collection Features

✅ **Automatic Token Management**
- Tokens are automatically saved after login/register
- All protected endpoints use the saved token

✅ **Auto-save IDs**
- Product IDs, variant IDs, cart item IDs, and order IDs are automatically saved
- You can reference them in subsequent requests

✅ **Pre-configured Authentication**
- All protected endpoints have Bearer token authentication pre-configured
- Uses the `auth_token` environment variable

✅ **Complete API Coverage**
- All endpoints from the Food Ordering API are included
- Organized by feature (Auth, Products, Cart, Orders, Admin)

## Testing Tips

1. **Start with Registration/Login:**
   - Always authenticate first to get a token

2. **For Admin Endpoints:**
   - Make sure you've promoted your user to admin
   - Use the same token from login

3. **For Cart Operations:**
   - Create products first (as admin)
   - Then add them to cart (as regular user)

4. **For Orders:**
   - Add items to cart first
   - Then place an order

## Troubleshooting

**401 Unauthorized:**
- Make sure you've run login/register first
- Check that `auth_token` is set in environment
- Token might be expired, login again

**403 Forbidden (Admin endpoints):**
- User is not an admin
- Run "Promote to Admin" request first
- Make sure `admin_secret_key` matches your `.env` file

**404 Not Found:**
- Check that IDs (product_id, variant_id, etc.) are set correctly
- Make sure the resource exists in the database

## Environment Variables Reference

| Variable | Description | Auto-set? |
|----------|-------------|-----------|
| `base_url` | API base URL | No |
| `auth_token` | JWT token for authentication | Yes |
| `user_id` | Current user ID | Yes |
| `user_email` | User email for login | No |
| `admin_secret_key` | Admin secret from .env | No |
| `product_id` | Last created product ID | Yes |
| `variant_id` | Last created variant ID | Yes |
| `cart_item_id` | Last added cart item ID | Yes |
| `order_id` | Last placed order ID | Yes |
| `order_orderId` | Last placed order orderId | Yes |

