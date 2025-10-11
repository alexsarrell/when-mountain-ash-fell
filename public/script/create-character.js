function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// ============ Динамическое состояние ============
const state = {
    pool: 10,
    base: {},           // будет заполнено после загрузки
    age: null,
    race: null,
    cls: null,
    points: {},         // будет заполнено после загрузки
    content: { races: [], classes: [], items: {}, stats: {} },
    spriteGenerated: false
}

// ============ Хелперы для работы со статами ============

// Получить все PRIMARY статы (которые можно распределять)
function getPrimaryStats() {
    return Object.entries(state.content.stats)
        .filter(([_, def]) => def.category === 'primary')
        .map(([key, def]) => [key, def.label])
}

// Получить все VITAL статы (health, mana)
function getVitalStats() {
    return Object.entries(state.content.stats)
        .filter(([_, def]) => def.category === 'vital')
}

// Получить дефолтное значение стата
function getDefaultValue(key) {
    return state.content.stats[key]?.defaultValue ?? 0
}

// Получить мин/макс значения
function getStatLimits(key) {
    const def = state.content.stats[key]
    return { min: def?.min ?? 0, max: def?.max ?? 10 }
}

// ============ Инициализация state после загрузки ============
function initializeState() {
    // Заполняем base дефолтными значениями
    state.base = Object.fromEntries(
        Object.entries(state.content.stats).map(([key, def]) => [key, def.defaultValue])
    )

    // Заполняем points нулями для primary статов
    state.points = Object.fromEntries(
        getPrimaryStats().map(([key]) => [key, 0])
    )
}

// ============ Расчёт бонусов ============

function raceBonuses() {
    if (!state.race?.statBonuses) return {}
    return state.race.statBonuses
}

function classBase() {
    if (!state.cls?.baseStats) return {}
    return state.cls.baseStats
}

function eff() {
    const rb = raceBonuses()
    const cb = classBase()
    const res = { ...state.base, ...cb }

    // Применяем бонусы расы и очки игрока
    for (const [key] of getPrimaryStats()) {
        if (key in rb) res[key] = (res[key] || 0) + (rb[key] || 0)
        res[key] = (res[key] || 0) + (state.points[key] || 0)
    }

    return res
}

// ============ Валидация ============

function canSubmit() {
    const nameOk = document.getElementById('name').value.trim().length > 0
    const appearanceOk = document.getElementById('appearance').value.trim().length > 0
    const e = eff()

    // Проверяем, что все primary статы >= минимума
    const statsOk = getPrimaryStats().every(([key]) => {
        const value = e[key] || 0
        const limits = getStatLimits(key)
        return value >= limits.min
    })

    return !!(state.race && state.cls && nameOk && appearanceOk && state.pool === 0 && statsOk)
}

// ============ Рендеринг итоговых статов ============

function renderFinal() {
    const e = eff()
    const box = document.getElementById('final')
    box.innerHTML = ''
    const list = document.createElement('div')
    list.className = 'final-list'

    const pairs = []

    // Сначала vital статы
    for (const [key, def] of getVitalStats()) {
        pairs.push([def.label, e[key]])
    }

    // Потом primary статы
    for (const [key, label] of getPrimaryStats()) {
        pairs.push([label, e[key]])
    }

    pairs.forEach(([label, value]) => {
        const line = document.createElement('div')
        line.className = 'line'
        line.innerHTML = `<span>${label}</span><span>${value}</span>`
        list.appendChild(line)
    })

    box.appendChild(list)
}

// ============ Рендеринг предметов ============

function renderItems() {
    const box = document.getElementById('items')
    box.innerHTML = ''
    if (!state.cls) return

    const ids = state.cls.startingItems || []
    ids.forEach(id => {
        const it = state.content.items[id]
        if (!it) return

        const line = document.createElement('div')
        line.className = 'item'

        const left = document.createElement('div')
        left.innerHTML = `<b>${it.name}</b> <span class="small">(${it.type})</span><div class="small">${it.description || ''}</div>`

        const right = document.createElement('div')
        const st = []
        for (const k of Object.keys(it.stats || {})) {
            const def = state.content.stats[k]
            const statLabel = def?.label || k
            st.push(`${statLabel}+${it.stats[k]}`)
        }
        right.textContent = st.join(', ')

        line.appendChild(left)
        line.appendChild(right)
        box.appendChild(line)
    })
}

// ============ Рендеринг статов для распределения ============

function renderStats() {
    const wrap = document.getElementById('stats')
    wrap.innerHTML = ''
    const bonuses = raceBonuses()

    for (const [key, label] of getPrimaryStats()) {
        const bonus = bonuses[key] || 0
        const limits = getStatLimits(key)
        const div = document.createElement('div')
        div.className = 'stat'

        const bClass = bonus > 0 ? 'good' : (bonus < 0 ? 'bad' : '')
        const val = eff()[key]

        const def = state.content.stats[key]
        const title = def?.description || ''

        div.innerHTML = `
      <h4 title="${title}">${label} <span class="${bClass}">${bonus > 0 ? `(+${bonus})` : (bonus < 0 ? `(${bonus})` : '')}</span></h4>
      <div class="ctrl">
        <button data-k="${key}" data-d="-1" class="btn" style="padding:4px 10px">-</button>
        <div class="pill" style="min-width:48px; text-align:center">${val}</div>
        <button data-k="${key}" data-d="1" class="btn" style="padding:4px 10px">+</button>
      </div>`
        wrap.appendChild(div)
    }

    document.getElementById('pool').textContent = String(state.pool)
    renderFinal()

    wrap.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            const k = btn.dataset.k
            const d = Number(btn.dataset.d)
            const limits = getStatLimits(k)
            const defaultValue = getDefaultValue(k)

            // Текущее значение БЕЗ бонусов расы/класса
            // (только базовое + очки игрока)
            const playerPoints = state.points[k] || 0
            const baseValue = state.base[k] || 0

            // Для проверки максимума смотрим полное значение (с бонусами класса из base)
            const totalBeforeRace = baseValue + playerPoints

            // Увеличение: проверяем пул и максимум
            if (d > 0) {
                if (state.pool <= 0) return  // нет очков
                if (totalBeforeRace >= limits.max) return  // достигнут максимум
            }

            // Уменьшение: проверяем что не уходим ниже defaultValue
            // (игрок не может скручивать статы ниже дефолта вручную)
            if (d < 0) {
                // Проверяем что после вычитания не станет меньше defaultValue
                if (totalBeforeRace <= defaultValue) return
            }

            // Применяем изменение
            state.points[k] = playerPoints + d
            state.pool -= d
            state.spriteGenerated = false

            renderStats()
            syncSubmit()
        })
    })
}

// ============ Рендеринг рас ============

function renderRaces() {
    const wrap = document.getElementById('races')
    wrap.innerHTML = ''

    state.content.races.forEach(r => {
        const div = document.createElement('div')
        div.className = 'race'

        // Динамически собираем бонусы
        const bonusTexts = []
        for (const [key, value] of Object.entries(r.statBonuses || {})) {
            const def = state.content.stats[key]
            const label = def?.label || key
            bonusTexts.push(`${label} ${value > 0 ? '+' : ''}${value}`)
        }

        div.innerHTML = `
      <div style="font-weight:700">${r.name}</div>
      <div class="small">${r.description}</div>
      <div class="small">${bonusTexts.join(' / ')}</div>
    `

        if (state.race?.id === r.id) div.classList.add('active')

        div.addEventListener('click', () => {
            state.race = r
            state.spriteGenerated = false
            renderRaces()
            renderStats()
            syncSubmit()
        })

        wrap.appendChild(div)
    })
}

// ============ Рендеринг классов ============

function renderClasses() {
    const wrap = document.getElementById('classes')
    wrap.innerHTML = ''

    state.content.classes.forEach(c => {
        const div = document.createElement('div')
        div.className = 'cls'

        const statTexts = []
        for (const [key, value] of Object.entries(c.baseStats || {})) {
            const def = state.content.stats[key]
            const label = def?.label || key
            statTexts.push(`${label} ${value}`)
        }

        div.innerHTML = `
          <div style="font-weight:700">${c.name}</div>
          <div class="small">${c.description}</div>
          <div class="small">${statTexts.join(' / ')}</div>
        `

        if (state.cls?.id === c.id) div.classList.add('active')

        div.addEventListener('click', () => {
            state.cls = c
            state.spriteGenerated = false
            renderClasses()
            renderStats()
            renderItems()
            syncSubmit()
        })

        wrap.appendChild(div)
    })
}

// ============ Синхронизация кнопок ============

function syncSubmit() {
    const can = canSubmit()
    const genBtn = document.getElementById('generate-character-sprite')
    const createBtn = document.getElementById('create-character')
    if (genBtn) genBtn.disabled = !can
    if (createBtn) createBtn.disabled = !(can && state.spriteGenerated)
}

// ============ События полей ввода ============

document.getElementById('name').addEventListener('input', () => {
    state.spriteGenerated = false
    syncSubmit()
})

document.getElementById('age').addEventListener('input', () => {
    state.age = Number(document.getElementById('age').value) || null
    state.spriteGenerated = false
    syncSubmit()
})

document.getElementById('appearance').addEventListener('input', () => {
    state.spriteGenerated = false
    syncSubmit()
})

document.getElementById('sex').addEventListener('change', () => {
    state.spriteGenerated = false
    syncSubmit()
})

// ============ Загрузка контента ============

async function loadContent() {
    const res = await fetch('/game/content')
    const data = await res.json()
    state.content = data

    // ВАЖНО: инициализируем state после загрузки
    initializeState()

    renderRaces()
    renderClasses()
    renderStats()
    renderItems()
    syncSubmit()
}

// ============ Генерация спрайта ============

document.getElementById('generate-character-sprite').addEventListener('click', async () => {
    const payload = {
        name: document.getElementById('name').value.trim(),
        age: state.age,
        sex: document.getElementById('sex').value,
        race: state.race?.id,
        class: state.cls,
        stats: eff(),
        appearance: document.getElementById('appearance').value.trim(),
        items: (state.cls?.startingItems || [])
            .map(id => state.content.items[id])
            .filter(Boolean)
    }

    const prev = typeof getCookie === 'function' ? getCookie('imageUrl') : undefined

    if (window.onCharacterSpriteGenerate) {
        await window.onCharacterSpriteGenerate(payload)
        const curr = typeof getCookie === 'function' ? getCookie('imageUrl') : undefined
        if (curr && curr !== prev) state.spriteGenerated = true
    }

    syncSubmit()
})

// ============ Создание персонажа ============

document.getElementById('create-character').addEventListener('click', () => {
    const statsObj = eff()

    console.log(`starting items ${state.cls?.startingItems || []}`)

    const id = uuidv4()

    const payload = {
        _id: id,
        characterName: document.getElementById('name').value.trim(),
        sex: document.getElementById('sex').value === 'FEMALE' ? 1 : 0,
        age: state.age,
        race: state.race,
        class: state.cls,
        stats: statsObj,
        level: 1,
        appearance: document.getElementById('appearance').value.trim(),
        inventory: (state.cls?.startingItems || [])
            .map(id => ({
                id,
                name: state.content.items[id].name
            }))
            .filter(Boolean),
        imageUrl: getCookie('imageUrl')
    }

    if (window.onCharacterCreation) {
        window.onCharacterCreation(payload).then(r => r)
    }

    sessionStorage.setItem('characterId', id.toString())
    setCookie('characterId', id.toString(), '/', 3600000)

    window.location.href = 'game.html'
})

// ============ Запуск ============

loadContent().catch(err => {
    console.error(err)
    alert('Не удалось загрузить контент')
})
