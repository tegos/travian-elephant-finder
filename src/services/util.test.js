const { test } = require('node:test');
const assert = require('node:assert/strict');
const util = require('#src/services/util.js');

test('tilesWithinDistance returns only tiles inside the circle', () => {
  const tiles = util.tilesWithinDistance(0, 0, 1);
  const keys = new Set(tiles.map((t) => `${t.x},${t.y}`));

  // Plus-shape: center + 4 orthogonal neighbours; corners (distance sqrt(2)) excluded.
  assert.equal(tiles.length, 5);
  assert.ok(keys.has('0,0'));
  assert.ok(keys.has('1,0'));
  assert.ok(keys.has('0,-1'));
  assert.ok(!keys.has('1,1'));
});

test('tilesWithinDistance centers on the given coordinates', () => {
  const tiles = util.tilesWithinDistance(-24, -162, 0);
  assert.deepEqual(tiles, [{ x: -24, y: -162 }]);
});

test('every returned tile is within the radius', () => {
  const cx = 5;
  const cy = -7;
  const radius = 4;
  for (const { x, y } of util.tilesWithinDistance(cx, cy, radius)) {
    assert.ok(util.distance(x, y, cx, cy) <= radius);
  }
});
