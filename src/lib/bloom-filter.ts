// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Bloom Filter — Probabilistic set membership (FNV-1a based)
// Used by Edge Gate to detect ticket replay attacks in O(1)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export class BloomFilter {
  private bits: Uint8Array;
  private m: number; // bit-array size
  private k: number; // number of hash functions
  private insertedCount = 0;

  constructor(m: number = 2048, k: number = 7) {
    this.m = m;
    this.k = k;
    this.bits = new Uint8Array(Math.ceil(m / 8));
  }

  // FNV-1a hash (32-bit)
  private fnv1a(str: string, seed: number = 0): number {
    let hash = 0x811c9dc5 ^ seed;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    return hash >>> 0;
  }

  // Generate k hash positions from item string
  private getPositions(item: string): number[] {
    const positions: number[] = [];
    for (let i = 0; i < this.k; i++) {
      const hash = this.fnv1a(item, i * 0xdeadbeef);
      positions.push(hash % this.m);
    }
    return positions;
  }

  // Set a bit at position
  private setBit(pos: number): void {
    const byteIndex = Math.floor(pos / 8);
    const bitIndex = pos % 8;
    this.bits[byteIndex] |= (1 << bitIndex);
  }

  // Check if bit is set at position
  private getBit(pos: number): boolean {
    const byteIndex = Math.floor(pos / 8);
    const bitIndex = pos % 8;
    return (this.bits[byteIndex] & (1 << bitIndex)) !== 0;
  }

  // Insert an item into the filter
  insert(item: string): void {
    const positions = this.getPositions(item);
    positions.forEach(pos => this.setBit(pos));
    this.insertedCount++;
  }

  // Check if item might be in the set (probabilistic — false positives possible)
  contains(item: string): boolean {
    const positions = this.getPositions(item);
    return positions.every(pos => this.getBit(pos));
  }

  // Ratio of set bits to total bits (0..1)
  get fillRatio(): number {
    let setBits = 0;
    for (let i = 0; i < this.bits.length; i++) {
      let byte = this.bits[i];
      while (byte) {
        setBits += byte & 1;
        byte >>= 1;
      }
    }
    return setBits / this.m;
  }

  // Estimated false-positive rate
  get falsePositiveRate(): number {
    return Math.pow(1 - Math.exp(-this.k * this.insertedCount / this.m), this.k);
  }

  // Number of items inserted
  get count(): number {
    return this.insertedCount;
  }

  // Reset the filter
  clear(): void {
    this.bits.fill(0);
    this.insertedCount = 0;
  }
}
