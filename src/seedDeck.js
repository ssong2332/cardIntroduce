/**
 * Simple 32-bit string hash function (FNV-1a variant)
 * @param {string|number} input
 * @returns {number} 32-bit positive integer
 */
export function hashSeed(input) {
  if (typeof input === 'number') {
    return (input >>> 0) || 123456789;
  }
  const str = String(input);
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

/**
 * Mulberry32 32-bit PRNG generator
 * @param {string|number} seed
 * @returns {() => number} Returns float in [0, 1)
 */
export function createSeededRandom(seed) {
  let s = hashSeed(seed);
  return function next() {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministically shuffles an array using Fisher-Yates with a seeded PRNG.
 * Does not mutate original array.
 * @template T
 * @param {T[]} array
 * @param {string|number} seed
 * @returns {T[]}
 */
export function shuffleWithSeed(array, seed) {
  const list = [...array];
  const rng = createSeededRandom(seed);

  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }

  return list;
}

/**
 * TeamDeckManager manages the leader and members deck state.
 */
export class TeamDeckManager {
  /**
   * @param {{ leader: any, members: any[] }} teamData
   * @param {{ seed?: string|number, forcedOrder?: string[] }} [options]
   */
  constructor(teamData, options = {}) {
    this.leader = teamData.leader || null;
    this.rawMembers = teamData.members ? [...teamData.members] : [];
    this.seed = options.seed || 'default-seed-2026';
    this.forcedOrder = options.forcedOrder || null;

    this.deck = [];
    this.drawnMembers = [];

    this.initDeck();
  }

  initDeck() {
    this.drawnMembers = [];

    if (Array.isArray(this.forcedOrder) && this.forcedOrder.length > 0) {
      const memberMap = new Map(this.rawMembers.map(m => [m.id, m]));
      const ordered = [];
      for (const id of this.forcedOrder) {
        if (memberMap.has(id)) {
          ordered.push(memberMap.get(id));
          memberMap.delete(id);
        }
      }
      // Any remaining members not in forcedOrder appended at the end
      for (const remaining of memberMap.values()) {
        ordered.push(remaining);
      }
      this.deck = ordered;
    } else {
      this.deck = shuffleWithSeed(this.rawMembers, this.seed);
    }
  }

  /**
   * Reconfigures seed or forcedOrder and resets deck.
   * @param {string|number} seed
   * @param {string[]} [forcedOrder]
   */
  reset(seed, forcedOrder) {
    if (seed !== undefined) this.seed = seed;
    if (forcedOrder !== undefined) this.forcedOrder = forcedOrder;
    this.initDeck();
  }

  getLeader() {
    return this.leader;
  }

  getRemainingCount() {
    return this.deck.length;
  }

  getTotalCount() {
    return this.rawMembers.length;
  }

  getDrawnMembers() {
    return [...this.drawnMembers];
  }

  isComplete() {
    return this.deck.length === 0;
  }

  /**
   * Draws the top card from the deck.
   * @returns {any|null} The drawn member object, or null if deck is empty.
   */
  drawNext() {
    if (this.deck.length === 0) {
      return null;
    }
    const card = this.deck.shift();
    this.drawnMembers.push(card);
    return card;
  }
}
