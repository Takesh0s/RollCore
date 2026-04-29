# Test Results — RollCore Backend

**Suite completa:** 103 testes | **Falhas:** 0 | **Erros:** 0 | **Skipped:** 0
**Data:** 28/04/2026 | **Status:** ✅ BUILD SUCCESS | **Tempo total:** 14.206s

---

## 1. AuthController — Testes de Sistema / API (JUnit 5 + MockMvc)

**Arquivo:** `backend/src/test/java/com/rollcore/controller/AuthControllerTest.java`
**Casos de teste:** 8 | **Falhas:** 0 | **Tempo:** ~5.3s

### Cobertura

| Grupo | Teste | Tipo |
|---|---|---|
| `POST /auth/register` | 201 com payload válido | Sistema |
| `POST /auth/register` | 409 quando e-mail já existe — UC-01 A01 / MSG001 | Sistema |
| `POST /auth/register` | 400 quando formato de username é inválido | Sistema |
| `POST /auth/register` | 400 quando senha é fraca — UC-01 RN-01 | Sistema |
| `POST /auth/login` | 200 com credenciais válidas | Sistema |
| `POST /auth/login` | 401 com credenciais erradas — UC-01 E01 / MSG003 | Sistema |
| `POST /auth/refresh` | 200 com refresh token válido — UC-01 S01 | Sistema |
| `POST /auth/refresh` | 401 com refresh token expirado — UC-01 E03 | Sistema |

### Saída do Maven
```
Tests run: 8, Failures: 0, Errors: 0, Skipped: 0
```

---

## 2. CharacterController — Testes de Sistema / API (JUnit 5 + MockMvc)

**Arquivo:** `backend/src/test/java/com/rollcore/controller/CharacterControllerTest.java`
**Casos de teste:** 7 | **Falhas:** 0 | **Tempo:** ~0.6s

### Cobertura

| Grupo | Teste | Tipo |
|---|---|---|
| `GET /characters` | 200 com lista do usuário autenticado | Sistema |
| `POST /characters` | 201 com payload válido | Sistema |
| `POST /characters` | 400 quando nome está em branco | Sistema |
| `POST /characters` | 400 quando nível excede 20 | Sistema |
| `GET /characters/{id}` | 200 quando personagem encontrado | Sistema |
| `GET /characters/{id}` | 404 quando personagem não existe | Sistema |
| `DELETE /characters/{id}` | 204 ao deletar personagem próprio | Sistema |

### Saída do Maven
```
Tests run: 7, Failures: 0, Errors: 0, Skipped: 0
```

---

## 3. DndEngine — Testes Unitários (JUnit 5)

**Arquivo:** `backend/src/test/java/com/rollcore/engine/DndEngineTest.java`
**Casos de teste:** 43 | **Falhas:** 0 | **Tempo:** ~0.3s

### Cobertura

| Grupo | Testes | Tipo |
|---|---|---|
| `calcMod()` — floor((valor-10)/2) | 9 (parameterizado, 9 pares score→mod) | Unitário |
| `profBonus()` — por faixa de nível | 10 (parameterizado, níveis 1–20) | Unitário |
| `getMaxSpellSlots()` — full e half casters | 6 (Mago, Bardo, Paladino, Bárbaro, Warlock) | Unitário |
| `getMaxSpellSlots()` — third casters (Cavaleiro Arcano / Trapaceiro Arcano) | 8 (níveis 1–7, resolveCasterType, resolveSpellAbility) | Unitário |
| `getWarlockSlots()` — Pact Magic (PHB p.107) | 4 (níveis 1, 5, 20; Mago→null) | Unitário |
| `getSpellSaveDC()` — 8 + profBonus + mod (PHB p.205) | 3 (Mago, Clérigo, Bárbaro→null) | Unitário |
| `getSpellAttackBonus()` | 1 (Warlock nível 5, CHA=14 → +5) | Unitário |
| `isValidClass()` / `isValidRace()` | 2 | Unitário |

### Saída do Maven
```
Tests run: 43, Failures: 0, Errors: 0, Skipped: 0
```

---

## 4. CharacterService — Testes Unitários (JUnit 5 + Mockito)

**Arquivo:** `backend/src/test/java/com/rollcore/service/CharacterServiceTest.java`
**Casos de teste:** 21 | **Falhas:** 0 | **Tempo:** ~0.5s

### Cobertura

| Grupo | Testes | Tipo |
|---|---|---|
| `create()` — AC e spell slots server-side (UC-02 RN-01 / RN-04) | 12 (inclui parameterizado DEX→AC com 4 pares) | Unitário |
| `listByUser()` | 2 | Unitário |
| `getById()` — controle de posse (UC-02 RN-04) | 3 (próprio, ForbiddenException, NotFoundException) | Unitário |
| `update()` — recálculo de AC e slots | 2 | Unitário |
| `delete()` — autorização | 2 | Unitário |

### Saída do Maven
```
Tests run: 21, Failures: 0, Errors: 0, Skipped: 0
```

---

## 5. DiceService — Testes Unitários (JUnit 5 + Mockito)

**Arquivo:** `backend/src/test/java/com/rollcore/service/DiceServiceTest.java`
**Casos de teste:** 15 | **Falhas:** 0 | **Tempo:** ~0.15s

### Cobertura

| Grupo | Testes | Tipo |
|---|---|---|
| `roll()` — fórmulas válidas | 6 (inclui parameterizado com 4 fórmulas + bounds d20) | Unitário |
| `roll()` — fórmulas inválidas lançam `InvalidFormulaException` — UC-03 E01 | 9 (parameterizado com 7 fórmulas + 2 testes diretos) | Unitário |
| `getHistory()` | 2 (lista com rolls; lista vazia) | Unitário |

### Saída do Maven
```
Tests run: 15, Failures: 0, Errors: 0, Skipped: 0
```

---

## 6. SpellService — Testes Unitários (JUnit 5 + Mockito)

**Arquivo:** `backend/src/test/java/com/rollcore/service/SpellServiceTest.java`
**Casos de teste:** 9 | **Falhas:** 0 | **Tempo:** ~0.17s

### Cobertura

| Grupo | Testes | Tipo |
|---|---|---|
| `filter()` — filtros do compêndio | 3 (lista mapeada; filtros null; classe em branco→null) | Unitário |
| `addToCharacter()` | 3 (salva e retorna; ConflictException se já conhece; ForbiddenException dono errado) | Unitário |
| `removeFromCharacter()` | 2 (deleta; NotFoundException se não está na lista) | Unitário |
| `listForCharacter()` | 1 | Unitário |

### Saída do Maven
```
Tests run: 9, Failures: 0, Errors: 0, Skipped: 0
```

---

## Resumo Geral

| Arquivo de Teste | Tipo | Casos | Status |
|---|---|---|---|
| `AuthControllerTest` | Sistema (API) | 8 | ✅ |
| `CharacterControllerTest` | Sistema (API) | 7 | ✅ |
| `DndEngineTest` | Unitário | 43 | ✅ |
| `CharacterServiceTest` | Unitário | 21 | ✅ |
| `DiceServiceTest` | Unitário | 15 | ✅ |
| `SpellServiceTest` | Unitário | 9 | ✅ |
| **Total** | | **103** | **✅ BUILD SUCCESS** |

```
Tests run: 103, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS — Total time: 14.206s
Finished at: 2026-04-28T19:08:55-03:00
```