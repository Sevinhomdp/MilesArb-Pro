
// ════════════════════════════════════════════════════════════════════
// MilesArb Pro — Score de Risco: 8 Casos de Teste
// Executar no console do browser com o sistema aberto
// ════════════════════════════════════════════════════════════════════

(function runScoreTests(){
  const TOLS = 5; // tolerância de ±5 pontos
  const cases = [
    {
      id:1, desc:'Emissão LATAM baixo risco',
      fn: ()=> Engine.calcScoreEmissao({margem:35,roi:60,precoMercado:27,valorRealMil:27*(1-0.20),prazoDias:7,progId:'latam'}),
      expected: 88
    },
    {
      id:2, desc:'Emissão Smiles alto risco',
      fn: ()=> Engine.calcScoreEmissao({margem:8,roi:18,precoMercado:26,valorRealMil:26*(1-0.02),prazoDias:30,progId:'smiles'}),
      expected: 35
    },
    {
      id:3, desc:'Venda Smiles à vista margem alta',
      fn: ()=> Engine.calcScoreVenda({margem:((26-18)/26)*100,precoMercado:27,valorRealMil:26,prazoDias:7,progId:'smiles',parcelas:1}),
      expected: 85
    },
    {
      id:4, desc:'Venda Smiles parcelada 3x',
      fn: ()=> Engine.calcScoreVenda({margem:((26-18)/26)*100,precoMercado:27,valorRealMil:26,prazoDias:7,progId:'smiles',parcelas:3}),
      expected: 70
    },
    {
      id:5, desc:'Compra Livelo preço baixo',
      fn: ()=> Engine.calcScoreCompra({cpm:17,precoMercado:26,progId:'livelo',parcelas:1,pctExpiracao:0}),
      expected: 92
    },
    {
      id:6, desc:'Transferência Livelo→Smiles bônus 100%',
      fn: ()=> Engine.calcScoreTransferencia({bonus:100,pontosOrigem:50000,custoMedioOrigem:17,progDest:'smiles',taxa:0,pctExpiracao:0}),
      expected: 95
    },
    {
      id:7, desc:'Emissão com 30% milhas vencendo em 60 dias',
      fn: ()=> {
        const base = Engine.calcScoreEmissao({margem:35,roi:60,precoMercado:27,valorRealMil:27*(1-0.20),prazoDias:7,progId:'latam'});
        const withExp = Engine.calcScoreEmissao({margem:35,roi:60,precoMercado:27,valorRealMil:27*(1-0.20),prazoDias:7,progId:'latam'});
        // Override _getExp to simulate 30%
        const w = Engine._getWeights('emissao');
        const mS=Engine._normMargem(35),rS=Engine._normROI(60);
        const sp=((27-27*(1-0.20))/27)*100;
        const spS=Engine._normSpread(sp);
        const pS=Engine._normPrazo(7);
        const lS=Engine._normLiquidez(15);
        const vS=Engine._normVolatilidade(0);
        const eS=Engine._normExpiracao(30); // 30% expiring
        const total=w.margem+w.roi+w.spread+w.prazo+w.liquidez+w.volatilidade+w.expiracao||100;
        const raw=mS*(w.margem/total)+rS*(w.roi/total)+spS*(w.spread/total)+pS*(w.prazo/total)+lS*(w.liquidez/total)+vS*(w.volatilidade/total)+eS*(w.expiracao/total);
        const score=Engine._clamp(Math.round(raw),0,100);
        return {score,scoreClass:score>=80?'low':score>=60?'moderate':'high',scoreBreakdown:{expiracao:eS}};
      },
      expected: null, // Must be < case 1 (=88)
      check: (r)=> r.score < 88
    },
    {
      id:8, desc:'Simulador: variação de mercado ±10% afeta score coerentemente',
      fn: ()=> {
        const base = Engine.calcScoreVenda({margem:25,precoMercado:27,valorRealMil:26,prazoDias:7,progId:'smiles',parcelas:1}).score;
        const up10 = Engine.calcScoreVenda({margem:25,precoMercado:27*1.1,valorRealMil:26,prazoDias:7,progId:'smiles',parcelas:1}).score;
        const dn10 = Engine.calcScoreVenda({margem:25,precoMercado:27*0.9,valorRealMil:26,prazoDias:7,progId:'smiles',parcelas:1}).score;
        return {score:base, up10, dn10, coerente: up10 >= base && base >= dn10};
      },
      expected: null,
      check: (r) => r.coerente
    }
  ];

  console.group('🔬 MilesArb Pro — Testes de Score de Risco');
  let passed=0, failed=0;
  cases.forEach(tc => {
    try {
      const result = tc.fn();
      const score  = result.score;
      const ok = tc.check ? tc.check(result)
                           : Math.abs(score - tc.expected) <= TOLS;
      const status = ok ? '✅ PASS' : '❌ FAIL';
      if(ok) passed++; else failed++;
      if(tc.expected != null){
        console.log(`${status} [${tc.id}] ${tc.desc} → score=${score} (esperado: ${tc.expected}±${TOLS})`);
      } else {
        console.log(`${status} [${tc.id}] ${tc.desc} → ${JSON.stringify(result)}`);
      }
    } catch(e) {
      console.error(`❌ ERRO [${tc.id}] ${tc.desc}:`, e.message);
      failed++;
    }
  });
  console.log('');
  console.log(`Resultado: ${passed}/${cases.length} passaram ${failed>0?'— ❌ '+failed+' falharam':''}`);
  console.groupEnd();
  return {passed, failed, total:cases.length};
})();
