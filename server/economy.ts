import { db } from './db';
import { users, transactions, inventory, investments, jobs } from '../shared/schema';
import { eq, desc } from 'drizzle-orm';
import type { User, InsertUser, InsertTransaction } from '../shared/schema';

export class EconomyService {
  // Získání nebo vytvoření uživatele
  async getOrCreateUser(discordId: string, username: string): Promise<User> {
    let [user] = await db.select().from(users).where(eq(users.id, discordId));
    
    if (!user) {
      const insertUser: InsertUser = {
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
  async updateUserMoney(userId: string, amount: string, type: 'add' | 'subtract' = 'add'): Promise<void> {
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
  async addTransaction(userId: string, type: string, amount: string, description: string): Promise<void> {
    const transaction: InsertTransaction = {
      userId,
      type,
      amount,
      description,
    };
    
    await db.insert(transactions).values(transaction);
  }

  // Denní bonus
  async claimDaily(userId: string, username: string): Promise<{ success: boolean; amount?: number; nextDaily?: Date; error?: string }> {
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
  async work(userId: string, username: string): Promise<{ success: boolean; amount?: number; nextWork?: Date; error?: string }> {
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
  async playSlots(userId: string, username: string, betAmount: number): Promise<{ success: boolean; won: boolean; amount?: number; symbols?: string[]; balance?: number; error?: string }> {
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
  async deposit(userId: string, username: string, amount: number): Promise<{ success: boolean; error?: string }> {
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
  async withdraw(userId: string, username: string, amount: number): Promise<{ success: boolean; error?: string }> {
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

  // Žebříček nejbohatších
  async getLeaderboard(limit: number = 10): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.money))
      .limit(limit);
  }
}

export const economyService = new EconomyService();