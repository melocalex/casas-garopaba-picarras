# Casas anuais · Garopaba · Piçarras · Praia de Leste · Itapoá

Painel estático (HTML + CSS + JS) para acompanhar **casas** de locação anual/longa em:

- Garopaba (SC)
- Balneário Piçarras (SC)
- Pontal do Paraná — Praia de Leste (PR)
- Itapoá — Itapema do Norte (SC)

## Como os dados funcionam

- Fonte única: [`data.json`](./data.json)
- O site lê esse arquivo no carregamento (`fetch('./data.json')`).
- `transporte_app`: cobertura de Uber, 99, inDrive e táxi/app local nas 4 cidades, com status `confirmado` / `não confirmado` e links das fontes.
- Campos úteis: `aluguel`, `taxas`, `total_estimado`, `anual`, `distancia_mar` / `distancia_mar_metros` (somente se o anúncio declarar), `nota_qualidade`, `veredito`, `foto`.
- Para atualizar: edite `data.json`, adicione fotos em `images/`, commit e push em `main`. GitHub Pages publica automaticamente.

## Regras da busca

- Somente casas (sem apartamentos)
- Orçamento até ~R$ 3.500/mês (aluguel + taxas quando informadas)
- Exclui temporada/diária e “anual só de março”
- Distância do mar: nunca inventada — só texto do anúncio (ou `null`)
- OLX: às vezes entra via análise manual (fetch bloqueado com 403)

## Site

https://melocalex.github.io/casas-garopaba-picarras/

## Transporte por app

A seção **Transporte por app** do painel vem de `transporte_app` em `data.json` (pesquisa em 10/11/2026, America/Sao_Paulo). Só marcamos **confirmado** com página oficial ou fonte primária; listagem no site do app não garante carro na hora.
