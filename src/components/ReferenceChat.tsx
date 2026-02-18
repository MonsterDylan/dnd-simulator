"use client";

import { useEffect, useRef, useState } from "react";
import { lookupResource } from "@/lib/api";
import type { LookupResource } from "@/lib/types";

const RESOURCES: { value: LookupResource; label: string }[] = [
  { value: "monster", label: "Monster" },
  { value: "spell", label: "Spell" },
  { value: "armor", label: "Armor" },
  { value: "weapon", label: "Weapon" },
  { value: "magicItem", label: "Magic Item" },
  { value: "race", label: "Race" },
  { value: "class", label: "Class" },
  { value: "background", label: "Background" },
];

type RefMessage =
  | { type: "user"; text: string; resource: LookupResource }
  | { type: "result"; resource: string; items: unknown[]; count: number }
  | { type: "error"; text: string };

function detectResource(q: string): LookupResource | null {
  if (/\bspell|magic missile|fireball|cast\b/i.test(q)) return "spell";
  if (/\barmor|mail|shield|plate|leather\b/i.test(q)) return "armor";
  if (/\bsword|axe|bow|dagger|weapon|mace|spear\b/i.test(q)) return "weapon";
  if (/\bpotion|ring|wand|staff|amulet|magic item\b/i.test(q)) return "magicItem";
  if (/\belf|dwarf|human|halfling|gnome|tiefling|dragonborn|orc|race\b/i.test(q)) return "race";
  if (/\bfighter|wizard|rogue|cleric|ranger|paladin|barbarian|bard|druid|sorcerer|warlock|monk|class\b/i.test(q)) return "class";
  if (/\bsoldier|sage|criminal|acolyte|noble|folk hero|background\b/i.test(q)) return "background";
  if (/\bgoblin|dragon|beast|creature|undead|monster\b/i.test(q)) return "monster";
  return null;
}

function ResultCard({ resource, item }: { resource: string; item: unknown }) {
  const d = item as Record<string, unknown>;

  if (resource === "monster") {
    const hp = d.hp as { current: number; max: number } | undefined;
    const attacks = (d.attacks as { name: string; damage: string }[] | undefined) ?? [];
    return (
      <div className="bg-dnd-dark rounded p-2 mb-1 text-xs">
        <div className="font-bold text-dnd-gold">{String(d.name ?? "")}</div>
        <div className="text-gray-300">
          CR {String(d.cr ?? "?")} · HP {hp?.max ?? "?"} · AC {String(d.ac ?? "?")}
        </div>
        {attacks.length > 0 && (
          <div className="text-gray-400 truncate">
            {attacks.map((a) => `${a.name} (${a.damage})`).join(", ")}
          </div>
        )}
      </div>
    );
  }

  if (resource === "spell") {
    return (
      <div className="bg-dnd-dark rounded p-2 mb-1 text-xs">
        <div className="font-bold text-dnd-gold">{String(d.name ?? "")}</div>
        <div className="text-gray-300">
          Lv {String(d.level ?? "?")} {String(d.school ?? "")} · {String(d.castingTime ?? "")}
        </div>
        <div className="text-gray-400 truncate">{String(d.classes ?? "")}</div>
      </div>
    );
  }

  if (resource === "armor") {
    return (
      <div className="bg-dnd-dark rounded p-2 mb-1 text-xs">
        <div className="font-bold text-dnd-gold">{String(d.name ?? "")}</div>
        <div className="text-gray-300">
          AC {String(d.ac ?? "?")} · {String(d.category ?? "")}
        </div>
        {d.stealthDisadvantage && (
          <div className="text-dnd-red">Stealth disadvantage</div>
        )}
      </div>
    );
  }

  if (resource === "weapon") {
    return (
      <div className="bg-dnd-dark rounded p-2 mb-1 text-xs">
        <div className="font-bold text-dnd-gold">{String(d.name ?? "")}</div>
        <div className="text-gray-300">
          {String(d.damage ?? "")} {String(d.damageType ?? "")} · {String(d.category ?? "")}
        </div>
      </div>
    );
  }

  if (resource === "magicItem") {
    return (
      <div className="bg-dnd-dark rounded p-2 mb-1 text-xs">
        <div className="font-bold text-dnd-gold">{String(d.name ?? "")}</div>
        <div className="text-gray-300">
          {String(d.rarity ?? "")} · {String(d.type ?? "")}
          {d.requiresAttunement ? " · Attunement" : ""}
        </div>
      </div>
    );
  }

  if (resource === "race") {
    return (
      <div className="bg-dnd-dark rounded p-2 mb-1 text-xs">
        <div className="font-bold text-dnd-gold">{String(d.name ?? "")}</div>
        <div className="text-gray-300">Speed {String(d.speed ?? 30)}ft</div>
        <div className="text-gray-400 truncate">{String(d.abilityBonuses ?? "")}</div>
      </div>
    );
  }

  if (resource === "class") {
    return (
      <div className="bg-dnd-dark rounded p-2 mb-1 text-xs">
        <div className="font-bold text-dnd-gold">{String(d.name ?? "")}</div>
        <div className="text-gray-300">Hit Die: d{String(d.hitDie ?? "?")}</div>
        <div className="text-gray-400 truncate">{String(d.savingThrows ?? "")}</div>
      </div>
    );
  }

  if (resource === "background") {
    return (
      <div className="bg-dnd-dark rounded p-2 mb-1 text-xs">
        <div className="font-bold text-dnd-gold">{String(d.name ?? "")}</div>
        <div className="text-gray-300 truncate">{String(d.skillProficiencies ?? "")}</div>
        <div className="text-gray-400">{String(d.feature ?? "")}</div>
      </div>
    );
  }

  return (
    <div className="bg-dnd-dark rounded p-2 mb-1 text-xs text-gray-300">
      {String(d.name ?? JSON.stringify(item))}
    </div>
  );
}

export default function ReferenceChat() {
  const [messages, setMessages] = useState<RefMessage[]>([]);
  const [query, setQuery] = useState("");
  const [resource, setResource] = useState<LookupResource>("monster");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  function handleQueryChange(val: string) {
    setQuery(val);
    const detected = detectResource(val);
    if (detected) setResource(detected);
  }

  async function handleSearch() {
    const q = query.trim();
    if (!q) return;
    setMessages((prev) => [...prev, { type: "user", text: q, resource }]);
    setQuery("");
    setLoading(true);
    try {
      const result = await lookupResource(resource, q);
      setMessages((prev) => [...prev, { type: "result", ...result }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { type: "error", text: "Lookup failed. Check your n8n connection." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  }

  return (
    <div className="border-t border-dnd-border bg-dnd-surface flex flex-col" style={{ height: "280px" }}>
      {/* Header */}
      <div className="px-3 py-2 border-b border-dnd-border shrink-0 flex items-center gap-2">
        <span className="text-dnd-gold text-xs font-bold tracking-wide">D&D REFERENCE</span>
        <span className="text-gray-500 text-xs">· Open5e</span>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto game-scroll px-2 py-2 space-y-1"
      >
        {messages.length === 0 && (
          <p className="text-gray-600 text-xs text-center mt-4">
            Search monsters, spells, armor, and more
          </p>
        )}

        {messages.map((msg, i) => {
          if (msg.type === "user") {
            const label = RESOURCES.find((r) => r.value === msg.resource)?.label ?? msg.resource;
            return (
              <div key={i} className="text-right">
                <span className="inline-block bg-dnd-gold/20 text-dnd-gold-light text-xs rounded px-2 py-1">
                  [{label}] {msg.text}
                </span>
              </div>
            );
          }

          if (msg.type === "result") {
            const items = msg.items as unknown[];
            return (
              <div key={i}>
                {items.length === 0 ? (
                  <div className="text-gray-500 text-xs italic px-1">No results found.</div>
                ) : (
                  <>
                    <div className="text-gray-500 text-xs px-1 mb-1">
                      {msg.count} result{msg.count !== 1 ? "s" : ""}
                    </div>
                    {items.map((item, j) => (
                      <ResultCard key={j} resource={msg.resource} item={item} />
                    ))}
                  </>
                )}
              </div>
            );
          }

          if (msg.type === "error") {
            return (
              <div key={i} className="text-dnd-red text-xs px-1 italic">
                {msg.text}
              </div>
            );
          }

          return null;
        })}

        {loading && (
          <div className="flex gap-1 px-1 py-1">
            <span className="w-1.5 h-1.5 bg-dnd-gold rounded-full animate-[typingDot_1.2s_ease-in-out_infinite]" />
            <span className="w-1.5 h-1.5 bg-dnd-gold rounded-full animate-[typingDot_1.2s_ease-in-out_0.4s_infinite]" />
            <span className="w-1.5 h-1.5 bg-dnd-gold rounded-full animate-[typingDot_1.2s_ease-in-out_0.8s_infinite]" />
          </div>
        )}
      </div>

      {/* Input row */}
      <div className="shrink-0 border-t border-dnd-border p-2 flex gap-1">
        <select
          value={resource}
          onChange={(e) => setResource(e.target.value as LookupResource)}
          className="bg-dnd-dark border border-dnd-border text-gray-300 text-xs rounded px-1 py-1 focus:outline-none focus:border-dnd-gold shrink-0"
        >
          {RESOURCES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search..."
          disabled={loading}
          className="flex-1 min-w-0 bg-dnd-dark border border-dnd-border text-gray-200 text-xs rounded px-2 py-1 placeholder-gray-600 focus:outline-none focus:border-dnd-gold disabled:opacity-50"
        />

        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="shrink-0 bg-dnd-gold hover:bg-dnd-gold-light disabled:opacity-40 text-dnd-dark text-xs font-bold rounded px-2 py-1 transition-colors"
        >
          Go
        </button>
      </div>
    </div>
  );
}
