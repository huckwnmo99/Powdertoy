# 개선 계획서 V2 - Powder Toy 화학 공정 모드

**작성일**: 2026-03-02 (Updated)
**대상 파일**: `ThePowderToyWeb/index.html`, `ThePowderToyWeb/chemistry.lua`, `run_server.py`, `serve-wasm.py`
**비고**: 증류탑 서바이벌 게임은 제거 완료 (index.js, index.css 삭제)

---

## 수정 우선순위 요약

| 순서 | 대상 파일 | 수정 내용 | 심각도 |
|------|----------|----------|--------|
| **P1** | index.html 인라인 Lua | 카테고리 번호 전면 수정 (전부 틀림) | 치명 |
| **P2** | index.html 인라인 Lua | 반응 함수 완전 재작성 (6개 누락) | 치명 |
| **P3** | chemistry.lua | SC_RADIOACTIVE→SC_NUCLEAR, SC_CRACKER 제거 | 치명 |
| **P4** | chemistry.lua | Ni break 수정 + global→local + CH4 Weight | 경미 |
| **P5** | serve-wasm.py | dead import, 디버그 print, argv 버그 | 경미 |
| **P6** | run_server.py | 0.0.0.0→127.0.0.1 바인딩 | 경미 |

---

## P1. 카테고리 번호 전면 수정 (치명)

### 파일: `ThePowderToyWeb/index.html` 41번 줄

### 문제

MenuSection.h 실제 상수값:
```
SC_EXPLOSIVE = 5,  SC_GAS = 6,  SC_LIQUID = 7,  SC_POWDERS = 8
SC_SOLIDS = 9,  SC_NUCLEAR = 10,  SC_SPECIAL = 11,  SC_LIFE = 12
```

현재 인라인 코드:
```lua
h(7) h(2) h(6) h(8) h(9)
```

실제로 숨겨지는 것: SC_LIQUID(7), SC_POWERED(2), SC_GAS(6), SC_POWDERS(8), SC_SOLIDS(9)
→ 화학 반응에 필수인 기체/액체/고체가 전부 메뉴에서 사라짐. WTRV 선택 불가.

### 수정

```lua
-- 현재 (틀림)
h(7) h(2) h(6) h(8) h(9)

-- 수정 후 (MenuSection.h 기준 올바른 값)
h(5) h(10) h(11) h(12)
-- 5=SC_EXPLOSIVE, 10=SC_NUCLEAR, 11=SC_SPECIAL, 12=SC_LIFE
-- SC_CRACKER는 존재하지 않으므로 제거
```

### 추가: 숨김 대상으로 이동시키는 카테고리도 수정

```lua
-- 현재: 카테고리 12(SC_LIFE)로 이동 → SC_LIFE를 숨기면서 동시에 거기로 보내면 순환 문제
-- SC_LIFE(12) 자체를 숨기려는데, 다른 원소를 12로 보내면 그 원소들도 보이지 않게 됨
-- 이것은 의도한 동작일 수 있음 (12로 보낸 뒤 12 탭 자체를 표시하지 않으면 됨)
-- TPT에서 menusection을 비활성 카테고리(SC_TOTAL 이상)로 설정하면 메뉴에서 완전히 숨겨짐
-- 하지만 현재 h()는 SC_LIFE가 아닌 카테고리를 숨기므로, 12로 이동시킨 원소가
-- SC_LIFE 탭에 그대로 노출됨 → 의도치 않은 부작용

-- 가장 안전한 방법: 충분히 큰 숫자(예: 16)로 이동하여 어떤 메뉴에도 표시 안 됨
local function h(c)
  for i=1,255 do
    if tpt.get_property("menusection",i)==c then
      tpt.set_property("menusection",i,16)  -- 16 = 존재하지 않는 탭 → 완전 숨김
    end
  end
end
h(5) h(10) h(11) h(12)
```

---

## P2. 인라인 반응 함수 완전 재작성 (치명)

### 파일: `ThePowderToyWeb/index.html` 42~48번 줄

### 문제 목록 (6개 누락 + 1개 버그)

| # | 항목 | 현재 (인라인) | 수정 후 |
|---|------|-------------|---------|
| 1 | 흡열 반응 | 없음 | `temp - 100K` 적용 |
| 2 | Ni 촉매 | 없음 (무조건 10%) | 5x5 NI 탐색 → 있으면 즉시, 없으면 2% |
| 3 | 자기 위치 체크 | 없음 | `dx==0 and dy==0` 스킵 |
| 4 | CO Weight | 없음 | 28 |
| 5 | H2 Weight | 없음 | 2 |
| 6 | NI HeatConduct | 없음 | 251 |
| 7 | `return` 누락 | 없음 → 다중 H2O 소모 | `return` 추가 |

### 수정: 전체 luaCode 변수 교체

```javascript
var luaCode = `
-- 1. UI: 불필요 카테고리 숨기기 (MenuSection.h 기준)
local function h(c)
  for i=1,255 do
    if tpt.get_property("menusection",i)==c then
      tpt.set_property("menusection",i,16)
    end
  end
end
h(5) h(10) h(11) h(12)

-- 2. 원소 등록
local e=TPT.element
local c1=e.allocate("CHEM","CH4")
local c2=e.allocate("CHEM","CO")
local c3=e.allocate("CHEM","H2")
local c4=e.allocate("CHEM","NI")

-- 3. 원소 속성
e.element_set_property(c1,"Name","CH4")
e.element_set_property(c1,"Description","Methane. Key feedstock for SMR.")
e.element_set_property(c1,"Color",0x90EE90)
e.element_set_property(c1,"Properties",e.TYPE_GAS)
e.element_set_property(c1,"Weight",16)
e.element_set_property(c1,"MenuSection",11)

e.element_set_property(c2,"Name","CO")
e.element_set_property(c2,"Description","Carbon Monoxide. SMR product.")
e.element_set_property(c2,"Color",0x6464FF)
e.element_set_property(c2,"Properties",e.TYPE_GAS)
e.element_set_property(c2,"Weight",28)
e.element_set_property(c2,"MenuSection",11)

e.element_set_property(c3,"Name","H2")
e.element_set_property(c3,"Description","Hydrogen. Highly flammable.")
e.element_set_property(c3,"Color",0xFFC8FF)
e.element_set_property(c3,"Properties",e.TYPE_GAS)
e.element_set_property(c3,"Weight",2)
e.element_set_property(c3,"Flammable",100)
e.element_set_property(c3,"MenuSection",11)

e.element_set_property(c4,"Name","NI")
e.element_set_property(c4,"Description","Nickel catalyst for SMR.")
e.element_set_property(c4,"Color",0xC0C0C0)
e.element_set_property(c4,"Properties",e.TYPE_SOLID)
e.element_set_property(c4,"HeatConduct",251)
e.element_set_property(c4,"MenuSection",11)

-- 4. SMR 반응: CH4 + H2O -> CO + H2 (T>973K, Ni catalyst)
e.property_set_func(c1, function(i,x,y,s,n)
  local t=tpt.get_property("temp",x,y)
  if t>973 then
    for dx=-1,1 do
      for dy=-1,1 do
        if not(dx==0 and dy==0) then
          if tpt.get_property("type",x+dx,y+dy)==e.DEFAULT_PT_WTRV then
            local hasNi=false
            for cx=-2,2 do
              for cy=-2,2 do
                if tpt.get_property("type",x+cx,y+cy)==c4 then
                  hasNi=true break
                end
              end
              if hasNi then break end
            end
            if hasNi or math.random()<0.02 then
              tpt.set_property("type",x,y,c2)
              tpt.set_property("type",x+dx,y+dy,c3)
              tpt.set_property("temp",x,y,t-100)
              return
            end
          end
        end
      end
    end
  end
end)
print("Chemistry Mod Loaded!")
`;
```

---

## P3. chemistry.lua 존재하지 않는 상수 수정 (치명)

### 파일: `ThePowderToyWeb/chemistry.lua` 16~20번 줄

### 문제

```lua
hideCategory(elements.SC_RADIOACTIVE) -- SC_RADIOACTIVE 존재하지 않음 → nil → 무효
hideCategory(elements.SC_CRACKER)     -- SC_CRACKER 존재하지 않음 → nil → 무효
```

### 수정

```lua
hideCategory(elements.SC_EXPLOSIVE)  -- 5 (유지)
hideCategory(elements.SC_NUCLEAR)    -- 10 (SC_RADIOACTIVE → SC_NUCLEAR)
hideCategory(elements.SC_SPECIAL)    -- 11 (유지)
hideCategory(elements.SC_LIFE)       -- 12 (유지)
-- SC_CRACKER 제거 (존재하지 않는 상수)
```

### 추가: hideCategory 숨김 대상 카테고리도 수정

```lua
-- 현재
tpt.set_property("menusection", i, elements.SC_NONE)  -- SC_NONE도 존재하지 않을 수 있음

-- 수정
tpt.set_property("menusection", i, 16)  -- 존재하지 않는 탭 번호 → 확실한 숨김
```

---

## P4. chemistry.lua 경미한 수정 3건

### 파일: `ThePowderToyWeb/chemistry.lua`

### 4-1. Ni 검색 외부 break 추가 (70~77번 줄)

```lua
-- 현재
for cx = -2, 2 do
    for cy = -2, 2 do
        if tpt.get_property("type", x+cx, y+cy) == NI then
            hasNi = true; break
        end
    end
end

-- 수정
for cx = -2, 2 do
    for cy = -2, 2 do
        if tpt.get_property("type", x+cx, y+cy) == NI then
            hasNi = true; break
        end
    end
    if hasNi then break end  -- 추가
end
```

### 4-2. global → local 함수 (62번 줄)

```lua
-- 현재
function update_reforming(i, x, y, s, n)

-- 수정
local function update_reforming(i, x, y, s, n)
```

### 4-3. CH4 Weight 15→16 (37번 줄)

```lua
-- 현재
elements.element_set_property(CH4, "Weight", 15)  -- CH3의 분자량

-- 수정
elements.element_set_property(CH4, "Weight", 16)  -- CH4 = 12 + 4×1 = 16
```

---

## P5. serve-wasm.py 버그 3건

### 파일: `ThePowderToyWeb/serve-wasm.py`

### 5-1. 미사용 import 제거 (5~6번 줄)

```python
# 제거
import json
import re
```

### 5-2. 디버그 print 제거 (116번 줄)

```python
# 제거
print(self.index_pages)
```

### 5-3. argv 언패킹 안전하게 (12~18번 줄)

```python
# 현재
if len(sys.argv) >= 2:
    (script, build_root,) = sys.argv  # 3개 이상이면 크래시

# 수정
if len(sys.argv) >= 2:
    build_root = sys.argv[1]
    os.chdir(build_root)
```

---

## P6. run_server.py 바인딩 수정

### 파일: `ThePowderToyWeb/run_server.py` 13번 줄

```python
# 현재
socketserver.TCPServer(("", PORT), ...)  # 0.0.0.0 → 네트워크 노출

# 수정
socketserver.TCPServer(("127.0.0.1", PORT), ...)  # localhost만
```

---

## 작업 순서

```
단계 1: P1+P2 (index.html 인라인 Lua 전면 교체)  ← 가장 치명적
단계 2: P3+P4 (chemistry.lua 상수/로직 수정)
단계 3: P5 (serve-wasm.py 정리)
단계 4: P6 (run_server.py 보안)
```
