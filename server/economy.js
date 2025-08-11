const { db } = require('./db');
const { users, transactions, inventory, investments, jobs } = require('../shared/schema');
const { eq, desc, sql } = require('drizzle-orm');

class EconomyService {
  // Získání nebo vytvoření uživatele
  async getOrCreateUser(discordId, username) {
    let [user] = await db.select().from(users).where(eq(users.id, discordId));
    
    if (!user) {
      const insertUser = {
        id: discordId,
        username: username,
        money: '1000.00',
        bank: '0.00',
        experience: 0,
        level: 1,
        job: 'nezaměstnaný',
      };
      
      [user] = await db.insert(users).values(insertUser).returning();
    }
    
    return user;
  }

  // Aktualizace peněz uživatele
  async updateUserMoney(userId, amount, type = 'add') {
    const user = await this.getOrCreateUser(userId, '');
    const currentMoney = parseFloat(user.money);
    const changeAmount = parseFloat(amount);
    
    const newAmount = type === 'add' ? currentMoney + changeAmount : currentMoney - changeAmount;
    
    await db.update(users)
      .set({ 
        money: newAmount.toFixed(2),
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  // Přidání transakce do historie
  async addTransaction(userId, type, amount, description) {
    const transaction = {
      userId,
      type,
      amount,
      description,
    };
    
    await db.insert(transactions).values(transaction);
  }

  // Denní bonus
  async claimDaily(userId, username) {
    const user = await this.getOrCreateUser(userId, username);
    const now = new Date();
    
    if (user.lastDaily) {
      const nextDaily = new Date(user.lastDaily);
      nextDaily.setHours(nextDaily.getHours() + 24);
      
      if (now < nextDaily) {
        return { 
          success: false, 
          error: 'Další denní bonus můžeš získat za',
          nextDaily 
        };
      }
    }
    
    const dailyAmount = Math.floor(Math.random() * 500) + 200; // 200-699 peněz
    
    await db.update(users)
      .set({ 
        lastDaily: now,
        money: (parseFloat(user.money) + dailyAmount).toFixed(2),
        experience: user.experience + 10,
        updatedAt: now
      })
      .where(eq(users.id, userId));
      
    await this.addTransaction(userId, 'daily', dailyAmount.toString(), 'Denní bonus');
    
    return { success: true, amount: dailyAmount };
  }

  // Práce
  async work(userId, username) {
    const user = await this.getOrCreateUser(userId, username);
    const now = new Date();
    
    if (user.lastWork) {
      const nextWork = new Date(user.lastWork);
      nextWork.setHours(nextWork.getHours() + 1);
      
      if (now < nextWork) {
        return { 
          success: false, 
          error: 'Další práci můžeš vykonat za',
          nextWork 
        };
      }
    }
    
    // Výdělek závisí na povolání a levelu
    const baseAmount = user.job === 'nezaměstnaný' ? 50 : 100;
    const levelBonus = user.level * 10;
    const workAmount = Math.floor(Math.random() * (baseAmount + levelBonus)) + baseAmount;
    
    await db.update(users)
      .set({ 
        lastWork: now,
        money: (parseFloat(user.money) + workAmount).toFixed(2),
        experience: user.experience + 5,
        updatedAt: now
      })
      .where(eq(users.id, userId));
      
    await this.addTransaction(userId, 'work', workAmount.toString(), `Práce jako ${user.job}`);
    
    return { success: true, amount: workAmount };
  }

  // Hazard - automaty
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
    
    // Vyhodnocení výhry
    if (result[0] === result[1] && result[1] === result[2]) {
      // Tři stejné
      if (result[0] === '💎') winAmount = betAmount * 10;
      else if (result[0] === '⭐') winAmount = betAmount * 7;
      else if (result[0] === '🔔') winAmount = betAmount * 5;
      else winAmount = betAmount * 3;
      won = true;
    } else if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) {
      // Dva stejné
      winAmount = betAmount * 1.5;
      won = true;
    }
    
    const finalAmount = won ? (userMoney - betAmount + winAmount) : (userMoney - betAmount);
    
    await db.update(users)
      .set({ 
        money: finalAmount.toFixed(2),
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
      
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

  // Převod peněz do banky
  async deposit(userId, username, amount) {
    const user = await this.getOrCreateUser(userId, username);
    const userMoney = parseFloat(user.money);
    
    if (userMoney < amount) {
      return { success: false, error: 'Nemáš dostatek peněz v hotovosti!' };
    }
    
    await db.update(users)
      .set({ 
        money: (userMoney - amount).toFixed(2),
        bank: (parseFloat(user.bank) + amount).toFixed(2),
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
      
    await this.addTransaction(userId, 'deposit', amount.toString(), 'Vklad do banky');
    
    return { success: true };
  }

  // Výběr peněz z banky
  async withdraw(userId, username, amount) {
    const user = await this.getOrCreateUser(userId, username);
    const userBank = parseFloat(user.bank);
    
    if (userBank < amount) {
      return { success: false, error: 'Nemáš dostatek peněz v bance!' };
    }
    
    await db.update(users)
      .set({ 
        money: (parseFloat(user.money) + amount).toFixed(2),
        bank: (userBank - amount).toFixed(2),
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
      
    await this.addTransaction(userId, 'withdraw', amount.toString(), 'Výběr z banky');
    
    return { success: true };
  }

  // Žebříček nejbohatších (řazeno podle celkového bohatství)
  async getLeaderboard(limit = 10) {
    return await db
      .select()
      .from(users)
      .orderBy(desc(sql`CAST(money AS DECIMAL) + CAST(bank AS DECIMAL)`))
      .limit(limit);
  }

  // Přidání předmětu do inventáře
  async addInventoryItem(userId, itemName, itemType, value, quantity = 1) {
    // Zkontroluj, jestli už předmět nemá
    const [existingItem] = await db
      .select()
      .from(inventory)
      .where(eq(inventory.userId, userId))
      .where(eq(inventory.itemName, itemName));

    if (existingItem) {
      // Zvýš množství
      await db
        .update(inventory)
        .set({ 
          quantity: existingItem.quantity + quantity,
          updatedAt: new Date()
        })
        .where(eq(inventory.id, existingItem.id));
    } else {
      // Přidej nový předmět
      const insertItem = {
        userId,
        itemName,
        itemType,
        quantity,
        value: value.toString()
      };
      
      await db.insert(inventory).values(insertItem);
    }
  }

  // Získání inventáře uživatele
  async getInventory(userId) {
    return await db
      .select()
      .from(inventory)
      .where(eq(inventory.userId, userId))
      .orderBy(desc(inventory.value));
  }

  // Zkontroluj, jestli má uživatel předmět
  async hasInventoryItem(userId, itemName) {
    const [item] = await db
      .select()
      .from(inventory)
      .where(eq(inventory.userId, userId))
      .where(eq(inventory.itemName, itemName));
    
    return !!item;
  }

  // Aktualizace rob cooldown
  async updateRobCooldown(userId, timestamp) {
    await db.update(users)
      .set({ 
        lastRob: timestamp,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  // Aktualizace povolání
  async updateUserJob(userId, jobName) {
    await db.update(users)
      .set({ 
        job: jobName,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  // Vytvoření investice
  async createInvestment(userId, amount) {
    const insertInvestment = {
      userId,
      name: 'Portfolio Investment',
      amount: amount.toString(),
      type: 'portfolio',
      buyPrice: amount.toString(),
      currentPrice: amount.toString()
    };
    
    await db.insert(investments).values(insertInvestment);
  }

  // Získání uživatelských investic
  async getUserInvestments(userId) {
    return await db
      .select()
      .from(investments)
      .where(eq(investments.userId, userId))
      .orderBy(desc(investments.createdAt));
  }

  // Výběr všech investic
  async collectAllInvestments(userId) {
    await db.delete(investments)
      .where(eq(investments.userId, userId));
  }
}

const economyService = new EconomyService();
module.exports = { economyService };