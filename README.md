# Empreende Fácil

Aplicativo web em português para ajudar trabalhadores autônomos a organizar produtos, serviços, pedidos e movimentações de caixa.

## Recursos

- Cadastro, edição e exclusão de produtos e serviços.
- Pedidos com cliente, quantidade, preço combinado, entrega, observações e situação.
- Histórico dos pedidos preservado quando o preço do catálogo muda ou o item é excluído.
- Entradas e saídas por data e categoria, com resumo mensal em reais.
- Exportação de movimentações em CSV e cópia completa em JSON, com restauração validada.
- Guia de uso, interface responsiva, navegação por teclado e formulários com rótulos.
- Dados reais do usuário desde o primeiro acesso, sem indicadores ou resultados fictícios.

## Usar

Acesse o endereço do GitHub Pages deste repositório. Para executar localmente, sirva esta pasta com um servidor HTTP estático. Não há instalação de dependências nem etapa de compilação.

Exemplo com Python disponível no computador:

```sh
python -m http.server 8080
```

Depois acesse `http://localhost:8080`.

## Dados e privacidade

Os dados ficam no `localStorage` do navegador, separados por endereço do site. Não há login, banco de dados remoto, sincronização entre dispositivos, rastreamento ou envio dos registros para o GitHub. O GitHub Pages hospeda apenas os arquivos do aplicativo. As fontes são solicitadas ao Google Fonts; se estiverem indisponíveis, o navegador utiliza fontes locais.

Limpar os dados do navegador remove os registros. Use **Aprenda a usar → Exportar cópia** regularmente. O JSON permite restaurar os dados; o CSV permite consultar movimentações em planilhas. A restauração substitui os registros atuais e exige confirmação. A exclusão também exige confirmação.

Um navegador compartilhado não é adequado para guardar informações confidenciais. Registre apenas o necessário; não inclua senhas, documentos ou dados bancários. As cópias exportadas podem conter nomes de clientes e devem ser guardadas com cuidado.

## Regras de funcionamento

Os valores são calculados em centavos. O resumo financeiro considera o mês da data de cada movimentação. O saldo corresponde a entradas menos saídas e não equivale necessariamente ao lucro. Pedidos em aberto incluem todos os meses. Concluir um pedido não gera uma entrada automática: o recebimento é lançado separadamente para representar quando o dinheiro efetivamente entrou.

Um pedido salva o nome e o preço do item no momento do cadastro. Alterações posteriores no catálogo não modificam o valor dos pedidos existentes. As datas são tratadas como datas locais, sem conversão de fuso horário.

## Estrutura

- `index.html`: interface e guia.
- `styles.css`: estilos e adaptação para celular.
- `core.js`: validação, cálculos e exportação.
- `app.js`: interação, formulários e persistência.
- `icon.svg`: ícone.
- `tests.cjs`: testes das regras de negócio, executáveis com `node tests.cjs`.

Projeto de Thiago Correia de Melo, desenvolvido no contexto de estudos de Ciência da Computação, inovação e empreendedorismo tecnológico.
