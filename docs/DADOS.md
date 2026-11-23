# Modelo de dados — RollCore

Banco PostgreSQL 16. O esquema é versionado pelo Flyway em `backend/src/main/resources/db/migration` (V1 a V20).
Exportar para `DADOS.pdf` na entrega, com o diagrama entidade-relacionamento.

## Tabelas

| Tabela | Descrição |
|---|---|
| `users` | Contas de usuário, plano (FREE ou PREMIUM), login por e-mail ou Google |
| `refresh_tokens` | Tokens de renovação rotativos |
| `characters` | Fichas de personagem D&D 5e |
| `character_items` | Inventário da ficha |
| `character_spells` | Magias conhecidas ou preparadas por ficha |
| `spells` | Catálogo SRD de magias |
| `dice_rolls` | Histórico de rolagens |
| `dice_shortcuts` | Atalhos de rolagem do usuário |
| `game_tables` | Mesas |
| `game_table_members` | Membros da mesa e seus papéis |
| `sessions` | Sessões ao vivo da mesa |
| `table_events` | Eventos do calendário da mesa |
| `table_event_rsvps` | Confirmações de presença |
| `notifications` | Notificações do usuário |
| `game_maps` | Mapas de batalha |
| `images` | Imagens armazenadas (avatares e mapas) |

## A completar
- [ ] Diagrama entidade-relacionamento (chaves e cardinalidades)
- [ ] Dicionário de dados por tabela (colunas, tipos, restrições)
