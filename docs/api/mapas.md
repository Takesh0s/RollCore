# Mapas

Mapas de batalha das ferramentas do mestre (GM Tools). Todas as rotas exigem o token de acesso (`Authorization: Bearer ...`).

| Rota | Resposta |
|---|---|
| `GET /maps` | os mapas do usuário, o mais recentemente editado primeiro |
| `POST /maps` | 201 com o mapa criado |
| `GET /maps/{id}` | o mapa (próprio ou publicado); 404 se for de outra pessoa e não estiver publicado |
| `PUT /maps/{id}` | salva o mapa (só o autor); 403 para os demais |
| `DELETE /maps/{id}` | 204 (só o autor) |
| `POST /maps/{id}/publish` | compartilha na Oficina da Comunidade (só o autor) |
| `POST /maps/{id}/unpublish` | tira da Oficina (só o autor) |
| `POST /maps/{id}/copy` | 201: copia um mapa próprio ou publicado para a biblioteca de quem pediu (volta como não publicado) |
| `GET /maps/community?q=&kind=` | mapas publicados, os mais novos primeiro (até 40); `q` filtra pelo nome e `kind` pelo tipo |

## Corpo de `POST /maps` e `PUT /maps/{id}`
```json
{
  "name": "Cripta do Lich",
  "kind": "MEDIEVAL",
  "gridType": "SQUARE",
  "cols": 30,
  "rows": 20,
  "cellSize": 48,
  "imageId": "uuid devolvido por POST /images (opcional)",
  "layers": "{\"cells\":{\"grass\":[0,1,31]},\"fog\":[5,6]}",
  "gridVisible": true,
  "fogEnabled": false
}
```

| Campo | Regra |
|---|---|
| `name` | 3 a 100 caracteres |
| `kind` | `MEDIEVAL`, `STEAMPUNK`, `CYBERPUNK`, `WESTERN`, `PIRATE` ou `MODERN` |
| `gridType` | `SQUARE` ou `HEX` |
| `cols`, `rows` | 5 a 100 |
| `cellSize` | 16 a 128 (pixels) |
| `imageId` | imagem de fundo enviada pelo próprio usuário em `POST /images`; omitir (ou `null`) deixa o mapa em branco |
| `layers` | texto com um objeto JSON de até 200 mil caracteres (ver abaixo) |

A resposta traz os mesmos campos mais `id`, `imageUrl` (`/images/{id}`), `published`, `authorName`, `mine` (o chamador é o autor) e `updatedAt`.

## `layers`
O servidor só confere que é um objeto JSON de tamanho limitado; quem define o conteúdo são os clientes.
O formato atual guarda índices de células (`índice = linha * cols + coluna`), não pixels, para ficar pequeno:

- `cells`: terreno → lista de células pintadas com ele;
- `fog`: células já reveladas (usado quando `fogEnabled` é verdadeiro).

## Regras
- Cada usuário pode ter até 30 mapas (`rollcore.maps.max-per-user`); passou disso, `POST /maps` e `POST /maps/{id}/copy` respondem 409.
- A imagem de fundo reaproveita o upload de imagens (JPEG, PNG ou WebP, até 2 MB). Só dá para usar uma imagem que o próprio usuário enviou.
- Uma cópia continua apontando para a imagem do original. A imagem só é apagada quando o último mapa que a usa é excluído, e só por quem a enviou.
- Excluir a conta apaga os mapas da pessoa; as cópias de outros usuários ficam sem a imagem de fundo.
- `kind` desconhecido em `?kind=` responde 400.
