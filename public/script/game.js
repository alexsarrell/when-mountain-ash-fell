
document.getElementById('send-action').addEventListener('click',async function (event) {
    event.preventDefault();
    console.log('Submit user request', event);
    const actionValue = document.getElementById('action').value.trim();
    const characterId = sessionStorage.getItem('characterId') ?? getCookie('characterId');

    const payload = {
        characterId,
        action: actionValue,
    };

    if (window.onAction) {
        await window.onAction(payload).then(r => r)
    }
})

document.getElementById('send-action').addEventListener('click', function() {
    document.getElementById('action').value = '';
});

/**
 * TODO сделать отображение инвентаря
 *
 * 1.привязать действие к кнопе инвенторя как вверху
 * 2.свформировать JSON из characterId как выше
 * 3.в main.js сделать новый хук getInventory
 * 4. в game.routes.ts добавить новый рут /character для получения инфы о персонаже по аналогии с другими рутами (Не забудь что это GET запрос а не POST)
 * 5. вернуть из /character объект в main.js хук, из main.js передать его в game.js
 * 6. game.js отрисовывает страничку на основании данных полученных с сервера
 */

document.getElementById('inventory').addEventListener('click', async function (event) {
    event.preventDefault();
    console.log('Open inventory', event);
    const characterId = sessionStorage.getItem('characterId') ?? getCookie('characterId');
    const payload = {
        characterId
    };

    if (window.getInventory) {
        await window.getInventory(payload).then(r => {
            const inventoryDialog = document.getElementById('inventoryDialog')
            const inventory = document.getElementById('inventoryGrid')
            console.log('result', r)
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
            inventory.innerHTML = '';
            const totalSlots = 15;
            for (let i = 0; i < totalSlots; i++)
            {
                const emptySlot = document.createElement('div');
                emptySlot.className = 'inventory-item empty';
                emptySlot.textContent = '';
                inventory.appendChild(emptySlot);
            }
            for (const i in r.inventory) {
                const item = r.inventory[i];
                const slotIndex = parseInt(i);

                if (slotIndex < totalSlots) {
                    const slot = inventory.children[slotIndex];
                    slot.className = 'inventory-item';
                    slot.textContent = item.name;
                }
                else {
                    console.error('Инвентарь переполнен!');
                }
            }
            inventoryDialog.showModal();
        })
    }
});

document.getElementById('CloseDialog').addEventListener('click',async function (event) {
    event.preventDefault();
    console.log('CloseDialog');
    const inventoryDialog = document.getElementById('inventoryDialog')
    inventoryDialog.close();
})