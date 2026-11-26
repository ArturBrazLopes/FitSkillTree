# FitSkillTree

O FitSkillTree organiza treinos em uma árvore de desafios. Complete séries de flexões, agachamentos e abdominais para liberar novos exercícios, subir de nível e ganhar conquistas.

O app usa React Native, Expo e TypeScript. No Android, o Expo Go envia fotos da câmera ao MediaPipe no computador. O app recebe os pontos do corpo, desenha o esqueleto e conta as repetições. O progresso fica salvo no aparelho.

## O que está disponível

- **Desafios** — mapa interativo com pré-requisitos, metas e desbloqueio por conclusão.
- **Contagem pela câmera no Android** — agachamentos e abdominais comuns, flexões comuns e com apoio nos joelhos. As outras variações têm conclusão manual.
- **Habilidades** — ficha com Força, Resistência, Explosão e Controle, ganho percentual no jogo e seis conquistas. Cada desafio concluído pela primeira vez rende pontos, e cada dez pontos sobem um nível. O resumo aparece após salvar a conclusão.
- **Ajustes** — escolha do tema. A aba Histórico ainda está em preparação.

## Começar no Windows

Você precisa de Node.js 24.3 ou mais recente na linha 24, Python 3.12 e Expo Go compatível com o SDK 58. Use um celular Android para testar a contagem automática.

### 1. Instalar o projeto

```powershell
git clone https://github.com/ArturBrazLopes/FitSkillTree.git
cd FitSkillTree
npm.cmd ci

py -3.12 -m venv .venv
& .\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Em um checkout que você já baixou, comece por `npm.cmd ci` na raiz do projeto. O Metro usa o Python da `.venv` automaticamente. Se você usa outro ambiente virtual, configure `FITTECHTREE_PYTHON` com o caminho do executável Python que tem as dependências instaladas.

### 2. Baixar o modelo de pose

Baixe uma vez o modelo oficial **Pose Landmarker Lite**, versão 1, para `server/models`. O arquivo é uma dependência local do servidor. [Documentação do MediaPipe Pose Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker)

```powershell
$model = 'server/models/pose_landmarker_lite.task'
New-Item -ItemType Directory -Force (Split-Path $model) | Out-Null
Invoke-WebRequest -UseBasicParsing -Uri 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task' -OutFile $model
if ((Get-FileHash $model -Algorithm SHA256).Hash -ne '59929E1D1EE95287735DDD833B19CF4AC46D29BC7AFDDBBF6753C459690D574A') {
    throw 'O arquivo baixado não corresponde ao modelo esperado.'
}
```

### 3. Abrir o app no Expo Go

Com o celular e o PC na mesma rede, rode `npm.cmd start`. Se a rede impedir a conexão, encerre o Metro com **Ctrl+C** e rode pelo ngrok.

```powershell
npm.cmd start -- --tunnel ngrok
```

Escaneie o QR code no Expo Go. Abra **Desafios → 5 agachamentos**, permita o acesso à câmera e aguarde o contador. O Metro inicia o servidor Python quando o primeiro desafio com contagem automática precisa dele. O celular usa o endereço do próprio Expo, sem configuração de IP no app.

## Testar a contagem

| Exercício | Enquadramento | Ciclo que conta |
| --- | --- | --- |
| Agachamento | Fique em pé de lado para o celular, com quadril, joelho e tornozelo no quadro. | Comece em pé, desça até o joelho atingir 110° ou menos com o quadril baixando e volte a 160° ou mais. |
| Flexão | Posicione-se de frente para o celular, com a cabeça mais perto dele e os dois braços no quadro. | Os dois cotovelos começam em 142° ou mais, dobram até 125° ou menos e voltam a 142° ou mais. |
| Abdominal | Posicione-se de lado para o celular, com costas no chão, joelhos dobrados e ombro, quadril e joelho visíveis. | Os ombros sobem o equivalente a 15% do comprimento do tronco em relação ao quadril e voltam a até 7% da posição inicial. |

Faça movimentos controlados para que a câmera consiga amostrar cada fase. A meta de captura é de até 12 fotos por segundo. O indicador **FPS de análise** mostra o ritmo das respostas que realmente chegam, sujeito à câmera, ao PC e à conexão. Ao atingir a meta, toque em **Finalizar desafio** para salvar o progresso e ver as recompensas.

## Como o app funciona

| Caminho | Responsabilidade |
| --- | --- |
| `src/app` | Rotas, navegação e telas do Expo Router. |
| `src/features/tech-tree` | Catálogo, mapa, câmera, conta de repetições e progresso compartilhado. |
| `src/features/skills` | Pontuação, níveis, conquistas e resumo de recompensas. |
| `server` | O middleware do Metro encaminha as fotos ao servidor Python, que devolve os pontos do MediaPipe. |
| `tests` | Testes de contagem e progressão. |

Na rede local, as fotos seguem até o Metro no PC. Com ngrok, elas passam pelo túnel até o computador. O servidor Python analisa as imagens em memória. A captura usa fotos temporárias no aparelho e tenta removê-las após o processamento. Encerre o túnel ao terminar o teste. O AsyncStorage guarda a lista de desafios concluídos, que também alimenta a ficha de habilidades.

## Validação e diagnóstico

```powershell
npm.cmd run typecheck
node --test
```

- **O QR code não abre** — confirme a versão do Expo Go. Se LAN falhar, reinicie com `npm.cmd start -- --tunnel ngrok` e escaneie o QR code novo.
- **O detector não respondeu** — confira se o modelo existe em `server/models` e se a `.venv` tem os pacotes de `requirements.txt`. O terminal do Expo exibe o erro do processo Python.
- **A câmera abre, mas a contagem não anda** — confira o enquadramento, os indicadores no painel e os FPS de análise antes de testar outra série.

## Licença

O código do FitSkillTree usa a [licença MIT](LICENSE). O modelo baixado separadamente segue os termos publicados pelos responsáveis pelo MediaPipe. [Ficha do modelo Pose Landmarker Lite](https://huggingface.co/litert-community/MediaPipe-PoseLandmarker-Lite)
