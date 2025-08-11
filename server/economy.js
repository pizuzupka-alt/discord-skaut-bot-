const Database = require('better-sqlite3');
const path = require('path');

class EconomyService {
    constructor() {
        this.db = new Database(path.join(process.cwd(), 'economy.db'));
        this.initDatabase();
    }

    initDatabase() {
        // Vytvoř všechny tabulky
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT,
                money TEXT DEFAULT '1000.00',
                bank TEXT DEFAULT '0.00',
                experience INTEGER DEFAULT 0,
                level INTEGER DEFAULT 1,
                job TEXT DEFAULT 'nezaměstnaný',
                last_daily TEXT,
                last_work TEXT,
                last_rob TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId TEXT,
                type TEXT,
                amount TEXT,
                description TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS inventory (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId TEXT,
                itemName TEXT,
                itemType TEXT,
                quantity INTEGER DEFAULT 1,
                value TEXT DEFAULT '0.00',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS investments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId TEXT,
                name TEXT,
                amount TEXT,
                type TEXT,
                buyPrice TEXT,
                currentPrice TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
        `);
    }

    // Získání nebo vytvoření uživatele
    async getOrCreateUser(discordId, username) {
        let user = this.db.prepare('SELECT * FROM users WHERE id = ?').get(discordId);
        
        if (!user) {
            this.db.prepare(`
                INSERT INTO users (id, username, money, bank, experience, level, job)
                VALUES (?, ?, '1000.00', '0.00', 0, 1, 'nezaměstnaný')
            `).run(discordId, username);
            
            user = this.db.prepare('SELECT * FROM users WHERE id = ?').get(discordId);
        }
        
        return user;
    }

    // Aktualizace peněz
    async updateUserMoney(userId, amount, type = 'add') {
        const user = await this.getOrCreateUser(userId, '');
        const currentMoney = parseFloat(user.money);
        const changeAmount = parseFloat(amount);
        
        const newAmount = type === 'add' ? currentMoney + changeAmount : currentMoney - changeAmount;
        
        this.db.prepare(`
            UPDATE users 
            SET money = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(newAmount.toFixed(2), userId);
    }

    // Přidání transakce
    async addTransaction(userId, type, amount, description) {
        this.db.prepare(`
            INSERT INTO transactions (userId, type, amount, description)
            VALUES (?, ?, ?, ?)
        `).run(userId, type, amount, description);
    }

    // Denní bonus
    async claimDaily(userId, username) {
        const user = await this.getOrCreateUser(userId, username);
        const now = new Date();
        
        if (user.last_daily) {
            const lastDaily = new Date(user.last_daily);
            const nextDaily = new Date(lastDaily);
            nextDaily.setHours(nextDaily.getHours() + 24);
            
            if (now < nextDaily) {
                return { 
                    success: false, 
                    error: 'Další denní bonus můžeš získat za',
                    nextDaily 
                };
            }
        }
        
        const dailyAmount = Math.floor(Math.random() * 500) + 200; // 200-699
        
        this.db.prepare(`
            UPDATE users 
            SET last_daily = ?, money = ?, experience = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(
            now.toISOString(),
            (parseFloat(user.money) + dailyAmount).toFixed(2),
            user.experience + 10,
            userId
        );
        
        await this.addTransaction(userId, 'daily', dailyAmount.toString(), 'Denní bonus');
        
        return { success: true, amount: dailyAmount };
    }

    // Práce
    async work(userId, username) {
        const user = await this.getOrCreateUser(userId, username);
        const now = new Date();
        
        if (user.last_work) {
            const lastWork = new Date(user.last_work);
            const nextWork = new Date(lastWork);
            nextWork.setHours(nextWork.getHours() + 1);
            
            if (now < nextWork) {
                return { 
                    success: false, 
                    error: 'Další práci můžeš vykonat za',
                    nextWork 
                };
            }
        }
        
        const baseAmount = user.job === 'nezaměstnaný' ? 50 : 100;
        const levelBonus = user.level * 10;
        const workAmount = Math.floor(Math.random() * (baseAmount + levelBonus)) + baseAmount;
        
        this.db.prepare(`
            UPDATE users 
            SET last_work = ?, money = ?, experience = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(
            now.toISOString(),
            (parseFloat(user.money) + workAmount).toFixed(2),
            user.experience + 5,
            userId
        );
        
        await this.addTransaction(userId, 'work', workAmount.toString(), `Práce jako ${user.job}`);
        
        return { success: true, amount: workAmount };
    }

    // Automaty
    async playSlots(userId, username, betAmount) {
        const user = await this.getOrCreateUser(userId, username);
        const userMoney = parseFloat(user.money);
        
        if (userMoney < betAmount) {
            return { success: false, won: false, error: 'Nemáš dostatek peněz!' };
        }
        
        if (betAmount < 10) {
            return { success: false, won: false, error: 'Minimální sázka je 10 peněz!' };
        }

        const symbols = ['🍎', '🍊', '🍋', '🍇', '🔔', '⭐', '💎'];
        const result = [
            symbols[Math.floor(Math.random() * symbols.length)],
            symbols[Math.floor(Math.random() * symbols.length)],
            symbols[Math.floor(Math.random() * symbols.length)]
        ];
        
        let winAmount = 0;
        let won = false;
        
        if (result[0] === result[1] && result[1] === result[2]) {
            if (result[0] === '💎') winAmount = betAmount * 10;
            else if (result[0] === '⭐') winAmount = betAmount * 7;
            else if (result[0] === '🔔') winAmount = betAmount * 5;
            else winAmount = betAmount * 3;
            won = true;
        } else if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) {
            winAmount = betAmount * 1.5;
            won = true;
        }
        
        const finalAmount = won ? (userMoney - betAmount + winAmount) : (userMoney - betAmount);
        
        this.db.prepare(`
            UPDATE users 
            SET money = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(finalAmount.toFixed(2), userId);
        
        const transactionAmount = won ? (winAmount - betAmount).toString() : (-betAmount).toString();
        await this.addTransaction(userId, 'gamble', transactionAmount, 'Automaty');
        
        return { 
            success: true, 
            won, 
            amount: won ? winAmount : 0, 
            symbols: result, 
            balance: finalAmount 
        };
    }

    // Vklad do banky
    async deposit(userId, username, amount) {
        const user = await this.getOrCreateUser(userId, username);
        const userMoney = parseFloat(user.money);
        
        if (userMoney < amount) {
            return { success: false, error: 'Nemáš dostatek peněz v hotovosti!' };
        }
        
        this.db.prepare(`
            UPDATE users 
            SET money = ?, bank = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(
            (userMoney - amount).toFixed(2),
            (parseFloat(user.bank) + amount).toFixed(2),
            userId
        );
        
        await this.addTransaction(userId, 'deposit', amount.toString(), 'Vklad do banky');
        
        return { success: true };
    }

    // Výběr z banky
    async withdraw(userId, username, amount) {
        const user = await this.getOrCreateUser(userId, username);
        const userBank = parseFloat(user.bank);
        
        if (userBank < amount) {
            return { success: false, error: 'Nemáš dostatek peněz v bance!' };
        }
        
        this.db.prepare(`
            UPDATE users 
            SET money = ?, bank = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(
            (parseFloat(user.money) + amount).toFixed(2),
            (userBank - amount).toFixed(2),
            userId
        );
        
        await this.addTransaction(userId, 'withdraw', amount.toString(), 'Výběr z banky');
        
        return { success: true };
    }

    // Žebříček
    async getLeaderboard(limit = 10) {
        return this.db.prepare(`
            SELECT * FROM users 
            ORDER BY (CAST(money AS REAL) + CAST(bank AS REAL)) DESC 
            LIMIT ?
        `).all(limit);
    }

    // Inventář
    async addInventoryItem(userId, itemName, itemType, value, quantity = 1) {
        const existingItem = this.db.prepare(`
            SELECT * FROM inventory 
            WHERE userId = ? AND itemName = ?
        `).get(userId, itemName);

        if (existingItem) {
            this.db.prepare(`
                UPDATE inventory 
                SET quantity = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(existingItem.quantity + quantity, existingItem.id);
        } else {
            this.db.prepare(`
                INSERT INTO inventory (userId, itemName, itemType, quantity, value)
                VALUES (?, ?, ?, ?, ?)
            `).run(userId, itemName, itemType, quantity, value.toString());
        }
    }

    async getInventory(userId) {
        return this.db.prepare(`
            SELECT * FROM inventory 
            WHERE userId = ? 
            ORDER BY CAST(value AS REAL) DESC
        `).all(userId);
    }

    async hasInventoryItem(userId, itemName) {
        const item = this.db.prepare(`
            SELECT * FROM inventory 
            WHERE userId = ? AND itemName = ?
        `).get(userId, itemName);
        
        return !!item;
    }

    // Aktualizace cooldownů
    async updateRobCooldown(userId, timestamp) {
        this.db.prepare(`
            UPDATE users 
            SET last_rob = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(timestamp.toISOString(), userId);
    }

    async updateUserJob(userId, jobName) {
        this.db.prepare(`
            UPDATE users 
            SET job = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(jobName, userId);
    }

    // Investice
    async createInvestment(userId, amount) {
        this.db.prepare(`
            INSERT INTO investments (userId, name, amount, type, buyPrice, currentPrice)
            VALUES (?, 'Portfolio Investment', ?, 'portfolio', ?, ?)
        `).run(userId, amount.toString(), amount.toString(), amount.toString());
    }

    async getUserInvestments(userId) {
        return this.db.prepare(`
            SELECT * FROM investments 
            WHERE userId = ? 
            ORDER BY created_at DESC
        `).all(userId);
    }

    async collectAllInvestments(userId) {
        this.db.prepare(`
            DELETE FROM investments 
            WHERE userId = ?
        `).run(userId);
    }
}

const economyService = new EconomyService();
module.exports = { economyService };
