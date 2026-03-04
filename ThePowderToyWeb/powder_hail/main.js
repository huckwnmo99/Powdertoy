"use strict";

// --- 요소 정의 (TPT 기반 속성 추가: 상변화, 수명, 점도) ---
const ELEMENTS = {
    EMPTY:   { id: 0, name: '지우개', color: [0, 0, 0, 255], state: 'gas', weight: 0, conduct: 0, heatCapacity: 1.0 },
    WALL:    { id: 1, name: '벽', color: [128, 128, 128, 255], state: 'solid', weight: 100, conduct: 0, heatCapacity: 1.0 },
    SAND:    { id: 2, name: '모래', color: [194, 178, 128, 255], state: 'powder', weight: 90, conduct: 50, heatCapacity: 0.8, highTemp: 1700, highTransition: 23 },
    WATER:   { id: 3, name: '물(H2O)', color: [30, 144, 255, 255], state: 'liquid', weight: 30, conduct: 118, heatCapacity: 4.18, highTemp: 100, highTransition: 5, lowTemp: 0, lowTransition: 19, dispersion: 5 },
    FIRE:    { id: 4, name: '열/불', color: [255, 69, 0, 255], state: 'gas', weight: -1, conduct: 88, heatCapacity: 1.0, defaultLife: 40 },
    STEAM:   { id: 5, name: '수증기', color: [220, 220, 220, 150], state: 'gas', weight: -1, conduct: 20, heatCapacity: 2.0, lowTemp: 100, lowTransition: 3 },
    METHANE: { id: 6, name: '메테인(CH4)', color: [144, 238, 144, 150], state: 'gas', weight: -2, conduct: 24, heatCapacity: 2.2 },
    COAL:    { id: 7, name: '석탄(C)', color: [30, 30, 30, 255], state: 'powder', weight: 95, conduct: 20, heatCapacity: 1.0 },
    O2:      { id: 8, name: '산소(O2)', color: [100, 255, 100, 100], state: 'gas', weight: 0, conduct: 24, heatCapacity: 0.92 },
    CO2:     { id: 9, name: '이산화탄소', color: [150, 75, 0, 150], state: 'gas', weight: 5, conduct: 24, heatCapacity: 0.84 },
    CO:      { id: 10, name: '일산화탄소', color: [100, 100, 255, 150], state: 'gas', weight: 0, conduct: 24, heatCapacity: 1.04 },
    H2:      { id: 11, name: '수소(H2)', color: [255, 200, 255, 100], state: 'gas', weight: -5, conduct: 24, heatCapacity: 14.3 },
    NI:      { id: 12, name: '니켈(Ni)', color: [192, 192, 192, 255], state: 'solid', weight: 100, conduct: 150, heatCapacity: 0.44, highTemp: 1455, highTransition: 22 },
    OIL:     { id: 13, name: '원유(Oil)', color: [50, 20, 0, 255], state: 'liquid', weight: 20, conduct: 40, heatCapacity: 2.0, highTemp: 350, highTransition: 14, dispersion: 2 },
    LIGHT_GAS: { id: 14, name: '경질가스', color: [200, 255, 200, 120], state: 'gas', weight: -3, conduct: 24, heatCapacity: 1.0 },
    IRON:    { id: 15, name: '철(Fe)', color: [120, 120, 130, 255], state: 'solid', weight: 100, conduct: 180, heatCapacity: 0.45, highTemp: 1538, highTransition: 22 },
    COPPER:  { id: 16, name: '구리(Cu)', color: [184, 115, 51, 255], state: 'solid', weight: 100, conduct: 255, heatCapacity: 0.39, highTemp: 1085, highTransition: 22 },
    PLATINUM:{ id: 17, name: '백금(Pt)', color: [229, 228, 226, 255], state: 'solid', weight: 100, conduct: 50, heatCapacity: 0.13, highTemp: 1768, highTransition: 22 },
    C_STEEL: { id: 18, name: '카본스틸', color: [70, 75, 80, 255], state: 'solid', weight: 100, conduct: 140, heatCapacity: 0.50, highTemp: 1400, highTransition: 22 },

    // 신규 추가 요소
    ICE:     { id: 19, name: '얼음', color: [200, 200, 255, 255], state: 'powder', weight: 25, conduct: 118, heatCapacity: 2.09, highTemp: 0, highTransition: 3 },
    SMOKE:   { id: 20, name: '연기', color: [100, 100, 100, 150], state: 'gas', weight: -1, conduct: 24, heatCapacity: 1.0, defaultLife: 100 },
    ASH:     { id: 21, name: '재(Ash)', color: [90, 90, 90, 255], state: 'powder', weight: 80, conduct: 24, heatCapacity: 0.8 },
    LAVA:    { id: 22, name: '용암', color: [255, 100, 0, 255], state: 'liquid', weight: 95, conduct: 255, heatCapacity: 1.6, dispersion: 1, lowTemp: 1000, lowTransition: 26 },
    GLASS:   { id: 23, name: '유리', color: [200, 200, 200, 100], state: 'solid', weight: 100, conduct: 20, heatCapacity: 0.84, highTemp: 1700, highTransition: 22 },
    INSULATOR:{id: 24, name: '단열벽', color: [100, 100, 150, 255], state: 'solid', weight: 100, conduct: 0, heatCapacity: 1.0 },
    CARBON:  { id: 25, name: '카본(순수 탄소)', color: [15, 15, 15, 255], state: 'powder', weight: 95, conduct: 50, heatCapacity: 0.71 },
    STONE:   { id: 26, name: '암석', color: [136, 140, 141, 255], state: 'solid', weight: 100, conduct: 50, heatCapacity: 0.84, highTemp: 1200, highTransition: 22 }
};

const EL_LIST = Object.values(ELEMENTS).sort((a, b) => a.id - b.id);

// --- 엔탈피→온도 스케일 팩터 (kJ/mol → °C 변환) ---
const ENTHALPY_SCALE = 0.05;

// --- 화학 반응 정의 (동적 시스템) ---
const REACTIONS = [
    {
        id: 'combustion_ch4',
        name: '[연소] 메테인 연소 (CH4 + 2O2 -> CO2 + 2H2O)',
        type: 'combustion',
        reactants: [6, 8], // METHANE, O2
        reactantRatio: [1, 2],
        products: [9, 5], // CO2, STEAM
        productRatio: [1, 2],
        enthalpy: +890,
        activationTemp: 400,
        active: true
    },
    {
        id: 'combustion_h2',
        name: '[연소] 수소 연소 (2H2 + O2 -> 2H2O)',
        type: 'combustion',
        reactants: [11, 8], // H2, O2
        reactantRatio: [2, 1],
        products: [5, 5], // STEAM, STEAM
        productRatio: [2, 0],
        enthalpy: +285,
        activationTemp: 500,
        active: true
    },
    {
        id: 'combustion_coal',
        name: '[연소] 석탄 연소 (C + O2 -> CO2)',
        type: 'combustion',
        reactants: [7, 8], // COAL, O2
        reactantRatio: [1, 1],
        products: [9, 21], // CO2, ASH
        productRatio: [1, 1],
        enthalpy: +393,
        activationTemp: 350,
        active: true
    },
    {
        id: 'combustion_oil',
        name: '[연소] 원유 연소 (Oil + O2 -> CO2 + 연기)',
        type: 'combustion',
        reactants: [13, 8], // OIL, O2
        reactantRatio: [1, 1],
        products: [9, 20], // CO2, SMOKE
        productRatio: [1, 1],
        enthalpy: +500,
        activationTemp: 300,
        active: true
    },
    {
        id: 'combustion_co',
        name: '[연소] 일산화탄소 연소 (2CO + O2 -> 2CO2)',
        type: 'combustion',
        reactants: [10, 8], // CO, O2
        reactantRatio: [2, 1],
        products: [9, 9], // CO2, CO2
        productRatio: [2, 0],
        enthalpy: +283,
        activationTemp: 600,
        active: true
    },
    {
        id: 'smr',
        name: '[개질] 증기 메테인 개질 (CH4 + H2O -> CO + 3H2)',
        type: 'reforming',
        reactants: [6, 5], // METHANE, STEAM
        reactantRatio: [1, 1],
        products: [10, 11], // CO, H2
        productRatio: [1, 3],
        enthalpy: -206, // 강한 흡열
        activationTemp: 700,
        active: false // 기본적으로 비활성화
    },
    {
        id: 'pyrolysis_ch4',
        name: '[열분해] 메테인 열분해 (CH4 -> C + 2H2)',
        type: 'pyrolysis',
        reactants: [6], // METHANE (단일 반응물)
        reactantRatio: [1],
        products: [25, 11], // CARBON(순수 탄소), H2
        productRatio: [1, 2],
        enthalpy: -75, // 흡열 (실제 ΔH_r = +74.8 kJ/mol)
        activationTemp: 800, // 촉매 없이 높은 온도 필요
        active: false // 기본적으로 비활성화
    }
];

// 화학 반응 UI 초기화
function initReactionsUI() {
    const container = document.getElementById('reactions-container');
    if (!container) return;
    
    REACTIONS.forEach((rxn, index) => {
        const label = document.createElement('label');
        label.style.display = 'block';
        label.style.cursor = 'pointer';
        label.style.fontSize = '14px';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = rxn.active;
        checkbox.onchange = (e) => {
            REACTIONS[index].active = e.target.checked;
        };
        
        const enthalpyText = rxn.enthalpy > 0 ? `+${rxn.enthalpy} (발열)` : `${rxn.enthalpy} (흡열)`;
        const enthalpyColor = rxn.enthalpy > 0 ? '#ff5722' : '#2196f3';
        
        label.appendChild(checkbox);
        label.innerHTML += ` <strong>${rxn.name}</strong> <span style="color:${enthalpyColor};">[ΔH: ${enthalpyText}]</span> (Act: ${rxn.activationTemp}°C)`;
        
        // Re-attach listener since innerHTML overwrite removes the node's listener
        label.querySelector('input').addEventListener('change', (e) => {
            REACTIONS[index].active = e.target.checked;
        });
        
        container.appendChild(label);
    });
}
window.addEventListener('DOMContentLoaded', initReactionsUI);

// --- 엔진 설정 ---
const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d');
const width = canvas.width;
const height = canvas.height;

let grid = new Int32Array(width * height).fill(ELEMENTS.EMPTY.id);
let tempGrid = new Float32Array(width * height).fill(22.0);
let presGrid = new Float32Array(width * height).fill(0.0);
let velX = new Float32Array(width * height).fill(0.0);
let velY = new Float32Array(width * height).fill(0.0);
let lifeGrid = new Int32Array(width * height).fill(0); // 생명력 그리드 추가
let latentGrid = new Float32Array(width * height).fill(0.0); // 잠열(Latent Heat) 그리드 추가
let processedThisFrame = new Uint8Array(width * height); // 프레임당 중복 처리 방지 플래그

let pipeGrid = new Int32Array(width * height).fill(-1); 
let pipeFlowGrid = new Float32Array(width * height).fill(0.0); 

const imgData = ctx.createImageData(width, height);

let currentElement = ELEMENTS.SAND.id;
let brushSize = 5;
let displayMode = 'normal';
let lastTime = 0;
const frameDelay = 1000 / 60;

let toolMode = 'draw';
let currentFlowRate = 0.5;

document.getElementsByName('toolMode').forEach(el => { el.addEventListener('change', e => toolMode = e.target.value); });
document.getElementById('flowRate').addEventListener('input', e => {
    currentFlowRate = parseFloat(e.target.value);
    document.getElementById('flowRateVal').textContent = Math.round(currentFlowRate * 100) + '%';
});

const hudName = document.getElementById('hudName');
const hudTemp = document.getElementById('hudTemp');
const hudPres = document.getElementById('hudPres');
const elToolbar = document.getElementById('toolbar');
let mouseGridX = 0, mouseGridY = 0;

window.addEventListener('keydown', (e) => {
    if (e.key === 't' || e.key === 'T') displayMode = (displayMode === 'heat' ? 'normal' : 'heat');
    if (e.key === 'p' || e.key === 'P') displayMode = (displayMode === 'pressure' ? 'normal' : 'pressure');
    if (e.key === 'v' || e.key === 'V') displayMode = (displayMode === 'velocity' ? 'normal' : 'velocity');
});

function handleInput(e) {
    const rect = canvas.getBoundingClientRect();
    mouseGridX = Math.floor((e.clientX - rect.left) * (width / rect.width));
    mouseGridY = Math.floor((e.clientY - rect.top) * (height / rect.height));
    
    if (e.buttons === 1 && mouseGridX >= 0 && mouseGridX < width && mouseGridY >= 0 && mouseGridY < height) {
        for (let dy = -brushSize; dy <= brushSize; dy++) {
            for (let dx = -brushSize; dx <= brushSize; dx++) {
                if (dx*dx + dy*dy <= brushSize*brushSize) {
                    const nx = mouseGridX + dx, ny = mouseGridY + dy;
                    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                        const idx = ny * width + nx;
                        if (currentElement === ELEMENTS.EMPTY.id || toolMode === 'erasePipe') {
                            setCell(nx, ny, ELEMENTS.EMPTY.id);
                            pipeGrid[idx] = -1; pipeFlowGrid[idx] = 0.0;
                            tempGrid[idx] = 22.0; presGrid[idx] = 0.0; velX[idx] = 0.0; velY[idx] = 0.0;
                        } else if (toolMode === 'draw') {
                            setCell(nx, ny, currentElement);
                            // 물질의 특성에 맞는 기본 온도로 생성
                            if (currentElement === ELEMENTS.FIRE.id) {
                                tempGrid[idx] = 1000;
                            } else if (currentElement === ELEMENTS.ICE.id) {
                                tempGrid[idx] = -10;
                            } else if (currentElement === ELEMENTS.LAVA.id) {
                                tempGrid[idx] = 1500;
                            } else if (currentElement === ELEMENTS.STEAM.id) {
                                tempGrid[idx] = 120;
                            } else if (currentElement === ELEMENTS.LIGHT_GAS.id) {
                                tempGrid[idx] = 400;
                            } else {
                                // 기존 온도가 극단적이지 않다면 상온 유지, 아니면 상온으로 덮어쓰기
                                tempGrid[idx] = 22.0;
                            }
                        } else if (toolMode === 'pipe') {
                            pipeGrid[idx] = currentElement;
                            pipeFlowGrid[idx] = currentFlowRate;
                            grid[idx] = ELEMENTS.WALL.id; 
                        }
                    }
                }
            }
        }
    }
}
canvas.addEventListener('mousedown', handleInput);
canvas.addEventListener('mousemove', handleInput);

function getCell(x, y) {
    if (x < 0 || x >= width || y < 0 || y >= height) return ELEMENTS.WALL.id;
    return grid[y * width + x];
}

// setCell 시 수명(Life) 초기화 지원
function setCell(x, y, id) {
    if (x >= 0 && x < width && y >= 0 && y < height) {
        const idx = y * width + x;
        grid[idx] = id;
        latentGrid[idx] = 0.0; // 물질 변경 시 잠열 초기화
        const el = EL_LIST[id];
        if (el && el.defaultLife) {
            lifeGrid[idx] = el.defaultLife + Math.floor(Math.random() * 20); // 약간의 무작위 수명
        } else {
            lifeGrid[idx] = 0;
        }
    }
}

function swap(idx1, idx2) {
    const tmp = grid[idx1]; grid[idx1] = grid[idx2]; grid[idx2] = tmp;
    const tTmp = tempGrid[idx1]; tempGrid[idx1] = tempGrid[idx2]; tempGrid[idx2] = tTmp;
    const vxTmp = velX[idx1]; velX[idx1] = velX[idx2]; velX[idx2] = vxTmp;
    const vyTmp = velY[idx1]; velY[idx1] = velY[idx2]; velY[idx2] = vyTmp;
    const lTmp = lifeGrid[idx1]; lifeGrid[idx1] = lifeGrid[idx2]; lifeGrid[idx2] = lTmp; // 수명도 스왑
    const latTmp = latentGrid[idx1]; latentGrid[idx1] = latentGrid[idx2]; latentGrid[idx2] = latTmp; // 잠열 스왑
    processedThisFrame[idx1] = 1; processedThisFrame[idx2] = 1; // 이동한 양쪽 모두 처리 완료 표시
}

function updatePipes() {
    for (let i = 0; i < width * height; i++) {
        if (pipeGrid[i] !== -1 && Math.random() < pipeFlowGrid[i]) {
            const elId = pipeGrid[i];
            const neighbors = [i-width, i+width, i-1, i+1];
            for (let ni of neighbors) {
                if (ni >= 0 && ni < width * height && grid[ni] === ELEMENTS.EMPTY.id) {
                    setCell(ni % width, Math.floor(ni / width), elId);
                    presGrid[ni] += 2.0; 
                    if (elId === ELEMENTS.FIRE.id) tempGrid[ni] = 1000;
                    break;
                }
            }
        }
    }
}

// 전역 변수로 다음 프레임 버퍼 추가
let nextVelX = new Float32Array(width * height).fill(0.0);
let nextVelY = new Float32Array(width * height).fill(0.0);
let nextPres = new Float32Array(width * height).fill(0.0);
let nextTemp = new Float32Array(width * height).fill(22.0);

// TPT의 유체 역학 상수
const AIR_VLOSS = 0.999;   // 속도 감쇠 (마찰) - ref SimulationConfig.h:40
const AIR_PLOSS = 0.9999;  // 압력 감쇠 - ref SimulationConfig.h:41
const AIR_VADV = 0.3;      // 이류(Advection) 강도
const AIR_TSTEPV = 0.4;    // 압력 -> 속도 변환 계수
const AIR_TSTEPP = 0.3;    // 속도 -> 압력 변환 계수

// Precomputed Gaussian kernel (ref Air.cpp:8-26) exp(-2*(i*i+j*j)) normalized
const GAUSS_KERNEL = [];
let gaussSum = 0;
for (let j = -1; j <= 1; j++) {
    for (let k = -1; k <= 1; k++) {
        const w = Math.exp(-2 * (j * j + k * k));
        GAUSS_KERNEL.push(w);
        gaussSum += w;
    }
}
for (let n = 0; n < GAUSS_KERNEL.length; n++) GAUSS_KERNEL[n] /= gaussSum;

function updateAirAndHeat() {
    // 1. 벽면/가장자리 마찰 및 고체 통과 불가 처리
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const i = y * width + x;
            const el = EL_LIST[grid[i]];
            if (el.state === 'solid' && pipeGrid[i] === -1) {
                velX[i] = 0; velY[i] = 0; // ref: only zero velocity at walls, not pressure
            }
        }
    }

    // 1.5. Edge damping (ref Air.cpp:224-253) - damp pressure/velocity at boundaries
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = y * width + x;
            if (x < 2 || x >= width - 2 || y < 2 || y >= height - 2) {
                presGrid[i] *= 0.8;
                velX[i] *= 0.9;
                velY[i] *= 0.9;
            }
        }
    }

    // 2. 압력 투영 (Velocity Divergence -> Pressure)
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const i = y * width + x;
            let dp = (velX[i - 1] - velX[i + 1]) + (velY[i - width] - velY[i + width]);
            presGrid[i] = (presGrid[i] * AIR_PLOSS) + (dp * AIR_TSTEPP * 0.5);
        }
    }

    // 3. 속도 갱신 (Pressure Gradient -> Velocity)
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const i = y * width + x;
            let dx = presGrid[i - 1] - presGrid[i + 1];
            let dy = presGrid[i - width] - presGrid[i + width];
            
            velX[i] = (velX[i] * AIR_VLOSS) + (dx * AIR_TSTEPV * 0.5);
            velY[i] = (velY[i] * AIR_VLOSS) + (dy * AIR_TSTEPV * 0.5);
        }
    }

    // 4. 이류 (Advection) & 스무딩 (Smoothing) - 속도 및 압력
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const i = y * width + x;
            const el = EL_LIST[grid[i]];
            
            // 3x3 Gaussian kernel smoothing (ref Air.cpp:8-26)
            let dx = 0, dy = 0, dp = 0;
            let wSum = 0;
            let ki = 0;
            for (let j = -1; j <= 1; j++) {
                for (let k = -1; k <= 1; k++) {
                    const ni = (y + j) * width + (x + k);
                    const weight = GAUSS_KERNEL[ki++];
                    if (EL_LIST[grid[ni]] && EL_LIST[grid[ni]].state !== 'solid') {
                        dx += velX[ni] * weight;
                        dy += velY[ni] * weight;
                        dp += presGrid[ni] * weight;
                        wSum += weight;
                    }
                }
            }
            if (wSum > 0) {
                dx /= wSum; dy /= wSum; dp /= wSum;
            } else {
                dx = velX[i]; dy = velY[i]; dp = presGrid[i];
            }

            // 이류
            if (el.state !== 'solid') {
                let tx = x - dx * 0.7;
                let ty = y - dy * 0.7;

                if (tx >= 1 && tx < width - 2 && ty >= 1 && ty < height - 2) {
                    let px = Math.floor(tx);
                    let py = Math.floor(ty);
                    let fx = tx - px;
                    let fy = ty - py;

                    let idx00 = py * width + px;
                    let idx10 = py * width + px + 1;
                    let idx01 = (py + 1) * width + px;
                    let idx11 = (py + 1) * width + px + 1;

                    dx = dx * (1 - AIR_VADV) + AIR_VADV * (
                        velX[idx00] * (1-fx)*(1-fy) + velX[idx10] * fx*(1-fy) +
                        velX[idx01] * (1-fx)*fy + velX[idx11] * fx*fy
                    );
                    dy = dy * (1 - AIR_VADV) + AIR_VADV * (
                        velY[idx00] * (1-fx)*(1-fy) + velY[idx10] * fx*(1-fy) +
                        velY[idx01] * (1-fx)*fy + velY[idx11] * fx*fy
                    );
                }
            } else {
                dx = 0; dy = 0; dp = 0;
            }

            if (el.state === 'gas') dp += (tempGrid[i] - 22) * 0.00005;

            nextVelX[i] = Math.max(-256, Math.min(256, dx));
            nextVelY[i] = Math.max(-256, Math.min(256, dy));
            nextPres[i] = Math.max(-256, Math.min(256, dp));
        }
    }

    // 5. 열 전도 (Heat Conduction) 및 대류 (Advection for Heat)
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const i = y * width + x;
            const el = EL_LIST[grid[i]];
            
            let currentTemp = tempGrid[i];
            
            // 유체의 열 이류 (바람을 타고 온도가 이동)
            if (el.state !== 'solid') {
                let dx = nextVelX[i];
                let dy = nextVelY[i];
                let tx = x - dx * 0.7;
                let ty = y - dy * 0.7;
                
                if (tx >= 1 && tx < width - 2 && ty >= 1 && ty < height - 2) {
                    let px = Math.floor(tx);
                    let py = Math.floor(ty);
                    let fx = tx - px;
                    let fy = ty - py;
                    
                    let idx00 = py * width + px;
                    let idx10 = py * width + px + 1;
                    let idx01 = (py + 1) * width + px;
                    let idx11 = (py + 1) * width + px + 1;

                    let advTemp = tempGrid[idx00] * (1-fx)*(1-fy) + tempGrid[idx10] * fx*(1-fy) +
                                  tempGrid[idx01] * (1-fx)*fy + tempGrid[idx11] * fx*fy;
                    
                    currentTemp = currentTemp * (1 - AIR_VADV) + advTemp * AIR_VADV;
                }
            }

            // 입자 간 열 전도 (ref Simulation.cpp:2434-2489) - 8 neighbors with heatCapacity
            const conduct = el.conduct;
            if (conduct > 0 && Math.random() < conduct / 250.0) {
                const myHC = el.heatCapacity || 1.0;
                let sumTempHC = currentTemp * myHC;
                let sumHC = myHC;
                for (let ni of [i-1, i+1, i-width, i+width, i-width-1, i-width+1, i+width-1, i+width+1]) {
                    if (ni < 0 || ni >= width * height) continue;
                    const nEl = EL_LIST[grid[ni]];
                    if (nEl && nEl.conduct > 0) {
                        const nHC = nEl.heatCapacity || 1.0;
                        sumTempHC += tempGrid[ni] * nHC;
                        sumHC += nHC;
                    }
                }
                if (sumHC > myHC) {
                    currentTemp = sumTempHC / sumHC;
                }
            }

            // 가스의 자연 냉각 (Ambient cooling) - 전역 설정(단열계 모드) 연동
            let ambientCoolingEnabled = document.getElementById('ambient-cooling-toggle')?.checked ?? true;
            if (ambientCoolingEnabled && el.state === 'gas' && currentTemp > 22) {
                currentTemp -= (currentTemp - 22) * 0.002;
            }

            nextTemp[i] = currentTemp;
        }
    }

    // 버퍼 스왑
    let tmpVX = velX; velX = nextVelX; nextVelX = tmpVX;
    let tmpVY = velY; velY = nextVelY; nextVelY = tmpVY;
    let tmpP = presGrid; presGrid = nextPres; nextPres = tmpP;
    let tmpT = tempGrid; tempGrid = nextTemp; nextTemp = tmpT;
}

function updateParticles() {
    processedThisFrame.fill(0); // 매 프레임 초기화
    const dirX = Math.random() < 0.5 ? 1 : -1;
    for (let y = height - 2; y >= 1; y--) {
        for (let ix = 1; ix < width - 1; ix++) {
            const x = (dirX === 1 ? ix : width - 1 - ix);
            const i = y * width + x;
            const id = grid[i];

            if (id === ELEMENTS.EMPTY.id || id === ELEMENTS.WALL.id) continue;
            if (processedThisFrame[i]) continue; // 이미 이동한 파티클 스킵
            const el = EL_LIST[id];
            const temp = tempGrid[i];

            // 1. 유니버설 상변화 (State Changes) - 압력에 따른 끓는점 변화 적용 및 잠열(Latent Heat)
            if (el.highTemp !== undefined) {
                // 기압(presGrid)이 높으면 끓는점이 상승하고, 기압이 낮으면 끓는점이 하강 (대략적인 보정치)
                // 가스로 변하는 끓음 현상에만 압력의 영향을 크게 받도록 설정
                let isBoiling = (EL_LIST[el.highTransition] && EL_LIST[el.highTransition].state === 'gas');
                let adjustedHighTemp = el.highTemp;
                
                if (isBoiling) {
                    adjustedHighTemp += presGrid[i] * 5.0; // 기압 1당 5도씩 끓는점 변화
                }

                if (temp > adjustedHighTemp) {
                    let excessHeat = temp - adjustedHighTemp;
                    tempGrid[i] = adjustedHighTemp; // 온도를 상변화점에 고정 (현열 상승 멈춤)
                    latentGrid[i] += excessHeat;    // 초과 열을 잠열로 축적
                    
                    let requiredLatent = el.highLatent || 100; // 요구되는 잠열 에너지 (기본값 100)
                    if (latentGrid[i] >= requiredLatent) {
                        let excessLatent = latentGrid[i] - requiredLatent; // 초과 잠열 보존
                        const nextId = el.highTransition;
                        setCell(x, y, nextId); // latentGrid[i]가 0으로 초기화됨
                        tempGrid[i] = adjustedHighTemp + excessLatent; // 초과 잠열을 온도로 환원
                        // 기화/승화 시 강한 압력 팽창 (부피 증가)
                        if (el.state !== 'gas' && EL_LIST[nextId] && EL_LIST[nextId].state === 'gas') {
                            presGrid[i] += 3.0;
                        }
                        continue;
                    }
                } else if (latentGrid[i] > 0 && temp < adjustedHighTemp) {
                    // 상변화점 아래로 내려가면 축적된 잠열을 다시 뱉어내어 온도 유지
                    let deficit = adjustedHighTemp - temp;
                    if (latentGrid[i] >= deficit) {
                        latentGrid[i] -= deficit;
                        tempGrid[i] = adjustedHighTemp;
                    } else {
                        tempGrid[i] += latentGrid[i];
                        latentGrid[i] = 0;
                    }
                }
            }
            
            if (el.lowTemp !== undefined) {
                let adjustedLowTemp = el.lowTemp;
                if (temp < adjustedLowTemp) {
                    let deficitHeat = adjustedLowTemp - temp;
                    tempGrid[i] = adjustedLowTemp; // 온도를 상변화점에 고정
                    latentGrid[i] -= deficitHeat;  // 부족한 열을 잠열(음수)로 축적
                    
                    let requiredLatent = el.lowLatent || 100;
                    if (latentGrid[i] <= -requiredLatent) {
                        let excessCold = Math.abs(latentGrid[i]) - requiredLatent; // 초과 냉각 보존
                        const nextId = el.lowTransition;
                        setCell(x, y, nextId); // latentGrid[i]가 0으로 초기화됨
                        tempGrid[i] = adjustedLowTemp - excessCold; // 초과 냉각을 온도로 환원
                        // 응결 시 압력 수축
                        if (el.state === 'gas' && EL_LIST[nextId] && EL_LIST[nextId].state !== 'gas') {
                            presGrid[i] -= 1.0;
                        }
                        continue;
                    }
                } else if (latentGrid[i] < 0 && temp > adjustedLowTemp) {
                    // 얼고 있는 중(잠열 방출 중)에 열을 받으면 잠열부터 상쇄
                    let excess = temp - adjustedLowTemp;
                    if (Math.abs(latentGrid[i]) >= excess) {
                        latentGrid[i] += excess;
                        tempGrid[i] = adjustedLowTemp;
                    } else {
                        tempGrid[i] += latentGrid[i]; // latentGrid는 음수
                        latentGrid[i] = 0;
                    }
                }
            }

            // 2. 생명력 (Life) 로직
            if (el.defaultLife) {
                lifeGrid[i]--;
                if (lifeGrid[i] <= 0) {
                    if (id === ELEMENTS.FIRE.id) {
                        // 허공에 찍은 불이 꺼질 땐 연기를 거의 만들지 않음
                        setCell(x, y, Math.random() < 0.05 ? ELEMENTS.SMOKE.id : ELEMENTS.EMPTY.id);
                    } else if (id === ELEMENTS.SMOKE.id) {
                        setCell(x, y, ELEMENTS.EMPTY.id); // 연기 소멸
                    }
                    continue;
                }
            }

            // 3. 화학 반응 (동적 반응 시스템) — 화학양론 비율 및 질량 보존 적용
            let reacted = false;
            for (let rxn of REACTIONS) {
                if (!rxn.active) continue;

                let r1 = rxn.reactants[0];
                let isDecomposition = rxn.reactants.length === 1;

                if (id === r1 || (!isDecomposition && id === rxn.reactants[1])) {
                    if (temp >= rxn.activationTemp) {

                        if (isDecomposition) {
                            // 열분해 반응: productRatio에 따라 생성물 배치
                            if (Math.random() < 0.05) {
                                let pRatio = rxn.productRatio || [1, 1];

                                // 생성물 목록 생성
                                let productsToPlace = [];
                                for (let pi = 0; pi < rxn.products.length; pi++) {
                                    let count = pRatio[pi] || 0;
                                    for (let c = 0; c < count; c++) {
                                        productsToPlace.push(rxn.products[pi]);
                                    }
                                }

                                // 첫 번째 생성물은 자신의 위치에 배치
                                if (productsToPlace.length > 0) {
                                    setCell(x, y, productsToPlace[0]);
                                }

                                // 나머지 생성물은 주변 빈 공간에 배치
                                let placed = 1;
                                let neighbors8 = [i-1, i+1, i-width, i+width, i-width-1, i-width+1, i+width-1, i+width+1];
                                for (let ni of neighbors8) {
                                    if (placed >= productsToPlace.length) break;
                                    if (ni >= 0 && ni < width * height && grid[ni] === ELEMENTS.EMPTY.id) {
                                        setCell(ni % width, Math.floor(ni / width), productsToPlace[placed]);
                                        tempGrid[ni] = tempGrid[i];
                                        processedThisFrame[ni] = 1; // 생성물 중복 처리 방지
                                        placed++;
                                    }
                                }

                                // 엔탈피 적용 (스케일 팩터 적용)
                                tempGrid[i] += rxn.enthalpy * ENTHALPY_SCALE;
                                presGrid[i] += 1.0;
                                processedThisFrame[i] = 1; // 현재 셀도 처리 완료

                                reacted = true;
                                break;
                            }
                        } else {
                            // 2분자 반응: 화학양론 비율(reactantRatio)에 따라 반응물 소비
                            let r2 = rxn.reactants[1];
                            let rRatio = rxn.reactantRatio || [1, 1];

                            // 현재 파티클이 r1인지 r2인지 결정
                            let myReactantIdx = (id === r1) ? 0 : 1;
                            let otherReactantIdx = 1 - myReactantIdx;
                            let myId = rxn.reactants[myReactantIdx];
                            let otherId = rxn.reactants[otherReactantIdx];
                            let myNeeded = rRatio[myReactantIdx] - 1; // 자신 1개 제외
                            let otherNeeded = rRatio[otherReactantIdx];

                            // 주변 8방향에서 필요한 반응물 수집
                            let neighbors8 = [i-1, i+1, i-width, i+width, i-width-1, i-width+1, i+width-1, i+width+1];
                            let myFoundCells = [];
                            let otherFoundCells = [];

                            for (let ni of neighbors8) {
                                if (ni < 0 || ni >= width * height) continue;
                                if (grid[ni] === myId && myFoundCells.length < myNeeded) {
                                    myFoundCells.push(ni);
                                } else if (grid[ni] === otherId && otherFoundCells.length < otherNeeded) {
                                    otherFoundCells.push(ni);
                                }
                            }

                            let hasEnoughReactants = (myFoundCells.length >= myNeeded && otherFoundCells.length >= otherNeeded);

                            // 엄격한 산소 요구 옵션 확인
                            let strictOxygenEnabled = document.getElementById('strict-oxygen-toggle')?.checked ?? true;
                            let bypassOxygen = !strictOxygenEnabled && rxn.type === 'combustion' && otherId === ELEMENTS.O2.id;

                            // 촉매(Catalyst) 로직: 주변에 NI(12)나 PT(17)가 있으면 활성화 온도 낮춤
                            let effectiveActivationTemp = rxn.activationTemp;
                            let catalyzed = false;
                            for (let cn of neighbors8) {
                                if (cn < 0 || cn >= width * height) continue;
                                if (grid[cn] === ELEMENTS.NI.id || grid[cn] === ELEMENTS.PLATINUM.id) {
                                    effectiveActivationTemp -= 250;
                                    catalyzed = true;
                                    break;
                                }
                            }

                            if (hasEnoughReactants) {
                                if (temp >= effectiveActivationTemp && Math.random() < (catalyzed ? 0.4 : 0.2)) {
                                    // 반응물 소비 셀 목록 (자신 포함)
                                    let consumedCells = [i, ...myFoundCells, ...otherFoundCells];

                                    // 생성물 목록 생성 (productRatio에 따라)
                                    let pRatio = rxn.productRatio || [1, 1];
                                    let productsToPlace = [];
                                    for (let pi = 0; pi < rxn.products.length; pi++) {
                                        let count = pRatio[pi] || 0;
                                        for (let c = 0; c < count; c++) {
                                            productsToPlace.push(rxn.products[pi]);
                                        }
                                    }

                                    // 소비된 셀을 모두 비우기
                                    for (let ci of consumedCells) {
                                        setCell(ci % width, Math.floor(ci / width), ELEMENTS.EMPTY.id);
                                    }

                                    // 생성물 배치: 소비된 셀 위치에 먼저 배치
                                    let placed = 0;
                                    for (let ci of consumedCells) {
                                        if (placed >= productsToPlace.length) break;
                                        setCell(ci % width, Math.floor(ci / width), productsToPlace[placed]);
                                        processedThisFrame[ci] = 1; // 생성물 중복 처리 방지
                                        placed++;
                                    }
                                    // 남은 생성물은 주변 빈 공간에 배치
                                    for (let ni of neighbors8) {
                                        if (placed >= productsToPlace.length) break;
                                        if (ni >= 0 && ni < width * height && grid[ni] === ELEMENTS.EMPTY.id) {
                                            setCell(ni % width, Math.floor(ni / width), productsToPlace[placed]);
                                            tempGrid[ni] = tempGrid[i];
                                            processedThisFrame[ni] = 1; // 생성물 중복 처리 방지
                                            placed++;
                                        }
                                    }

                                    // 엔탈피 적용 (스케일 팩터, 소비된 셀에 균등 분배)
                                    let enthalpyPerCell = rxn.enthalpy * ENTHALPY_SCALE / consumedCells.length;
                                    for (let ci of consumedCells) {
                                        tempGrid[ci] += enthalpyPerCell;
                                    }
                                    presGrid[i] += 1.0;

                                    // 발열 연소 반응 시 FIRE를 인접 빈 공간에 배치 (생성물 덮어쓰기 방지)
                                    if (rxn.enthalpy > 0 && rxn.type === 'combustion') {
                                        if (Math.random() < 0.7) {
                                            for (let fni of neighbors8) {
                                                if (fni >= 0 && fni < width * height && grid[fni] === ELEMENTS.EMPTY.id) {
                                                    setCell(fni % width, Math.floor(fni / width), ELEMENTS.FIRE.id);
                                                    tempGrid[fni] = tempGrid[i];
                                                    processedThisFrame[fni] = 1;
                                                    break;
                                                }
                                            }
                                        }
                                    }

                                    reacted = true;
                                    break;
                                }
                            }
                            // 산소가 없지만 전파가 필요한 경우
                            else if (bypassOxygen && temp >= effectiveActivationTemp) {
                                let nearFire = false;
                                for (let ni of [i-1, i+1, i-width, i+width]) {
                                    if (grid[ni] === ELEMENTS.FIRE.id) { nearFire = true; break; }
                                }

                                if (nearFire && Math.random() < 0.1) {
                                    let p1 = rxn.products[0];
                                    let p2 = rxn.products[1] !== undefined ? rxn.products[1] : ELEMENTS.EMPTY.id;

                                    let residueId = (EL_LIST[p2] && EL_LIST[p2].state !== 'gas') ? p2 : p1;
                                    let emitId = (residueId === p2) ? p1 : p2;

                                    setCell(x, y, residueId);
                                    processedThisFrame[i] = 1;
                                    if (emitId !== ELEMENTS.EMPTY.id) {
                                        for (let ni of [i-1, i+1, i-width, i+width]) {
                                            if (ni >= 0 && ni < width * height && grid[ni] === ELEMENTS.EMPTY.id) {
                                                setCell(ni % width, Math.floor(ni / width), emitId);
                                                tempGrid[ni] = tempGrid[i];
                                                processedThisFrame[ni] = 1;
                                                break;
                                            }
                                        }
                                    }
                                    tempGrid[i] += rxn.enthalpy * ENTHALPY_SCALE * 0.5;
                                    presGrid[i] += 1.0;
                                    // FIRE를 인접 빈 공간에 배치 (생성물 덮어쓰기 방지)
                                    if (Math.random() < 0.5) {
                                        for (let fni of [i-1, i+1, i-width, i+width]) {
                                            if (fni >= 0 && fni < width * height && grid[fni] === ELEMENTS.EMPTY.id) {
                                                setCell(fni % width, Math.floor(fni / width), ELEMENTS.FIRE.id);
                                                tempGrid[fni] = tempGrid[i];
                                                processedThisFrame[fni] = 1;
                                                break;
                                            }
                                        }
                                    }
                                    reacted = true;
                                    break;
                                }
                            }
                        }
                        if (reacted) break;
                    }
                }
            }
            if (reacted) continue;

            // 불(FIRE)의 자체 기압 생성 효과
            if (id === ELEMENTS.FIRE.id) {
                presGrid[i] += 0.1;
            }

            // 4. 물리 이동 및 중력 (Particle Momentum & Gravity)
            let vx = velX[i], vy = velY[i];

            // 분말이나 액체일 경우 자체적인 중력 가속도(vy)를 바람(유체 속도)에 추가로 적용
            if (el.state === 'powder' || el.state === 'liquid') {
                vy += 1.0; // 기본 중력 가속도
            }
            
            // 기체는 부력/무게에 따른 상하 이동 추가
            if (el.state === 'gas') {
                if (el.weight < 0) vy -= 0.5; // 가벼운 기체는 위로
                else if (el.weight > 0) vy += 0.5; // 무거운 기체는 아래로
            }

            // 속도(vx, vy)가 일정 수치 이상이면 해당 방향으로 이동 시도
            if (Math.abs(vx) > 0.5 || Math.abs(vy) > 0.5) {
                let dx = Math.abs(vx) > 0.5 ? Math.sign(vx) : 0;
                let dy = Math.abs(vy) > 0.5 ? Math.sign(vy) : 0;
                
                // 이동하려는 목표 셀이 내부 영역을 벗어나지 않는지 확인 (경계 셀 함정 방지)
                if (x + dx >= 1 && x + dx <= width - 2 && y + dy >= 1 && y + dy <= height - 2) {
                    let targetIdx = (y + dy) * width + (x + dx);
                    let targetId = grid[targetIdx];
                    let targetEl = EL_LIST[targetId];

                    // 목표 셀이 비어있거나, 나보다 가벼운 물질(예: 고체가 기체를 밀어냄)이면 자리를 바꿈
                    if (targetId === ELEMENTS.EMPTY.id || (targetEl && targetEl.state === 'gas' && el.state !== 'gas') || (targetEl && targetEl.weight < el.weight)) {
                        swap(i, targetIdx);
                        continue; // 이동했으면 다음 입자로
                    }
                }
            }

            // 속도로 이동하지 못한 입자들의 자연스러운 흐름 (기존 로직 보완)
            if (Math.random() > (0.4 + presGrid[i] * 0.1)) continue;

            if (el.state === 'powder') {
                // 아래, 아래왼쪽, 아래오른쪽 순서로 빈 공간 찾기
                let moves = [i + width, i + width - 1, i + width + 1];
                // 50% 확률로 좌우 이동 방향 섞기 (자연스러운 쌓임)
                if (Math.random() < 0.5) moves = [i + width, i + width + 1, i + width - 1];

                for (let tgt of moves) {
                    let tgtX = tgt % width, tgtY = (tgt - tgtX) / width;
                    if (tgtX >= 1 && tgtX <= width - 2 && tgtY >= 1 && tgtY <= height - 2) {
                        let tId = grid[tgt];
                        if (tId !== ELEMENTS.WALL.id && (tId === ELEMENTS.EMPTY.id || EL_LIST[tId].weight < el.weight)) {
                            swap(i, tgt); break;
                        }
                    }
                }
            } else if (el.state === 'liquid') {
                let moved = false;
                let moves = [i + width, i + width - 1, i + width + 1];
                if (Math.random() < 0.5) moves = [i + width, i + width + 1, i + width - 1];

                for (let tgt of moves) {
                    let tgtX = tgt % width, tgtY = (tgt - tgtX) / width;
                    if (tgtX >= 1 && tgtX <= width - 2 && tgtY >= 1 && tgtY <= height - 2) {
                        let tId = grid[tgt];
                        if (tId !== ELEMENTS.WALL.id && (tId === ELEMENTS.EMPTY.id || EL_LIST[tId].weight < el.weight)) {
                            swap(i, tgt); moved = true; break;
                        }
                    }
                }

                if (!moved) {
                    // 점도(Dispersion) 처리: 좌우로 한 칸씩 swap하며 퍼짐 (가스 건너뜀 방지)
                    const disp = el.dispersion !== undefined ? el.dispersion : 1;
                    const side = Math.random() < 0.5 ? 1 : -1;
                    let curIdx = i;
                    let curX = x;
                    for (let d = 1; d <= disp; d++) {
                        let tx = curX + side;
                        if (tx < 1 || tx > width - 2) break;
                        let tgtIdx = y * width + tx;
                        let tId = grid[tgtIdx];
                        if (tId === ELEMENTS.EMPTY.id || (EL_LIST[tId] && EL_LIST[tId].state === 'gas')) {
                            swap(curIdx, tgtIdx);
                            curIdx = tgtIdx;
                            curX = tx;
                        } else {
                            break;
                        }
                    }
                }
            } else if (el.state === 'gas') {
                // 기체 이동 속도 제한: 한 프레임에 너무 멀리 가지 않도록 확률 조정
                if (Math.random() > 0.3) {
                    const r = Math.random();
                    let dy = 0;
                    if (el.weight < 0 && r < 0.6) dy = -1;
                    else if (el.weight > 0 && r < 0.6) dy = 1;
                    else dy = (Math.random() < 0.5 ? 1 : -1);
                    let dx = (Math.random() < 0.5 ? 1 : -1);

                    let nx = x + dx;
                    let ny = y + dy;

                    if (nx >= 1 && nx <= width - 2 && ny >= 1 && ny <= height - 2) {
                        let tgt = ny * width + nx;
                        let tId = grid[tgt];
                        if (tId !== ELEMENTS.WALL.id) {
                            let tEl = EL_LIST[tId];
                            if (tId === ELEMENTS.EMPTY.id) swap(i, tgt);
                            else if (tEl && tEl.state === 'gas') {
                                // 같은 기체끼리는 무게차이에 따라 섞임
                                if ((dy > 0 && el.weight > tEl.weight) || (dy < 0 && el.weight < tEl.weight) || Math.random() < 0.05) swap(i, tgt);
                            }
                        }
                    }
                }
            }
        }
    }
}

function updateHUD() {
    if (mouseGridX >= 0 && mouseGridX < width && mouseGridY >= 0 && mouseGridY < height) {
        const idx = mouseGridY * width + mouseGridX;
        let name = "-";
        if (pipeGrid[idx] !== -1) name = "[파이프] " + EL_LIST[pipeGrid[idx]].name;
        else name = EL_LIST[grid[idx]] ? EL_LIST[grid[idx]].name : '-';
        
        hudName.textContent = name;
        hudTemp.textContent = Math.round(tempGrid[idx]);
        hudPres.textContent = presGrid[idx].toFixed(2);
    }
}

function render() {
    const data = imgData.data;
    for (let i = 0; i < grid.length; i++) {
        const idx = i * 4;
        if (pipeGrid[i] !== -1 && displayMode === 'normal') {
            const pipeEl = EL_LIST[pipeGrid[i]];
            let r = pipeEl.color[0] * 0.6, g = pipeEl.color[1] * 0.6, b = pipeEl.color[2] * 0.6;
            if ((i % 5) === 0) { r += 50; g += 50; b += 50; }
            data[idx] = r; data[idx+1] = g; data[idx+2] = b; data[idx+3] = 255;
            continue;
        }

        if (displayMode === 'heat') {
            const t = tempGrid[i];
            data[idx] = Math.min(255, t * 0.5); data[idx+1] = Math.max(0, 100 - t * 0.1); data[idx+2] = Math.max(0, 255 - t); data[idx+3] = 255;
        } else if (displayMode === 'pressure') {
            const p = Math.abs(presGrid[i]) * 30;
            data[idx] = presGrid[i] > 0 ? p : 0; data[idx+1] = 0; data[idx+2] = presGrid[i] < 0 ? p : 0; data[idx+3] = 255;
        } else if (displayMode === 'velocity') {
            const vx = velX[i] * 50, vy = velY[i] * 50;
            data[idx] = Math.max(0, vx + 128); data[idx+1] = Math.max(0, vy + 128); data[idx+2] = Math.min(255, Math.sqrt(vx*vx + vy*vy) * 2); data[idx+3] = 255;
        } else {
            const el = EL_LIST[grid[i]];
            let r = el.color[0], g = el.color[1], b = el.color[2];
            // 불이나 연기는 수명(Life)에 따라 투명도/밝기 조절
            if (el.defaultLife) {
                const ratio = lifeGrid[i] / el.defaultLife;
                if (grid[i] === ELEMENTS.FIRE.id) { g *= ratio; b *= ratio; } // 불은 꺼질수록 붉어짐
                else if (grid[i] === ELEMENTS.SMOKE.id) { r *= ratio; g *= ratio; b *= ratio; } // 연기는 흐려짐
            }
            data[idx] = r; data[idx+1] = g; data[idx+2] = b; data[idx+3] = 255;
        }
    }
    ctx.putImageData(imgData, 0, 0);
}

let activeCategory = 'SOLIDS';

const refreshUI = () => {
    elToolbar.innerHTML = '';
    const CATEGORIES = {
        SOLIDS: ['벽', '단열벽', '모래', '석탄(C)', '카본(순수 탄소)', '유리', '얼음', '암석'],
        METALS: ['철(Fe)', '구리(Cu)', '니켈(Ni)', '백금(Pt)', '카본스틸'],
        LIQUIDS: ['물(H2O)', '원유(Oil)', '용암'],
        GASES: ['메테인(CH4)', '수증기', '산소(O2)', '이산화탄소', '일산화탄소', '수소(H2)', '경질가스', '연기'],
        SPECIAL: ['지우개', '열/불', '재(Ash)']
    };
    
    // 탭 영역
    const tabContainer = document.createElement('div');
    tabContainer.style.display = 'flex';
    tabContainer.style.gap = '5px';
    tabContainer.style.width = '100%';
    tabContainer.style.justifyContent = 'center';
    tabContainer.style.borderBottom = '2px solid #555';
    tabContainer.style.paddingBottom = '10px';
    tabContainer.style.marginBottom = '10px';

    Object.keys(CATEGORIES).forEach(cat => {
        const tabBtn = document.createElement('button');
        tabBtn.textContent = cat;
        if (activeCategory === cat) {
            tabBtn.style.backgroundColor = '#555';
            tabBtn.style.color = '#fff';
            tabBtn.style.borderColor = '#888';
        } else {
            tabBtn.style.backgroundColor = '#222';
            tabBtn.style.color = '#aaa';
            tabBtn.style.borderBottom = 'none';
        }
        tabBtn.onclick = () => {
            activeCategory = cat;
            refreshUI();
        };
        tabContainer.appendChild(tabBtn);
    });
    elToolbar.appendChild(tabContainer);

    // 요소(물질) 버튼 영역
    const elemContainer = document.createElement('div');
    elemContainer.style.display = 'flex';
    elemContainer.style.flexWrap = 'wrap';
    elemContainer.style.gap = '8px';
    elemContainer.style.justifyContent = 'center';
    elemContainer.style.width = '100%';

    CATEGORIES[activeCategory].forEach(name => {
        const el = Object.values(ELEMENTS).find(e => e.name === name);
        if(!el) return;
        const btn = document.createElement('button');
        btn.textContent = el.name;
        if(el.id === currentElement) btn.classList.add('active');
        btn.onclick = () => {
            currentElement = el.id;
            refreshUI(); // 버튼 액티브 상태 업데이트
        };
        elemContainer.appendChild(btn);
    });
    elToolbar.appendChild(elemContainer);
};
refreshUI();

function loop(timestamp) {
    if (timestamp - lastTime >= frameDelay) { 
        updatePipes(); 
        updateAirAndHeat(); 
        updateParticles(); 
        render(); 
        updateHUD(); 
        lastTime = timestamp; 
    }
    requestAnimationFrame(loop);
}
loop(0);
