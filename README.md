# Hotel Booking Platform — Backend

## Tech Stack
- **Framework:** NestJS
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Auth:** JWT (separate tokens for users and admins)
- **Docs:** Swagger/OpenAPI at `/api/docs`

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Setup environment
```bash
cp .env.example .env
# Edit .env with your database credentials
```

### 3. Run database
```bash
# With Docker:
docker-compose up postgres -d

# Or use existing PostgreSQL and set DATABASE_URL in .env
```

### 4. Run migrations and seed
```bash
npm run prisma:migrate
npm run prisma:seed
```

### 5. Start server
```bash
npm run start:dev
```

Server: http://localhost:3000  
Swagger: http://localhost:3000/api/docs

---

## Default Credentials

| Role  | Username | Password     |
|-------|----------|--------------|
| Admin | admin    | admin123456  |

First user invitation code: **SYSTEM**

---

## Complete API Reference

### USER AUTH
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | User login |

### USER ENDPOINTS (Bearer token required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/user/profile | Get profile + stats |
| PUT | /api/user/change-password | Change login password |
| PUT | /api/user/change-security-pin | Change security PIN |
| GET | /api/user/withdrawal-accounts | Get saved withdrawal accounts |
| POST | /api/user/withdrawal-accounts | Add withdrawal account |
| GET | /api/user/settings | Get site settings |
| GET | /api/user/content?lang=en | Get multilingual content |
| GET | /api/user/vip-levels | Get VIP levels info |

### ORDERS
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/orders/start | Start booking task (get hotel) |
| POST | /api/orders/submit | Submit/confirm booking |
| GET | /api/orders/history | Order history (filter: all/pending/completed) |
| GET | /api/orders/today-profit | Today's profit |

### DEPOSITS
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/deposits | Create deposit request |
| GET | /api/deposits | Get deposit history |
| GET | /api/deposits/quick-amounts | Get quick select amounts |

### WITHDRAWALS
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/withdrawals | Create withdrawal request |
| GET | /api/withdrawals | Get withdrawal history |

### WALLET
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/wallet/transactions | Wallet transaction history |

### HOTELS
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/hotels/popular | Popular hotels for home |
| GET | /api/hotels/scrolling | App scrolling items |

---

### ADMIN AUTH
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/auth/captcha | Get captcha SVG |
| POST | /api/admin/auth/login | Admin login |

### ADMIN DASHBOARD
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/dashboard/stats | Full dashboard statistics |

### ADMIN MEMBERS
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/members | List members with filters |
| POST | /api/admin/members/add | Add member manually |
| PUT | /api/admin/members/:id/edit | Edit member info |
| POST | /api/admin/members/:id/balance-adjustment | Add/deduct balance |
| GET | /api/admin/members/:id/order-slots | Get task timeline |
| POST | /api/admin/members/:id/order-slots/pin | Pin hotel to slot |
| POST | /api/admin/members/:id/order-slots/unpin | Set slot to random |
| POST | /api/admin/members/:id/block-orders | Kill switch |
| POST | /api/admin/members/:id/reset-orders | Reset daily counter |
| POST | /api/admin/members/:id/commission-settings | Override commission |
| POST | /api/admin/members/:id/password-change | Change passwords |
| POST | /api/admin/members/:id/ban | Ban account |
| POST | /api/admin/members/:id/enable | Enable account |
| POST | /api/admin/members/:id/toggle-transactions | Toggle transactions |
| POST | /api/admin/members/:id/set-test | Set as test user |
| POST | /api/admin/members/:id/set-proxy | Set as proxy/agent |
| GET | /api/admin/members/:id/team | View downline team |
| POST | /api/admin/members/:id/issue-salary | Issue salary |

### ADMIN FINANCIAL
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/financial/withdrawals | Withdrawal orders |
| POST | /api/admin/financial/withdrawals/:id/approve | Approve withdrawal |
| POST | /api/admin/financial/withdrawals/:id/reject | Reject withdrawal |
| GET | /api/admin/financial/deposits | Recharge orders |
| POST | /api/admin/financial/deposits/:id/approve | Approve deposit |
| POST | /api/admin/financial/deposits/:id/reject | Reject deposit |
| GET | /api/admin/financial/wallet-details | Wallet details |
| GET | /api/admin/financial/points-records | Points records |

### ADMIN ORDERS
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/orders | All orders with filters |

### ADMIN VIP
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/vip | Get all VIP levels |
| POST | /api/admin/vip | Create VIP level |
| PUT | /api/admin/vip/:id | Update VIP level |
| DELETE | /api/admin/vip/:id | Delete VIP level |

### ADMIN HOTELS
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/hotels | List hotels |
| POST | /api/admin/hotels | Add hotel |
| PUT | /api/admin/hotels/:id | Edit hotel |
| DELETE | /api/admin/hotels/:id | Delete hotel |
| POST | /api/admin/hotels/:id/toggle | Enable/disable hotel |

### ADMIN SETTINGS
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/settings/basic | Get basic settings |
| PUT | /api/admin/settings/basic | Update basic settings |
| GET | /api/admin/settings/customer-service | Get support links |
| POST | /api/admin/settings/customer-service | Add support link |
| PUT | /api/admin/settings/customer-service/:id | Update link |
| DELETE | /api/admin/settings/customer-service/:id | Delete link |
| GET | /api/admin/settings/merchant-banks | Merchant bank accounts |
| POST | /api/admin/settings/merchant-banks | Add merchant bank |
| PUT | /api/admin/settings/merchant-banks/:id | Update bank |

### ADMIN CONTENT
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/content?language=en | Get content by language |
| PUT | /api/admin/content | Update content |
| GET | /api/admin/content/agreements | Registration agreements |
| PUT | /api/admin/content/agreements | Update agreement |
| GET | /api/admin/content/app-scrolling | App scrolling items |
| POST | /api/admin/content/app-scrolling | Add item |
| PUT | /api/admin/content/app-scrolling/:id | Update item |
| DELETE | /api/admin/content/app-scrolling/:id | Delete item |

### ADMIN ADMINISTRATORS
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/administrators | List admins |
| POST | /api/admin/administrators | Create admin |
| PUT | /api/admin/administrators/:id | Update admin |
| POST | /api/admin/administrators/:id/toggle | Enable/disable |
| GET | /api/admin/administrators/roles | List roles |
| POST | /api/admin/administrators/roles | Create role |
| PUT | /api/admin/administrators/roles/:id | Update role permissions |

---

## Deploy to Server

```bash
# 1. Upload code to server
scp -r backend/ user@your-server:/app/hotel-booking/

# 2. On server
cd /app/hotel-booking
cp .env.example .env
# Edit .env with production values

# 3. Run with Docker
docker-compose up -d

# 4. Run migrations
docker exec hotel_booking_api npx prisma migrate deploy
docker exec hotel_booking_api npx ts-node prisma/seed.ts
```

---

## Key Business Logic

1. **Order Flow:** User hits Start → system finds hotel (random or pinned) → user sees modal → user submits → balance deducted → returned + commission immediately → referrer gets 30% of commission
2. **VIP Upgrade:** Automatic on deposit approval based on `pricePerGrade` threshold
3. **Daily Reset:** Orders reset at midnight automatically
4. **Kill Switch:** Admin can block all orders for any user instantly
5. **Pin Orders:** Admin can manually assign specific hotels to specific order slots per user (including trap orders with negative multiplier)
