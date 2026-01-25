package com.financetracker.config;

import com.financetracker.entity.*;
import com.financetracker.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;
    private final BudgetRepository budgetRepository;
    private final RecurringTransactionRepository recurringTransactionRepository;
    private final PasswordEncoder passwordEncoder;

    @org.springframework.beans.factory.annotation.Value("${admin.email:admin@financetracker.com}")
    private String adminEmail;

    @org.springframework.beans.factory.annotation.Value("${admin.password:}")
    private String adminPassword;

    @Override
    @Transactional
    public void run(String... args) {
        // Seed admin user first
        seedAdminUser();
        // Check if demo user already exists
        if (userRepository.findByEmail("demo@example.com").isPresent()) {
            log.info("Demo data already exists, skipping seeding");
            return;
        }

        log.info("Seeding demo data...");

        // Create demo user
        User demoUser = User.builder()
                .email("demo@example.com")
                .passwordHash(passwordEncoder.encode("demo123"))
                .fullName("Demo User")
                .defaultCurrency("VND")
                .build();
        demoUser = userRepository.save(demoUser);
        log.info("Created demo user: demo@example.com / demo123");

        // Create accounts
        Account cashAccount = Account.builder()
                .user(demoUser)
                .name("Tiền mặt")
                .type(AccountType.CASH)
                .currency("VND")
                .initialBalance(BigDecimal.valueOf(5000000))
                .currentBalance(BigDecimal.valueOf(5000000))
                .icon("💵")
                .color("#22c55e")
                .isActive(true)
                .build();
        cashAccount = accountRepository.save(cashAccount);

        Account bankAccount = Account.builder()
                .user(demoUser)
                .name("Vietcombank")
                .type(AccountType.BANK)
                .currency("VND")
                .initialBalance(BigDecimal.valueOf(20000000))
                .currentBalance(BigDecimal.valueOf(20000000))
                .icon("🏦")
                .color("#3b82f6")
                .isActive(true)
                .build();
        bankAccount = accountRepository.save(bankAccount);

        Account eWallet = Account.builder()
                .user(demoUser)
                .name("Momo")
                .type(AccountType.E_WALLET)
                .currency("VND")
                .initialBalance(BigDecimal.valueOf(2000000))
                .currentBalance(BigDecimal.valueOf(2000000))
                .icon("📱")
                .color("#a855f7")
                .isActive(true)
                .build();
        eWallet = accountRepository.save(eWallet);

        // Create categories
        Category salaryCategory = Category.builder()
                .user(demoUser)
                .name("Lương")
                .type(CategoryType.INCOME)
                .icon("💰")
                .color("#22c55e")
                .isSystem(false)
                .build();
        salaryCategory = categoryRepository.save(salaryCategory);

        Category bonusCategory = Category.builder()
                .user(demoUser)
                .name("Thưởng")
                .type(CategoryType.INCOME)
                .icon("🎁")
                .color("#10b981")
                .isSystem(false)
                .build();
        bonusCategory = categoryRepository.save(bonusCategory);

        Category foodCategory = Category.builder()
                .user(demoUser)
                .name("Ăn uống")
                .type(CategoryType.EXPENSE)
                .icon("🍜")
                .color("#f97316")
                .isSystem(false)
                .build();
        foodCategory = categoryRepository.save(foodCategory);

        Category transportCategory = Category.builder()
                .user(demoUser)
                .name("Di chuyển")
                .type(CategoryType.EXPENSE)
                .icon("🚗")
                .color("#eab308")
                .isSystem(false)
                .build();
        transportCategory = categoryRepository.save(transportCategory);

        Category shoppingCategory = Category.builder()
                .user(demoUser)
                .name("Mua sắm")
                .type(CategoryType.EXPENSE)
                .icon("🛒")
                .color("#ec4899")
                .isSystem(false)
                .build();
        shoppingCategory = categoryRepository.save(shoppingCategory);

        Category entertainmentCategory = Category.builder()
                .user(demoUser)
                .name("Giải trí")
                .type(CategoryType.EXPENSE)
                .icon("🎮")
                .color("#8b5cf6")
                .isSystem(false)
                .build();
        entertainmentCategory = categoryRepository.save(entertainmentCategory);

        Category billsCategory = Category.builder()
                .user(demoUser)
                .name("Hóa đơn")
                .type(CategoryType.EXPENSE)
                .icon("📄")
                .color("#ef4444")
                .isSystem(false)
                .build();
        billsCategory = categoryRepository.save(billsCategory);

        // Create transactions for the last 30 days
        LocalDate today = LocalDate.now();

        // Income - Salary at beginning of month
        LocalDate salaryDate = today.withDayOfMonth(1);
        createTransaction(demoUser, bankAccount, salaryCategory, TransactionType.INCOME,
                BigDecimal.valueOf(15000000), "VND", "Lương tháng " + today.getMonthValue(), salaryDate);

        // Various expenses throughout the month
        for (int i = 0; i < 30; i++) {
            LocalDate date = today.minusDays(i);

            // Food expenses (daily)
            if (i % 1 == 0) {
                BigDecimal amount = BigDecimal.valueOf(50000 + (int)(Math.random() * 100000));
                createTransaction(demoUser, cashAccount, foodCategory, TransactionType.EXPENSE,
                        amount, "VND", "Ăn trưa", date);
            }

            // Transport (every 2-3 days)
            if (i % 3 == 0) {
                BigDecimal amount = BigDecimal.valueOf(20000 + (int)(Math.random() * 50000));
                createTransaction(demoUser, eWallet, transportCategory, TransactionType.EXPENSE,
                        amount, "VND", "Grab/taxi", date);
            }

            // Shopping (weekly)
            if (i % 7 == 0) {
                BigDecimal amount = BigDecimal.valueOf(200000 + (int)(Math.random() * 300000));
                createTransaction(demoUser, bankAccount, shoppingCategory, TransactionType.EXPENSE,
                        amount, "VND", "Mua sắm cuối tuần", date);
            }

            // Entertainment (weekly)
            if (i % 7 == 3) {
                BigDecimal amount = BigDecimal.valueOf(100000 + (int)(Math.random() * 200000));
                createTransaction(demoUser, cashAccount, entertainmentCategory, TransactionType.EXPENSE,
                        amount, "VND", "Xem phim/cafe", date);
            }
        }

        // Bills (monthly)
        createTransaction(demoUser, bankAccount, billsCategory, TransactionType.EXPENSE,
                BigDecimal.valueOf(500000), "VND", "Tiền điện", today.minusDays(5));
        createTransaction(demoUser, bankAccount, billsCategory, TransactionType.EXPENSE,
                BigDecimal.valueOf(200000), "VND", "Tiền nước", today.minusDays(5));
        createTransaction(demoUser, bankAccount, billsCategory, TransactionType.EXPENSE,
                BigDecimal.valueOf(300000), "VND", "Internet", today.minusDays(10));

        // Create budgets
        Budget foodBudget = Budget.builder()
                .user(demoUser)
                .name("Ngân sách ăn uống")
                .category(foodCategory)
                .amount(BigDecimal.valueOf(3000000))
                .currency("VND")
                .period(BudgetPeriod.MONTHLY)
                .startDate(today.withDayOfMonth(1))
                .alertThreshold(80)
                .isActive(true)
                .build();
        budgetRepository.save(foodBudget);

        Budget transportBudget = Budget.builder()
                .user(demoUser)
                .name("Ngân sách di chuyển")
                .category(transportCategory)
                .amount(BigDecimal.valueOf(1000000))
                .currency("VND")
                .period(BudgetPeriod.MONTHLY)
                .startDate(today.withDayOfMonth(1))
                .alertThreshold(80)
                .isActive(true)
                .build();
        budgetRepository.save(transportBudget);

        Budget entertainmentBudget = Budget.builder()
                .user(demoUser)
                .name("Ngân sách giải trí")
                .category(entertainmentCategory)
                .amount(BigDecimal.valueOf(1500000))
                .currency("VND")
                .period(BudgetPeriod.MONTHLY)
                .startDate(today.withDayOfMonth(1))
                .alertThreshold(80)
                .isActive(true)
                .build();
        budgetRepository.save(entertainmentBudget);

        // Create recurring transactions for Vietnamese user
        // Monthly salary
        RecurringTransaction salaryCron = RecurringTransaction.builder()
                .user(demoUser)
                .account(bankAccount)
                .category(salaryCategory)
                .type(TransactionType.INCOME)
                .amount(BigDecimal.valueOf(15000000))
                .currency("VND")
                .description("Lương hàng tháng")
                .frequency(RecurrenceFrequency.MONTHLY)
                .intervalValue(1)
                .dayOfMonth(1)
                .startDate(today.withDayOfMonth(1))
                .nextExecutionDate(today.withDayOfMonth(1).plusMonths(1))
                .status(RecurringStatus.ACTIVE)
                .build();
        recurringTransactionRepository.save(salaryCron);

        // Monthly electricity bill
        RecurringTransaction electricBill = RecurringTransaction.builder()
                .user(demoUser)
                .account(bankAccount)
                .category(billsCategory)
                .type(TransactionType.EXPENSE)
                .amount(BigDecimal.valueOf(500000))
                .currency("VND")
                .description("Tiền điện hàng tháng")
                .frequency(RecurrenceFrequency.MONTHLY)
                .intervalValue(1)
                .dayOfMonth(5)
                .startDate(today.withDayOfMonth(5))
                .nextExecutionDate(today.getDayOfMonth() >= 5 ? today.withDayOfMonth(5).plusMonths(1) : today.withDayOfMonth(5))
                .status(RecurringStatus.ACTIVE)
                .build();
        recurringTransactionRepository.save(electricBill);

        // Monthly internet bill
        RecurringTransaction internetBill = RecurringTransaction.builder()
                .user(demoUser)
                .account(bankAccount)
                .category(billsCategory)
                .type(TransactionType.EXPENSE)
                .amount(BigDecimal.valueOf(300000))
                .currency("VND")
                .description("Tiền internet FPT")
                .frequency(RecurrenceFrequency.MONTHLY)
                .intervalValue(1)
                .dayOfMonth(10)
                .startDate(today.withDayOfMonth(10))
                .nextExecutionDate(today.getDayOfMonth() >= 10 ? today.withDayOfMonth(10).plusMonths(1) : today.withDayOfMonth(10))
                .status(RecurringStatus.ACTIVE)
                .build();
        recurringTransactionRepository.save(internetBill);

        // Weekly grocery shopping
        RecurringTransaction groceryCron = RecurringTransaction.builder()
                .user(demoUser)
                .account(cashAccount)
                .category(foodCategory)
                .type(TransactionType.EXPENSE)
                .amount(BigDecimal.valueOf(500000))
                .currency("VND")
                .description("Đi chợ cuối tuần")
                .frequency(RecurrenceFrequency.WEEKLY)
                .intervalValue(1)
                .dayOfWeek(7) // Saturday
                .startDate(today)
                .nextExecutionDate(today.plusDays((13 - today.getDayOfWeek().getValue()) % 7))
                .status(RecurringStatus.ACTIVE)
                .build();
        recurringTransactionRepository.save(groceryCron);

        // Daily transport (paused example)
        RecurringTransaction dailyTransport = RecurringTransaction.builder()
                .user(demoUser)
                .account(eWallet)
                .category(transportCategory)
                .type(TransactionType.EXPENSE)
                .amount(BigDecimal.valueOf(50000))
                .currency("VND")
                .description("Grab đi làm")
                .frequency(RecurrenceFrequency.DAILY)
                .intervalValue(1)
                .startDate(today)
                .nextExecutionDate(today.plusDays(1))
                .status(RecurringStatus.PAUSED)
                .build();
        recurringTransactionRepository.save(dailyTransport);

        log.info("Demo data seeding completed!");
        log.info("Demo account credentials: demo@example.com / demo123");

        // Create Japanese demo user with JPY
        seedJapaneseUser();
    }

    private void seedJapaneseUser() {
        if (userRepository.findByEmail("demo.jp@example.com").isPresent()) {
            return;
        }

        LocalDate today = LocalDate.now();

        // Create Japanese demo user
        User jpUser = User.builder()
                .email("demo.jp@example.com")
                .passwordHash(passwordEncoder.encode("demo123"))
                .fullName("田中太郎")
                .defaultCurrency("JPY")
                .build();
        jpUser = userRepository.save(jpUser);
        log.info("Created Japanese demo user: demo.jp@example.com / demo123");

        // Create JPY accounts
        Account jpCash = Account.builder()
                .user(jpUser)
                .name("現金")
                .type(AccountType.CASH)
                .currency("JPY")
                .initialBalance(BigDecimal.valueOf(50000))
                .currentBalance(BigDecimal.valueOf(50000))
                .icon("💴")
                .color("#22c55e")
                .isActive(true)
                .build();
        jpCash = accountRepository.save(jpCash);

        Account jpBank = Account.builder()
                .user(jpUser)
                .name("三菱UFJ銀行")
                .type(AccountType.BANK)
                .currency("JPY")
                .initialBalance(BigDecimal.valueOf(500000))
                .currentBalance(BigDecimal.valueOf(500000))
                .icon("🏦")
                .color("#3b82f6")
                .isActive(true)
                .build();
        jpBank = accountRepository.save(jpBank);

        Account paypay = Account.builder()
                .user(jpUser)
                .name("PayPay")
                .type(AccountType.E_WALLET)
                .currency("JPY")
                .initialBalance(BigDecimal.valueOf(30000))
                .currentBalance(BigDecimal.valueOf(30000))
                .icon("📱")
                .color("#ff0033")
                .isActive(true)
                .build();
        paypay = accountRepository.save(paypay);

        Account linePay = Account.builder()
                .user(jpUser)
                .name("LINE Pay")
                .type(AccountType.E_WALLET)
                .currency("JPY")
                .initialBalance(BigDecimal.valueOf(20000))
                .currentBalance(BigDecimal.valueOf(20000))
                .icon("💚")
                .color("#00b900")
                .isActive(true)
                .build();
        linePay = accountRepository.save(linePay);

        Account rakutenCard = Account.builder()
                .user(jpUser)
                .name("楽天カード")
                .type(AccountType.CREDIT_CARD)
                .currency("JPY")
                .initialBalance(BigDecimal.ZERO)
                .currentBalance(BigDecimal.ZERO)
                .icon("💳")
                .color("#bf0000")
                .isActive(true)
                .build();
        rakutenCard = accountRepository.save(rakutenCard);

        // Create Japanese categories
        Category jpSalary = Category.builder()
                .user(jpUser)
                .name("給料")
                .type(CategoryType.INCOME)
                .icon("💰")
                .color("#22c55e")
                .isSystem(false)
                .build();
        jpSalary = categoryRepository.save(jpSalary);

        Category jpFood = Category.builder()
                .user(jpUser)
                .name("食費")
                .type(CategoryType.EXPENSE)
                .icon("🍱")
                .color("#f97316")
                .isSystem(false)
                .build();
        jpFood = categoryRepository.save(jpFood);

        Category jpTransport = Category.builder()
                .user(jpUser)
                .name("交通費")
                .type(CategoryType.EXPENSE)
                .icon("🚃")
                .color("#eab308")
                .isSystem(false)
                .build();
        jpTransport = categoryRepository.save(jpTransport);

        Category jpShopping = Category.builder()
                .user(jpUser)
                .name("買い物")
                .type(CategoryType.EXPENSE)
                .icon("🛍️")
                .color("#ec4899")
                .isSystem(false)
                .build();
        jpShopping = categoryRepository.save(jpShopping);

        Category jpEntertainment = Category.builder()
                .user(jpUser)
                .name("娯楽")
                .type(CategoryType.EXPENSE)
                .icon("🎮")
                .color("#8b5cf6")
                .isSystem(false)
                .build();
        jpEntertainment = categoryRepository.save(jpEntertainment);

        Category jpBills = Category.builder()
                .user(jpUser)
                .name("光熱費")
                .type(CategoryType.EXPENSE)
                .icon("💡")
                .color("#ef4444")
                .isSystem(false)
                .build();
        jpBills = categoryRepository.save(jpBills);

        // Create transactions
        LocalDate salaryDate = today.withDayOfMonth(25);
        if (salaryDate.isAfter(today)) {
            salaryDate = salaryDate.minusMonths(1);
        }
        createTransaction(jpUser, jpBank, jpSalary, TransactionType.INCOME,
                BigDecimal.valueOf(280000), "JPY", "給料 " + today.getMonthValue() + "月", salaryDate);

        // Daily expenses
        for (int i = 0; i < 30; i++) {
            LocalDate date = today.minusDays(i);

            // Food (daily - konbini, restaurants)
            if (i % 1 == 0) {
                BigDecimal amount = BigDecimal.valueOf(500 + (int)(Math.random() * 1500));
                createTransaction(jpUser, paypay, jpFood, TransactionType.EXPENSE,
                        amount, "JPY", "コンビニ", date);
            }

            // Transport (Suica/train)
            if (i % 2 == 0) {
                BigDecimal amount = BigDecimal.valueOf(200 + (int)(Math.random() * 500));
                createTransaction(jpUser, linePay, jpTransport, TransactionType.EXPENSE,
                        amount, "JPY", "電車", date);
            }

            // Shopping (weekly)
            if (i % 7 == 0) {
                BigDecimal amount = BigDecimal.valueOf(3000 + (int)(Math.random() * 7000));
                createTransaction(jpUser, rakutenCard, jpShopping, TransactionType.EXPENSE,
                        amount, "JPY", "Amazon/楽天", date);
            }

            // Entertainment
            if (i % 7 == 5) {
                BigDecimal amount = BigDecimal.valueOf(1000 + (int)(Math.random() * 3000));
                createTransaction(jpUser, jpCash, jpEntertainment, TransactionType.EXPENSE,
                        amount, "JPY", "映画/カラオケ", date);
            }
        }

        // Monthly bills
        createTransaction(jpUser, jpBank, jpBills, TransactionType.EXPENSE,
                BigDecimal.valueOf(8000), "JPY", "電気代", today.minusDays(3));
        createTransaction(jpUser, jpBank, jpBills, TransactionType.EXPENSE,
                BigDecimal.valueOf(3000), "JPY", "水道代", today.minusDays(3));
        createTransaction(jpUser, jpBank, jpBills, TransactionType.EXPENSE,
                BigDecimal.valueOf(5000), "JPY", "インターネット", today.minusDays(7));

        // Create budgets
        Budget jpFoodBudget = Budget.builder()
                .user(jpUser)
                .name("食費予算")
                .category(jpFood)
                .amount(BigDecimal.valueOf(40000))
                .currency("JPY")
                .period(BudgetPeriod.MONTHLY)
                .startDate(today.withDayOfMonth(1))
                .alertThreshold(80)
                .isActive(true)
                .build();
        budgetRepository.save(jpFoodBudget);

        Budget jpTransportBudget = Budget.builder()
                .user(jpUser)
                .name("交通費予算")
                .category(jpTransport)
                .amount(BigDecimal.valueOf(15000))
                .currency("JPY")
                .period(BudgetPeriod.MONTHLY)
                .startDate(today.withDayOfMonth(1))
                .alertThreshold(80)
                .isActive(true)
                .build();
        budgetRepository.save(jpTransportBudget);

        Budget jpEntBudget = Budget.builder()
                .user(jpUser)
                .name("娯楽予算")
                .category(jpEntertainment)
                .amount(BigDecimal.valueOf(20000))
                .currency("JPY")
                .period(BudgetPeriod.MONTHLY)
                .startDate(today.withDayOfMonth(1))
                .alertThreshold(80)
                .isActive(true)
                .build();
        budgetRepository.save(jpEntBudget);

        // Create recurring transactions for Japanese user
        // Monthly salary (25th)
        RecurringTransaction jpSalaryCron = RecurringTransaction.builder()
                .user(jpUser)
                .account(jpBank)
                .category(jpSalary)
                .type(TransactionType.INCOME)
                .amount(BigDecimal.valueOf(280000))
                .currency("JPY")
                .description("給料")
                .frequency(RecurrenceFrequency.MONTHLY)
                .intervalValue(1)
                .dayOfMonth(25)
                .startDate(today.withDayOfMonth(25))
                .nextExecutionDate(today.getDayOfMonth() >= 25 ? today.withDayOfMonth(25).plusMonths(1) : today.withDayOfMonth(25))
                .status(RecurringStatus.ACTIVE)
                .build();
        recurringTransactionRepository.save(jpSalaryCron);

        // Monthly rent
        Category jpRent = Category.builder()
                .user(jpUser)
                .name("家賃")
                .type(CategoryType.EXPENSE)
                .icon("🏠")
                .color("#64748b")
                .isSystem(false)
                .build();
        jpRent = categoryRepository.save(jpRent);

        RecurringTransaction rentCron = RecurringTransaction.builder()
                .user(jpUser)
                .account(jpBank)
                .category(jpRent)
                .type(TransactionType.EXPENSE)
                .amount(BigDecimal.valueOf(70000))
                .currency("JPY")
                .description("家賃")
                .frequency(RecurrenceFrequency.MONTHLY)
                .intervalValue(1)
                .dayOfMonth(27)
                .startDate(today.withDayOfMonth(27))
                .nextExecutionDate(today.getDayOfMonth() >= 27 ? today.withDayOfMonth(27).plusMonths(1) : today.withDayOfMonth(27))
                .status(RecurringStatus.ACTIVE)
                .build();
        recurringTransactionRepository.save(rentCron);

        // Monthly phone bill
        Category jpPhone = Category.builder()
                .user(jpUser)
                .name("携帯代")
                .type(CategoryType.EXPENSE)
                .icon("📱")
                .color("#06b6d4")
                .isSystem(false)
                .build();
        jpPhone = categoryRepository.save(jpPhone);

        RecurringTransaction phoneBill = RecurringTransaction.builder()
                .user(jpUser)
                .account(jpBank)
                .category(jpPhone)
                .type(TransactionType.EXPENSE)
                .amount(BigDecimal.valueOf(3000))
                .currency("JPY")
                .description("携帯料金 (楽天モバイル)")
                .frequency(RecurrenceFrequency.MONTHLY)
                .intervalValue(1)
                .dayOfMonth(15)
                .startDate(today.withDayOfMonth(15))
                .nextExecutionDate(today.getDayOfMonth() >= 15 ? today.withDayOfMonth(15).plusMonths(1) : today.withDayOfMonth(15))
                .status(RecurringStatus.ACTIVE)
                .build();
        recurringTransactionRepository.save(phoneBill);

        // Monthly electricity
        RecurringTransaction jpElectric = RecurringTransaction.builder()
                .user(jpUser)
                .account(jpBank)
                .category(jpBills)
                .type(TransactionType.EXPENSE)
                .amount(BigDecimal.valueOf(8000))
                .currency("JPY")
                .description("電気代")
                .frequency(RecurrenceFrequency.MONTHLY)
                .intervalValue(1)
                .dayOfMonth(20)
                .startDate(today.withDayOfMonth(20))
                .nextExecutionDate(today.getDayOfMonth() >= 20 ? today.withDayOfMonth(20).plusMonths(1) : today.withDayOfMonth(20))
                .status(RecurringStatus.ACTIVE)
                .build();
        recurringTransactionRepository.save(jpElectric);

        // Weekly grocery
        RecurringTransaction jpGrocery = RecurringTransaction.builder()
                .user(jpUser)
                .account(paypay)
                .category(jpFood)
                .type(TransactionType.EXPENSE)
                .amount(BigDecimal.valueOf(5000))
                .currency("JPY")
                .description("スーパー買い物")
                .frequency(RecurrenceFrequency.WEEKLY)
                .intervalValue(1)
                .dayOfWeek(7) // Saturday
                .startDate(today)
                .nextExecutionDate(today.plusDays((13 - today.getDayOfWeek().getValue()) % 7))
                .status(RecurringStatus.ACTIVE)
                .build();
        recurringTransactionRepository.save(jpGrocery);

        // Netflix subscription
        Category jpSubscription = Category.builder()
                .user(jpUser)
                .name("サブスク")
                .type(CategoryType.EXPENSE)
                .icon("📺")
                .color("#e11d48")
                .isSystem(false)
                .build();
        jpSubscription = categoryRepository.save(jpSubscription);

        RecurringTransaction netflixCron = RecurringTransaction.builder()
                .user(jpUser)
                .account(rakutenCard)
                .category(jpSubscription)
                .type(TransactionType.EXPENSE)
                .amount(BigDecimal.valueOf(1490))
                .currency("JPY")
                .description("Netflix")
                .frequency(RecurrenceFrequency.MONTHLY)
                .intervalValue(1)
                .dayOfMonth(1)
                .startDate(today.withDayOfMonth(1))
                .nextExecutionDate(today.withDayOfMonth(1).plusMonths(1))
                .status(RecurringStatus.ACTIVE)
                .build();
        recurringTransactionRepository.save(netflixCron);

        // Spotify subscription
        RecurringTransaction spotifyCron = RecurringTransaction.builder()
                .user(jpUser)
                .account(rakutenCard)
                .category(jpSubscription)
                .type(TransactionType.EXPENSE)
                .amount(BigDecimal.valueOf(980))
                .currency("JPY")
                .description("Spotify Premium")
                .frequency(RecurrenceFrequency.MONTHLY)
                .intervalValue(1)
                .dayOfMonth(1)
                .startDate(today.withDayOfMonth(1))
                .nextExecutionDate(today.withDayOfMonth(1).plusMonths(1))
                .status(RecurringStatus.ACTIVE)
                .build();
        recurringTransactionRepository.save(spotifyCron);

        log.info("Japanese demo user seeding completed!");
        log.info("Japanese demo credentials: demo.jp@example.com / demo123");
    }

    private void seedAdminUser() {
        // Only seed admin if ADMIN_PASSWORD is set
        if (adminPassword == null || adminPassword.isBlank()) {
            log.info("ADMIN_PASSWORD not set, skipping admin user creation");
            return;
        }

        // Check if admin already exists
        if (userRepository.findByEmail(adminEmail).isPresent()) {
            log.info("Admin user {} already exists", adminEmail);
            return;
        }

        User admin = User.builder()
                .email(adminEmail)
                .passwordHash(passwordEncoder.encode(adminPassword))
                .fullName("Administrator")
                .defaultCurrency("VND")
                .role(Role.ADMIN)
                .enabled(true)
                .build();
        userRepository.save(admin);
        log.info("Created admin user: {}", adminEmail);
    }

    private void createTransaction(User user, Account account, Category category,
                                   TransactionType type, BigDecimal amount, String currency,
                                   String description, LocalDate date) {
        Transaction transaction = Transaction.builder()
                .user(user)
                .account(account)
                .category(category)
                .type(type)
                .amount(amount)
                .currency(currency)
                .description(description)
                .transactionDate(date)
                .build();
        transactionRepository.save(transaction);

        // Update account balance
        if (type == TransactionType.INCOME) {
            account.setCurrentBalance(account.getCurrentBalance().add(amount));
        } else if (type == TransactionType.EXPENSE) {
            account.setCurrentBalance(account.getCurrentBalance().subtract(amount));
        }
        accountRepository.save(account);
    }
}
