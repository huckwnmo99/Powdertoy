-- TPT Chemical Engineering Mod (Lua)
local elements = TPT.element

-- ==========================================
-- 1. 기존 불필요한 메뉴 탭 숨기기 (UI Clean-up)
-- ==========================================
local function hideCategory(category_id)
    for i = 1, 255 do
        if tpt.get_property("menusection", i) == category_id then
            tpt.set_property("menusection", i, 16) -- 존재하지 않는 탭 → 완전 숨김
        end
    end
end

-- 폭발물(5), 방사능(10), 특수(11), 생명체(12) 숨김 (MenuSection.h 기준)
hideCategory(elements.SC_EXPLOSIVE) -- 5
hideCategory(elements.SC_NUCLEAR)   -- 10 (SC_RADIOACTIVE는 존재하지 않음)
hideCategory(elements.SC_SPECIAL)   -- 11
hideCategory(elements.SC_LIFE)      -- 12

-- ==========================================
-- 2. 화학 전용 카테고리 생성 및 물질 할당
-- ==========================================
local CAT_CHEM = 11 -- Mod 카테고리

local CH4 = elements.allocate("CHEM", "CH4")
local CO  = elements.allocate("CHEM", "CO")
local H2  = elements.allocate("CHEM", "H2")
local NI  = elements.allocate("CHEM", "NI")

-- 3. 물질 속성 설정
elements.element_set_property(CH4, "Name", "CH4")
elements.element_set_property(CH4, "Description", "Methane. Key material for Reforming.")
elements.element_set_property(CH4, "Color", 0x90EE90)
elements.element_set_property(CH4, "Properties", elements.TYPE_GAS)
elements.element_set_property(CH4, "Weight", 16)
elements.element_set_property(CH4, "MenuSection", CAT_CHEM)

elements.element_set_property(CO, "Name", "CO")
elements.element_set_property(CO, "Color", 0x6464FF)
elements.element_set_property(CO, "Properties", elements.TYPE_GAS)
elements.element_set_property(CO, "Weight", 28)
elements.element_set_property(CO, "MenuSection", CAT_CHEM)

elements.element_set_property(H2, "Name", "H2")
elements.element_set_property(H2, "Color", 0xFFC8FF)
elements.element_set_property(H2, "Properties", elements.TYPE_GAS)
elements.element_set_property(H2, "Weight", 2)
elements.element_set_property(H2, "Flammable", 100)
elements.element_set_property(H2, "MenuSection", CAT_CHEM)

elements.element_set_property(NI, "Name", "NI")
elements.element_set_property(NI, "Color", 0xC0C0C0)
elements.element_set_property(NI, "Properties", elements.TYPE_SOLID)
elements.element_set_property(NI, "HeatConduct", 251)
elements.element_set_property(NI, "MenuSection", CAT_CHEM)

-- ==========================================
-- 4. 화학 반응 로직
-- ==========================================
-- 4a. SMR: CH4 + H2O → CO + 3H2 (T>973, Ni 촉매, 흡열)
-- 4b. Pyrolysis: CH4 → C + 2H2 (T>800, 무촉매)
local function update_ch4(i, x, y, s, n)
    local temp = sim.partProperty(i, "temp")
    -- SMR: 인접 수증기 탐색 (T>973)
    if temp > 973 then
        for dx = -1, 1 do
            for dy = -1, 1 do
                if not (dx == 0 and dy == 0) then
                    local rid = sim.partID(x + dx, y + dy)
                    if rid then
                        local rt = sim.partProperty(rid, "type")
                        if rt == elements.DEFAULT_PT_WTRV then
                            local hasNi = false
                            for cx = -2, 2 do
                                for cy = -2, 2 do
                                    if not (cx == 0 and cy == 0) then
                                        local nid = sim.partID(x + cx, y + cy)
                                        if nid and sim.partProperty(nid, "type") == NI then
                                            hasNi = true; break
                                        end
                                    end
                                end
                                if hasNi then break end
                            end
                            if hasNi or math.random() < 0.02 then
                                sim.partProperty(i, "type", CO)
                                sim.partProperty(rid, "type", H2)
                                sim.partProperty(i, "temp", temp - 100)
                                return
                            end
                        end
                    end
                end
            end
        end
    end
    -- Pyrolysis: CH4 → C(BCOL) + 2H2 (T>800, 2% 확률)
    if temp > 800 and math.random() < 0.02 then
        sim.partProperty(i, "type", elements.DEFAULT_PT_BCOL)
        sim.partCreate(-1, x + math.random(-1, 1), y + math.random(-1, 1), H2)
        sim.partCreate(-1, x + math.random(-1, 1), y + math.random(-1, 1), H2)
        sim.partProperty(i, "temp", temp - 50)
        return
    end
end

elements.property_set_func(CH4, update_ch4)

-- ==========================================
-- 5. COAL/BCOL 연소 (ref: COAL.cpp + FIRE.cpp)
-- ==========================================
-- DefaultProperties: life=110(미발화), tmp=50(연료)
-- 발화: FIRE/PLSM 2칸내 + life>100 → 1/500 확률 → life=99
-- 연소: life<100 → life--, 주변 FIRE 생성
-- 소진: life<=0 → FIRE로 변환
-- 압력: pv>4.3 & tmp>40 → tmp=39; tmp-- → tmp<=0 → BCOL
local COAL_ID = elements.DEFAULT_PT_COAL
local BCOL_ID = elements.DEFAULT_PT_BCOL
local FIRE_ID = elements.DEFAULT_PT_FIRE
local PLSM_ID = elements.DEFAULT_PT_PLSM

local function coal_update(i, x, y, s, n)
    local life = sim.partProperty(i, "life")
    local typ = sim.partProperty(i, "type")

    if life <= 0 then
        sim.partCreate(i, x, y, FIRE_ID)
        return 1
    elseif life < 100 then
        sim.partProperty(i, "life", life - 1)
        sim.partCreate(-1, x + math.random(-1, 1), y + math.random(-1, 1), FIRE_ID)
    end

    -- 발화 체크: 2칸 이내 FIRE/PLSM 감지 (ref: FIRE.cpp:175-183)
    if life > 100 then
        local ignited = false
        for dx = -2, 2 do
            for dy = -2, 2 do
                if not (dx == 0 and dy == 0) then
                    local rid = sim.partID(x + dx, y + dy)
                    if rid then
                        local rt = sim.partProperty(rid, "type")
                        if (rt == FIRE_ID or rt == PLSM_ID) and math.random() < 0.002 then
                            sim.partProperty(i, "life", 99)
                            ignited = true; break
                        end
                    end
                end
            end
            if ignited then break end
        end
    end

    -- 압력/연료 관리 (COAL만, BCOL 제외)
    if typ == COAL_ID then
        local tmp = sim.partProperty(i, "tmp")
        local pres = sim.pressure(math.floor(x / 4), math.floor(y / 4))
        if pres > 4.3 and tmp > 40 then
            sim.partProperty(i, "tmp", 39)
        elseif tmp < 40 and tmp > 0 then
            sim.partProperty(i, "tmp", tmp - 1)
        elseif tmp <= 0 then
            sim.partProperty(i, "type", BCOL_ID)
            return 1
        end
    end

    -- 최고 온도 기록
    local temp = sim.partProperty(i, "temp")
    local tmp2 = sim.partProperty(i, "tmp2")
    if temp > tmp2 then
        sim.partProperty(i, "tmp2", math.floor(temp))
    end
    return 0
end

elements.property(COAL_ID, "Update", coal_update, 1)
elements.property(BCOL_ID, "Update", coal_update, 1)

print("Chemical UI Mod Loaded Successfully!")
