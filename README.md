# Food Ordering System - Backend API

A scalable backend system for a food ordering platform built with NestJS, PostgreSQL, and RabbitMQ.

## Features

- **User Management**: Registration and login with JWT authentication
- **OTP-based Login**: Passwordless login using email/phone with 5-minute OTP expiration
- **Product Catalog**: Products with variants (e.g., sizes, types)
- **Shopping Cart**: Add, update, remove items with variant support
- **Order Management**: Place orders with unique order IDs and status tracking
- **Admin Panel**: Product CRUD operations for administrators
- **Message Queue**: RabbitMQ integration for scalable order processing
- **API Documentation**: Swagger UI for API exploration
- **Rate Limiting**: Built-in request throttling
- **Request Validation**: Input validation using class-validator

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT, bcrypt
- **Message Queue**: RabbitMQ (amqplib)
- **API Documentation**: Swagger/OpenAPI
- **Validation**: class-validator, class-transformer
- **Rate Limiting**: @nestjs/throttler

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- RabbitMQ (optional, for production order processing)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd food-ordering-system
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=food_ordering_db
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
RABBITMQ_URL=amqp://localhost:5672
```

4. Create PostgreSQL database:
```bash
createdb food_ordering_db
```

5. Start RabbitMQ (optional):
```bash
# Using Docker
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management

# Or install locally and start the service
```

6. Run database migrations (TypeORM will auto-sync in development):
```bash
npm run start:dev
```

The application will automatically create tables on first run (when `NODE_ENV !== 'production'`).

## Running the Application

### Development
```bash
npm run start:dev
```

### Production
```bash
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000`
Swagger documentation: `http://localhost:3000/api/docs`

## API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login with email/phone + password
- `POST /auth/otp/request` - Request OTP for passwordless login
- `POST /auth/otp/verify` - Verify OTP and login

### Products (Public)
- `GET /products` - Get all active products
- `GET /products/:id` - Get product by ID

### Cart (Protected)
- `GET /cart` - Get user's cart
- `POST /cart/add` - Add item to cart
- `PATCH /cart/items/:itemId` - Update cart item quantity
- `DELETE /cart/items/:itemId` - Remove item from cart
- `DELETE /cart/clear` - Clear entire cart

### Orders (Protected)
- `POST /orders` - Place an order from cart
- `GET /orders` - Get all user orders
- `GET /orders/:id` - Get order by ID
- `PATCH /orders/:id/status` - Update order status

### Admin (Protected - Admin only)
- `POST /admin/products` - Create a new product
- `PATCH /admin/products/:id` - Update a product
- `DELETE /admin/products/:id` - Soft delete a product
- `DELETE /admin/products/:id/permanent` - Permanently delete a product

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Database Schema

### Users
- id (UUID)
- name, email, phoneNumber
- password (hashed)
- tokens (JSON array of JWT tokens)
- isAdmin (boolean)

### Products
- id (UUID)
- name, description, imageUrl, category
- isActive (boolean)
- variants (one-to-many)

### Product Variants
- id (UUID)
- productId
- name (e.g., "8pc", "16pc")
- price
- isAvailable (boolean)

### Cart
- id (UUID)
- userId
- totalAmount
- items (one-to-many)

### Cart Items
- id (UUID)
- cartId, productId, variantId
- quantity, price

### Orders
- id (UUID)
- orderId (unique string identifier)
- userId
- totalAmount
- paymentType (enum: cash, card, online)
- status (enum: pending, paid, processing, completed, cancelled)
- items (one-to-many)

### OTPs
- id (UUID)
- identifier (email or phone)
- otp (6-digit code)
- expiresAt (5 minutes from creation)
- isUsed (boolean)

## Scalability Design

### High Concurrency Support (5 Million Orders in Parallel)

The system is designed to handle high concurrency through several architectural decisions:

#### 1. **Message Queue Architecture**
- **RabbitMQ Integration**: Orders are published to a message queue immediately after creation
- **Asynchronous Processing**: Long-running tasks (email notifications, inventory updates, analytics) are handled by background workers
- **Queue Durability**: Messages are persisted to survive broker restarts
- **Worker Scaling**: Multiple worker instances can consume from the queue in parallel

#### 2. **Database Optimization**
- **Indexes**: Strategic indexes on frequently queried fields:
  - `users.email` (unique)
  - `users.phoneNumber` (unique)
  - `orders.userId, orders.createdAt` (composite)
  - `orders.status`
  - `orders.orderId` (unique)
  - `otps.identifier, otps.otp` (composite)
  - `otps.expiresAt`
- **Connection Pooling**: TypeORM manages connection pools efficiently
- **Query Optimization**: Eager loading for related entities where appropriate
- **Soft Deletes**: Products use soft deletes to maintain referential integrity

#### 3. **Caching Strategy** (Future Enhancement)
- **Redis Integration**: Can be added for:
  - Product catalog caching
  - User session caching
  - Rate limiting counters
  - Frequently accessed data

#### 4. **Horizontal Scaling**
- **Stateless API**: JWT tokens allow stateless authentication
- **Load Balancing**: Multiple API instances can run behind a load balancer
- **Database Replication**: Read replicas for read-heavy operations
- **Queue Workers**: Scale workers independently based on queue depth

#### 5. **Performance Optimizations**
- **Rate Limiting**: Prevents abuse and ensures fair resource usage
- **Request Validation**: Early validation reduces unnecessary processing
- **Efficient Queries**: Use of relations and eager loading strategically
- **Batch Operations**: Bulk inserts/updates where possible

#### 6. **Monitoring & Observability** (Recommended)
- **Logging**: Structured logging for debugging and monitoring
- **Metrics**: Track order processing times, queue depths, error rates
- **Alerting**: Set up alerts for queue backlogs, database connection issues

### Scaling Recommendations

1. **Database Scaling**:
   - Use read replicas for product catalog queries
   - Implement database sharding by user ID or order date
   - Use connection pooling with appropriate pool sizes

2. **Queue Scaling**:
   - Monitor queue depth and scale workers accordingly
   - Use multiple queues for different priority levels
   - Implement dead-letter queues for failed messages

3. **API Scaling**:
   - Deploy multiple API instances behind a load balancer
   - Use CDN for static assets
   - Implement API gateway for rate limiting and routing

4. **Caching**:
   - Cache product catalog (TTL: 5-10 minutes)
   - Cache user sessions
   - Use Redis for distributed rate limiting

5. **Background Jobs**:
   - Separate workers for different job types (emails, notifications, analytics)
   - Use job scheduling (e.g., Bull/BullMQ) for delayed tasks
   - Implement retry mechanisms with exponential backoff

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Project Structure

```
src/
├── auth/              # Authentication module
│   ├── entities/     # OTP entity
│   ├── guards/       # JWT and Admin guards
│   ├── strategies/   # Passport JWT strategy
│   ├── decorators/   # Public route decorator
│   └── dto/          # Auth DTOs
├── users/            # User management
│   └── entities/     # User entity
├── products/         # Product catalog
│   ├── entities/     # Product and ProductVariant entities
│   └── dto/          # Product DTOs
├── cart/             # Shopping cart
│   ├── entities/     # Cart and CartItem entities
│   └── dto/          # Cart DTOs
├── orders/           # Order management
│   ├── entities/     # Order and OrderItem entities
│   └── dto/          # Order DTOs
├── admin/            # Admin routes
├── queue/            # RabbitMQ service
├── config/           # Configuration files
└── main.ts           # Application entry point
```

## Environment Variables

See `.env.example` for all available configuration options.

## Security Considerations

- Passwords are hashed using bcrypt (10 rounds)
- JWT tokens expire after 7 days (configurable)
- OTPs expire after 5 minutes
- Rate limiting prevents brute force attacks
- Input validation prevents injection attacks
- CORS enabled for cross-origin requests

## License

ISC

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## Support

For issues and questions, please open an issue on the repository.

