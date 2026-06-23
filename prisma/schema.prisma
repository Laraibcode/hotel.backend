generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── ADMIN ───────────────────────────────────────────────────────────────────

model Admin {
  id              Int       @id @default(autoincrement())
  username        String    @unique
  password        String
  characterName   String?
  frontendUserId  Int?
  remark          String?
  isEnabled       Boolean   @default(true)
  lastLoginAt     DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  role            AdminRole? @relation(fields: [roleId], references: [id])
  roleId          Int?

  balanceAdjustments BalanceAdjustment[]
  depositReviews     Deposit[]           @relation("ReviewedBy")
  withdrawalReviews  Withdrawal[]        @relation("ReviewedBy")
}

model AdminRole {
  id          Int      @id @default(autoincrement())
  name        String   @unique
  permissions Json     // { siteSettings: {...}, productManagement: {...}, ... }
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  admins Admin[]
}

// ─── USERS ───────────────────────────────────────────────────────────────────

model User {
  id              Int       @id @default(autoincrement())
  phone           String    @unique
  nickname        String?
  password        String
  withdrawPassword String
  invitationCode  String    @unique
  creditScore     Int       @default(100)
  userType        UserType  @default(REGULAR)
  status          UserStatus @default(ENABLED)
  transactionStatus Boolean @default(true)
  isTestUser      Boolean   @default(false)
  isProxy         Boolean   @default(false)

  vipLevel        VipLevel  @relation(fields: [vipLevelId], references: [id])
  vipLevelId      Int       @default(1)

  referrer        User?     @relation("Referrals", fields: [referrerId], references: [id])
  referrerId      Int?
  referrals       User[]    @relation("Referrals")

  // Wallet
  balance         Decimal   @default(0) @db.Decimal(18, 2)
  frozenBalance   Decimal   @default(0) @db.Decimal(18, 2)
  totalDeposits   Decimal   @default(0) @db.Decimal(18, 2)
  totalWithdrawals Decimal  @default(0) @db.Decimal(18, 2)
  totalCommissions Decimal  @default(0) @db.Decimal(18, 2)

  // Daily orders
  dailyOrderCount Int       @default(0)
  lastOrderResetAt DateTime @default(now())
  ordersBlocked   Boolean   @default(false)

  lastLoginAt     DateTime?
  lastLoginIp     String?
  registeredAt    DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  orders              Order[]
  deposits            Deposit[]
  withdrawals         Withdrawal[]
  withdrawalAccounts  WithdrawalAccount[]
  walletTransactions  WalletTransaction[]
  balanceAdjustments  BalanceAdjustment[]
  orderSlots          UserOrderSlot[]
  pointsRecords       PointsRecord[]
  bankCards           UserBankCard[]
}

enum UserType {
  REGULAR
  TEST
  PROXY
}

enum UserStatus {
  ENABLED
  DISABLED
  BANNED
}

// ─── VIP LEVELS ──────────────────────────────────────────────────────────────

model VipLevel {
  id                    Int     @id @default(autoincrement())
  name                  String  @unique
  picture               String?
  dailyOrderVolume      Int
  taskWheel             Int     @default(3)
  amountLimit           Decimal @db.Decimal(18, 2) // min balance to place orders
  lowestProductPrice    Decimal @default(0) @db.Decimal(18, 2)
  highestProductPrice   Decimal @default(0) @db.Decimal(18, 2)
  upgradeRewards        Decimal @default(0) @db.Decimal(18, 2)
  pricePerGrade         Decimal @db.Decimal(18, 2) // membership purchase amount
  minWithdrawal         Decimal @db.Decimal(18, 2)
  maxWithdrawal         Decimal @db.Decimal(18, 2)
  minRecharge           Decimal @db.Decimal(18, 2)
  maxRecharge           Decimal @db.Decimal(18, 2)
  transactionFeeRate    Decimal @default(0) @db.Decimal(5, 4)
  orderCommissionRate   Decimal @db.Decimal(5, 4) // e.g. 0.01 = 1%
  gradeSalary           Decimal @default(0) @db.Decimal(18, 2)
  sortOrder             Int     @default(0)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  users User[]
}

// ─── HOTELS (PRODUCTS) ───────────────────────────────────────────────────────

model Hotel {
  id          Int      @id @default(autoincrement())
  name        String
  picture     String?
  price       Decimal  @db.Decimal(18, 2)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  orders      Order[]
  pinnedSlots UserOrderSlot[]
}

model AppScrollItem {
  id        Int      @id @default(autoincrement())
  name      String
  picture   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// ─── USER ORDER SLOTS (Task Timeline) ────────────────────────────────────────

model UserOrderSlot {
  id          Int      @id @default(autoincrement())
  user        User     @relation(fields: [userId], references: [id])
  userId      Int
  slotNumber  Int      // 1-60
  isRandom    Boolean  @default(true)
  hotel       Hotel?   @relation(fields: [hotelId], references: [id])
  hotelId     Int?
  multiplier  Decimal  @default(1) @db.Decimal(5, 2) // negative = trap
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([userId, slotNumber])
}

// ─── ORDERS ──────────────────────────────────────────────────────────────────

model Order {
  id              String   @id @default(cuid())
  orderNumber     String   @unique
  user            User     @relation(fields: [userId], references: [id])
  userId          Int
  hotel           Hotel    @relation(fields: [hotelId], references: [id])
  hotelId         Int
  slotNumber      Int
  unitPrice       Decimal  @db.Decimal(18, 2)
  transactionVolume Int    @default(1)
  transactionAmount Decimal @db.Decimal(18, 2)
  commission      Decimal  @db.Decimal(18, 2)
  commissionRate  Decimal  @db.Decimal(5, 4)
  status          OrderStatus @default(WAITING)
  settledAt       DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum OrderStatus {
  WAITING
  COMPLETE
  FAILED
}

// ─── DEPOSITS (RECHARGE) ─────────────────────────────────────────────────────

model Deposit {
  id              Int           @id @default(autoincrement())
  user            User          @relation(fields: [userId], references: [id])
  userId          Int
  amount          Decimal       @db.Decimal(18, 2)
  bankInfo        Json?         // bank name, account number, holder name
  paymentVoucher  String?
  status          DepositStatus @default(PENDING)
  reviewInfo      String?
  reviewedBy      Admin?        @relation("ReviewedBy", fields: [reviewedById], references: [id])
  reviewedById    Int?
  processedAt     DateTime?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}

enum DepositStatus {
  PENDING
  APPROVED
  REJECTED
}

// ─── WITHDRAWALS ─────────────────────────────────────────────────────────────

model Withdrawal {
  id              Int              @id @default(autoincrement())
  user            User             @relation(fields: [userId], references: [id])
  userId          Int
  amount          Decimal          @db.Decimal(18, 2)
  handlingFee     Decimal          @default(0) @db.Decimal(18, 2)
  method          WithdrawalMethod
  bankInfo        Json             // bank/crypto details
  securityPin     String           // hashed, verified before saving
  status          WithdrawalStatus @default(PENDING)
  reviewInfo      String?
  reviewedBy      Admin?           @relation("ReviewedBy", fields: [reviewedById], references: [id])
  reviewedById    Int?
  processedAt     DateTime?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
}

enum WithdrawalMethod {
  BANK_CARD
  USDT
  WISE
  REVOLUT
}

enum WithdrawalStatus {
  PENDING
  APPROVED
  REJECTED
}

// ─── WITHDRAWAL ACCOUNTS ─────────────────────────────────────────────────────

model WithdrawalAccount {
  id          Int              @id @default(autoincrement())
  user        User             @relation(fields: [userId], references: [id])
  userId      Int
  method      WithdrawalMethod
  details     Json             // method-specific fields
  isDefault   Boolean          @default(false)
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
}

// ─── USER BANK CARDS (for display in admin) ──────────────────────────────────

model UserBankCard {
  id          Int      @id @default(autoincrement())
  user        User     @relation(fields: [userId], references: [id])
  userId      Int
  bankName    String
  cardNumber  String
  accountName String
  phoneNumber String?
  branch      String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// ─── WALLET TRANSACTIONS ─────────────────────────────────────────────────────

model WalletTransaction {
  id              Int                   @id @default(autoincrement())
  user            User                  @relation(fields: [userId], references: [id])
  userId          Int
  type            WalletTransactionType
  state           String                // income / expenditure
  balanceBefore   Decimal               @db.Decimal(18, 2)
  balanceAfter    Decimal               @db.Decimal(18, 2)
  amount          Decimal               @db.Decimal(18, 2)
  description     String?
  referenceId     String?               // orderId, depositId, etc.
  createdAt       DateTime              @default(now())
}

enum WalletTransactionType {
  TRADE
  RETURN_PRINCIPAL
  TRANSACTION_COMMISSION
  CURRENT_BALANCE
  COMMISSION
  DEPOSIT
  WITHDRAWAL
  BALANCE_ADJUSTMENT
  SALARY
  REFERRAL_COMMISSION
}

// ─── BALANCE ADJUSTMENTS ─────────────────────────────────────────────────────

model BalanceAdjustment {
  id          Int      @id @default(autoincrement())
  user        User     @relation(fields: [userId], references: [id])
  userId      Int
  admin       Admin    @relation(fields: [adminId], references: [id])
  adminId     Int
  type        String   // ADD / DEDUCT
  amount      Decimal  @db.Decimal(18, 2)
  reason      String?
  createdAt   DateTime @default(now())
}

// ─── POINTS RECORDS ──────────────────────────────────────────────────────────

model PointsRecord {
  id              Int      @id @default(autoincrement())
  user            User     @relation(fields: [userId], references: [id])
  userId          Int
  upperLevelUser  String?
  operator        String?
  balanceBefore   Decimal  @db.Decimal(18, 2)
  balanceAfter    Decimal  @db.Decimal(18, 2)
  state           String   // Rank up, etc.
  amount          Decimal  @db.Decimal(18, 2)
  createdAt       DateTime @default(now())
}

// ─── SITE SETTINGS ───────────────────────────────────────────────────────────

model SiteSettings {
  id                    Int      @id @default(1)
  appName               String   @default("Hotel Booking")
  defaultLanguage       String   @default("en")
  timezone              String   @default("UTC")
  logo                  String?
  openingTime           String   @default("09:00")
  closingTime           String   @default("23:58:59")
  withdrawalStartTime   String   @default("01:00")
  withdrawalEndTime     String   @default("17:00")
  registrationRewards   Decimal  @default(0) @db.Decimal(18, 2)
  rebateMultiplier      Decimal  @default(0) @db.Decimal(5, 2)
  level1CommissionRate  Decimal  @default(0.30) @db.Decimal(5, 4)
  level2CommissionRate  Decimal  @default(0) @db.Decimal(5, 4)
  level3CommissionRate  Decimal  @default(0) @db.Decimal(5, 4)
  level4CommissionRate  Decimal  @default(0) @db.Decimal(5, 4)
  level5CommissionRate  Decimal  @default(0) @db.Decimal(5, 4)
  updatedAt             DateTime @updatedAt
}

// ─── CUSTOMER SERVICE LINKS ──────────────────────────────────────────────────

model CustomerServiceLink {
  id        Int      @id @default(autoincrement())
  name      String
  url       String
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// ─── BANK CARD TYPES ─────────────────────────────────────────────────────────

model BankCardType {
  id          Int      @id @default(autoincrement())
  nameVn      String?
  nameEn      String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// ─── MERCHANT BANK ACCOUNTS ──────────────────────────────────────────────────

model MerchantBankAccount {
  id          Int      @id @default(autoincrement())
  bankName    String
  username    String
  cardNumber  String
  isEnabled   Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// ─── MULTILINGUAL CONTENT ────────────────────────────────────────────────────

model MultilingualContent {
  id            Int      @id @default(autoincrement())
  key           String   // homepage_banner, register_message, faq, about_us, vip_rules, nda, system_tips
  language      String   // en, ur, ar, es, pt, de, ru, uk, fr
  content       String   @db.Text
  contentType   String   @default("text") // text, html, image
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([key, language])
}

// ─── REGISTRATION AGREEMENT (PROTOCOL) ───────────────────────────────────────

model RegistrationAgreement {
  id        Int      @id @default(autoincrement())
  language  String   @unique
  content   String   @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
