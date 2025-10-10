// Handlers only; creation UI is in /script/create-character.js

function setCookie(name, value, path, maxAgeSec = 3600) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSec}`
}

function getCookie(name) {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop().split(';').shift()
  return undefined
}

window.onCharacterSpriteGenerate = async (payload) => {
  try {
    const res = await fetch('/character/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error('Image generation failed')
    const { imageUrl } = await res.json()
    if (imageUrl) {
      setCookie('imageUrl', imageUrl, 3600)
      const el = document.getElementById('portrait')
      if (el) {
        el.innerHTML = ''
        const img = document.createElement('img')
        img.src = imageUrl
        img.alt = 'Character portrait'
        img.style.width = '100%'
        img.style.height = '100%'
        img.style.objectFit = 'contain'
        el.appendChild(img)
      }
    }
  } catch (e) {
    console.error(e)
    alert('Не удалось сгенерировать портрет')
  }
}

window.onCharacterCreation = async (body) => {
  try {
    const res = await fetch('/character', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    if (!res.ok) throw new Error('Character save failed')
    alert('Персонаж создан')
  } catch (e) {
    console.error(e)
    alert('Не удалось создать персонажа')
  }
}

const newGameBtn = document.getElementById('newGameButton')
if (newGameBtn) newGameBtn.addEventListener('click', () => { window.location.href = 'html/create-character.html' })

const continueBtn = document.getElementById('continueButton')
if (continueBtn) continueBtn.addEventListener('click', () => { window.location.href = 'html/game.html' })
