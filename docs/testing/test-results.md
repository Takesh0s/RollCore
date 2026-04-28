# Test Results

## CharacterService — Testes Unitários (JUnit 5 + Mockito)

**Arquivo:** `backend/src/test/java/com/rollcore/service/CharacterServiceTest.java`  
**Casos de teste:** 21 | **Falhas:** 0 | **Erros:** 0  
**Tempo:** 10.851s | **Status:** ✅ BUILD SUCCESS  
**Data:** 27/04/2026

### Cobertura
| Grupo | Testes |
|---|---|
| `create()` — AC e spell slots server-side (UC-02 RN-01 / RN-04) | 12 |
| `listByUser()` | 2 |
| `getById()` — controle de posse | 3 |
| `update()` — recálculo de AC e slots | 2 |
| `delete()` — autorização | 2 |

### Saída do Maven
```
Tests run: 21, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS — Total time: 10.851s
```