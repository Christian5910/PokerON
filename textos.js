/* ==========================================================================
   PokerON! - textos.js (os textos do Como Jogar; sem lógica)
   Três abas: O site, O jogo e Estratégia. O marcador {{tabela}} vira a tabela de mãos com as cartas desenhadas.
   ========================================================================== */
window.PTXT = (function () {
  'use strict';

  const site = `
<h3>Dois jeitos de jogar</h3>
<p>O PokerON! joga <b>Texas Hold'em sem limite de aposta</b>, o poker mais famoso do mundo, e tem dois modos. Você escolhe no botão da partida, no alto da tela.</p>
<ul>
  <li><b>Poker no aparelho:</b> as cartas aparecem na tela. O jogo embaralha, distribui, abre as cartas da mesa e diz quem ganhou. Dá para jogar contra robôs, passar o aparelho entre amigos ou misturar pessoas e robôs. É uma partida honesta: não existe retroceder.</li>
  <li><b>Mesa com cartas reais:</b> você joga com baralho e fichas de verdade, e o aparelho faz o papel de dealer e de banco. Ele controla quem é o dealer, os blinds, de quem é a vez, as apostas, os potes (inclusive os laterais) e as fichas de cada um. Não aparece nenhuma carta na tela. Aqui dá para <b>retroceder a ação</b>, tirar e chamar jogadores no meio da noite e corrigir fichas.</li>
</ul>

<h3>A tela do jogo</h3>
<p>No alto fica o botão da <b>partida</b>, que mostra o modo, quantos jogadores há e em que mão está. Tocando nele você começa outra partida. Abaixo ficam o <b>pote</b>, a <b>rodada</b> (pré-flop, flop, turn ou river) e os <b>blinds</b>, depois a <b>mesa</b>, a caixa de ação, o quadro dos jogadores e a lista das últimas jogadas.</p>
<p>No computador e com o celular deitado, os controles ficam numa coluna à esquerda e a mesa fica à direita, sempre à vista.</p>

<h3>A mesa e os marcadores</h3>
<ul>
  <li>No modo no aparelho, a mesa é oval, com cada jogador num assento: nome, fichas, as duas cartas viradas para baixo e o que ele fez (aposta, passou, desistiu, all-in). A borda amarela mostra de quem é a vez e a verde mostra quem ganhou a mão.</li>
  <li>As cartas da mesa ficam no centro, com o valor do pote logo acima.</li>
  <li>O círculo branco com <b>D</b> marca o <b>dealer</b>. Os azuis com <b>SB</b> e <b>BB</b> marcam quem paga o <b>blind pequeno</b> e o <b>blind grande</b> naquela mão.</li>
  <li>Na mesa com cartas reais não há oval: os jogadores aparecem numa lista, com as mesmas marcas.</li>
</ul>

<h3>Começar uma partida</h3>
<p>Toque no botão da partida e escolha o modo.</p>
<p><b>Poker no aparelho:</b></p>
<ol>
  <li>Escolha quantos <b>jogadores</b> há na mesa, de 2 a 9.</li>
  <li>Escolha quantos deles são <b>pessoas</b>. Com 1 pessoa, você joga contra robôs. Com mais, o aparelho passa de mão em mão.</li>
  <li>Digite o nome de cada pessoa, se quiser.</li>
  <li>Se houver robôs, escolha o <b>nível</b>, de 1 a 5, ou "Variados", que mistura níveis.</li>
  <li>Escolha as <b>fichas</b> de cada um e se os blinds <b>sobem</b> a cada algumas mãos.</li>
  <li>Toque em <b>Jogar</b>.</li>
</ol>
<p><b>Mesa com cartas reais:</b></p>
<ol>
  <li>Escolha quantos jogadores há, de 2 a 10, e digite os nomes.</li>
  <li>Digite as <b>fichas</b> de cada um, o <b>blind pequeno</b>, o <b>blind grande</b> e, se usar, o <b>ante</b>.</li>
  <li>Escolha se os blinds sobem sozinhos a cada algumas mãos ou só quando você mandar.</li>
  <li>Toque em <b>Jogar</b>. O aparelho sorteia o dealer.</li>
</ol>
<p>O botão <b>Nova partida</b>, no fim da tela, recomeça com as mesmas escolhas. Se a partida estiver em andamento, o jogo pergunta antes de abandoná-la.</p>

<h3>A caixa de ação</h3>
<p>Abaixo da mesa, uma frase diz de quem é a vez e quanto custa continuar. Na sua vez aparecem três botões:</p>
<ul>
  <li><b>Desistir:</b> você larga a mão e perde o que já colocou. Quando ninguém apostou, desistir fica desligado, porque passar não custa nada.</li>
  <li><b>Passar</b> (quando ninguém apostou) ou <b>Pagar</b> (quando alguém apostou): você continua na mão. Se pagar custar todas as suas fichas, o botão diz <b>Pagar tudo</b>.</li>
  <li><b>Apostar</b> ou <b>Aumentar para</b>: você coloca mais fichas na mesa. O valor se escolhe na barra logo abaixo, ou nos atalhos <b>Mín</b>, <b>½ pote</b>, <b>Pote</b> e <b>Tudo</b>. No valor máximo, o botão vira <b>All-in</b>.</li>
</ul>

<h3>Suas cartas</h3>
<p>No modo no aparelho, as suas duas cartas aparecem num quadro acima dos botões, grandes e com o nome da sua melhor mão naquele momento (por exemplo, "Par de damas"). Em Ajudas dá para esconder o nome da mão.</p>

<h3>Tabela de mãos, sempre à mão</h3>
<p>O botão <b>Tabela de mãos</b> fica sempre visível, nos dois modos, e abre a lista das 10 combinações da mais forte para a mais fraca, com exemplo e chance de cada uma. No modo no aparelho, a combinação que você tem naquele momento vem destacada. No teclado, a letra <b>T</b> abre a tabela. A mesma tabela está na aba "O jogo".</p>

<h3>Os robôs jogam sozinhos</h3>
<p>Na vez de um robô, o assento dele acende e a lista de <b>últimas jogadas</b> conta o que ele fez. Em Ajudas dá para escolher a velocidade dos robôs. Se você for eliminado, a partida continua entre os robôs e o botão <b>Acelerar até o fim</b> faz as mãos passarem quase na hora.</p>

<h3>Mais de uma pessoa no mesmo aparelho</h3>
<p>Antes de cada vez de uma pessoa aparece uma tela escura pedindo para <b>passar o aparelho</b>. Ela esconde as cartas até a pessoa tocar em "Estou pronto". Assim ninguém vê a mão do outro. Depois da jogada as cartas somem de novo. As cartas só aparecem para todos no showdown, quando elas precisam ser mostradas.</p>

<h3>Mesa com cartas reais: o passo a passo</h3>
<ol>
  <li>Embaralhe, distribua duas cartas para cada um e toque em <b>Começar a mão</b>. Os blinds saem sozinhos das fichas de quem deve pagá-los.</li>
  <li>Cada um joga na sua vez: o aparelho mostra de quem é e quanto custa continuar. Quem toca nos botões é a própria pessoa da vez (ou o dealer por ela).</li>
  <li>Quando a rodada de apostas termina, o aparelho avisa para <b>abrir o flop</b>, depois o <b>turn</b> e o <b>river</b>. Abra as cartas na mesa de verdade e toque em <b>continuar</b>.</li>
  <li>No fim, mostrem as cartas e toque em <b>Quem ganhou?</b>. Marque o vencedor de cada pote. Se houve empate, marque os dois: o pote é dividido.</li>
  <li>Toque em <b>Próxima mão</b>. O botão do dealer anda uma casa para a esquerda.</li>
</ol>
<ul>
  <li><b>Retroceder ação:</b> desfaz a última coisa que foi feita (uma aposta, abrir uma rodada, escolher o vencedor, mudar fichas). Dá para voltar várias vezes seguidas.</li>
  <li><b>Jogadores e fichas:</b> troca nomes, corrige fichas (entre uma mão e outra), escolhe ou sorteia o dealer, tira um jogador da mesa e chama um novo. Quem é chamado no meio de uma mão entra na seguinte. Quem sai no meio de uma mão desiste dela.</li>
  <li><b>Blinds:</b> muda o blind pequeno, o grande e o ante a qualquer momento (vale na próxima mão) ou sobe para o próximo nível com um toque.</li>
</ul>

<h3>Salvamento</h3>
<p>A partida é salva sozinha a cada jogada, neste aparelho. Se você fechar a página, ao voltar ela está lá, e você toca em Continuar. Cada aparelho tem o seu jogo.</p>

<h3>Ajudas</h3>
<p>No fim da tela, o painel <b>Ajudas</b> tem duas escolhas, salvas neste aparelho:</p>
<ul>
  <li><b>Robôs:</b> a velocidade com que eles jogam, rápida, normal ou lenta.</li>
  <li><b>Nome da mão:</b> mostrar ou esconder o nome da combinação que você tem.</li>
</ul>

<h3>Teclado</h3>
<ul>
  <li><b>T</b> abre a tabela de mãos.</li>
  <li><b>F</b> desiste e <b>C</b> passa ou paga, quando for a sua vez.</li>
  <li>Tab anda pelos botões e Enter ou Espaço os acionam.</li>
</ul>

<h3>Sorte de verdade</h3>
<p>Cada partida nasce de uma <b>semente aleatória de 128 bits</b>, misturada com a hora, o tempo de uso, medidas do aparelho e o sorteio do navegador. Com ela, o baralho é embaralhado em cada mão por um método sem viés, que dá a todas as ordens possíveis a mesma chance. Por isso duas partidas nunca saem iguais, em nenhum aparelho. Os robôs não enxergam as suas cartas nem as do baralho.</p>

<h3>Menu, estatísticas e configurações</h3>
<p>O botão do menu (as três linhas, no canto) abre a lista dos outros jogos, as <b>estatísticas</b> (partidas, vitórias, mãos jogadas e ganhas, maior pote e melhor mão num showdown) e as <b>configurações</b>: som, vibração, modo escuro e reduzir animações. Se o modo escuro nunca foi escolhido, o jogo segue o do seu aparelho.</p>

<h3>Instalar e jogar sem internet</h3>
<p>O PokerON! funciona offline depois da primeira visita. No menu há o botão de instalar, que coloca o jogo na tela inicial do celular ou no computador, como um aplicativo. Nada do que você joga sai do seu aparelho.</p>

<h3>Só neste aparelho</h3>
<p>O jogo não tem partida online pela internet: as pessoas precisam estar juntas, passando o aparelho ou usando a mesa com cartas reais.</p>
`;

  const jogo = `
<h3>Objetivo</h3>
<p>Ganhar fichas. Em cada mão, você faz a melhor combinação de 5 cartas que conseguir, usando as suas 2 cartas e as 5 que ficam abertas no centro da mesa, ou faz todos os outros desistirem antes do fim. No modo no aparelho, a partida acaba quando um jogador fica com todas as fichas. Quem fica sem fichas é eliminado.</p>

<h3>O que cada um recebe</h3>
<p>Cada jogador recebe <b>2 cartas viradas para baixo</b>, só dele. No centro da mesa vão aparecer, aos poucos, <b>5 cartas abertas</b>, que valem para todos. O baralho tem 52 cartas, sem coringa.</p>

<h3>O dealer e os blinds</h3>
<p>Em cada mão, um jogador é o <b>dealer</b> (o botão D). O botão anda uma casa para a esquerda a cada mão, para ninguém ficar sempre na melhor ou na pior posição.</p>
<ul>
  <li>O jogador à esquerda do dealer paga o <b>blind pequeno</b> (SB) e o seguinte paga o <b>blind grande</b> (BB), que vale o dobro. São apostas obrigatórias, colocadas antes de ver as cartas, para o pote nunca começar vazio.</li>
  <li>Se o jogo tiver <b>ante</b>, todos colocam uma fichinha extra no pote antes de cada mão.</li>
  <li>Com <b>só 2 jogadores</b> (o "heads-up"), o dealer paga o blind pequeno e age primeiro antes do flop. Depois do flop, o outro age primeiro.</li>
  <li>Quem tem menos fichas que o blind paga o que tem e fica em all-in.</li>
</ul>

<h3>As quatro rodadas de apostas</h3>
<ol>
  <li><b>Pré-flop:</b> com as 2 cartas na mão, começa quem está à esquerda do blind grande e segue em roda.</li>
  <li><b>Flop:</b> 3 cartas abertas no centro. Começa o primeiro jogador ainda na mão à esquerda do dealer.</li>
  <li><b>Turn:</b> mais 1 carta aberta.</li>
  <li><b>River:</b> a última carta aberta.</li>
</ol>
<p>Se sobrar um só jogador a qualquer momento, os outros desistiram e ele ganha o pote sem mostrar as cartas. Se mais de um chegar ao fim do river, vem o <b>showdown</b>: as cartas são mostradas e vence a melhor combinação.</p>

<h3>O que dá para fazer na sua vez</h3>
<ul>
  <li><b>Desistir (fold):</b> larga a mão. O que já foi colocado no pote fica lá.</li>
  <li><b>Passar (check):</b> não aposta nada e segue na mão. Só dá quando ninguém apostou nessa rodada, ou quando você já tem o maior valor colocado.</li>
  <li><b>Pagar (call):</b> iguala a maior aposta da rodada.</li>
  <li><b>Apostar (bet)</b> ou <b>aumentar (raise):</b> coloca mais fichas. Apostar é abrir a rodada. Aumentar é subir uma aposta que já existe.</li>
  <li><b>All-in:</b> colocar todas as fichas de uma vez.</li>
</ul>
<p>A rodada só acaba quando todos que continuam na mão <b>igualaram</b> a maior aposta (ou estão em all-in) e todos já tiveram a sua vez.</p>

<h3>Sem limite: quanto dá para apostar</h3>
<p>No Texas Hold'em <b>sem limite (no-limit)</b>, você pode apostar de uma vez qualquer valor, até todas as suas fichas. Há só um piso:</p>
<ul>
  <li>A aposta mínima, ao abrir a rodada, é o valor do blind grande.</li>
  <li>Um aumento mínimo precisa ter <b>o tamanho do aumento anterior</b> na mesma rodada, pelo menos. Se alguém apostou 100 e você quer aumentar, o mínimo é para 200 (100 mais um aumento de 100). Se alguém aumentou de 100 para 300, o próximo aumento mínimo é para 500.</li>
  <li>Um all-in <b>menor que o aumento mínimo</b> vale e todos precisam pagar, mas ele <b>não reabre</b> as apostas para quem já tinha falado: essas pessoas só podem pagar ou desistir.</li>
</ul>

<h3>Potes laterais</h3>
<p>Quando alguém entra em all-in com menos fichas que os outros, ele só disputa o que conseguiu cobrir. O resto das apostas forma um <b>pote lateral</b>, disputado só pelos jogadores que colocaram aquelas fichas. O jogador do all-in pode ganhar o pote principal e perder o lateral, e vice-versa. O jogo calcula tudo isso sozinho.</p>
<p>Se uma aposta ficar maior do que qualquer outro jogador consegue pagar, a parte que ninguém cobriu <b>volta</b> para quem apostou.</p>

<h3>As mãos, da mais forte para a mais fraca</h3>
<p>Vale a melhor combinação de 5 cartas, escolhida entre as 7 disponíveis (as suas 2 e as 5 da mesa). Os naipes não têm valor, e o ás vale mais que o rei (ou menos que o 2, só na sequência A-2-3-4-5).</p>
{{tabela}}

<h3>Desempates</h3>
<ul>
  <li>Mãos da mesma categoria: vence a que tem as cartas mais altas naquela combinação (um par de damas vence um par de valetes).</li>
  <li>Se o grupo for igual, valem as <b>cartas de fora</b> (os "kickers"): ás e dama contra ás e valete num par de ases é vitória do primeiro.</li>
  <li>Se tudo for igual, é <b>empate</b> e o pote é dividido. Se sobrar uma ficha na divisão, ela vai para o jogador mais próximo, à esquerda do dealer.</li>
  <li>Às vezes a melhor mão está inteira na mesa. Aí todo mundo que continua tem a mesma mão e o pote é dividido.</li>
</ul>

<h3>Fim da mão e da partida</h3>
<p>Depois do pote, o botão do dealer anda e começa outra mão. No modo no aparelho, quem perde todas as fichas é eliminado e o jogo registra a posição final. Os blinds podem subir a cada algumas mãos, em degraus, para a partida chegar a um vencedor. Na mesa com cartas reais não há fim marcado: vocês param quando quiserem.</p>

<h3>Como o aparelho cuida do baralho</h3>
<p>No modo no aparelho, o baralho é embaralhado de novo a cada mão, com uma sorte sem viés, e as cartas saem na ordem de sempre: duas para cada um, uma a uma, a partir da esquerda do dealer, e depois as da mesa. Os robôs só sabem o que um jogador de verdade sabe: as próprias cartas, as da mesa, as fichas e o que cada um fez.</p>
`;

  const estrategia = `
<h3>Posição vale ouro</h3>
<p>Quem age por último numa rodada sabe o que todos fizeram antes. Por isso, <b>perto do dealer você pode jogar mais mãos</b>, e logo depois dos blinds, bem menos. Quem entra primeiro com uma mão fraca costuma pagar caro por isso.</p>

<h3>Antes do flop: escolha as suas mãos</h3>
<ul>
  <li>Jogue com folga os <b>pares</b> e as cartas altas (A, K, Q, J), principalmente do mesmo naipe ou em sequência.</li>
  <li>Evite mãos fracas e soltas, como um 9 com um 3 de naipes diferentes. Elas parecem "quase boas" e custam fichas.</li>
  <li>Quando for entrar, prefira <b>aumentar</b> a só pagar. Aumentar pode fazer os outros desistirem e dá o controle da mão.</li>
  <li>Se alguém aumentou muito antes de você, jogue só mãos fortes.</li>
</ul>

<h3>Conte o preço: as "odds do pote"</h3>
<p>Antes de pagar, compare o valor que você precisa colocar com o pote. Se o pote tem 300 e você paga 100, está pagando 1 para ganhar 3 (e arriscando 25% do pote final). Se as suas chances de ganhar são maiores que isso, pagar compensa no longo prazo. Se o pote, já com a aposta do outro, tem 200 e você paga 100, você precisa ganhar pelo menos metade das vezes.</p>
<p>Um <b>projeto</b> (por exemplo, quatro cartas do mesmo naipe esperando a quinta) tem cerca de 1 chance em 5 de completar numa carta só e perto de 1 em 3 em duas cartas. Use isso para decidir se vale pagar.</p>

<h3>Depois do flop</h3>
<ul>
  <li>Pergunte-se o que a sua mão <b>é</b> e o que ela <b>pode virar</b>. Mãos prontas (trinca, dois pares fortes) pedem aposta. Projetos pedem preço bom.</li>
  <li>Cuidado com mesas "molhadas", com cartas em sequência ou do mesmo naipe: muita gente tem projeto, e uma mão que parecia boa pode ser superada. Já numa mesa "seca", com cartas soltas, um par forte vale mais.</li>
  <li>Quando você aposta, tenha um motivo: ganhar mais de quem tem pior (aposta por valor) ou fazer desistir quem tem melhor (blefe).</li>
</ul>

<h3>Tamanho das apostas</h3>
<p>Apostas entre metade e três quartos do pote costumam funcionar bem: dão um preço ruim para quem tem projeto e não arriscam demais. Apostas muito pequenas convidam todo mundo a pagar. Apostar sempre o mesmo valor com mão forte e com mão fraca também ajuda a não ser lido.</p>

<h3>Blefar com cuidado</h3>
<ul>
  <li>Blefe quando a história que você conta faz sentido: você mostrou força antes e a mesa ajuda a sua história.</li>
  <li>Blefe contra poucos jogadores. Contra muitos, sempre alguém tem algo.</li>
  <li>Contra quem paga tudo, não blefe: aposte por valor. Contra quem desiste fácil, blefe mais.</li>
</ul>

<h3>Cuide das fichas</h3>
<ul>
  <li>Nada de all-in com mão mediana quando ainda dá para esperar uma melhor. Com poucas fichas (uns 10 blinds grandes ou menos), as jogadas viram "tudo ou nada" e esperar custa caro: os blinds comem as fichas.</li>
  <li>Quem tem muitas fichas pode pressionar quem tem poucas, porque o outro não quer arriscar a partida.</li>
  <li>Perder uma mão boa por azar acontece. Se você fez a jogada certa, siga em frente sem mudar o seu jogo.</li>
</ul>

<h3>Na mesa com cartas reais</h3>
<ul>
  <li>Combinem antes os blinds e quando eles sobem. Sem isso, a noite pode não ter fim.</li>
  <li>Quem acabou de fazer uma jogada pode se enganar de botão: use <b>Retroceder ação</b> sem cerimônia.</li>
  <li>Se faltar jogador, é fácil tirar da mesa. Se chegar alguém, dá para chamar com as fichas combinadas.</li>
</ul>

<h3>Contra os robôs</h3>
<ul>
  <li>Os níveis 1 e 2 deixam você treinar o básico: escolher mãos e contar o pote.</li>
  <li>No nível 3, o robô compara as chances de ganhar com o preço de pagar. Ele não blefa, então uma aposta grande dele quase sempre tem mão.</li>
  <li>Nos níveis 4 e 5, o robô também blefa e aposta com mãos médias. Não desista só porque ele apostou: veja o preço e a sua mão.</li>
  <li>O nível 5 percebe como cada um joga. Se você paga quase tudo, ele blefa menos contra você. Se você desiste fácil, ele aperta mais.</li>
  <li>Os robôs não olham as suas cartas. Jogam só com o que um jogador de verdade enxerga.</li>
</ul>
`;

  return { site, jogo, estrategia };
})();
