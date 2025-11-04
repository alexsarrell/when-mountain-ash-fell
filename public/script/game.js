
function saveChatHistory() {
    const messages = Array.from(document.querySelectorAll('.chat-message')).map(msg => ({
        text: msg.textContent,
        isUser: msg.classList.contains('user')
    }))
    sessionStorage.setItem('chatHistory', JSON.stringify(messages))
}

function addMessage(text, isUser) {
    const messagesContainer = document.getElementById('chat-messages')
    const messageDiv = document.createElement('div')
    messageDiv.className = `chat-message ${isUser ? 'user' : 'assistant'}`
    messageDiv.textContent = text
    messagesContainer.appendChild(messageDiv)
    messagesContainer.scrollTop = messagesContainer.scrollHeight
    saveChatHistory()
}

document.getElementById('chat-form').addEventListener('submit', async function (event) {
    event.preventDefault()
    
    hideDiceBox()
    
    const actionValue = document.getElementById('action').value.trim()
    if (!actionValue) return
    
    addMessage(actionValue, true)
    document.getElementById('action').value = ''
    
    const characterId = sessionStorage.getItem('characterId') ?? getCookie('characterId')
    const payload = {
        characterId,
        action: actionValue,
    }

    if (window.onAction) {
        await window.onAction(payload)
    }
})

window.onAction = async (body) => {
    const messagesContainer = document.getElementById('chat-messages')
    const loadingDiv = document.createElement('div')
    loadingDiv.className = 'chat-message assistant loading-dots'
    loadingDiv.id = 'loading-message'
    messagesContainer.appendChild(loadingDiv)
    messagesContainer.scrollTop = messagesContainer.scrollHeight
    
    try {
        const response = await fetch('/game/action', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(body)
        })
        
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        
        while (true) {
            const {done, value} = await reader.read()
            if (done) break
            
            buffer += decoder.decode(value, {stream: true})
            const lines = buffer.split('\n\n')
            buffer = lines.pop()
            
            for (const line of lines) {
                if (!line.startsWith('data: ')) continue
                const jsonStr = line.slice(6)
                console.log('SSE raw JSON:', jsonStr)
                
                let data
                try {
                    data = JSON.parse(jsonStr)
                } catch (e) {
                    console.error('JSON parse error:', e, 'Raw:', jsonStr)
                    continue
                }
                
                switch (data.type) {
                    case 'dice_roll':
												console.log('Try to roll dice', window.diceBox)
                        showDiceRoll(data.dice, data.result)
                        break
                    
                    case 'narrative':
                        loadingDiv.remove()
                        addMessage(data.narrative, false)
                        break
                    
                    case 'location_image':
                        document.getElementById('locImg').setAttribute('src', data.url)
                        document.body.style.setProperty('--bg-image', `url(${data.url})`)
                        sessionStorage.setItem('locationImage', data.url)
                        break
                    
                    case 'character_image':
                        console.log('Character image updated:', data.url)
                        break
                    
                    case 'error':
                        loadingDiv.remove()
                        addMessage('Ошибка: ' + data.message, false)
                        break
                    
                    case 'done':
                        console.log('Action processing complete')
                        break
                }
            }
        }
    } catch (e) {
        console.error(e)
        loadingDiv.remove()
        addMessage('Произошла ошибка при обработке действия', false)
    }
}

function showDiceRoll(dice, result) {
    const diceBoxEl = document.getElementById('dice-box');
    diceBoxEl.style.opacity = '1';
    diceBoxEl.style.pointerEvents = 'auto';
    
    const diceNotation = `${dice}@${result}`;
    console.log('Rolling dice:', diceNotation, 'Result:', result);
    window.diceBox.roll(diceNotation);
}

function hideDiceBox() {
    console.log('hideDiceBox called');
    const diceBoxEl = document.getElementById('dice-box');
    if (diceBoxEl) {
        diceBoxEl.style.opacity = '0';
        diceBoxEl.style.pointerEvents = 'none';
        console.log('dice box hidden');
    }
}

let equipmentSnapshot = null

document.getElementById('inventory').addEventListener('click', async function (event) {
    event.preventDefault()
    console.log('Open inventory', event)
    
    const characterId = sessionStorage.getItem('characterId') ?? getCookie('characterId')
    const payload = {
        characterId
    }

    if (window.getInventory) {
        await window.getInventory(payload).then(r => {
            const inventoryDialog = document.getElementById('inventoryDialog')
            const inventory = document.getElementById('inventoryGrid')
            console.log('result', r)
            
            equipmentSnapshot = {}
            for (const slot in r.equipment) {
                equipmentSnapshot[slot] = r.equipment[slot]?.id || null
            }
            console.log('Equipment snapshot saved:', equipmentSnapshot)


	        // Portrait
	        if (r.imageUrl) {
		        const el = document.getElementById('inventory-portrait')
		        if (el) {
			        el.innerHTML = ''
			        const img = document.createElement('img')
			        img.src = r.imageUrl
			        img.alt = 'Character portrait'
			        img.className = 'inventory-portrait-image'
			        el.appendChild(img)
		        }
	        }

	        // Inventory items
            inventory.innerHTML = ''
            const totalSlots = 15
            for (let i = 0; i < totalSlots; i++)
            {
                const emptySlot = document.createElement('div')
                emptySlot.className = 'inventory-item empty'
                emptySlot.textContent = ''
                inventory.appendChild(emptySlot)
            }
            for (const i in r.inventory) {
                const item = r.inventory[i]
                const slotIndex = parseInt(i)

                if (slotIndex < totalSlots) {
                    const slot = inventory.children[slotIndex]
                    slot.className = 'inventory-item'
                    slot.textContent = item.name
                    slot.dataset.itemId = item.id
                    slot.setAttribute('draggable', 'true')
                }
                else {
                    console.error('Инвентарь переполнен!')
                }
            }
            inventoryDialog.showModal()
        })
    }
})

document.getElementById('CloseDialog').addEventListener('click', async function (event) {
    event.preventDefault()
    console.log('CloseDialog')
    const inventoryDialog = document.getElementById('inventoryDialog')
    inventoryDialog.close()
    
    const characterId = sessionStorage.getItem('characterId') ?? getCookie('characterId')
    
    try {
        const currentRes = await fetch(`/character?id=${characterId}`)
        if (!currentRes.ok) {
            console.error('Failed to fetch current equipment')
            return
        }
        
        const currentData = await currentRes.json()
        const currentEquipment = {}
        for (const slot in currentData.equipment) {
            currentEquipment[slot] = currentData.equipment[slot]?.id || null
        }
        
        console.log('Current equipment:', currentEquipment)
        console.log('Snapshot equipment:', equipmentSnapshot)
        
        const equippedItemIds = []
        const unequippedItemIds = []
        
        if (equipmentSnapshot) {
            const allSlots = new Set([...Object.keys(currentEquipment), ...Object.keys(equipmentSnapshot)])
            
            for (const slot of allSlots) {
                const current = currentEquipment[slot] || null
                const snapshot = equipmentSnapshot[slot] || null
                
                if (current !== snapshot) {
                    if (current && !snapshot) {
                        equippedItemIds.push(current)
                        console.log(`Equipped in ${slot}: ${current}`)
                    } else if (!current && snapshot) {
                        unequippedItemIds.push(snapshot)
                        console.log(`Unequipped from ${slot}: ${snapshot}`)
                    } else if (current && snapshot) {
                        unequippedItemIds.push(snapshot)
                        equippedItemIds.push(current)
                        console.log(`Replaced in ${slot}: ${snapshot} -> ${current}`)
                    }
                }
            }
        }
        
        if (equippedItemIds.length > 0 || unequippedItemIds.length > 0) {
            console.log('Equipment changed, regenerating sprite...', { equippedItemIds, unequippedItemIds })
            const res = await fetch('/character/sprite/regenerate', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ 
                    characterId,
                    equippedItemIds,
                    unequippedItemIds
                })
            })
            
            if (res.ok) {
                const data = await res.json()
                console.log('Character sprite regenerated:', data.imageUrl)
            } else {
                console.error('Failed to regenerate sprite')
            }
        } else {
            console.log('No equipment changes detected, skipping regeneration')
        }
    } catch (err) {
        console.error('Failed to check equipment changes', err)
    }
})


const chatToggleBtn = document.getElementById('chat-toggle')
const chatCollapseBtn = document.querySelector('.chat-collapse-btn')
const chatContainer = document.querySelector('.chat-container')

chatToggleBtn.addEventListener('click', function() {
    chatContainer.classList.remove('collapsed')
    chatToggleBtn.classList.add('hidden')
})

chatCollapseBtn.addEventListener('click', function() {
    chatContainer.classList.add('collapsed')
    chatToggleBtn.classList.remove('hidden')
})

function loadGameState() {
    const chatHistory = sessionStorage.getItem('chatHistory')
    if (chatHistory) {
        const messages = JSON.parse(chatHistory)
        messages.forEach(msg => {
            const messagesContainer = document.getElementById('chat-messages')
            const messageDiv = document.createElement('div')
            messageDiv.className = `chat-message ${msg.isUser ? 'user' : 'assistant'}`
            messageDiv.textContent = msg.text
            messagesContainer.appendChild(messageDiv)
        })
        const messagesContainer = document.getElementById('chat-messages')
        messagesContainer.scrollTop = messagesContainer.scrollHeight
    }
    
    const locationImage = sessionStorage.getItem('locationImage')
    if (locationImage) {
        document.getElementById('locImg').setAttribute('src', locationImage)
        document.body.style.setProperty('--bg-image', `url(${locationImage})`)
    }
}

loadGameState()