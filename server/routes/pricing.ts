import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { config } from "../config";
import { MultiarmedBandit } from "../services/pricing/bandit";
import { PricingPolicy } from "../services/pricing/policy";

const router = Router();
const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);

// Initialize pricing services
const bandit = new MultiarmedBandit(config.pricing.banditEpsilon);
const pricingPolicy = new PricingPolicy(supabase);

// GET /quote?eventId=&ticketTypeId=&channel= → retorna preço atual
router.get("/quote", async (req, res) => {
  try {
    const { eventId, ticketTypeId, channel = "web" } = req.query;

    if (!eventId || !ticketTypeId) {
      return res.status(400).json({
        error: "Missing required parameters",
        required: ["eventId", "ticketTypeId"]
      });
    }

    // Get current pricing data
    const { data: ticketType, error: ticketError } = await supabase
      .from("ticket_types")
      .select("*, events(*)")
      .eq("id", ticketTypeId)
      .eq("event_id", eventId)
      .single();

    if (ticketError || !ticketType) {
      return res.status(404).json({ error: "Ticket type not found" });
    }

    // Get external signals
    const { data: signals } = await supabase
      .from("signals")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Calculate dynamic price using policy and bandit
    const contextualFeatures = {
      basePrice: ticketType.base_price,
      currentStock: ticketType.available,
      capacity: ticketType.capacity,
      timeToEvent: new Date(ticketType.events.date).getTime() - Date.now(),
      channel,
      signals: signals || {},
    };

    const recommendedPrice = await pricingPolicy.calculatePrice(
      eventId as string,
      ticketTypeId as string,
      contextualFeatures
    );

    const finalPrice = await bandit.selectPrice(
      `${eventId}-${ticketTypeId}`,
      [recommendedPrice * 0.9, recommendedPrice, recommendedPrice * 1.1],
      contextualFeatures
    );

    // Record demand snapshot
    await supabase.from("demand_snapshots").insert({
      event_id: eventId,
      ticket_type_id: ticketTypeId,
      price: finalPrice,
      available_stock: ticketType.available,
      channel,
      views: 1,
    });

    res.json({
      eventId,
      ticketTypeId,
      currentPrice: finalPrice,
      basePrice: ticketType.base_price,
      available: ticketType.available,
      capacity: ticketType.capacity,
      channel,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Pricing quote error:", error);
    res.status(500).json({ error: "Failed to get price quote" });
  }
});

// POST /purchase → registra venda, atualiza estoque e snapshots
router.post("/purchase", async (req, res) => {
  try {
    const { eventId, ticketTypeId, customerId, quantity = 1, price, channel = "web" } = req.body;

    if (!eventId || !ticketTypeId || !customerId || !price) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["eventId", "ticketTypeId", "customerId", "price"]
      });
    }

    // Start transaction
    const { data: ticketType, error: fetchError } = await supabase
      .from("ticket_types")
      .select("*")
      .eq("id", ticketTypeId)
      .single();

    if (fetchError || !ticketType) {
      return res.status(404).json({ error: "Ticket type not found" });
    }

    if (ticketType.available < quantity) {
      return res.status(400).json({ error: "Insufficient tickets available" });
    }

    // Update stock
    const { error: updateError } = await supabase
      .from("ticket_types")
      .update({ available: ticketType.available - quantity })
      .eq("id", ticketTypeId);

    if (updateError) {
      return res.status(500).json({ error: "Failed to update stock" });
    }

    // Record purchase interaction
    await supabase.from("interactions").insert({
      customer_id: customerId,
      event_id: eventId,
      interaction_type: "purchase",
      value: price * quantity,
      metadata: { ticket_type_id: ticketTypeId, quantity, channel },
    });

    // Record demand snapshot
    await supabase.from("demand_snapshots").insert({
      event_id: eventId,
      ticket_type_id: ticketTypeId,
      price,
      available_stock: ticketType.available - quantity,
      channel,
      sales: quantity,
    });

    // Update bandit with reward (successful purchase = positive reward)
    await bandit.updateReward(`${eventId}-${ticketTypeId}`, price, 1.0);

    res.json({
      success: true,
      purchaseId: `${eventId}-${ticketTypeId}-${Date.now()}`,
      quantity,
      totalPrice: price * quantity,
      remainingStock: ticketType.available - quantity,
    });

  } catch (error) {
    console.error("Purchase error:", error);
    res.status(500).json({ error: "Failed to process purchase" });
  }
});

// POST /ab/mark → registra exibição/click para algoritmo de bandit
router.post("/ab/mark", async (req, res) => {
  try {
    const { eventId, ticketTypeId, action, price, customerId, channel = "web" } = req.body;

    if (!eventId || !ticketTypeId || !action || !price) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["eventId", "ticketTypeId", "action", "price"]
      });
    }

    const validActions = ["view", "click", "add_to_cart"];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        error: "Invalid action",
        validActions
      });
    }

    // Record interaction
    if (customerId) {
      await supabase.from("interactions").insert({
        customer_id: customerId,
        event_id: eventId,
        interaction_type: action,
        metadata: { ticket_type_id: ticketTypeId, price, channel },
      });
    }

    // Update demand snapshot
    const updateField = action === "view" ? "views" : "clicks";
    await supabase.from("demand_snapshots").insert({
      event_id: eventId,
      ticket_type_id: ticketTypeId,
      price,
      [updateField]: 1,
      available_stock: 0, // Will be updated with actual stock
      channel,
    });

    // Provide feedback to bandit (clicks and add_to_cart are positive signals)
    const reward = action === "view" ? 0.1 : action === "click" ? 0.3 : 0.7;
    await bandit.updateReward(`${eventId}-${ticketTypeId}`, price, reward);

    res.json({
      success: true,
      action,
      eventId,
      ticketTypeId,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("AB marking error:", error);
    res.status(500).json({ error: "Failed to mark action" });
  }
});

export default router;