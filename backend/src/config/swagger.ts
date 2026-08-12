export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Mini ERP + CRM Operations Portal API',
    version: '1.0.0',
    description: 'Complete production-grade REST API documentation for the Wholesale/Distribution ERP & CRM Operations Portal.',
  },
  servers: [
    {
      url: process.env.API_URL || 'http://localhost:5000',
      description: 'Primary API Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT bearer token in the format: Bearer <token>',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string', example: 'Validation failed' },
              details: { type: 'array', items: { type: 'object' } },
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'John Doe' },
          email: { type: 'string', format: 'email', example: 'admin@example.com' },
          role: { type: 'string', enum: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'], example: 'ADMIN' },
          isActive: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Customer: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          customerName: { type: 'string', example: 'Rajesh Sharma' },
          mobile: { type: 'string', example: '+919876543210' },
          email: { type: 'string', format: 'email', example: 'rajesh@sharmatraders.com' },
          businessName: { type: 'string', example: 'Sharma Traders Pvt Ltd' },
          gstNumber: { type: 'string', example: '27AAAAA0000A1Z5' },
          customerType: { type: 'string', enum: ['RETAIL', 'WHOLESALE', 'DISTRIBUTOR'], example: 'WHOLESALE' },
          address: { type: 'string', example: 'Plot 42, MIDC Industrial Area, Mumbai' },
          status: { type: 'string', enum: ['LEAD', 'ACTIVE', 'INACTIVE'], example: 'ACTIVE' },
          followUpDate: { type: 'string', format: 'date-time', nullable: true },
          notes: { type: 'string', example: 'Key wholesale distributor for Western region' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Product: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Industrial Copper Wire 2.5mm' },
          sku: { type: 'string', example: 'CW-25-100M' },
          category: { type: 'string', example: 'Electrical Cables' },
          unitPrice: { type: 'number', example: 1450.00 },
          currentStock: { type: 'integer', example: 150 },
          minimumStock: { type: 'integer', example: 20 },
          warehouseLocation: { type: 'string', example: 'Bay A, Rack 04' },
          imageUrl: { type: 'string', nullable: true, example: '/uploads/product-123.jpg' },
          isActive: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      ChallanItem: {
        type: 'object',
        properties: {
          productId: { type: 'string', format: 'uuid' },
          quantity: { type: 'integer', example: 5 },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  paths: {
    // ----------------------------------------------------
    // AUTHENTICATION & USERS
    // ----------------------------------------------------
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'User Login',
        description: 'Authenticate user with email and password to obtain JWT access token.',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'admin@example.com' },
                  password: { type: 'string', example: 'password123' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login successful, returns JWT token and user info' },
          401: { description: 'Invalid credentials or inactive account' },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get Current User Session',
        description: 'Fetch profile details of the currently authenticated user.',
        responses: {
          200: { description: 'Current user profile details' },
          401: { description: 'Token missing or expired' },
        },
      },
    },
    '/api/auth/users': {
      get: {
        tags: ['User Management (Admin)'],
        summary: 'List All Platform Users',
        description: 'Fetch list of all user accounts registered in the platform (Admin only).',
        responses: {
          200: { description: 'Array of user objects' },
          403: { description: 'Forbidden - Requires ADMIN role' },
        },
      },
      post: {
        tags: ['User Management (Admin)'],
        summary: 'Create New User Account',
        description: 'Register a new user account with role assignment (Admin only).',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password', 'role'],
                properties: {
                  name: { type: 'string', example: 'Warehouse Executive' },
                  email: { type: 'string', format: 'email', example: 'warehouse2@example.com' },
                  password: { type: 'string', example: 'password123' },
                  role: { type: 'string', enum: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'], example: 'WAREHOUSE' },
                  isActive: { type: 'boolean', default: true },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'User account created successfully' },
          409: { description: 'Email already registered' },
        },
      },
    },
    '/api/auth/users/{id}': {
      patch: {
        tags: ['User Management (Admin)'],
        summary: 'Update User Role or Active Status',
        description: 'Modify active status or role for a specific user (Admin only).',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  role: { type: 'string', enum: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'] },
                  isActive: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'User updated successfully' },
          404: { description: 'User not found' },
        },
      },
    },

    // ----------------------------------------------------
    // CUSTOMER CRM
    // ----------------------------------------------------
    '/api/customers': {
      get: {
        tags: ['Customer CRM'],
        summary: 'List Customers',
        description: 'Paginated customer directory with full-text search and status/type filtering.',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search name, email, mobile, or business' },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['LEAD', 'ACTIVE', 'INACTIVE'] } },
          { name: 'customerType', in: 'query', schema: { type: 'string', enum: ['RETAIL', 'WHOLESALE', 'DISTRIBUTOR'] } },
        ],
        responses: {
          200: { description: 'Paginated customer list' },
        },
      },
      post: {
        tags: ['Customer CRM'],
        summary: 'Create Customer',
        description: 'Register a new customer account (Admin & Sales only).',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['customerName', 'mobile', 'email', 'businessName', 'customerType', 'address'],
                properties: {
                  customerName: { type: 'string', example: 'Anil Kumar' },
                  mobile: { type: 'string', example: '+919988776655' },
                  email: { type: 'string', format: 'email', example: 'anil@kumarenterprises.com' },
                  businessName: { type: 'string', example: 'Kumar Enterprises' },
                  gstNumber: { type: 'string', example: '27ABCDE1234F1Z5' },
                  customerType: { type: 'string', enum: ['RETAIL', 'WHOLESALE', 'DISTRIBUTOR'], example: 'WHOLESALE' },
                  address: { type: 'string', example: '102 Commercial Complex, Pune' },
                  status: { type: 'string', enum: ['LEAD', 'ACTIVE', 'INACTIVE'], default: 'LEAD' },
                  followUpDate: { type: 'string', format: 'date-time' },
                  notes: { type: 'string', example: 'Met at trade show 2026' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Customer created successfully' },
        },
      },
    },
    '/api/customers/{id}': {
      get: {
        tags: ['Customer CRM'],
        summary: 'Get Customer Details',
        description: 'Fetch full profile details of a customer including follow-ups, challans, and invoices.',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Customer detail object' },
          404: { description: 'Customer not found' },
        },
      },
      patch: {
        tags: ['Customer CRM'],
        summary: 'Update Customer',
        description: 'Update profile details for an existing customer.',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  customerName: { type: 'string' },
                  mobile: { type: 'string' },
                  email: { type: 'string' },
                  businessName: { type: 'string' },
                  gstNumber: { type: 'string' },
                  customerType: { type: 'string', enum: ['RETAIL', 'WHOLESALE', 'DISTRIBUTOR'] },
                  address: { type: 'string' },
                  status: { type: 'string', enum: ['LEAD', 'ACTIVE', 'INACTIVE'] },
                  followUpDate: { type: 'string', format: 'date-time' },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Customer updated successfully' },
        },
      },
      delete: {
        tags: ['Customer CRM'],
        summary: 'Delete Customer Record',
        description: 'Permanently remove a customer record (Admin only).',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Customer deleted successfully' },
        },
      },
    },
    '/api/customers/{id}/follow-ups': {
      get: {
        tags: ['Customer CRM'],
        summary: 'Get Customer Follow-up Logs',
        description: 'Fetch timeline of all logged CRM follow-ups for a customer.',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Array of follow-up log objects' },
        },
      },
      post: {
        tags: ['Customer CRM'],
        summary: 'Add CRM Follow-up Note',
        description: 'Log a new conversation note and update next action date for a customer.',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['note', 'followUpDate'],
                properties: {
                  note: { type: 'string', example: 'Discussed Q3 pricing discount structure via phone' },
                  followUpDate: { type: 'string', format: 'date-time', example: '2026-08-20T10:00:00.000Z' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Follow-up logged successfully' },
        },
      },
    },

    // ----------------------------------------------------
    // PRODUCTS & INVENTORY
    // ----------------------------------------------------
    '/api/products': {
      get: {
        tags: ['Products & Inventory'],
        summary: 'List Products',
        description: 'Paginated product catalog with search, category, and stock health status filtering.',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'stockStatus', in: 'query', schema: { type: 'string', enum: ['HEALTHY', 'LOW_STOCK', 'OUT_OF_STOCK'] } },
        ],
        responses: {
          200: { description: 'Paginated product list' },
        },
      },
      post: {
        tags: ['Products & Inventory'],
        summary: 'Create Product',
        description: 'Add a new product with unique SKU, price, stock alert thresholds, and image (Admin & Warehouse).',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['name', 'sku', 'category', 'unitPrice', 'warehouseLocation'],
                properties: {
                  name: { type: 'string', example: 'LED Floodlight 100W' },
                  sku: { type: 'string', example: 'FL-100W-LED' },
                  category: { type: 'string', example: 'Lighting' },
                  unitPrice: { type: 'number', example: 2890.00 },
                  currentStock: { type: 'integer', default: 0 },
                  minimumStock: { type: 'integer', default: 10 },
                  warehouseLocation: { type: 'string', example: 'Rack C-02' },
                  image: { type: 'string', format: 'binary', description: 'Product image file (JPG, PNG, WEBP)' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Product created successfully' },
          409: { description: 'SKU already exists' },
        },
      },
    },
    '/api/products/stock-movements': {
      get: {
        tags: ['Products & Inventory'],
        summary: 'View Stock Movement Ledger',
        description: 'Paginated stock movements audit trail across all products (Admin & Warehouse).',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 15 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'movementType', in: 'query', schema: { type: 'string', enum: ['IN', 'OUT'] } },
          { name: 'productId', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Stock movement ledger entries' },
        },
      },
    },
    '/api/products/{id}': {
      get: {
        tags: ['Products & Inventory'],
        summary: 'Get Product Details',
        description: 'Fetch details for a single product by ID.',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Product object' },
          404: { description: 'Product not found' },
        },
      },
      patch: {
        tags: ['Products & Inventory'],
        summary: 'Update Product Details',
        description: 'Update product properties or image.',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  sku: { type: 'string' },
                  category: { type: 'string' },
                  unitPrice: { type: 'number' },
                  minimumStock: { type: 'integer' },
                  warehouseLocation: { type: 'string' },
                  image: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Product updated successfully' },
        },
      },
      delete: {
        tags: ['Products & Inventory'],
        summary: 'Deactivate Product',
        description: 'Soft-delete/deactivate a product (Admin only).',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Product deactivated successfully' },
        },
      },
    },
    '/api/products/{id}/stock': {
      post: {
        tags: ['Products & Inventory'],
        summary: 'Manual Stock Adjustment (IN/OUT)',
        description: 'Manually add (IN) or deduct (OUT) inventory stock with a timestamped reason note.',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['quantity', 'movementType', 'reason'],
                properties: {
                  quantity: { type: 'integer', example: 50 },
                  movementType: { type: 'string', enum: ['IN', 'OUT'], example: 'IN' },
                  reason: { type: 'string', example: 'Purchase order PO-2026-99 received from vendor' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Stock adjusted successfully and ledger entry recorded' },
          400: { description: 'Insufficient stock for OUT adjustment' },
        },
      },
    },

    // ----------------------------------------------------
    // SALES CHALLANS
    // ----------------------------------------------------
    '/api/challans': {
      get: {
        tags: ['Sales Challans'],
        summary: 'List Sales Challans',
        description: 'Paginated list of sales delivery challans.',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['DRAFT', 'CONFIRMED', 'CANCELLED'] } },
        ],
        responses: {
          200: { description: 'Paginated challans list' },
        },
      },
      post: {
        tags: ['Sales Challans'],
        summary: 'Create Sales Challan (Draft)',
        description: 'Create a new DRAFT delivery challan for a customer with product line items.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['customerId', 'items'],
                properties: {
                  customerId: { type: 'string', format: 'uuid' },
                  items: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/ChallanItem',
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Challan created in DRAFT status' },
        },
      },
    },
    '/api/challans/{id}': {
      get: {
        tags: ['Sales Challans'],
        summary: 'Get Challan Details',
        description: 'Fetch full challan details including customer info and line item price snapshots.',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Challan detail object' },
          404: { description: 'Challan not found' },
        },
      },
      patch: {
        tags: ['Sales Challans'],
        summary: 'Update Draft Challan',
        description: 'Modify items of a DRAFT challan before confirmation.',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  customerId: { type: 'string' },
                  items: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/ChallanItem' },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Draft challan updated' },
        },
      },
    },
    '/api/challans/{id}/confirm': {
      post: {
        tags: ['Sales Challans'],
        summary: 'Confirm Challan & Deduct Stock',
        description: 'Atomically deduct stock per line item inside a database transaction, mark status CONFIRMED, and generate Tax Invoice.',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Challan confirmed, stock deducted, invoice generated' },
          400: { description: 'Insufficient stock or already confirmed/cancelled' },
        },
      },
    },
    '/api/challans/{id}/cancel': {
      post: {
        tags: ['Sales Challans'],
        summary: 'Cancel Challan',
        description: 'Cancel a DRAFT or CONFIRMED delivery challan.',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Challan cancelled' },
        },
      },
    },
    '/api/challans/{id}/pdf': {
      get: {
        tags: ['Sales Challans'],
        summary: 'Download Sales Challan PDF',
        description: 'Generate and stream printable PDF document for a delivery challan. Accepts ?token=<jwt> for browser tab opening.',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'token', in: 'query', schema: { type: 'string' }, description: 'JWT token for direct browser tab PDF downloads' },
        ],
        responses: {
          200: { description: 'PDF binary stream', content: { 'application/pdf': {} } },
        },
      },
    },

    // ----------------------------------------------------
    // TAX INVOICES
    // ----------------------------------------------------
    '/api/invoices': {
      get: {
        tags: ['Tax Invoices'],
        summary: 'List Tax Invoices',
        description: 'Paginated list of generated GST tax invoices.',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: {
          200: { description: 'Paginated invoices list' },
        },
      },
    },
    '/api/invoices/{id}/pdf': {
      get: {
        tags: ['Tax Invoices'],
        summary: 'Download Tax Invoice PDF',
        description: 'Generate and stream printable PDF document for a GST Tax Invoice. Accepts ?token=<jwt> for browser tab opening.',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'token', in: 'query', schema: { type: 'string' }, description: 'JWT token for direct browser tab PDF downloads' },
        ],
        responses: {
          200: { description: 'PDF binary stream', content: { 'application/pdf': {} } },
        },
      },
    },

    // ----------------------------------------------------
    // DASHBOARD & ANALYTICS
    // ----------------------------------------------------
    '/api/dashboard/summary': {
      get: {
        tags: ['Dashboard & Analytics'],
        summary: 'Get Executive Dashboard Metrics',
        description: 'Fetch real-time business counters, customer pipeline breakdown, inventory stock alerts, and revenue metrics.',
        responses: {
          200: { description: 'Executive dashboard analytics object' },
        },
      },
    },
  },
};
