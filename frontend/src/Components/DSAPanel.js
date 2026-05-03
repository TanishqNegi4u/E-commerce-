import React, { useState } from 'react';

const DSA_ITEMS = [
  { id: 1,  ds: 'Trie',              problem: 'Search autocomplete',              file: 'DSAUtils.java',       complexity: 'O(L + k)',      fixed: false },
  { id: 2,  ds: 'Merge Sort',        problem: 'Sort products by price (stable)',  file: 'DSAUtils.java',       complexity: 'O(n log n)',    fixed: false },
  { id: 3,  ds: 'Merge Sort',        problem: 'Sort products by rating (stable)', file: 'DSAUtils.java',       complexity: 'O(n log n)',    fixed: false },
  { id: 4,  ds: 'Binary Search',     problem: 'Filter by price range',            file: 'DSAUtils.java',       complexity: 'O(log n)',      fixed: false },
  { id: 5,  ds: 'Min-Heap',          problem: 'Top-K cheapest products',          file: 'DSAUtils.java',       complexity: 'O(n + K log n)',fixed: false },
  { id: 6,  ds: 'LRU Cache',         problem: 'Recently viewed (cap 20)',         file: 'ProductService.java', complexity: 'O(1) get/put',  fixed: true  },
  { id: 7,  ds: 'Graph + BFS',       problem: 'Related product recommendations',  file: 'DSAUtils.java',       complexity: 'O(V + E)',      fixed: false },
  { id: 8,  ds: 'Stack',             problem: 'Order history navigation',         file: 'OrderService.java',   complexity: 'O(n)',          fixed: false },
  { id: 9,  ds: 'ConcurrentHashMap', problem: 'O(1) SKU lookup (thread-safe)',    file: 'ProductService.java', complexity: 'O(1) avg',      fixed: true  },
  { id: 10, ds: 'Quick Select',      problem: 'Median-price product',             file: 'DSAUtils.java',       complexity: 'O(n) avg',      fixed: false },
];

const NOTES = {
  1:  'Thread-safe via ReentrantReadWriteLock. Multiple concurrent reads allowed; writes are exclusive. Scale to Redis for multi-node.',
  2:  'Stable sort — tie-breaking preserves secondary order. Chosen over Collections.sort() to demonstrate the algorithm explicitly.',
  3:  'Handles null averageRating (treats as 0). Same merge logic, different comparator passed in.',
  4:  'Uses leftmost/uppermost binary search variants. Requires pre-sorted input (O(n log n) total including sort step).',
  5:  'Current: O(n + K log n) via PriorityQueue poll. Interview upgrade: max-heap of size K → O(n log K) for large n, small K.',
  6:  'FIXED: wrapped with Collections.synchronizedMap(). Previously plain LinkedHashMap in singleton — data race on concurrent access.',
  7:  'BFS chosen: explores depth-1 neighbors before depth-2 — mirrors "most related" user expectation.',
  8:  'Reframed as browser back-stack: push each status update, pop to navigate backwards. Models order history as a Stack.',
  9:  'FIXED: ConcurrentHashMap replaces plain HashMap in singleton. DB fallback now uses findBySku() (indexed) not findAll().stream().filter().',
  10: 'Works on defensive copy — no mutation of caller\'s list. Add Fisher-Yates shuffle before partition to avoid O(n²) worst-case.',
};

export default function DSAPanel() {
  const [expanded, setExpanded] = useState(null);

  const toggle = (id) => setExpanded(prev => prev === id ? null : id);

  return (
    <section className="dsa-panel" aria-labelledby="dsa-heading">
      <div className="dsa-panel__header">
        <h2 className="dsa-panel__title" id="dsa-heading">🧠 10 DSA Structures in Production</h2>
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
          <span className="dsa-tag">All in DSAUtils.java + Services</span>
          <span className="dsa-tag" style={{ background: 'rgba(0,229,160,.1)', color: 'var(--green)', borderColor: 'rgba(0,229,160,.25)' }}>
            ✓ 2 thread-safety fixes applied
          </span>
        </div>
      </div>
      <p style={{ color: 'var(--text2)', fontSize: '.88rem', marginBottom: '1.5rem', lineHeight: 1.7 }}>
        Every structure is wired to a real business use case and covered by JUnit 5 tests.
        In-memory structures are per-JVM — replace with Redis for horizontal scaling.
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table className="dsa-table" aria-label="DSA implementations">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Structure</th>
              <th scope="col">Business Use</th>
              <th scope="col">File</th>
              <th scope="col">Complexity</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {DSA_ITEMS.map(row => (
              <React.Fragment key={row.id}>
                <tr
                  style={{ cursor: 'pointer' }}
                  onClick={() => toggle(row.id)}
                  aria-expanded={expanded === row.id}
                  aria-label={`${row.ds} — ${row.problem}. Click to ${expanded === row.id ? 'collapse' : 'expand'} details.`}
                >
                  <td style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: '.82rem' }}>{String(row.id).padStart(2,'0')}</td>
                  <td><span className="dsa-tag">{row.ds}</span></td>
                  <td style={{ color: 'var(--text2)' }}>{row.problem}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '.73rem', color: 'var(--muted)' }}>{row.file}</td>
                  <td><span className="complexity-badge">{row.complexity}</span></td>
                  <td>
                    {row.fixed
                      ? <span style={{ color: 'var(--green)', fontSize: '.75rem', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>✓ Fixed</span>
                      : <span style={{ color: 'var(--muted)', fontSize: '.75rem' }}>{expanded === row.id ? '▴' : '▾'}</span>
                    }
                  </td>
                </tr>
                {expanded === row.id && (
                  <tr aria-live="polite">
                    <td colSpan={6} style={{
                      background: 'rgba(245,166,35,.04)', borderLeft: '3px solid var(--accent)',
                      padding: '.85rem 1.1rem', fontSize: '.84rem', color: 'var(--text2)', lineHeight: 1.75,
                    }}>
                      💡 {NOTES[row.id]}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}