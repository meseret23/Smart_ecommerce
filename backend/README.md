# SmartMarket Backend

REST API for the SmartMarket e-commerce platform, built with Node.js, Express, TypeScript, and PostgreSQL.

## Prerequisites

- Node.js and npm
- PostgreSQL
- A configured local database

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the backend directory:

   ```dotenv
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=your_local_password
   DB_NAME=smartmarket_db
   PORT=5000
   ```

   Replace the example password with your local PostgreSQL password. Never commit `.env` or real credentials.

3. Start the development server:

   ```bash
   npm run dev
   ```

## Available Scripts

| Command         | Purpose                                  |
| --------------- | ---------------------------------------- |
| `npm run dev`   | Run the development server               |
| `npm run build` | Compile TypeScript                       |
| `npm start`     | Run the compiled server                  |
| `npm test`      | Placeholder; automated tests are planned |

## Product Catalog Endpoints

Base URL: `http://localhost:5000`

| Method | Endpoint                               | Purpose               |
| ------ | -------------------------------------- | --------------------- |
| GET    | `/api/products`                        | List products         |
| GET    | `/api/products?search=phone`           | Search product names  |
| GET    | `/api/products?categoryId=1`           | Filter by category    |
| GET    | `/api/products?sortBy=price&order=asc` | Sort products         |
| GET    | `/api/products?page=1&limit=10`        | Paginate results      |
| GET    | `/api/products/name/Phone`             | Find products by name |
| GET    | `/api/products/1`                      | Find a product by ID  |

### Notes

- Invalid query parameters and invalid product IDs return HTTP 400.
- A product that does not exist returns HTTP 404.
- Unexpected server errors return HTTP 500.
- Listing responses include pagination metadata.
- The database must contain product records to test successful searches, sorting, and retrieval.

## Current Scope

The product catalog API is under development. Authentication, cart operations, checkout, seller features, and automated tests are planned for later development stages.
