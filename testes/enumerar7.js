/* Conta, em todas as 133.784.560 combinações de 7 cartas, quantas dão cada melhor mão. (node testes/enumerar7.js) */
const P = require('../regras.js');
const cont = new Array(10).fill(0), a = new Array(7);
let total = 0;
for (a[0] = 0; a[0] < 46; a[0]++) for (a[1] = a[0] + 1; a[1] < 47; a[1]++) for (a[2] = a[1] + 1; a[2] < 48; a[2]++)
  for (a[3] = a[2] + 1; a[3] < 49; a[3]++) for (a[4] = a[3] + 1; a[4] < 50; a[4]++) for (a[5] = a[4] + 1; a[5] < 51; a[5]++)
    for (a[6] = a[5] + 1; a[6] < 52; a[6]++) { cont[P.categoria(P.avaliar(a))]++; total++; }
console.log(JSON.stringify({ total, cont, pct: cont.map((x) => +(100 * x / total).toFixed(4)) }));
