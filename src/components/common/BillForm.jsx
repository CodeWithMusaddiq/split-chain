import { useState } from "react";

function BillForm({ onSubmit }) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [count, setCount] = useState(2);
  const [names, setNames] = useState(["", ""]);

  function handleCountChange(e) {
    const n = Math.max(2, Math.min(10, parseInt(e.target.value) || 2));
    setCount(n);
    setNames((prev) => {
      const updated = [...prev];
      while (updated.length < n) updated.push("");
      return updated.slice(0, n);
    });
  }

  function handleNameChange(index, value) {
    setNames((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  }

  function handleSubmit() {
    if (!title || !amount) {
      alert("Please enter a title and amount.");
      return;
    }
    const filledNames = names.map((n, i) => n.trim() || `Person ${i + 1}`);
    const anyEmpty = names.some((n) => !n.trim());
    if (anyEmpty) {
      const ok = window.confirm("Some names are empty and will be auto-filled. Continue?");
      if (!ok) return;
    }

    onSubmit({
      title,
      totalAmount: parseFloat(amount),
      currency: "INR",
      splitMode: "equal",
      participants: filledNames.map((name) => ({ name })),
    });

    setTitle("");
    setAmount("");
    setDate("");
    setCategory("");
    setNotes("");
    setCount(2);
    setNames(["", ""]);
  }

  return (
    <div className="space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">

      {/* Title + Amount */}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Split Title</span>
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            type="text"
            placeholder="e.g. Dinner at Soul Kitchen"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Amount (₹)</span>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">₹</span>
            <input
              className="w-full rounded-lg border border-slate-200 py-2 pl-7 pr-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              type="number"
              step="1"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </label>
      </div>

      {/* Date + Category */}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Date</span>
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Category</span>
          <select
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Select category</option>
            <option>Food</option>
            <option>Travel</option>
            <option>Utilities</option>
            <option>Entertainment</option>
            <option>Other</option>
          </select>
        </label>
      </div>

      {/* Number of people */}
      <label className="space-y-1">
        <span className="text-sm font-medium text-slate-700">Number of people splitting</span>
        <input
          className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          type="number"
          min="2"
          max="10"
          value={count}
          onChange={handleCountChange}
        />
      </label>

      {/* Dynamic name fields */}
      <div className="space-y-2">
        <span className="text-sm font-medium text-slate-700">Participant Names</span>
        <div className="grid gap-3 sm:grid-cols-2">
          {names.map((name, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-6 text-center text-xs font-semibold text-slate-400">
                {i + 1}
              </span>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                type="text"
                placeholder={`Person ${i + 1}`}
                value={name}
                onChange={(e) => handleNameChange(i, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Per person preview */}
      {amount && count >= 2 && (
        <div className="rounded-lg bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
          Each person pays{" "}
          <span className="font-semibold">
            ₹{(parseFloat(amount) / count).toFixed(2)}
          </span>{" "}
          (split equally among {count} people)
        </div>
      )}

      {/* Notes */}
      <label className="space-y-1">
        <span className="text-sm font-medium text-slate-700">Notes</span>
        <textarea
          className="h-20 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          placeholder="Add expense details"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>

      <button
        type="button"
        onClick={handleSubmit}
        className="inline-flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
      >
        Add Bill
      </button>
    </div>
  );
}

export default BillForm;