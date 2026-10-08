/* Draws one build/upgrade circle onto a canvas that lies on the floor: one colour for all circles,
   a small icon of what it builds, the price (counts down while paying) and one short word. */
(function (TBS) {
  'use strict';

  const FC = TBS.FloorCircle = {};

  function icon(x, kind, cx, cy, s, col) {
    x.save();
    x.translate(cx, cy);
    x.scale(s / 64, s / 64);
    x.fillStyle = col; x.strokeStyle = col; x.lineWidth = 6; x.lineCap = 'round'; x.lineJoin = 'round';
    switch (kind) {
      case 'table':
        x.beginPath(); x.ellipse(0, -10, 28, 9, 0, 0, Math.PI * 2); x.fill();
        x.fillRect(-4, -6, 8, 30); x.fillRect(-16, 22, 32, 6);
        x.fillRect(-36, 2, 10, 16); x.fillRect(26, 2, 10, 16);
        break;
      case 'machine':
        x.fillRect(-26, -16, 52, 40); x.fillRect(12, -32, 10, 18);
        x.clearRect(-16, -6, 22, 14);
        break;
      case 'tank':
        x.fillRect(-18, -24, 36, 46); x.beginPath(); x.ellipse(0, -24, 18, 7, 0, 0, Math.PI * 2); x.fill();
        x.clearRect(-10, -10, 20, 4); x.clearRect(-10, 2, 20, 4);
        break;
      case 'up':
        x.beginPath(); x.moveTo(0, -30); x.lineTo(26, -2); x.lineTo(10, -2); x.lineTo(10, 28); x.lineTo(-10, 28); x.lineTo(-10, -2); x.lineTo(-26, -2); x.closePath(); x.fill();
        break;
      case 'price':
        x.beginPath(); x.moveTo(-28, -18); x.lineTo(10, -18); x.lineTo(30, 0); x.lineTo(10, 18); x.lineTo(-28, 18); x.closePath(); x.fill();
        x.globalCompositeOperation = 'destination-out'; x.font = '900 30px Arial'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('$', -6, 2);
        break;
      case 'worker':
        x.beginPath(); x.arc(0, -4, 22, Math.PI, 0); x.fill(); x.fillRect(-30, -4, 60, 8);
        x.beginPath(); x.arc(0, 18, 14, 0, Math.PI * 2); x.fill();
        break;
      case 'carry':
        x.fillRect(-28, 18, 56, 6); x.fillRect(-18, 2, 36, 12); x.fillRect(-14, -12, 28, 12); x.fillRect(-10, -26, 20, 12);
        break;
      case 'speed':
        x.beginPath(); x.moveTo(6, -32); x.lineTo(-18, 4); x.lineTo(-2, 4); x.lineTo(-8, 32); x.lineTo(18, -6); x.lineTo(2, -6); x.closePath(); x.fill();
        break;
      case 'cashier':
        x.fillRect(-26, -2, 52, 26); x.fillRect(-18, -24, 36, 18); x.clearRect(-12, -18, 24, 8);
        break;
      case 'counter':
        x.fillRect(-32, -6, 64, 12); x.fillRect(-28, 6, 6, 20); x.fillRect(22, 6, 6, 20);
        break;
      default:
        x.beginPath(); x.arc(0, 0, 20, 0, Math.PI * 2); x.fill();
    }
    x.restore();
  }

  FC.draw = function (x, o, remaining, fill) {
    const col = TBS.CONFIG.COLORS.buildCircle, W = 256, c = W / 2;
    x.clearRect(0, 0, W, W);
    // dark disc so the price reads on any floor
    x.beginPath(); x.arc(c, c, 118, 0, Math.PI * 2); x.fillStyle = 'rgba(14,20,58,0.74)'; x.fill();
    // fill grows clockwise from the top while paying
    if (fill > 0) {
      x.beginPath(); x.moveTo(c, c); x.arc(c, c, 112, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, fill)); x.closePath();
      x.fillStyle = 'rgba(255,210,58,0.55)'; x.fill();
    }
    x.beginPath(); x.arc(c, c, 116, 0, Math.PI * 2); x.lineWidth = 9; x.strokeStyle = col; x.stroke();
    const k = TBS.CONFIG.LAYOUT.PRICE_TEXT_STRETCH || 1;
    icon(x, o.icon, c, 60, 46, '#ffffff');
    x.fillStyle = '#ffffff'; x.textAlign = 'center'; x.textBaseline = 'middle';
    const txt = o.gems ? String(o.gems) : TBS.U.fmtShort(remaining);
    x.save(); x.translate(c, 132); x.scale(1, k);
    x.font = '900 ' + (txt.length > 5 ? 50 : 62) + 'px "Segoe UI", Arial, sans-serif';
    if (o.gems) { // gem price: a blue diamond next to the number
      const w = x.measureText(txt).width, gx = -w / 2 - 22;
      x.beginPath(); x.moveTo(gx, 22); x.lineTo(gx - 22, -4); x.lineTo(gx - 12, -20); x.lineTo(gx + 12, -20); x.lineTo(gx + 22, -4); x.closePath();
      x.fillStyle = '#5cc6ff'; x.fill();
      x.fillStyle = '#ffffff'; x.fillText(txt, 14, 0);
    } else x.fillText(txt, 0, 0);
    x.restore();
    // upgrades say which level they give ("Machine Lv 3", the last one "Machine MAX")
    const word = o.kind === 'upgrade' && o.toLevel ? o.label + ' ' + (o.toLevel >= o.maxLevel ? 'MAX' : 'Lv ' + o.toLevel) : o.label;
    x.save(); x.translate(c, 196); x.scale(1, k);
    x.font = '800 ' + (word.length > 11 ? 24 : 28) + 'px "Segoe UI", Arial, sans-serif';
    x.fillStyle = '#ffe9a8';
    x.fillText(word, 0, 0);
    x.restore();
  };
})(window.TBS = window.TBS || {});
