"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var bcrypt = require("bcrypt");
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var adminPassword, vipLevels, _i, vipLevels_1, vip, sampleHotels, _a, sampleHotels_1, hotel, existing, systemUser, _b, _c, contents, _d, contents_1, content;
        var _e, _f;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    console.log('🌱 Seeding database...');
                    return [4 /*yield*/, bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123456', 12)];
                case 1:
                    adminPassword = _g.sent();
                    return [4 /*yield*/, prisma.admin.upsert({
                            where: { username: 'admin' },
                            update: {},
                            create: {
                                username: process.env.ADMIN_USERNAME || 'admin',
                                password: adminPassword,
                                characterName: 'Super administrator, no assignment required',
                                isEnabled: true,
                            },
                        })];
                case 2:
                    _g.sent();
                    console.log('✅ Default admin created: admin');
                    vipLevels = [
                        {
                            id: 1, name: 'VIP1', sortOrder: 1,
                            dailyOrderVolume: 30, taskWheel: 3,
                            amountLimit: 25, lowestProductPrice: 0, highestProductPrice: 0,
                            upgradeRewards: 0, pricePerGrade: 25,
                            minWithdrawal: 100, maxWithdrawal: 5000,
                            minRecharge: 20, maxRecharge: 1000000,
                            transactionFeeRate: 0, orderCommissionRate: 0.01,
                            gradeSalary: 10,
                        },
                        {
                            id: 2, name: 'VIP2', sortOrder: 2,
                            dailyOrderVolume: 40, taskWheel: 3,
                            amountLimit: 1500, lowestProductPrice: 0, highestProductPrice: 0,
                            upgradeRewards: 0, pricePerGrade: 1500,
                            minWithdrawal: 100, maxWithdrawal: 10000,
                            minRecharge: 100, maxRecharge: 1000000,
                            transactionFeeRate: 0, orderCommissionRate: 0.02,
                            gradeSalary: 0,
                        },
                        {
                            id: 3, name: 'VIP3', sortOrder: 3,
                            dailyOrderVolume: 50, taskWheel: 5,
                            amountLimit: 5000, lowestProductPrice: 0, highestProductPrice: 0,
                            upgradeRewards: 0, pricePerGrade: 5000,
                            minWithdrawal: 100, maxWithdrawal: 50000,
                            minRecharge: 500, maxRecharge: 1000000,
                            transactionFeeRate: 0, orderCommissionRate: 0.04,
                            gradeSalary: 0,
                        },
                        {
                            id: 4, name: 'VIP4', sortOrder: 4,
                            dailyOrderVolume: 60, taskWheel: 6,
                            amountLimit: 10000, lowestProductPrice: 0, highestProductPrice: 0,
                            upgradeRewards: 0, pricePerGrade: 10000,
                            minWithdrawal: 100, maxWithdrawal: 1000000,
                            minRecharge: 500, maxRecharge: 1000000,
                            transactionFeeRate: 0, orderCommissionRate: 0.05,
                            gradeSalary: 0,
                        },
                    ];
                    _i = 0, vipLevels_1 = vipLevels;
                    _g.label = 3;
                case 3:
                    if (!(_i < vipLevels_1.length)) return [3 /*break*/, 6];
                    vip = vipLevels_1[_i];
                    return [4 /*yield*/, prisma.vipLevel.upsert({
                            where: { id: vip.id },
                            update: vip,
                            create: vip,
                        })];
                case 4:
                    _g.sent();
                    _g.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6:
                    console.log('✅ VIP levels created: VIP1-VIP4');
                    // ─── Site Settings ────────────────────────────────────────────────────────
                    return [4 /*yield*/, prisma.siteSettings.upsert({
                            where: { id: 1 },
                            update: {},
                            create: {
                                id: 1,
                                appName: 'Hotel Booking',
                                defaultLanguage: 'en',
                                timezone: 'UTC',
                                openingTime: '09:00',
                                closingTime: '23:58:59',
                                withdrawalStartTime: '01:00',
                                withdrawalEndTime: '17:00',
                                registrationRewards: 0,
                                rebateMultiplier: 0,
                                level1CommissionRate: 0.30,
                                level2CommissionRate: 0,
                                level3CommissionRate: 0,
                                level4CommissionRate: 0,
                                level5CommissionRate: 0,
                            },
                        })];
                case 7:
                    // ─── Site Settings ────────────────────────────────────────────────────────
                    _g.sent();
                    console.log('✅ Site settings initialized');
                    // ─── Customer Service Links ───────────────────────────────────────────────
                    return [4 /*yield*/, prisma.customerServiceLink.upsert({
                            where: { id: 1 },
                            update: {},
                            create: { id: 1, name: 'Tawk', url: 'https://tawk.to', isActive: true },
                        })];
                case 8:
                    // ─── Customer Service Links ───────────────────────────────────────────────
                    _g.sent();
                    return [4 /*yield*/, prisma.customerServiceLink.upsert({
                            where: { id: 2 },
                            update: {},
                            create: { id: 2, name: 'Telegram', url: 'https://t.me/support', isActive: true },
                        })];
                case 9:
                    _g.sent();
                    console.log('✅ Customer service links created');
                    sampleHotels = [
                        { name: 'Wilderness Hotel Inari', price: 315, picture: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400' },
                        { name: 'Alean Family Doville', price: 882, picture: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400' },
                        { name: 'Trezzini Palace Hotel', price: 774, picture: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400' },
                        { name: 'Akka Knibekaize Hostel', price: 669, picture: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400' },
                        { name: 'Arctic TreeHouse Hotel', price: 8510, picture: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400' },
                        { name: 'Hotel Chalpan', price: 475, picture: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400' },
                        { name: 'Kakslauttanen Arctic Resort', price: 524, picture: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400' },
                        { name: 'Golden Triangle Hotel', price: 1635, picture: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400' },
                        { name: 'Grand Residenza Milano', price: 1240, picture: 'https://images.unsplash.com/photo-1521898284481-a5ec348cb555?w=400' },
                        { name: 'Citrus Hotel', price: 893, picture: 'https://images.unsplash.com/photo-1630660664869-c9d3cc676880?w=400' },
                    ];
                    _a = 0, sampleHotels_1 = sampleHotels;
                    _g.label = 10;
                case 10:
                    if (!(_a < sampleHotels_1.length)) return [3 /*break*/, 14];
                    hotel = sampleHotels_1[_a];
                    return [4 /*yield*/, prisma.hotel.findFirst({ where: { name: hotel.name } })];
                case 11:
                    existing = _g.sent();
                    if (!!existing) return [3 /*break*/, 13];
                    return [4 /*yield*/, prisma.hotel.create({ data: hotel })];
                case 12:
                    _g.sent();
                    _g.label = 13;
                case 13:
                    _a++;
                    return [3 /*break*/, 10];
                case 14:
                    console.log('✅ Sample hotels created');
                    return [4 /*yield*/, prisma.user.findFirst({ where: { invitationCode: 'SYSTEM' } })];
                case 15:
                    systemUser = _g.sent();
                    if (!!systemUser) return [3 /*break*/, 19];
                    _c = (_b = prisma.user).create;
                    _e = {};
                    _f = {
                        phone: 'system',
                        nickname: 'System'
                    };
                    return [4 /*yield*/, bcrypt.hash('system-no-login', 12)];
                case 16:
                    _f.password = _g.sent();
                    return [4 /*yield*/, bcrypt.hash('system-no-login', 12)];
                case 17: return [4 /*yield*/, _c.apply(_b, [(_e.data = (_f.withdrawPassword = _g.sent(),
                            _f.invitationCode = 'SYSTEM',
                            _f.vipLevelId = 1,
                            _f.status = 'DISABLED',
                            _f),
                            _e)])];
                case 18:
                    _g.sent();
                    _g.label = 19;
                case 19:
                    console.log('✅ System invitation code: SYSTEM');
                    contents = [
                        { key: 'register_message', language: 'en', content: 'Congratulations, you have successfully registered! Welcome to Hotel Booking.' },
                        { key: 'system_tips', language: 'en', content: 'If you do not get a response after a long time, please contact online customer service.' },
                        { key: 'faq', language: 'en', content: '<h3>Deposit</h3><p>Each deposit needs to be submitted to customer service for assistance.</p><h3>Withdraw funds</h3><p>Before withdrawing, bind your withdrawal address first.</p>' },
                        { key: 'nda', language: 'en', content: 'Platform members can use referral codes to invite others. Income is 30% of the commissions earned by downline participants.' },
                        { key: 'about_us', language: 'en', content: 'Hotel Booking is a hotel affiliate commission platform.' },
                    ];
                    _d = 0, contents_1 = contents;
                    _g.label = 20;
                case 20:
                    if (!(_d < contents_1.length)) return [3 /*break*/, 23];
                    content = contents_1[_d];
                    return [4 /*yield*/, prisma.multilingualContent.upsert({
                            where: { key_language: { key: content.key, language: content.language } },
                            update: {},
                            create: content,
                        })];
                case 21:
                    _g.sent();
                    _g.label = 22;
                case 22:
                    _d++;
                    return [3 /*break*/, 20];
                case 23:
                    console.log('✅ Default content created');
                    console.log('\n🎉 Database seeded successfully!');
                    console.log('─────────────────────────────────');
                    console.log('Admin login: admin / admin123456');
                    console.log('First user invitation code: SYSTEM');
                    console.log('─────────────────────────────────');
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(console.error)
    .finally(function () { return prisma.$disconnect(); });
