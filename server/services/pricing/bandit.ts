/**
 * ε-greedy Multi-Armed Bandit for Dynamic Pricing
 * 
 * This class implements an epsilon-greedy strategy for selecting prices
 * from a set of candidate prices, learning from user interactions.
 */

interface BanditArm {
  price: number;
  rewards: number[];
  averageReward: number;
  count: number;
}

interface BanditContext {
  basePrice: number;
  currentStock: number;
  capacity: number;
  timeToEvent: number;
  channel: string;
  signals: any;
}

export class MultiarmedBandit {
  private epsilon: number;
  private arms: Map<string, BanditArm[]> = new Map();
  private contextWeights: Map<string, number> = new Map();

  constructor(epsilon: number = 0.1) {
    this.epsilon = epsilon;
    this.initializeContextWeights();
  }

  private initializeContextWeights() {
    // Initialize feature weights for contextual bandits
    this.contextWeights.set("stock_level", 0.3);
    this.contextWeights.set("time_pressure", 0.25);
    this.contextWeights.set("channel_premium", 0.2);
    this.contextWeights.set("weather_boost", 0.15);
    this.contextWeights.set("trend_factor", 0.1);
  }

  /**
   * Select the best price using epsilon-greedy strategy
   */
  async selectPrice(
    eventTicketKey: string,
    candidatePrices: number[],
    context: BanditContext
  ): Promise<number> {
    
    // Initialize arms if not exists
    if (!this.arms.has(eventTicketKey)) {
      this.arms.set(eventTicketKey, candidatePrices.map(price => ({
        price,
        rewards: [],
        averageReward: 0,
        count: 0,
      })));
    }

    const arms = this.arms.get(eventTicketKey)!;

    // Epsilon-greedy selection
    if (Math.random() < this.epsilon) {
      // Exploration: random selection
      const randomIndex = Math.floor(Math.random() * arms.length);
      return arms[randomIndex].price;
    } else {
      // Exploitation: select best performing arm with contextual adjustment
      const contextualScores = arms.map(arm => 
        this.calculateContextualScore(arm, context)
      );

      const bestArmIndex = contextualScores.indexOf(Math.max(...contextualScores));
      return arms[bestArmIndex].price;
    }
  }

  /**
   * Update the reward for a specific price choice
   */
  async updateReward(
    eventTicketKey: string,
    selectedPrice: number,
    reward: number
  ): Promise<void> {
    
    const arms = this.arms.get(eventTicketKey);
    if (!arms) return;

    const armIndex = arms.findIndex(arm => arm.price === selectedPrice);
    if (armIndex === -1) return;

    const arm = arms[armIndex];
    
    // Update arm statistics
    arm.rewards.push(reward);
    arm.count += 1;
    
    // Keep only recent rewards (sliding window of 100)
    if (arm.rewards.length > 100) {
      arm.rewards.shift();
    }

    // Recalculate average reward
    arm.averageReward = arm.rewards.reduce((sum, r) => sum + r, 0) / arm.rewards.length;

    // Update epsilon based on confidence (optional adaptive epsilon)
    this.updateEpsilon(arms);
  }

  /**
   * Calculate contextual score for an arm
   */
  private calculateContextualScore(arm: BanditArm, context: BanditContext): number {
    let baseScore = arm.averageReward;

    // If no historical data, use optimistic initialization
    if (arm.count === 0) {
      baseScore = 0.5; // Neutral optimistic value
    }

    // Apply contextual adjustments
    let contextualAdjustment = 0;

    // Stock level factor (scarcity premium)
    const stockRatio = context.currentStock / context.capacity;
    if (stockRatio < 0.2) { // Low stock
      contextualAdjustment += this.contextWeights.get("stock_level")! * 0.3;
    } else if (stockRatio < 0.5) { // Medium stock
      contextualAdjustment += this.contextWeights.get("stock_level")! * 0.1;
    }

    // Time pressure factor
    const daysToEvent = context.timeToEvent / (1000 * 60 * 60 * 24);
    if (daysToEvent < 3) { // Last minute premium
      contextualAdjustment += this.contextWeights.get("time_pressure")! * 0.4;
    } else if (daysToEvent < 7) {
      contextualAdjustment += this.contextWeights.get("time_pressure")! * 0.2;
    }

    // Channel premium (mobile vs web vs app)
    if (context.channel === "mobile") {
      contextualAdjustment += this.contextWeights.get("channel_premium")! * 0.1;
    } else if (context.channel === "app") {
      contextualAdjustment += this.contextWeights.get("channel_premium")! * 0.15;
    }

    // External signals
    if (context.signals) {
      // Weather factor
      if (context.signals.precipitation && context.signals.precipitation > 5) {
        contextualAdjustment += this.contextWeights.get("weather_boost")! * 0.2; // Rain = higher demand
      }

      // Trend factor
      if (context.signals.google_trends && context.signals.google_trends > 80) {
        contextualAdjustment += this.contextWeights.get("trend_factor")! * 0.3;
      }
    }

    return baseScore + contextualAdjustment;
  }

  /**
   * Adaptive epsilon based on confidence
   */
  private updateEpsilon(arms: BanditArm[]): void {
    const totalTrials = arms.reduce((sum, arm) => sum + arm.count, 0);
    
    // Decrease epsilon as we gain more confidence (more trials)
    if (totalTrials > 100) {
      this.epsilon = Math.max(0.05, this.epsilon * 0.995); // Minimum 5% exploration
    }
  }

  /**
   * Get bandit statistics for monitoring
   */
  getBanditStats(eventTicketKey: string): any {
    const arms = this.arms.get(eventTicketKey);
    if (!arms) return null;

    return {
      epsilon: this.epsilon,
      totalTrials: arms.reduce((sum, arm) => sum + arm.count, 0),
      arms: arms.map(arm => ({
        price: arm.price,
        averageReward: Math.round(arm.averageReward * 1000) / 1000,
        count: arm.count,
        confidence: arm.count > 10 ? "alta" : arm.count > 3 ? "média" : "baixa",
      })),
      bestArm: arms.reduce((best, current) => 
        current.averageReward > best.averageReward ? current : best
      ),
    };
  }

  /**
   * Reset bandit for a specific event/ticket (useful for new events)
   */
  resetBandit(eventTicketKey: string): void {
    this.arms.delete(eventTicketKey);
  }
}
