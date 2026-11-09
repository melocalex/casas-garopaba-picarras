# Casas anuais · Garopaba & Balneário Piçarras

Painel estático (HTML + CSS + JS) para acompanhar **casas** de locação anual/longa em Garopaba (SC) e Balneário Piçarras (SC).

## Como os dados funcionam

- Fonte única: [`data.json`](./data.json)
- O site lê esse arquivo no carregamento (`fetch('./data.json')`).
- Para atualizar o painel após uma nova busca diária: edite `data.json` (e, se houver, adicione fotos em `images/`), faça commit e push em `main`. O GitHub Pages publica automaticamente.

### Campos principais por casa

`id`, `cidade`, `bairro`, `titulo`, `url`, `fonte`, `aluguel`, `taxas`, `total_estimado`, `quartos`, `banheiros`, `area_m2`, `anual`, `disponibilidade`, `praia_declarada`, `pets`, `mobiliado`, `nota_qualidade`, `veredito`, `pros`, `contras`, `analise`, `foto`, `status`, `visto_em`, `adicionado_em`.

Campos desconhecidos ficam vazios/`null` e o site mostra **não informado**.

## Escopo

- Somente **casas** (sem apartamentos).
- Garopaba: sem Gamboa e sem Siriú como foco de busca.
- Distância da praia: **somente se o anúncio declarar**.

## Local

Abra `index.html` via um servidor estático (por causa do `fetch`), ou use o Pages:

`https://melocalex.github.io/casas-garopaba-picarras/`

## Licença de uso

Uso pessoal para acompanhamento de busca. Anúncios e fotos pertencem aos respectivos portais/imobiliárias.
