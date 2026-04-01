import { useState, useEffect, useCallback } from "react";

// ═══════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════

function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function generateTxId() {
  const buf = new Uint8Array(32);
  crypto.getRandomValues(buf);
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

export function generateWalletAddress() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  return Array.from(crypto.getRandomValues(new Uint8Array(58)))
    .map((b) => chars[b % chars.length])
    .join("");
}

const round2 = (n) => Math.round(n * 100) / 100;

// ═══════════════════════════════════════════════════
// CORE LOGIC
// ═══════════════════════════════════════════════════

export function calculateShares(bill) {
  const { totalAmount, participants, splitMode } = bill;
  if (!participants.length) return [];

  let shares;
  if (splitMode === "equal") {
    const base = round2(totalAmount / participants.length);
    shares = participants.map((p) => ({ ...p, amountOwed: base }));
  } else if (splitMode === "percent") {
    shares = participants.map((p) => ({
      ...p,
      amountOwed: round2((p.percentage / 100) * totalAmount),
    }));
  } else {
    shares = participants.map((p) => ({ ...p }));
  }

  const sumOwed = shares.reduce((acc, p) => acc + p.amountOwed, 0);
  const diff = round2(totalAmount - sumOwed);
  if (diff !== 0) {
    shares[shares.length - 1].amountOwed = round2(
      shares[shares.length - 1].amountOwed + diff
    );
  }
  return shares;
}

export function markAsPaid(bill, participantId) {
  const paymentTxId = generateTxId();
  const paidAt = Date.now();

  const updatedParticipants = bill.participants.map((p) =>
    p.id === participantId ? { ...p, paid: true, paymentTxId, paidAt } : p
  );

  const allPaid = updatedParticipants.every((p) => p.paid);
  const updatedBill = {
    ...bill,
    participants: updatedParticipants,
    status: allPaid ? "settled" : "open",
  };

  const payer = updatedParticipants.find((p) => p.id === participantId);
  const transaction = {
    txId: paymentTxId,
    type: "payment",
    from: payer?.walletAddress ?? "unknown",
    to: bill.participants[0]?.walletAddress ?? "system",
    amount: payer?.amountOwed ?? 0,
    billId: bill.id,
    participantId,
    timestamp: paidAt,
    status: "confirmed",
  };

  return { updatedBill, transaction };
}

export function getProgress(bill) {
  const { participants } = bill;
  const total = participants.length;
  const paid = participants.filter((p) => p.paid).length;
  const remaining = total - paid;
  const pct = total === 0 ? 0 : Math.round((paid / total) * 100);
  const amountCollected = round2(
    participants.filter((p) => p.paid).reduce((s, p) => s + p.amountOwed, 0)
  );
  const amountRemaining = round2(bill.totalAmount - amountCollected);
  return { total, paid, remaining, pct, amountCollected, amountRemaining };
}

export function createBill(formData) {
  const {
    title,
    totalAmount,
    currency = "INR",
    splitMode = "equal",
    participants: rawParticipants,
    groupId = null,
  } = formData;

  const count = rawParticipants.length;
  const defaultPct = count ? round2(100 / count) : 0;

  const participants = rawParticipants.map((p, i) => ({
    id: uuid(),
    name: p.name,
    walletAddress: p.walletAddress || generateWalletAddress(),
    percentage:
      p.percentage ??
      (i === count - 1 ? round2(100 - defaultPct * (count - 1)) : defaultPct),
    amountOwed: 0,
    paid: false,
    paymentTxId: null,
    paidAt: null,
  }));

  const creationTxId = generateTxId();
  const now = Date.now();

  const draft = {
    id: uuid(),
    title,
    totalAmount,
    currency,
    splitMode,
    participants,
    txId: creationTxId,
    createdAt: now,
    status: "open",
    groupId,
  };

  draft.participants = calculateShares(draft);

  const transaction = {
    txId: creationTxId,
    type: "bill_created",
    from: "system",
    to: participants[0]?.walletAddress ?? "system",
    amount: totalAmount,
    billId: draft.id,
    participantId: "",
    timestamp: now,
    status: "confirmed",
  };

  return { bill: draft, transaction };
}

// ═══════════════════════════════════════════════════
// STORAGE KEYS
// ═══════════════════════════════════════════════════

const LS_BILLS = "web3expense_bills";
const LS_TXS = "web3expense_transactions";
const LS_GROUPS = "web3expense_groups";

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

// ═══════════════════════════════════════════════════
// REACT HOOK
// ═══════════════════════════════════════════════════

export function useExpenseStore() {
  const [bills, setBills] = useState(() => loadFromStorage(LS_BILLS, []));
  const [transactions, setTransactions] = useState(() => loadFromStorage(LS_TXS, []));
  const [groups, setGroups] = useState(() => loadFromStorage(LS_GROUPS, []));

  useEffect(() => { localStorage.setItem(LS_BILLS, JSON.stringify(bills)); }, [bills]);
  useEffect(() => { localStorage.setItem(LS_TXS, JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem(LS_GROUPS, JSON.stringify(groups)); }, [groups]);

  const addBill = useCallback((formData) => {
    const { bill, transaction } = createBill(formData);
    setBills((prev) => [bill, ...prev]);
    setTransactions((prev) => [transaction, ...prev]);
    return bill;
  }, []);

  const payParticipant = useCallback((billId, participantId) => {
    setBills((prev) =>
      prev.map((b) => {
        if (b.id !== billId) return b;
        const { updatedBill, transaction } = markAsPaid(b, participantId);
        setTransactions((txs) => [transaction, ...txs]);
        return updatedBill;
      })
    );
  }, []);

  const deleteBill = useCallback((billId) => {
    setBills((prev) => prev.filter((b) => b.id !== billId));
    setTransactions((prev) => prev.filter((t) => t.billId !== billId));
  }, []);

  const getBillById = useCallback(
    (id) => bills.find((b) => b.id === id) ?? null,
    [bills]
  );

  // ── Groups ──
  const addGroup = useCallback((name, members, category = '', desc = '') => {
    const group = {
      id: uuid(),
      name,
      members,
      category,
      desc,
      createdAt: Date.now(),
    };
    setGroups((prev) => [group, ...prev]);
    return group;
  }, []);

  const deleteGroup = useCallback((groupId) => {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    // also remove bills belonging to this group
    setBills((prev) => prev.filter((b) => b.groupId !== groupId));
  }, []);

  const getBillsByGroup = useCallback(
    (groupId) => bills.filter((b) => b.groupId === groupId),
    [bills]
  );

  // ── Dashboard stats ──
  const getStats = useCallback(() => {
    const totalBills = bills.length;
    const totalAmount = round2(bills.reduce((s, b) => s + b.totalAmount, 0));
    const collected = round2(
      bills.reduce((s, b) => {
        return s + b.participants.filter((p) => p.paid).reduce((x, p) => x + p.amountOwed, 0);
      }, 0)
    );
    const pending = round2(totalAmount - collected);
    const settledBills = bills.filter((b) => b.status === "settled").length;
    return { totalBills, totalAmount, collected, pending, settledBills, totalGroups: groups.length };
  }, [bills, groups]);

  return {
    bills, transactions, groups,
    addBill, payParticipant, deleteBill, getBillById,
    addGroup, deleteGroup, getBillsByGroup,
    getStats,
  };
}