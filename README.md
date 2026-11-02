# Gerenciador de Atendimento WhatsApp - Técnicos da NIO

## Arquivos
- `index.html`: interface do aplicativo.
- `app.js`: funcionalidades, mensagens, histórico e relatórios.
- `manifest.json`: configuração de instalação PWA.
- `sw.js`: cache básico para abertura offline.
- `assets/icon.svg`: ícone do aplicativo.

## Instalação local
1. Extraia a pasta `gerenciador_whatsapp_nio`.
2. Para testar, abra um terminal nessa pasta e execute:
   - Windows: `py -m http.server 8080`
   - Linux/macOS: `python3 -m http.server 8080`
3. Acesse `http://localhost:8080`.

Não abra apenas pelo `file://` se quiser testar o PWA. O Service Worker precisa de `localhost` ou HTTPS.

## Hospedagem
Envie todos os arquivos e a pasta `assets` para a mesma pasta no servidor com HTTPS. Abra o endereço no Chrome/Android e use “Instalar aplicativo” ou “Adicionar à tela inicial”.

## Funcionalidades
- Modelos rápidos: Instalação, Reparo, Ausente, Agendamento, Finalização e Retorno.
- Edição e restauração dos textos padrão.
- Validação de telefone brasileiro com DDD.
- Link `wa.me` e abertura da conversa com texto preenchido.
- Histórico local, busca, filtro, reabertura e exclusão.
- Indicadores e relatório por tipo.
- Exportação CSV e backup/restauração JSON.
- QR Code do link (biblioteca carregada por CDN).
- Tema escuro.
- PWA com cache dos arquivos principais.

## Observações importantes
- O aplicativo não envia mensagens automaticamente. Ele abre o WhatsApp com o texto preenchido; o técnico precisa revisar e tocar em Enviar.
- Os dados ficam no LocalStorage do navegador e não são sincronizados entre aparelhos. Limpar os dados do navegador pode apagar o histórico. Use Backup JSON para preservar os registros.
- O Bootstrap, Bootstrap Icons e a biblioteca de QR Code são carregados por CDN. A interface principal já aberta pode ser servida pelo cache, mas os estilos/ícones e QR Code podem depender de internet. Para uso totalmente offline, baixe essas bibliotecas e ajuste os caminhos no `index.html`.
- O QR Code pode ser escaneado por outro aparelho para abrir o link; ele não realiza o envio da mensagem.
- Use apenas para contatos e atendimentos autorizados, respeitando a privacidade dos clientes.
