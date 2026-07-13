const { test } = require('node:test');
const assert = require('node:assert/strict');
const travian = require('#src/services/travian.js');

test('parses village coordinates from map.sql rows', () => {
  const sql = [
    "INSERT INTO `x_world` VALUES (144524,-37,-160,3,48513,'FastShield Köyü',13663,'FastShield',0,'',9,NULL,TRUE,NULL,NULL,NULL);",
    "INSERT INTO `x_world` VALUES (812,-191,198,1,48978,'Base 1',3304,'daartz',246,'OOXX',89,NULL,FALSE,NULL,NULL,NULL);",
    "INSERT INTO `x_world` VALUES (999001,50,50,5,50001,'Natars village',0,'Natars',0,'',65542,NULL,FALSE,NULL,NULL,NULL);",
  ].join('\n');

  const coordinates = travian.parseVillageCoordinates(sql);

  assert.equal(coordinates.size, 3);
  assert.ok(coordinates.has('-37,-160'));
  assert.ok(coordinates.has('-191,198'));
  assert.ok(coordinates.has('50,50'));
});

test('parses own village coordinates, normalizing the Unicode minus', () => {
  const html = `
    <div id="villageName"></div>
    <span class="coordinatesWrapper">
      <span class="coordinateX">(&#8722;24</span>
      <span class="coordinateY">&#8722;162)</span>
    </span>`;

  assert.deepEqual(travian.parseOwnCoordinates(html), { x: -24, y: -162 });
});

test('parses positive own coordinates and returns null when absent', () => {
  const html = '<span class="coordinateX">(7</span><span class="coordinateY">3)</span>';
  assert.deepEqual(travian.parseOwnCoordinates(html), { x: 7, y: 3 });

  assert.equal(travian.parseOwnCoordinates('<div>no coords here</div>'), null);
});

test('handles positive and negative coordinates and empty input', () => {
  const sql =
    "INSERT INTO `x_world` VALUES (1,7,-3,2,100,'x',1,'p',0,'',5,NULL,TRUE,NULL,NULL,NULL);";

  const coordinates = travian.parseVillageCoordinates(sql);
  assert.ok(coordinates.has('7,-3'));

  assert.equal(travian.parseVillageCoordinates('').size, 0);
  assert.equal(travian.parseVillageCoordinates('nonsense line').size, 0);
});
